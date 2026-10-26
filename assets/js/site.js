(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* nav scrolled state */
  const nav = document.querySelector('.nav');
  const onScrollNav = () => nav && nav.classList.toggle('scrolled', scrollY > 20);
  addEventListener('scroll', onScrollNav, { passive: true }); onScrollNav();

  /* tile overlays for .tile-img (aashish pixel reveal) */
  document.querySelectorAll('.tile-img').forEach(el => {
    const t = document.createElement('div'); t.className = 'tiles';
    const cells = [];
    for (let i = 0; i < 60; i++) { const c = document.createElement('i'); cells.push(c); t.appendChild(c); }
    cells.forEach(c => c.style.transitionDelay = (Math.random() * .55).toFixed(2) + 's');
    el.appendChild(t);
  });

  /* reveal on intersection */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  document.querySelectorAll('.reveal, .line-mask, .tile-img, [data-in]').forEach(el => io.observe(el));

  /* marquee: duplicate track content so -50% loops seamlessly */
  document.querySelectorAll('.marquee-track').forEach(tr => { tr.innerHTML += tr.innerHTML; });

  /* light parallax */
  const par = [...document.querySelectorAll('[data-speed]')];
  if (par.length && !reduce) {
    const tick = () => {
      const vh = innerHeight;
      par.forEach(el => {
        const r = el.getBoundingClientRect();
        const c = r.top + r.height / 2 - vh / 2;
        el.style.transform = `translate3d(0, ${(-c * parseFloat(el.dataset.speed)).toFixed(1)}px, 0)`;
      });
    };
    addEventListener('scroll', () => requestAnimationFrame(tick), { passive: true }); tick();
  }

  /* pixel name (jithin) — text rasterised into square cells, cursor heats cells gold */
  function pixelText(canvas) {
    const text = canvas.dataset.text.toUpperCase();
    const ctx = canvas.getContext('2d');
    let cells = [], cell = 8, W = 0, H = 0, mx = -1e4, my = -1e4, t0 = performance.now(), raf;
    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue('--ink').trim() || '#141414';
    const gold = css.getPropertyValue('--gold').trim() || '#fdb300';
    const forest = css.getPropertyValue('--forest').trim() || '#2b3d26';

    function build() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = Math.max(4, Math.round(H / 26));
      const cols = Math.floor(W / cell), rows = Math.floor(H / cell);
      /* render big, crop to real ink bounds, then fit into cols x rows */
      const big = document.createElement('canvas'), bg = big.getContext('2d');
      const F = 200; bg.font = `800 ${F}px "Barlow Condensed", "Arial Narrow", sans-serif`;
      big.width = Math.ceil(bg.measureText(text).width + F); big.height = F * 2;
      bg.font = `800 ${F}px "Barlow Condensed", "Arial Narrow", sans-serif`;
      bg.textBaseline = 'middle'; bg.fillStyle = '#000'; bg.fillText(text, F / 2, F);
      const bd = bg.getImageData(0, 0, big.width, big.height).data;
      let x0 = big.width, x1 = 0, y0 = big.height, y1 = 0;
      for (let y = 0; y < big.height; y++) for (let x = 0; x < big.width; x++) if (bd[(y * big.width + x) * 4 + 3] > 20) {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      const k = Math.min(cols * .96 / bw, rows * .9 / bh);
      const off = document.createElement('canvas'); off.width = cols; off.height = rows;
      const o = off.getContext('2d');
      o.drawImage(big, x0, y0, bw, bh, (cols - bw * k) / 2, (rows - bh * k) / 2, bw * k, bh * k);
      const d = o.getImageData(0, 0, cols, rows).data;
      cells = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        if (d[(y * cols + x) * 4 + 3] > 110) cells.push({ x: x * cell + (W - cols * cell) / 2, y: y * cell, d: Math.random() * 700 + x * 6 });
      }
      t0 = performance.now();
    }
    function draw(now) {
      ctx.clearRect(0, 0, W, H);
      const el = now - t0; let anim = false;
      const R = cell * 7;
      for (const c of cells) {
        const p = reduce ? 1 : Math.min(1, Math.max(0, (el - c.d) / 380));
        if (p < 1) anim = true;
        if (p <= 0) continue;
        const dx = c.x - mx, dy = c.y - my, dist = Math.sqrt(dx * dx + dy * dy);
        let s = cell - 1.2;
        if (dist < R) {
          const k = 1 - dist / R;
          ctx.fillStyle = k > .55 ? gold : forest; s = (cell - 1.2) * (1 - k * .45);
        } else ctx.fillStyle = ink;
        const sz = s * p, o = (cell - sz) / 2;
        ctx.fillRect(c.x + o, c.y + o, sz, sz);
      }
      if (anim || mx > -1e3) raf = requestAnimationFrame(draw); else raf = null;
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };
    canvas.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; kick(); });
    canvas.addEventListener('pointerleave', () => { mx = my = -1e4; kick(); });
    let started = false;
    const start = () => { if (started) return; started = true; build(); kick(); };
    new IntersectionObserver((es, ob) => es.forEach(e => { if (e.isIntersecting) { start(); ob.disconnect(); } })).observe(canvas);
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (started) { build(); t0 -= 5000; kick(); } }, 150); });
  }
  const ready = document.fonts ? document.fonts.ready : Promise.resolve();
  ready.then(() => document.querySelectorAll('canvas[data-text]').forEach(pixelText));

  /* dithered image (mecha aside) — ordered Bayer dither of an <img> into ink dots */
  function dither(canvas) {
    const img = new Image(); img.src = canvas.dataset.src;
    img.onload = () => {
      const W = canvas.clientWidth, H = canvas.clientHeight; if (!W || !H) return;
      const px = 3, cols = Math.ceil(W / px), rows = Math.ceil(H / px);
      const off = document.createElement('canvas'); off.width = cols; off.height = rows;
      const o = off.getContext('2d');
      const s = Math.max(cols / img.width, rows / img.height);
      o.drawImage(img, (cols - img.width * s) / 2, (rows - img.height * s) / 2, img.width * s, img.height * s);
      const d = o.getImageData(0, 0, cols, rows).data;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = W * dpr; canvas.height = H * dpr;
      const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
      const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#141414';
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const a = d[i + 3] / 255;
        const l = a ? (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255 * a + (1 - a) : 1;
        const th = (B[(y % 4) * 4 + (x % 4)] + .5) / 16;
        if (l * 1.08 < th) ctx.fillRect(x * px, y * px, px - .6, px - .6);
      }
    };
  }
  document.querySelectorAll('canvas[data-dither]').forEach(dither);

  /* case study: scroll progress on active index item + hide fab near footer */
  const active = document.querySelector('.cs-index a.active');
  const fab = document.querySelector('.fab');
  const foot = document.querySelector('.cs-foot');
  if (active || fab) {
    const upd = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (active) active.style.setProperty('--p', max > 0 ? Math.min(1, scrollY / max).toFixed(3) : 1);
      if (fab && foot) fab.classList.toggle('hide', foot.getBoundingClientRect().top < innerHeight * .8);
    };
    addEventListener('scroll', upd, { passive: true }); upd();
  }
})();
