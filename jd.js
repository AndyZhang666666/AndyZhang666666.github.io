/* ============================================================
   JD 匹配器 · 匹配引擎
   纯前端跑，不上传、不调接口，JD 文本只留在浏览器里。
   ============================================================ */

(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  /* ---------- 1. 从 JD 里识别硬门槛年限 ---------- */
  function parseYears(text) {
    // 允许数字/中文/字母/端类等修饰词，但不跨句读（逗号、句号、换行）
    const GAP = '[\\u4e00-\\u9fa5A-Za-z0-9·\\s]{0,12}?';
    const pats = [
      new RegExp('(\\d+)\\s*[-–~至到]\\s*\\d+\\s*年(?:以上)?' + GAP + '(?:经验|经历)'),
      new RegExp('(\\d+)\\s*年(?:以上|及以上|\\+)?' + GAP + '(?:经验|经历)'),
      /经验\s*[:：]?\s*(\d+)\s*年(?:以上)?/,
      /(\d+)\s*\+?\s*years?\s*(?:of\s*)?[a-z\s]{0,24}?experience/i
    ];
    for (const p of pats) {
      const m = text.match(p);
      if (m) return parseInt(m[1], 10);
    }
    if (/应届|校招|管培|毕业生|graduate|校园招聘|无经验要求|不限经验/i.test(text)) return 0;
    return null;
  }

  /* ---------- 2. 关键词命中 ---------- */
  function matchDims(text) {
    const low = text.toLowerCase();
    const hits = [];
    JD_GRAPH.dims.forEach(d => {
      const found = d.kw.filter(k => low.includes(k));
      if (found.length) hits.push({ dim: d, kwHit: found.slice(0, 4), n: found.length });
    });
    // 命中词多的排前面，同数按权重
    hits.sort((a, b) => (b.n - a.n) || (b.dim.weight - a.dim.weight));
    return hits;
  }

  /* ---------- 3. 打分 ---------- */
  function score(hits, yearGap) {
    let got = 0, total = 0;
    hits.forEach(h => {
      const w = h.dim.weight;
      if (h.dim.level === 'gap') {
        // 完全没做过的，比「部分相关」扣得更狠，别让分数虚高
        total += w * 1.5;
      } else {
        total += w;
        got += h.dim.level === 'have' ? w : w * 0.5;
      }
    });
    if (!total) return null;
    let pct = Math.round((got / total) * 100);
    // 有核心项（权重 2）完全没有，就不该出现高分
    if (hits.some(h => h.dim.level === 'gap' && h.dim.weight >= 2)) pct = Math.min(pct, 68);
    // 年限是硬门槛，能力再对也要如实压分
    if (yearGap) pct = Math.min(pct, 75);
    // 关键词匹配再好也不等于面试通过，不给 100% 这种虚数
    return Math.min(pct, 95);
  }

  /* ---------- 4. 渲染 ---------- */
  function verdict(pct, gaps, yearGap) {
    if (pct === null) return { t: '没识别出明确要求', d: '这段 JD 里的能力关键词太少，换一段更具体的岗位描述试试。' };
    if (yearGap) return { t: '年限是硬门槛', d: '能力项对得上，但全职年限不够。如果这个岗位卡年限，我大概过不了初筛——先说清楚，不浪费你时间。' };
    if (pct >= 85) return { t: '高度匹配', d: '核心要求基本都有直接证据，可以直接看下面的项目。' };
    if (pct >= 65) return { t: '匹配', d: '主要要求对得上，有几项是相关经验而非完全对口，下面标出来了。' };
    if (pct >= 45) return { t: '部分匹配', d: '有一半左右对得上。缺的那些我没做过，直接列在下面，不含糊。' };
    return { t: '匹配度不高', d: '这个岗位的核心要求我大部分没有直接经验。不建议为了投而投。' };
  }

  function evHTML(ev) {
    return ev.map(e => `
      <li class="jd-ev">
        <span class="jd-ev-co">${esc(e.co)}</span>
        <span class="jd-ev-text">${esc(e.text)}</span>
        <span class="jd-ev-metric">${esc(e.metric)}</span>
      </li>`).join('');
  }

  function render(text) {
    const out = $('#jdResult');
    const hits = matchDims(text);

    if (!hits.length) {
      out.innerHTML = `<p class="jd-empty">没在这段文字里识别到能力关键词。试试贴一段完整的岗位职责 + 任职要求。</p>`;
      out.hidden = false;
      return;
    }

    const need = parseYears(text);
    // 全职年限：2026.06 起算
    const fullYears = Math.max(0, (Date.now() - new Date('2026-06-01')) / 31557600000);
    const yearGap = need !== null && need >= 2 && fullYears < need;
    const pct = score(hits, yearGap);

    const have = hits.filter(h => h.dim.level === 'have');
    const partial = hits.filter(h => h.dim.level === 'partial');
    const gaps = hits.filter(h => h.dim.level === 'gap');
    const v = verdict(pct, gaps, yearGap);

    out.innerHTML = `
      <div class="jd-head">
        <div class="jd-score">
          <span class="jd-score-num">${pct}</span><span class="jd-score-unit">%</span>
          <span class="jd-score-label">匹配度</span>
        </div>
        <div class="jd-verdict">
          <strong>${esc(v.t)}</strong>
          <p>${esc(v.d)}</p>
          <p class="jd-meta">识别到 ${hits.length} 项要求 · 有直接证据 ${have.length} 项 · 部分相关 ${partial.length} 项 · 暂无 ${gaps.length} 项</p>
        </div>
      </div>

      ${need !== null ? `
        <div class="jd-years ${yearGap ? 'warn' : 'ok'}">
          <span class="jd-years-k">年限要求</span>
          <span class="jd-years-v">${need === 0 ? '应届 / 不限' : need + ' 年以上'}</span>
          <span class="jd-years-d">${esc(JD_GRAPH.seniority.text)}</span>
        </div>` : ''}

      ${have.length ? `
        <div class="jd-group">
          <h4 class="jd-group-t"><span class="jd-mark have">✓</span>有直接证据 <span class="jd-group-n">${have.length}</span></h4>
          ${have.map(h => `
            <div class="jd-dim">
              <div class="jd-dim-h">
                <span class="jd-dim-name">${esc(h.dim.name)}</span>
                <span class="jd-dim-kw">JD 里提到：${h.kwHit.map(esc).join(' / ')}</span>
              </div>
              <ul class="jd-evs">${evHTML(h.dim.ev)}</ul>
            </div>`).join('')}
        </div>` : ''}

      ${partial.length ? `
        <div class="jd-group">
          <h4 class="jd-group-t"><span class="jd-mark partial">~</span>部分相关 <span class="jd-group-n">${partial.length}</span></h4>
          ${partial.map(h => `
            <div class="jd-dim">
              <div class="jd-dim-h">
                <span class="jd-dim-name">${esc(h.dim.name)}</span>
                <span class="jd-dim-kw">JD 里提到：${h.kwHit.map(esc).join(' / ')}</span>
              </div>
              <p class="jd-note">${esc(h.dim.note || '')}</p>
              ${h.dim.ev ? `<ul class="jd-evs">${evHTML(h.dim.ev)}</ul>` : ''}
            </div>`).join('')}
        </div>` : ''}

      ${gaps.length ? `
        <div class="jd-group">
          <h4 class="jd-group-t"><span class="jd-mark gap">×</span>暂时没有 <span class="jd-group-n">${gaps.length}</span></h4>
          ${gaps.map(h => `
            <div class="jd-dim gap">
              <div class="jd-dim-h">
                <span class="jd-dim-name">${esc(h.dim.name)}</span>
                <span class="jd-dim-kw">JD 里提到：${h.kwHit.map(esc).join(' / ')}</span>
              </div>
              <p class="jd-note">${esc(h.dim.note || '')}</p>
            </div>`).join('')}
        </div>` : ''}

      <div class="jd-foot">
        <button type="button" class="jd-copy" id="jdCopy">复制这份匹配结果</button>
        <span class="jd-disclaimer">本地跑的关键词匹配，不调接口、不上传。证据里的数字都来自真实项目。</span>
      </div>`;

    out.hidden = false;
    $('#jdCopy').addEventListener('click', () => copyResult(pct, have, partial, gaps, need, yearGap));
  }

  function copyResult(pct, have, partial, gaps, need, yearGap) {
    let t = `张千羽 · JD 匹配结果\n匹配度 ${pct}%\n\n`;
    if (need !== null) t += `年限要求：${need === 0 ? '应届/不限' : need + ' 年以上'}${yearGap ? '（我的全职年限不够，先说明）' : ''}\n${JD_GRAPH.seniority.text}\n\n`;
    if (have.length) {
      t += `【有直接证据】\n`;
      have.forEach(h => {
        t += `· ${h.dim.name}\n`;
        h.dim.ev.forEach(e => { t += `   - ${e.co}：${e.text}（${e.metric}）\n`; });
      });
      t += '\n';
    }
    if (partial.length) {
      t += `【部分相关】\n`;
      partial.forEach(h => { t += `· ${h.dim.name}：${h.dim.note}\n`; });
      t += '\n';
    }
    if (gaps.length) {
      t += `【暂时没有】\n`;
      gaps.forEach(h => { t += `· ${h.dim.name}：${h.dim.note}\n`; });
    }
    t += `\n———\nandy_zzz@yeah.net · github.com/AndyZhang666666`;
    navigator.clipboard.writeText(t).then(() => {
      const b = $('#jdCopy');
      b.textContent = '已复制';
      setTimeout(() => { b.textContent = '复制这份匹配结果'; }, 1800);
    });
  }

  /* ---------- 5. 绑定 ---------- */
  function init() {
    const ta = $('#jdInput');
    if (!ta) return;
    const btn = $('#jdRun');
    const clear = $('#jdClear');
    const counter = $('#jdCount');

    const upd = () => {
      const n = ta.value.trim().length;
      counter.textContent = n ? `${n} 字` : '';
      btn.disabled = n < 20;
    };
    ta.addEventListener('input', upd);
    upd();

    btn.addEventListener('click', () => {
      const v = ta.value.trim();
      if (v.length < 20) return;
      render(v);
      $('#jdResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    clear.addEventListener('click', () => {
      ta.value = '';
      $('#jdResult').hidden = true;
      upd();
      ta.focus();
    });

    // 示例 JD 一键填入
    document.querySelectorAll('.jd-sample').forEach(el => {
      el.addEventListener('click', () => {
        ta.value = el.dataset.jd;
        upd();
        btn.click();
      });
    });

    // Cmd/Ctrl + Enter 提交
    ta.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') btn.click();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
