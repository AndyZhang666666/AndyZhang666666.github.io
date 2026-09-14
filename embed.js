// ===== 项目卡内嵌互动 - embed.js =====
// 只处理有 demo URL 的项目卡，添加「在此试用」按钮 + iframe 展开能力

(function() {
  'use strict';

  // 等 app.js 渲染完项目卡后再执行
  function initEmbed() {
    const projectCards = document.querySelectorAll('.project-card:not(.placeholder)');
    
    projectCards.forEach((card) => {
      // 从 DOM 读取 url，而不是依赖 window.data
      const demoLink = card.querySelector('.project-link[href*="http"]');
      if (!demoLink) return;
      
      const url = demoLink.getAttribute('href');
      const projectName = card.querySelector('.project-name')?.textContent || '';
      if (!url) return;

      // 找到 .project-links 容器
      const linksContainer = card.querySelector('.project-links');
      if (!linksContainer) return;

      // 创建「在此试用」按钮
      const tryBtn = document.createElement('button');
      tryBtn.className = 'embed-try-btn';
      tryBtn.setAttribute('type', 'button');
      tryBtn.setAttribute('aria-expanded', 'false');
      tryBtn.innerHTML = `
        <span data-zh="在此试用" data-en="Try here">在此试用</span>
        <svg viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;

      // 创建 iframe 容器
      const embedContainer = document.createElement('div');
      embedContainer.className = 'embed-container';
      embedContainer.setAttribute('role', 'region');
      embedContainer.setAttribute('aria-hidden', 'true');
      embedContainer.innerHTML = `
        <div class="embed-container-inner">
          <div class="embed-iframe-wrap">
            <div class="embed-loading">
              <div class="embed-loading-spinner"></div>
              <span>加载中...</span>
            </div>
          </div>
        </div>
      `;

      // 点击展开/收起
      tryBtn.addEventListener('click', function() {
        const isOpen = embedContainer.classList.contains('open');
        
        if (isOpen) {
          // 收起
          embedContainer.classList.remove('open');
          tryBtn.classList.remove('active');
          tryBtn.setAttribute('aria-expanded', 'false');
          embedContainer.setAttribute('aria-hidden', 'true');
          
          // 移除 iframe 释放资源
          const wrap = embedContainer.querySelector('.embed-iframe-wrap');
          const existingIframe = wrap.querySelector('iframe');
          if (existingIframe) {
            existingIframe.remove();
          }
          // 恢复 loading 态
          const loading = wrap.querySelector('.embed-loading');
          if (loading) {
            loading.classList.remove('hide');
          }
        } else {
          // 展开前先收起其他已展开的：多个 iframe 同时跑会拖慢页面
          document.querySelectorAll('.embed-container.open').forEach(function (other) {
            if (other === embedContainer) return;
            other.classList.remove('open');
            other.setAttribute('aria-hidden', 'true');
            var ob = other.closest('.project-card-inner');
            var btn = ob && ob.querySelector('.embed-try-btn');
            if (btn) { btn.classList.remove('active'); btn.setAttribute('aria-expanded', 'false'); }
            var ow = other.querySelector('.embed-iframe-wrap');
            var oi = ow && ow.querySelector('iframe');
            if (oi) oi.remove();
            var ol = ow && ow.querySelector('.embed-loading');
            if (ol) ol.classList.remove('hide');
          });

          // 展开
          embedContainer.classList.add('open');
          tryBtn.classList.add('active');
          tryBtn.setAttribute('aria-expanded', 'true');
          embedContainer.setAttribute('aria-hidden', 'false');
          
          // 创建 iframe
          const wrap = embedContainer.querySelector('.embed-iframe-wrap');
          const loading = wrap.querySelector('.embed-loading');
          const iframe = document.createElement('iframe');
          iframe.src = url;
          iframe.title = projectName + ' Demo';
          iframe.setAttribute('loading', 'lazy');
          iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
          
          // iframe 加载完成后隐藏 loading
          iframe.addEventListener('load', function() {
            if (loading) {
              loading.classList.add('hide');
            }
          });
          
          wrap.appendChild(iframe);
        }
      });

      // 插入按钮（在「打开看看」链接之前）
      const firstLink = linksContainer.querySelector('.project-link');
      if (firstLink) {
        linksContainer.insertBefore(tryBtn, firstLink);
      } else {
        linksContainer.appendChild(tryBtn);
      }

      // 插入容器（在 .project-card-inner 末尾）
      const cardInner = card.querySelector('.project-card-inner');
      if (cardInner) {
        cardInner.appendChild(embedContainer);
      }
    });

    // 为特定项目添加 mini 交互组件
    addMiniComponents(projectCards);
  }

  // 为合适的项目添加原生 mini 交互组件
  function addMiniComponents(projectCards) {
    projectCards.forEach((card) => {
      const projectName = card.querySelector('.project-name')?.textContent || '';

      // Growth Experiment Lab: A/B 实验决策模拟器 mini 版
      if (projectName.includes('Growth Experiment Lab')) {
        addABSimMini(card);
      }

      // Pricing Model Sim: 定价模拟器 mini 版
      if (projectName.includes('Pricing Model Sim')) {
        addPricingSimMini(card);
      }
    });
  }

  // A/B 实验决策模拟器 mini 版
  function addABSimMini(card) {
    const cardInner = card.querySelector('.project-card-inner');
    if (!cardInner) return;

    const miniDiv = document.createElement('div');
    miniDiv.className = 'embed-mini';
    miniDiv.innerHTML = `
      <div class="embed-mini-title" data-zh="快速体验：样本量计算" data-en="Quick try: Sample size">快速体验：样本量计算</div>
      <div class="embed-ab-sim">
        <div class="embed-ab-control">
          <label class="embed-ab-label">
            <span data-zh="基线转化率" data-en="Baseline rate">基线转化率</span>
            <span class="embed-ab-value">5%</span>
          </label>
          <input type="range" class="embed-ab-slider" id="abBaseline" min="1" max="20" value="5" step="0.5">
        </div>
        <div class="embed-ab-control">
          <label class="embed-ab-label">
            <span data-zh="想检出的最小提升" data-en="MDE">想检出的最小提升</span>
            <span class="embed-ab-value">10%</span>
          </label>
          <input type="range" class="embed-ab-slider" id="abMDE" min="5" max="50" value="10" step="5">
        </div>
        <div class="embed-ab-result">
          <span data-zh="每组需要" data-en="Each arm needs">每组需要</span>
          <strong class="ab-result-num">12,458</strong>
          <span data-zh="个样本" data-en="samples">个样本</span>
        </div>
      </div>
    `;

    const baselineSlider = miniDiv.querySelector('#abBaseline');
    const mdeSlider = miniDiv.querySelector('#abMDE');
    const baselineValue = miniDiv.querySelector('#abBaseline').parentElement.querySelector('.embed-ab-value');
    const mdeValue = miniDiv.querySelector('#abMDE').parentElement.querySelector('.embed-ab-value');
    const resultNum = miniDiv.querySelector('.ab-result-num');

    function updateAB() {
      const p1 = parseFloat(baselineSlider.value) / 100;
      const mde = parseFloat(mdeSlider.value) / 100;
      const p2 = p1 * (1 + mde);

      baselineValue.textContent = (p1 * 100).toFixed(1) + '%';
      mdeValue.textContent = (mde * 100).toFixed(0) + '%';

      // 简化公式：每组样本量 ≈ 16 * p * (1-p) / (p2 - p1)^2
      const pAvg = (p1 + p2) / 2;
      const n = Math.ceil(16 * pAvg * (1 - pAvg) / Math.pow(p2 - p1, 2));
      resultNum.textContent = n.toLocaleString('zh-CN');
    }

    baselineSlider.addEventListener('input', updateAB);
    mdeSlider.addEventListener('input', updateAB);
    updateAB();

    cardInner.appendChild(miniDiv);
  }

  // 定价模拟器 mini 版
  function addPricingSimMini(card) {
    const cardInner = card.querySelector('.project-card-inner');
    if (!cardInner) return;

    const miniDiv = document.createElement('div');
    miniDiv.className = 'embed-mini';
    miniDiv.innerHTML = `
      <div class="embed-mini-title" data-zh="快速体验：12 个月收入" data-en="Quick try: 12-mo revenue">快速体验：12 个月收入</div>
      <div class="embed-pricing-sim">
        <canvas class="embed-pricing-chart" id="pricingChart"></canvas>
        <div class="embed-ab-control">
          <label class="embed-ab-label">
            <span data-zh="单次解锁价格" data-en="Pay-per-use">单次解锁价格</span>
            <span class="embed-ab-value">¥5</span>
          </label>
          <input type="range" class="embed-ab-slider" id="pricingPrice" min="1" max="20" value="5" step="1">
        </div>
        <div class="embed-pricing-metrics">
          <div class="embed-pricing-metric">
            <div class="embed-pricing-metric-label" data-zh="ARPU" data-en="ARPU">ARPU</div>
            <div class="embed-pricing-metric-value">¥18</div>
          </div>
          <div class="embed-pricing-metric">
            <div class="embed-pricing-metric-label" data-zh="LTV" data-en="LTV">LTV</div>
            <div class="embed-pricing-metric-value">¥32</div>
          </div>
          <div class="embed-pricing-metric">
            <div class="embed-pricing-metric-label" data-zh="留存 D90" data-en="Ret D90">留存 D90</div>
            <div class="embed-pricing-metric-value">15%</div>
          </div>
        </div>
      </div>
    `;

    const priceSlider = miniDiv.querySelector('#pricingPrice');
    const priceValue = miniDiv.querySelector('#pricingPrice').parentElement.querySelector('.embed-ab-value');
    const canvas = miniDiv.querySelector('#pricingChart');
    const ctx = canvas.getContext('2d');

    // canvas 必须先进入 DOM 才有布局尺寸，否则 width/height 算出来是 0。
    // 这里先 append，再按实际尺寸设置位图，最后才绘图。
    cardInner.appendChild(miniDiv);

    function sizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width || 251));
      const h = Math.max(1, Math.round(rect.height || 160));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h };
    }

    // 模拟留存曲线（简化）
    const retentionCurve = [
      1.0, 0.45, 0.32, 0.25, 0.21, 0.18, 
      0.17, 0.16, 0.15, 0.145, 0.14, 0.135
    ];

    function updatePricing() {
      const price = parseFloat(priceSlider.value);
      priceValue.textContent = '¥' + price;

      // 计算指标（简化模拟）
      let cumulativeRevenue = 0;
      const monthlyRevenue = [];
      
      for (let i = 0; i < 12; i++) {
        const usage = retentionCurve[i] * (1.5 - i * 0.05); // 模拟使用频次衰减
        const rev = price * usage;
        monthlyRevenue.push(rev);
        cumulativeRevenue += rev;
      }

      const arpu = cumulativeRevenue;
      const ltv = arpu * 1.8; // 简化
      const d90Retention = retentionCurve[2] * 100;

      miniDiv.querySelectorAll('.embed-pricing-metric-value')[0].textContent = '¥' + arpu.toFixed(0);
      miniDiv.querySelectorAll('.embed-pricing-metric-value')[1].textContent = '¥' + ltv.toFixed(0);
      miniDiv.querySelectorAll('.embed-pricing-metric-value')[2].textContent = d90Retention.toFixed(0) + '%';

      // 绘制收入曲线：用当前实际尺寸，不能复用闭包里的旧 rect
      const dim = sizeCanvas();
      drawChart(ctx, dim.w, dim.h, monthlyRevenue);
    }

    function drawChart(ctx, w, h, data) {
      ctx.clearRect(0, 0, w, h);
      
      const padding = 20;
      const chartW = w - padding * 2;
      const chartH = h - padding * 2;
      const maxVal = Math.max(...data);
      const step = chartW / (data.length - 1);

      // 背景网格
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const y = padding + (chartH / 3) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(w - padding, y);
        ctx.stroke();
      }

      // 绘制曲线
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      ctx.lineWidth = 2;
      ctx.beginPath();
      data.forEach((val, i) => {
        const x = padding + i * step;
        const y = padding + chartH - (val / maxVal) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // 填充区域
      ctx.lineTo(w - padding, h - padding);
      ctx.lineTo(padding, h - padding);
      ctx.closePath();
      const accentRgb = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim();
      ctx.fillStyle = `rgba(${accentRgb}, 0.12)`;
      ctx.fill();
    }

    priceSlider.addEventListener('input', updatePricing);
    updatePricing();

    // 主题切换后 accent 色变了，需要重绘。
    // 用 MutationObserver 监听 <html data-palette>，不依赖 app.js 派发事件。
    if (!window.__embedPaletteObserver) {
      window.__embedPaletteObserver = new MutationObserver(function () {
        window.dispatchEvent(new Event('palettechange'));
      });
      window.__embedPaletteObserver.observe(document.documentElement, {
        attributes: true, attributeFilter: ['data-palette']
      });
    }
    window.addEventListener('palettechange', function () { updatePricing(); });
  }

  // 在 app.js 渲染完成后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // 等待 app.js 执行完（data 加载 + 渲染）
      setTimeout(initEmbed, 500);
    });
  } else {
    setTimeout(initEmbed, 500);
  }
})();
