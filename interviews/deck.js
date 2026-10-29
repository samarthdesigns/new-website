/* Interview decks: password gate, hub, case-study picker and slide player.
   deck.bin and assets/img/locked/*.bin share one format: salt(16) | iv(12) | AES-256-GCM, PBKDF2-SHA256 250k. */
(() => {
  const app = document.getElementById('app');
  const KEY = 'sn-interviews';
  const keys = new Map();
  let pw = null, data = null, player = null;

  const hex = b => [...b].map(x => x.toString(16).padStart(2, '0')).join('');
  async function decrypt(buf, pass) {
    const u = new Uint8Array(buf), salt = u.slice(0, 16), id = hex(salt);
    if (!keys.has(id)) {
      const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
      keys.set(id, crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']));
    }
    try { return await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.slice(16, 28) }, await keys.get(id), u.slice(28)); }
    catch (e) { keys.delete(id); throw e; }
  }
  const encUrls = new Map();
  function encImg(path) {
    if (!encUrls.has(path)) encUrls.set(path, fetch(path).then(r => r.arrayBuffer()).then(b => decrypt(b, pw))
      .then(d => URL.createObjectURL(new Blob([d], { type: 'image/webp' }))));
    return encUrls.get(path);
  }

  /* ---------- gate */
  async function unlock(pass) {
    const buf = await fetch('deck.bin', { cache: 'no-cache' }).then(r => r.arrayBuffer());
    data = JSON.parse(new TextDecoder().decode(await decrypt(buf, pass)));
    pw = pass;
    sessionStorage.setItem(KEY, pass);
  }
  function gate() {
    const f = app.querySelector('.gate__f');
    if (!f) return;
    const input = f.querySelector('input'), btn = f.querySelector('button'), err = f.querySelector('.gate__e');
    input.focus();
    f.addEventListener('submit', async e => {
      e.preventDefault();
      btn.disabled = true; err.textContent = '';
      try { await unlock(input.value); route(); }
      catch { err.textContent = 'That password didn’t work.'; f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); input.select(); }
      finally { btn.disabled = false; }
    });
  }

  /* ---------- prefs kept in the URL query (?theme=agoda), so a shared link opens the same way */
  const THEMES_OK = ['site', 'agoda'];
  const pref = (k, def) => new URLSearchParams(location.search).get(k) || def;
  function setPref(k, v, def) {
    const q = new URLSearchParams(location.search);
    v === def ? q.delete(k) : q.set(k, v);
    history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
  }
  function applyTheme(t) {
    if (!THEMES_OK.includes(t)) t = 'site';
    document.documentElement.dataset.theme = t;
    document.querySelectorAll('[data-th]').forEach(b => b.setAttribute('aria-pressed', b.dataset.th === t));
    return t;
  }
  const themeSwitch = () => `<span class="tsw"><span class="seg" role="group" aria-label="Deck theme">${THEMES_OK.map(t =>
    `<button data-th="${t}" aria-pressed="false">${t === 'site' ? 'Site' : 'Agoda'}</button>`).join('')}</span>
    <span class="tsw__n">Agoda-inspired theme, not Agoda’s design system</span></span>`;
  function bindTheme(root) {
    root.querySelectorAll('[data-th]').forEach(b => b.addEventListener('click', () => setPref('theme', applyTheme(b.dataset.th), 'site')));
    applyTheme(pref('theme', 'site'));
  }
  applyTheme(pref('theme', 'site'));
  // With AI / Without AI: slides can carry vibe.ai / vibe.plain field overrides. Kept in the URL as ?ai=off.
  const vibe = () => pref('ai', 'on') === 'off' ? 'plain' : 'ai';
  const withVibe = s => s.vibe ? { ...s, ...(s.vibe[vibe()] || {}) } : s;
  const vibeSwitch = () => `<span class="seg" role="group" aria-label="AI in the story">${[['ai', 'With AI'], ['plain', 'Without AI']].map(([v, l]) =>
    `<button data-vibe="${v}" aria-pressed="${vibe() === v}">${l}</button>`).join('')}</span>`;

  /* ---------- helpers */
  const fmtDate = s => new Date(s + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const pad = n => String(n).padStart(2, '0');
  const deckById = id => data.decks.find(d => d.id === id);
  const go = h => { location.hash = h; };
  function top(right = '') {
    return `<header class="top"><a href="/" rel="nofollow">${data.owner}</a><div style="display:flex;gap:12px;align-items:center">${themeSwitch()}${right}<button class="pill" data-lock><span class="dot"></span>Lock</button></div></header>`;
  }
  function bindTop() {
    bindTheme(app);
    app.querySelector('[data-lock]')?.addEventListener('click', () => { sessionStorage.removeItem(KEY); location.hash = ''; location.reload(); });
  }

  /* ---------- hub */
  function hub() {
    document.title = 'Interviews · ' + data.owner;
    app.innerHTML = `<div class="page">${top()}
      <section class="head"><h1 class="disp">Interview decks</h1><p>One deck per conversation. Pick a deck, choose the case studies that fit the panel, then present.</p></section>
      <ol class="rows">${data.decks.map((d, i) => `<li class="row" tabindex="0" data-deck="${d.id}">
        <span class="row__n">${pad(i + 1)}</span><span class="row__t">${d.company}</span>
        <span class="k">${fmtDate(d.date)}</span><span class="k">${d.caseStudies.length} case studies</span><span class="row__go">Open →</span></li>`).join('')}</ol>
      <p class="foot">Private and unlisted. Please don’t share the link without asking.</p></div>`;
    bindTop();
    app.querySelectorAll('[data-deck]').forEach(r => {
      const open = () => go('#/' + r.dataset.deck);
      r.addEventListener('click', open);
      r.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
    });
  }

  /* ---------- picker */
  const picks = {};
  function picker(deck) {
    document.title = deck.company + ' · ' + data.owner;
    const sel = picks[deck.id] ||= [...deck.caseStudies];
    app.innerHTML = `<div class="page">${top()}
      <section class="head"><div><a class="back" href="#/">← All decks</a><h1 class="disp" style="margin-top:18px">${deck.company}</h1></div>
        <p>Pick one or more case studies. They play in the order you pick them, after a three-slide intro and before the thank-you.</p></section>
      <div class="picks">${deck.caseStudies.map(id => { const c = data.caseStudies[id]; return `
        <button class="pick" data-cs="${id}" aria-pressed="false">
          <span class="pick__img"><img src="${c.card}" alt="" loading="lazy"></span><span class="pick__n"></span>
          <span class="pick__s"><span class="k">${c.name} · ${c.slides.length} slides</span><h2 class="pick__t">${c.short}</h2><p class="pick__l">${c.lede}</p>
          <span class="chips">${c.tags.map(t => `<span class="chip">${t}</span>`).join('')}</span></span></button>`; }).join('')}</div>
      <div class="bar"><span class="bar__s"></span><div class="bar__r">
        <button class="go" data-go>Start presenting →</button></div></div></div>`;
    bindTop();
    const sync = () => {
      app.querySelectorAll('.pick').forEach(b => {
        const n = sel.indexOf(b.dataset.cs);
        b.setAttribute('aria-pressed', n > -1);
        b.querySelector('.pick__n').textContent = n > -1 ? n + 1 : '';
      });
      const total = data.intro.length + sel.reduce((s, id) => s + data.caseStudies[id].slides.length, 0) + 1;
      app.querySelector('.bar__s').textContent = sel.length
        ? `Intro → ${sel.map(id => data.caseStudies[id].short).join(' → ')} → Thank you · ${total} slides`
        : 'Pick at least one case study';
      app.querySelector('[data-go]').disabled = !sel.length;
    };
    app.querySelectorAll('.pick').forEach(b => b.addEventListener('click', () => {
      const n = sel.indexOf(b.dataset.cs);
      n > -1 ? sel.splice(n, 1) : sel.push(b.dataset.cs);
      sync();
    }));
    app.querySelector('[data-go]').addEventListener('click', () => go(`#/${deck.id}/play/${sel.join(',')}/1`));
    sync();
  }

  /* ---------- slides */
  function visual(v) {
    if (!v) return '';
    if (v.html) return v.html;
    if (v.img) return `<img src="${v.img.src}" alt="${v.img.alt || ''}" loading="lazy">`;
    if (v.stats) return `<div class="stats" style="--n:${v.stats.length}">${v.stats.map(([b, s]) => `<div><b>${b}</b><span>${s}</span></div>`).join('')}</div>`;
    if (v.imgs) return `<div class="car" data-car><div class="car__track">${v.imgs.map((m, i) => `<figure class="${i ? '' : 'is-on'}">${
      m.src.startsWith('enc:') ? `<span class="load">Unlocking…</span><img data-enc="${m.src.slice(4)}" alt="${m.alt}" hidden>` : `<img src="${m.src}" alt="${m.alt}" loading="lazy">`
    }</figure>`).join('')}</div><div class="car__ui"><span class="car__cap">${v.imgs[0].alt}</span>${v.imgs.length > 1
      ? `<span class="car__nav"><button data-d="-1" aria-label="Previous image">‹</button><span data-c>01 / ${pad(v.imgs.length)}</span><button data-d="1" aria-label="Next image">›</button></span>` : ''}</div></div>`;
    return '';
  }
  function slideHtml(s, sec, i) {
    let r = 0;
    const R = () => `data-r style="--i:${r++}"`;
    const kick = `<div class="s-kick" ${R()}><span class="k">${s.t === 'cover' ? `<b>${s.kicker}</b>` : `<b>${sec}</b>${s.kicker ? ' · ' + s.kicker : ''}`}</span><span class="k">${data.owner}</span></div>`;
    const title = `<h2 class="disp s-title" ${R()}>${s.title}</h2>`;
    const body = s.body ? `<div class="s-body" ${R()}>${s.body}</div>` : '';
    const vis = s.visual ? `<div class="vis" ${R()}>${visual(s.visual)}</div>` : '';
    const ai = s.ai ? `<span class="ai-tag">Contains AI-generated imagery</span>` : '';
    let inner;
    if (s.t === 'cover') inner = `${kick}<div class="s-grid"><div>${title}<p class="lede" ${R()}>${s.lede}</p>
      <div class="chips" ${R()}>${s.chips.map(c => `<span class="chip">${c}</span>`).join('')}</div>
      <div class="facts" ${R()}>${s.facts.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div></div>${vis}</div>`;
    else if (s.t === 'split') inner = `${kick}<div class="s-grid"><div>${title}${body}</div>${vis}</div>`;
    else if (s.t === 'stack') inner = `${kick}<div class="s-head">${title}${body}</div>${vis}`;
    else inner = `${kick}<div style="flex:1;display:flex;flex-direction:column;justify-content:center">${title}${body}${
      s.contact ? `<div class="contact" ${R()}>${s.contact.map(([l, t, h]) => `<a href="${h}" target="_blank" rel="noopener noreferrer"><span class="k">${l}</span>${t}</a>`).join('')}</div>` : ''}</div>`;
    return `<section class="slide t-${s.t === 'center' ? 'end' : s.t}" data-i="${i}" aria-roledescription="slide">${inner}${ai}</section>`;
  }

  /* ---------- widgets */
  const THEMES = [
    ['Base', { p: '#2b3d26', s: '#f6f6f4', c: '#ffffff', t: '#141414', r: '10px', f: 'var(--d-body)' }],
    ['Theme A', { p: '#274e7a', s: '#eef2f7', c: '#ffffff', t: '#0f1d2e', r: '3px', f: 'var(--d-body)' }],
    ['Theme B', { p: '#b5473a', s: '#faf3ee', c: '#ffffff', t: '#2a1612', r: '20px', f: 'Georgia, serif' }],
    ['Theme C', { p: '#8b7cf6', s: '#17151f', c: '#24212f', t: '#f1eef9', r: '12px', f: 'var(--d-body)' }],
  ];
  function themes(el) {
    el.className = 'themes';
    el.innerHTML = `<div class="themes__seg" role="group" aria-label="Theme">${THEMES.map(([n], i) => `<button aria-pressed="${!i}" data-t="${i}">${n}</button>`).join('')}</div>
      <div class="mock"><div class="mock__bar"><i></i>Client Portal<span>Dashboard · Reports · Settings</span></div><div class="mock__b">
        <div class="mock__kpis"><div>Open cases<b>128</b></div><div>Resolved<b>94%</b></div><div>Avg. time<b>2.4d</b></div></div>
        <div class="mock__chart">${[40, 62, 48, 75, 58, 88, 70, 95].map(h => `<i style="height:${h}%"></i>`).join('')}</div>
        <div class="mock__row">Quarterly review ready<span class="mock__btn">Open</span></div></div></div>
      <span class="k">Same components, four token sets. Sample themes, not client brands.</span>`;
    const mock = el.querySelector('.mock');
    const set = i => {
      Object.entries(THEMES[i][1]).forEach(([k, v]) => mock.style.setProperty('--' + k, v));
      el.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-pressed', b.dataset.t == i));
    };
    el.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => set(+b.dataset.t)));
    set(0);
  }
  function pizza(el) {
    const total = +el.dataset.total || 2400, who = [['You', '#2b3d26'], ['Aman', '#e38f9f'], ['Riya', '#274e7a'], ['Kabir', '#fdb300']];
    const own = [0, 0, 1, 1, 2, 2, 3, 3];
    const P = (a, r = 190) => [200 + r * Math.cos(a), 200 + r * Math.sin(a)].map(n => n.toFixed(2)).join(' ');
    const rad = d => (d - 90) * Math.PI / 180;
    el.className = 'pizza';
    el.innerHTML = `<svg viewBox="0 0 400 400" role="img" aria-label="Pizza split into 8 slices; click a slice to give it to the next person">${own.map((_, i) =>
      `<path data-s="${i}" d="M200 200 L${P(rad(i * 45))} A190 190 0 0 1 ${P(rad(i * 45 + 45))} Z"></path>`).join('')}</svg>
      <div><div class="pizza__who"></div><p class="pizza__tot">Bill ₹${total.toLocaleString('en-IN')} · 8 slices · tap a slice to pass it on</p></div>`;
    const draw = () => {
      el.querySelectorAll('path').forEach(p => p.style.fill = who[own[p.dataset.s]][1]);
      el.querySelector('.pizza__who').innerHTML = who.map(([n, c], i) => {
        const k = own.filter(o => o === i).length;
        return `<div><i style="background:${c}"></i><span>${n}<small>${k} slice${k === 1 ? '' : 's'}</small></span><b>₹${Math.round(total / 8 * k).toLocaleString('en-IN')}</b></div>`;
      }).join('');
    };
    el.querySelectorAll('path').forEach(p => p.addEventListener('click', () => { own[p.dataset.s] = (own[p.dataset.s] + 1) % who.length; draw(); }));
    draw();
  }
  function carousel(el) {
    const figs = [...el.querySelectorAll('figure')], cap = el.querySelector('.car__cap'), c = el.querySelector('[data-c]');
    let at = 0;
    const show = n => {
      at = (n + figs.length) % figs.length;
      figs.forEach((f, i) => f.classList.toggle('is-on', i === at));
      cap.textContent = figs[at].querySelector('img').alt;
      if (c) c.textContent = `${pad(at + 1)} / ${pad(figs.length)}`;
    };
    el.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); show(at + +b.dataset.d); }));
  }
  function wake(slide) {
    slide.querySelectorAll('img[data-enc]').forEach(img => {
      const path = img.dataset.enc;
      img.removeAttribute('data-enc');
      encImg(path).then(u => { img.src = u; img.hidden = false; img.previousElementSibling?.remove(); })
        .catch(() => { img.previousElementSibling.textContent = 'Couldn’t unlock this image.'; });
    });
  }

  /* ---------- player */
  function play(deck, ids, n) {
    ids = ids.filter(id => deck.caseStudies.includes(id));
    if (!ids.length) return go('#/' + deck.id);
    picks[deck.id] = ids;
    const secs = [['Intro', data.intro], ...ids.map(id => [data.caseStudies[id].name, data.caseStudies[id].slides]), ['Close', [data.outro]]];
    const list = secs.flatMap(([name, ss], si) => ss.map(s => ({ s: withVibe(s), name, si })));
    const base = `#/${deck.id}/play/${ids.join(',')}/`;
    document.title = deck.company + ' deck · ' + data.owner;
    app.innerHTML = `<div class="player"><div class="deckbar">${vibeSwitch()}${themeSwitch()}</div><div class="viewport"><div class="stage">${list.map((x, i) => slideHtml(x.s, x.name, i)).join('')}</div><aside class="notes" aria-live="polite" hidden><span class="k">Speaker notes · N to hide</span><p></p></aside></div>
      <nav class="chrome" aria-label="Slide controls"><div class="chrome__l"><b>${deck.company}</b><span></span></div>
        <div class="prog">${secs.map(([name, ss], si) => `<button style="--n:${ss.length}" data-sec="${si}" aria-label="Jump to ${name}" title="${name}"></button>`).join('')}</div>
        <div class="chrome__r"><span class="chrome__c"></span>
          <button class="ib" data-nav="-1" aria-label="Previous slide">‹</button><button class="ib" data-nav="1" aria-label="Next slide">›</button>
          <button class="ib ib--t" data-notes aria-pressed="false" aria-label="Speaker notes (N)" title="Speaker notes (N)">N</button>
          <button class="ib" data-fs aria-label="Fullscreen (F)"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 5V1h4M11 1h4v4M15 11v4h-4M5 15H1v-4"/></svg></button>
          <button class="ib" data-x aria-label="Back to picker (Esc)">×</button></div></nav></div>`;
    const root = app.querySelector('.player'), vp = root.querySelector('.viewport'), stage = root.querySelector('.stage');
    bindTheme(root);
    root.querySelectorAll('[data-vibe]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.vibe === vibe()) return;
      setPref('ai', b.dataset.vibe === 'plain' ? 'off' : 'on', 'on');
      route();
    }));
    const slides = [...stage.children], secBtns = [...root.querySelectorAll('[data-sec]')];
    stage.querySelectorAll('[data-widget="themes"]').forEach(themes);
    stage.querySelectorAll('[data-widget="pizza"]').forEach(pizza);
    stage.querySelectorAll('[data-car]').forEach(carousel);
    stage.querySelectorAll('.tools').forEach(t => { const sp = t.querySelectorAll(':scope>span'); sp.forEach((e, i) => e.style.setProperty('--a', i * 360 / sp.length - 90)); });
    let at = -1;
    const notesEl = root.querySelector('.notes'), notesBtn = root.querySelector('[data-notes]');
    const fillNotes = () => { notesEl.querySelector('p').innerHTML = list[at].s.notes || '<i>No notes on this slide.</i>'; };
    const toggleNotes = () => {
      notesEl.hidden = !notesEl.hidden;
      notesBtn.setAttribute('aria-pressed', !notesEl.hidden);
      if (!notesEl.hidden) fillNotes();
    };
    notesBtn.addEventListener('click', toggleNotes);
    const fit = () => {
      const narrow = innerWidth <= 760;
      root.classList.toggle('is-narrow', narrow);
      stage.style.setProperty('--s', narrow ? 1 : Math.min(vp.clientWidth / 1600, vp.clientHeight / 900));
    };
    const show = i => {
      i = Math.max(0, Math.min(list.length - 1, i));
      if (i === at) return;
      slides[at]?.classList.remove('is-on');
      at = i;
      slides[at].classList.add('is-on');
      wake(slides[at]); if (slides[at + 1]) wake(slides[at + 1]);
      if (!notesEl.hidden) fillNotes();
      notesBtn.classList.toggle('has', !!list[at].s.notes);
      root.querySelector('.chrome__c').textContent = `${pad(at + 1)} / ${pad(list.length)}`;
      root.querySelector('.chrome__l span').textContent = list[at].name;
      secBtns.forEach((b, si) => {
        const idx = list.map((x, k) => x.si === si ? k : -1).filter(k => k > -1);
        b.style.setProperty('--f', at > idx.at(-1) ? 1 : at < idx[0] ? 0 : (at - idx[0] + 1) / idx.length);
      });
      history.replaceState(null, '', base + (at + 1));
      if (root.classList.contains('is-narrow')) vp.scrollTop = 0;
    };
    root.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', () => show(at + +b.dataset.nav)));
    secBtns.forEach((b, si) => b.addEventListener('click', () => show(list.findIndex(x => x.si === si))));
    const fs = () => document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen?.().catch(() => {});
    root.querySelector('[data-fs]').addEventListener('click', fs);
    root.querySelector('[data-x]').addEventListener('click', () => go('#/' + deck.id));
    const key = e => {
      const t = e.target instanceof Element ? e.target : document.body;
      if (t.closest('input,select,textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !t.closest('button'))) { e.preventDefault(); show(at + 1); }
      else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); show(at - 1); }
      else if (k === 'Home') show(0);
      else if (k === 'End') show(list.length - 1);
      else if (k === 'f' || k === 'F') fs();
      else if (k === 'n' || k === 'N') toggleNotes();
      else if (k === 'Escape' && !document.fullscreenElement) go('#/' + deck.id);
    };
    let tx = 0, ty = 0;
    const ts = e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; };
    const te = e => {
      const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && !(e.target instanceof Element && e.target.closest('.car,.pizza,.themes'))) show(at + (dx < 0 ? 1 : -1));
    };
    addEventListener('keydown', key); addEventListener('resize', fit);
    vp.addEventListener('touchstart', ts, { passive: true }); vp.addEventListener('touchend', te);
    player = () => { removeEventListener('keydown', key); removeEventListener('resize', fit); if (document.fullscreenElement) document.exitFullscreen(); };
    fit();
    show((parseInt(n, 10) || 1) - 1);
  }

  /* ---------- router */
  function route() {
    if (!data) return;
    player?.(); player = null;
    const [deckId, mode, ids, n] = location.hash.replace(/^#\/?/, '').split('/');
    const deck = deckId && deckById(deckId);
    if (!deck) return hub();
    if (mode === 'play') return play(deck, (ids || '').split(',').filter(Boolean), n);
    picker(deck);
  }
  addEventListener('hashchange', route);

  const saved = sessionStorage.getItem(KEY);
  if (saved) unlock(saved).then(route).catch(() => { sessionStorage.removeItem(KEY); gate(); });
  else gate();
})();
