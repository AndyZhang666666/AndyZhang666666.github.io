import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomBytes, createHash, timingSafeEqual} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {loadCorpus} from './corpus.mjs';
import {retrieveRun, validateInput, eligibleDocuments} from '../engine.mjs';
import {generate, modelConfig, ModelError} from './model.mjs';

class ApiError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }
const digest = text => createHash('sha256').update(text).digest();
const equalToken = (a, b) => Boolean(a && b && timingSafeEqual(digest(a), digest(b)));
const identity = token => digest(token).toString('hex');

export function redact(value) {
  if (typeof value === 'string') return value.replace(/Bearer\s+[\w.\-]+/gi, 'Bearer [REDACTED]')
    .replace(/\bsk-[\w-]+/g, '[REDACTED_KEY]').replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[REDACTED_EMAIL]')
    .replace(/(?<!\d)1[3-9]\d{9}(?!\d)/g, '[REDACTED_PHONE]');
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !/^(?:token|authorization|password|secret|api.?key|owner)$/i.test(key))
    .map(([key, item]) => [key, redact(item)]));
  return value;
}

async function bodyJson(req) {
  if (!(req.headers['content-type'] ?? '').startsWith('application/json')) throw new ApiError(415, 'content_type', '请使用 application/json。');
  if (Number(req.headers['content-length']) > 4096) throw new ApiError(413, 'input_limit', '请求内容过长。');
  let size = 0; const parts = [];
  for await (const part of req) {
    size += part.length;
    if (size > 4096) throw new ApiError(413, 'input_limit', '请求内容过长。');
    parts.push(part);
  }
  try { return JSON.parse(Buffer.concat(parts).toString('utf8')); }
  catch { throw new ApiError(400, 'invalid_json', 'JSON 格式无效。'); }
}

const staticFiles = new Map([
  ['index.html', 'text/html'], ['app.mjs', 'text/javascript'], ['engine.mjs', 'text/javascript'],
  ['style.css', 'text/css'], ['public-corpus.json', 'application/json'], ['favicon.svg', 'image/svg+xml'],
]);

export async function createApp(options = {}) {
  const documents = options.documents ?? await loadCorpus();
  const adminToken = options.adminToken ?? process.env.RAG_ADMIN_TOKEN;
  if (adminToken && adminToken.length < 24) throw new Error('RAG_ADMIN_TOKEN must contain at least 24 characters');
  const config = Object.hasOwn(options, 'model') ? options.model : modelConfig();
  const sessions = new Map(); const records = new Map(); const rates = new Map();
  let modelCalls = 0;
  const now = options.now ?? Date.now;
  const ttl = 60 * 60 * 1000;
  const rateLimit = options.rateLimit ?? 30;

  function limit(key, max) {
    const minute = Math.floor(now() / 60000);
    const entry = rates.get(key);
    const current = entry?.minute === minute ? entry : {minute, count: 0};
    if (current.count >= max) throw new ApiError(429, 'rate_limit', '操作过于频繁，请一分钟后重试。');
    current.count++; rates.set(key, current);
  }
  function cleanup() {
    for (const [key, expiry] of sessions) if (expiry < now()) sessions.delete(key);
    for (const [key, value] of records) if (value.expires < now()) records.delete(key);
    for (const [key, value] of rates) if (value.minute < Math.floor(now() / 60000) - 1) rates.delete(key);
  }
  function authenticate(req) {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (equalToken(token, adminToken)) return {role: 'admin', owner: identity(token)};
    const owner = identity(token);
    if (token && sessions.get(owner) >= now()) return {role: 'employee', owner};
    throw new ApiError(401, 'session_required', '会话无效或已过期，请重新连接本地会话。');
  }
  function ownRecord(id, session) {
    const stored = records.get(id);
    if (!stored || stored.owner !== session.owner || stored.run.role !== session.role) throw new ApiError(404, 'not_found', '记录或依据不可用。');
    // Re-check current server authority and the immutable run's original scope.
    const allowedIds = new Set(eligibleDocuments(documents, {role: session.role, date: stored.run.date, snapshot: stored.run.snapshot}).flatMap(d => d.chunks.map(c => c.id)));
    if (stored.run.retrieved.some(c => !allowedIds.has(c.id))) throw new ApiError(404, 'not_found', '记录或依据不可用。');
    return stored.run;
  }
  function save(run, owner) {
    records.set(run.id, {run: structuredClone(run), owner, expires: now() + ttl});
    while (records.size > 100) records.delete(records.keys().next().value);
  }
  const server = http.createServer(async (req, res) => {
    const send = (status, object) => {
      res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer'});
      res.end(JSON.stringify(object));
    };
    try {
      cleanup();
      const host = req.headers.host ?? '';
      if (!/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host)) throw new ApiError(403, 'host', '此 API 仅用于本机。');
      if (req.headers.origin && req.headers.origin !== `http://${host}`) throw new ApiError(403, 'origin', '不接受跨站请求。');
      const url = new URL(req.url, `http://${host}`);
      const path = url.pathname;
      if (path.startsWith('/api/')) {
        limit('global', options.globalRateLimit ?? 100);
        if (path === '/api/health' && req.method === 'GET') return send(200, {service: 'rag-lab-local', modelConfigured: Boolean(config), adminConfigured: Boolean(adminToken)});
        if (path === '/api/session' && req.method === 'POST') {
          const body = await bodyJson(req);
          if (!body || Array.isArray(body) || typeof body !== 'object' || Object.keys(body).length) throw new ApiError(400, 'session_scope', '公开入口只能创建员工会话，不能指定身份。');
          limit('issue', 20);
          if (sessions.size >= 100) throw new ApiError(429, 'session_limit', '会话数量已达上限，请稍后重试。');
          const token = randomBytes(32).toString('hex');
          sessions.set(identity(token), now() + ttl);
          return send(201, {token, role: 'employee', expiresInSeconds: ttl / 1000});
        }
        const session = authenticate(req);
        limit(session.owner, rateLimit);
        if (path === '/api/whoami' && req.method === 'GET') return send(200, {role: session.role});
        if (path === '/api/run' && req.method === 'POST') {
          let input;
          try { input = validateInput(await bodyJson(req)); }
          catch (error) { if (error instanceof ApiError) throw error; throw new ApiError(400, 'invalid_input', error.message); }
          const started = performance.now();
          let run;
          try { run = retrieveRun(documents, input, session.role); }
          catch { throw new ApiError(503, 'retrieval_failed', '检索阶段失败，问题和条件已保留，请重试。'); }
          if (input.generation === 'model') {
            try {
              if (!config) throw new ModelError('model_not_configured', '模型未配置；检索已完成。请选择规则摘录，或按 README 配置本项目模型。');
              if (run.status === 'answered') {
                limit(`model:${session.owner}`, 4);
                if (modelCalls >= (options.maxModelCalls ?? 20)) throw new ApiError(429, 'call_limit', '本次服务模型调用上限已达 20 次，需由服务端确认后重启。');
                modelCalls++;
                run = await generate(run, config, {fetchImpl: options.fetchImpl, timeoutMs: options.modelTimeoutMs});
              } else { run.mode = 'local-evidence-gate'; run.stages.push('证据不足 / 冲突时未调用模型'); }
            } catch (error) {
              run.status = 'failed'; run.answer = ''; run.failureStage = 'generation';
              run.error = error instanceof ModelError || error instanceof ApiError ? {code: error.code, message: error.message} : {code: 'model_failed', message: '模型阶段失败，可重试。'};
              run.rawAnswer = error instanceof ModelError ? error.rawAnswer : null;
              run.model = config?.name ?? null;
              run.mode = 'local-model-failed'; run.checks.keyFacts = 'not-passed';
              run.elapsedMs = Math.round(performance.now() - started);
              save(run, session.owner);
              // Rejected raw output is available only in the owner's redacted export, not the ordinary answer.
              const {rawAnswer, ...visible} = run;
              return send(error instanceof ApiError ? error.status : 503, {error: run.error, run: visible});
            }
          }
          run.elapsedMs = Math.round((performance.now() - started) * 100) / 100;
          save(run, session.owner);
          const {rawAnswer, ...visible} = run;
          return send(200, {run: visible});
        }
        const source = path.match(/^\/api\/runs\/([\w-]+)\/(export|sources)$/);
        if (source && req.method === 'GET') {
          const run = ownRecord(source[1], session);
          if (source[2] === 'export') return send(200, redact({...run, exportNotice: '脱敏尽力处理；仅允许虚构场景，不应输入真实个人资料或密钥。'}));
          const chunk = run.retrieved.find(c => c.id === url.searchParams.get('chunkId'));
          if (!chunk) throw new ApiError(404, 'not_found', '记录或依据不可用。');
          return send(200, {source: chunk, date: run.date, snapshot: run.snapshot});
        }
        throw new ApiError(404, 'not_found', '接口不存在。');
      }
      if (req.method !== 'GET') throw new ApiError(405, 'method', '不支持此请求方式。');
      if (path === '/') { res.writeHead(302, {Location: '/rag-lab/'}); return res.end(); }
      const file = path === '/rag-lab/' ? 'index.html' : path.replace(/^\/rag-lab\//, '');
      if (!path.startsWith('/rag-lab/') || !staticFiles.has(file)) throw new ApiError(404, 'not_found', '页面不存在。');
      const content = await readFile(new URL(`../${file}`, import.meta.url));
      res.writeHead(200, {'Content-Type': `${staticFiles.get(file)}; charset=utf-8`, 'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'", 'Cache-Control': 'no-store'});
      res.end(content);
    } catch (error) {
      if (res.headersSent) { res.end(); return; }
      const safe = error instanceof ApiError ? error : new ApiError(500, 'internal', '服务暂时不可用，请重试。');
      send(safe.status, {error: {code: safe.code, message: safe.message}});
    }
  });
  server.requestTimeout = 15000; server.headersTimeout = 10000; server.maxHeadersCount = 32;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 4318);
  const server = await createApp();
  server.listen(port, '127.0.0.1', () => console.log(`RAG Lab local API: http://127.0.0.1:${port}/rag-lab/ (credentials are never printed)`));
}
