"""Local-only single-user sandbox API, serving only allowlisted frontend assets."""
import argparse
import hashlib
import json
import mimetypes
import re
import secrets
import time
from collections import defaultdict, deque
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from cases import CASES, VERSION
from store import Store, Problem, digest, dump
import model

ROOT = Path(__file__).resolve().parent.parent
STATIC = {'index.html', 'app.js', 'replay.js', 'style.css', 'samples/examples.json', 'favicon.svg'}

class Server(ThreadingHTTPServer):
    daemon_threads = True
    def __init__(self, address, store, model_client=None):
        super().__init__(address, Handler)
        self.store, self.model = store, model_client or model.ModelClient()
        self.rate = defaultdict(deque)
        self.model_requests = 0

class Handler(BaseHTTPRequestHandler):
    server_version = 'AgentBench/1'
    def log_message(self, *args):
        pass  # No cookies, prompts or provider responses in request logs.

    def respond(self, data, status=200, cookie=None, content_type='application/json; charset=utf-8'):
        raw = data if isinstance(data, bytes) else dump(data).encode()
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(raw)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'")
        if cookie:
            self.send_header('Set-Cookie', cookie)
        self.end_headers()
        try:
            self.wfile.write(raw)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def owner(self):
        jar = SimpleCookie()
        try:
            jar.load(self.headers.get('Cookie', ''))
            token = jar['bench_session'].value
            if not re.fullmatch('[a-f0-9]{64}', token):
                raise KeyError()
        except (KeyError, ValueError):
            raise Problem('SESSION_REQUIRED', '请刷新页面建立本地会话。', 401)
        return hashlib.sha256(token.encode()).hexdigest()

    def guard(self, write=False):
        port = self.server.server_port
        host = self.headers.get('Host', '')
        if host not in (f'127.0.0.1:{port}', f'localhost:{port}'):
            raise Problem('HOST_REJECTED', '仅接受本地地址。', 403)
        origin = self.headers.get('Origin')
        if origin and origin != 'http://' + host:
            raise Problem('ORIGIN_REJECTED', '跨站请求被拒绝。', 403)
        if write and self.headers.get('X-Bench-Request') != '1':
            raise Problem('CSRF_REJECTED', '缺少同源请求标识。', 403)

    def do_GET(self):
        try:
            self.guard()
            path = urlsplit(self.path).path
            if path == '/api/config':
                cookie = None
                try:
                    self.owner()
                except Problem:
                    cookie = 'bench_session=' + secrets.token_hex(32) + '; HttpOnly; SameSite=Strict; Path=/api/'
                return self.respond({'local': True, 'model_configured': self.server.model.configured,
                                     'versions': VERSION, 'cases': CASES}, cookie=cookie)
            if re.fullmatch('/api/runs/[a-f0-9]{32}(/export)?', path):
                record = self.server.store.record(path.split('/')[3], self.owner())
                if record['run'].get('pending'):
                    record['approval_digest'] = digest(record['run']['pending'])
                return self.respond(record)
            asset = path.removeprefix('/agent-bench/').lstrip('/') if hasattr(path, 'removeprefix') else path[len('/agent-bench/'):]
            if path in ('/', '/agent-bench', '/agent-bench/'):
                asset = 'index.html'
            if asset not in STATIC or not (ROOT / asset).is_file():
                raise Problem('NOT_FOUND', '资源不存在。', 404)
            return self.respond((ROOT / asset).read_bytes(), content_type=mimetypes.guess_type(asset)[0] or 'application/octet-stream')
        except Problem as exc:
            self.respond({'code': exc.code, 'message': exc.message}, exc.status)

    def do_POST(self):
        try:
            self.guard(write=True)
            owner = self.owner()
            ticks = self.server.rate[owner]
            while ticks and ticks[0] < time.time() - 60:
                ticks.popleft()
            if len(ticks) >= 120:
                raise Problem('RATE_LIMIT', '请求过于频繁，请一分钟后继续。', 429)
            ticks.append(time.time())
            if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
                raise Problem('JSON_REQUIRED', '接口只接受 JSON。', 415)
            size = int(self.headers.get('Content-Length', '0'))
            if size < 2 or size > 8192:
                raise Problem('INPUT_LIMIT', '请求体必须为 2–8192 字节。', 413)
            self.connection.settimeout(10)
            body = json.loads(self.rfile.read(size))
            path = urlsplit(self.path).path
            if path == '/api/pairs':
                if isinstance(body, dict) and body.get('mode') == 'model' and not self.server.model.configured:
                    raise Problem('MODEL_NOT_CONFIGURED', '真实模型未配置；可先运行程序策略测试。', 503)
                return self.respond(self.server.store.pair(owner, body), 201)
            match = re.fullmatch('/api/runs/([a-f0-9]{32})/(step|confirm|cancel|recover)', path)
            if not match:
                raise Problem('NOT_FOUND', '接口不存在。', 404)
            rid, action = match.groups()
            if action == 'step':
                if body != {}:
                    raise Problem('INVALID_ARGUMENTS', 'step 不接受附加参数。')
                r = self.server.store.record(rid, owner)
                if r['run']['mode'] == 'model':
                    if self.server.model_requests >= 200:
                        raise Problem('MODEL_SESSION_LIMIT', '本次服务最多执行 200 次模型步骤；请检查记录后再启动新会话。', 429)
                    self.server.model_requests += 1
                    r = model.step(self.server.store, self.server.model, rid, owner)
                else:
                    r = self.server.store.program_step(rid, owner)
            else:
                r = self.server.store.action(rid, owner, action, body)
            if r['run'].get('pending'):
                r['approval_digest'] = digest(r['run']['pending'])
            return self.respond(r)
        except Problem as exc:
            self.respond({'code': exc.code, 'message': exc.message}, exc.status)
        except (ValueError, TypeError, KeyError, UnicodeDecodeError):
            self.respond({'code': 'INVALID_ARGUMENTS', 'message': '请求不是有效的参数对象。'}, 400)
        except Exception:
            self.respond({'code': 'INTERNAL_ERROR', 'message': '服务发生错误；保留运行标识，刷新后检查最终状态。'}, 500)

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--port', type=int, default=8877)
    p.add_argument('--db', default=str(ROOT / '.local' / 'bench.sqlite3'))
    args = p.parse_args()
    Path(args.db).parent.mkdir(parents=True, exist_ok=True)
    server = Server(('127.0.0.1', args.port), Store(args.db))
    print(f'Agent Bench local: http://127.0.0.1:{server.server_port}/agent-bench/', flush=True)
    print('Model configured: ' + str(server.model.configured) + ' (no keys are logged)', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == '__main__':
    main()
