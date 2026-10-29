/* Interview decks: password gate, hub, case-study picker and slide player.
   deck.bin and assets/img/locked/*.bin share one format: salt(16) | iv(12) | AES-256-GCM, PBKDF2-SHA256 250k. */
(() => {
  const app = document.getElementById('app');
  const KEY = 'sn-interviews';
  const keys = new Map();
  let pw = null, data = null, player = null, loadedSha = null, editing = false, dirty = false;

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

  async function encrypt(bytes) {
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes));
    const out = new Uint8Array(28 + ct.length); out.set(salt); out.set(iv, 16); out.set(ct, 28);
    return out;
  }
  async function gitSha(bytes) {
    const head = new TextEncoder().encode(`blob ${bytes.length}\0`), all = new Uint8Array(head.length + bytes.length);
    all.set(head); all.set(bytes, head.length);
    return hex(new Uint8Array(await crypto.subtle.digest('SHA-1', all)));
  }

  /* ---------- gate */
  async function unlock(pass) {
    const buf = await fetch('deck.bin', { cache: 'no-cache' }).then(r => r.arrayBuffer());
    data = JSON.parse(new TextDecoder().decode(await decrypt(buf, pass)));
    loadedSha = await gitSha(new Uint8Array(buf));
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
  // A company theme belongs to that company's deck only (deck.theme, or a theme named after the deck id). The hub is always the site theme.
  const deckTheme = deck => deck && (deck.theme || (THEMES_OK.includes(deck.id) && deck.id !== 'site' ? deck.id : null));
  function applyTheme(t, deck) {
    if (!deck || t !== deckTheme(deck)) t = 'site';
    document.documentElement.dataset.theme = t;
    document.querySelectorAll('[data-th]').forEach(b => b.setAttribute('aria-pressed', b.dataset.th === t));
    return t;
  }
  const themeSwitch = deck => { const t = deckTheme(deck); return t ? `<span class="tsw"><span class="seg" role="group" aria-label="Deck style">${[['site', 'Site style'], [t, deck.company + ' style']].map(([v, l]) =>
    `<button data-th="${v}" aria-pressed="false">${l}</button>`).join('')}</span>
    <span class="tsw__n">${deck.company}-inspired theme, not ${deck.company}’s design system</span></span>` : ''; };
  function bindTheme(root, deck) {
    root.querySelectorAll('[data-th]').forEach(b => b.addEventListener('click', () => setPref('theme', applyTheme(b.dataset.th, deck), 'site')));
    applyTheme(pref('theme', 'site'), deck);
  }
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
  function top(right = '', deck) {
    return `<header class="top"><a href="/" rel="nofollow">${data.owner}</a><div style="display:flex;gap:12px;align-items:center">${themeSwitch(deck)}${right}<button class="pill" data-lock><span class="dot"></span>Lock</button></div></header>`;
  }
  function bindTop(deck) {
    bindTheme(app, deck);
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
    app.innerHTML = `<div class="page">${top('', deck)}
      <section class="head"><div><a class="back" href="#/">← All decks</a><h1 class="disp" style="margin-top:18px">${deck.company}</h1></div>
        <p>Pick one or more case studies. They play in the order you pick them, after a three-slide intro and before the thank-you.</p></section>
      <div class="picks">${deck.caseStudies.map(id => { const c = data.caseStudies[id]; return `
        <button class="pick" data-cs="${id}" aria-pressed="false">
          <span class="pick__img"><img src="${c.card}" alt="" loading="lazy"></span><span class="pick__n"></span>
          <span class="pick__s"><span class="k">${c.name} · ${c.slides.length} slides</span><h2 class="pick__t">${c.short}</h2><p class="pick__l">${c.lede}</p>
          <span class="chips">${c.tags.map(t => `<span class="chip">${t}</span>`).join('')}</span></span></button>`; }).join('')}</div>
      <div class="bar"><span class="bar__s"></span><div class="bar__r">
        <button class="go" data-go>Start presenting →</button></div></div></div>`;
    bindTop(deck);
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
      m.src.startsWith('enc:') ? `<span class="load">Unlocking…</span><img data-o="${m.src}" data-enc="${m.src.slice(4)}" alt="${m.alt}" hidden>` : `<img src="${m.src}" alt="${m.alt}" loading="lazy">`
    }</figure>`).join('')}</div><div class="car__ui"><span class="car__cap">${v.imgs[0].alt}</span>${v.imgs.length > 1
      ? `<span class="car__nav"><button data-d="-1" aria-label="Previous image">‹</button><span data-c>01 / ${pad(v.imgs.length)}</span><button data-d="1" aria-label="Next image">›</button></span>` : ''}</div></div>`;
    return '';
  }
  function slideHtml(s, sec, i) {
    let r = 0;
    const R = () => `data-r style="--i:${r++}"`;
    const kick = `<div class="s-kick" ${R()}><span class="k">${s.t === 'cover' ? `<b>${s.kicker}</b>` : `<b>${sec}</b>${s.kicker ? ' · ' + s.kicker : ''}`}</span><span class="k">${data.owner}</span></div>`;
    const title = `<h2 class="disp s-title" data-f="title" ${R()}>${s.title}</h2>`;
    const body = s.body ? `<div class="s-body" data-f="body" ${R()}>${s.body}</div>` : '';
    const vis = s.visual ? `<div class="vis" ${R()}>${visual(s.visual)}</div>` : '';
    const ai = s.ai ? `<span class="ai-tag">Contains AI-generated imagery</span>` : '';
    let inner;
    if (s.t === 'cover') inner = `${kick}<div class="s-grid"><div>${title}<p class="lede" data-f="lede" ${R()}>${s.lede}</p>
      <div class="chips" ${R()}>${s.chips.map(c => `<span class="chip">${c}</span>`).join('')}</div>
      <div class="facts" ${R()}>${s.facts.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div></div>${vis}</div>`;
    else if (s.t === 'split') inner = `${kick}<div class="s-grid"><div>${title}${body}</div>${vis}</div>`;
    else if (s.t === 'stack') inner = `${kick}<div class="s-head">${title}${body}</div>${vis}`;
    else inner = `${kick}<div style="flex:1;display:flex;flex-direction:column;justify-content:center">${title}${body}${
      s.contact ? `<div class="contact" ${R()}>${s.contact.map(([l, t, h]) => `<a href="${h}" target="_blank" rel="noopener noreferrer"><span class="k">${l}</span>${t}</a>`).join('')}</div>` : ''}</div>`;
    // every image remembers its source in the deck data (data-o) so the editor can swap it; enc: sources decrypt on wake
    inner = inner.replace(/<img\b([^>]*?)\ssrc="([^"]+)"/g, (m, a, src) =>
      src.startsWith('enc:') ? `<img${a} data-o="${src}" data-enc="${src.slice(4)}"` : `<img${a} data-o="${src}" src="${src}"`);
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
      const load = img.previousElementSibling?.matches('.load') ? img.previousElementSibling : null;
      encImg(path).then(u => { img.src = u; img.hidden = false; load?.remove(); })
        .catch(() => { if (load) load.textContent = 'Couldn’t unlock this image.'; });
    });
  }

  /* ---------- editor: edits apply to the decrypted deck in memory; Save re-encrypts and commits via the GitHub Contents API.
     The token is typed in here by Samarth and kept only in this browser's localStorage. */
  const TOK = 'sn-interviews-gh', REPO = 'samarthdesigns/new-website', newBins = new Map();
  const fieldOwner = (o, f) => (o.vibe?.[vibe()] && f in o.vibe[vibe()]) ? o.vibe[vibe()] : o;
  function swap(obj, from, to) {
    for (const k in obj) {
      const v = obj[k];
      if (typeof v === 'string') { if (v === from) obj[k] = to; else if (v.includes(`"${from}"`)) obj[k] = v.split(`"${from}"`).join(`"${to}"`); }
      else if (v && typeof v === 'object') swap(v, from, to);
    }
  }
  async function toWebp(file) {
    const bmp = await createImageBitmap(file), sc = Math.min(1, 2400 / bmp.width), c = document.createElement('canvas');
    c.width = Math.round(bmp.width * sc); c.height = Math.round(bmp.height * sc);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise(r => c.toBlob(r, 'image/webp', 0.86));
  }
  const b64 = u => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
  async function gh(path, bytes, message) {
    const token = localStorage.getItem(TOK), api = `https://api.github.com/repos/${REPO}/contents/${path}`;
    const h = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    const cur = await fetch(api + '?ref=main', { headers: h, cache: 'no-store' });
    if (!cur.ok && cur.status !== 404) throw new Error(`${path}: GitHub said ${cur.status}`);
    const sha = cur.ok ? (await cur.json()).sha : undefined;
    if (path === 'interviews/deck.bin' && sha && sha !== loadedSha) throw new Error('The deck changed on GitHub since you opened it. Reload, then redo these edits.');
    const r = await fetch(api, { method: 'PUT', headers: h, body: JSON.stringify({ message, content: b64(bytes), branch: 'main', ...(sha && { sha }) }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`${path}: ${r.status} ${j.message || ''}`);
    return j.content?.sha;
  }
  function editor(root, stage, list, cur, slideEl) {
    const btn = root.querySelector('[data-edit]'), panel = root.querySelector('.ed'), file = root.querySelector('[data-file]');
    const st = panel.querySelector('.ed__s'), tok = panel.querySelector('.ed__tok'), saveB = panel.querySelector('[data-save]');
    let target = null;
    const say = t => { st.textContent = t; };
    const sync = () => {
      const has = !!localStorage.getItem(TOK);
      tok.innerHTML = has
        ? `<span class="k">GitHub token saved in this browser</span> <button class="lnk" data-forget>Forget</button>`
        : `<form class="ed__f"><input type="password" placeholder="GitHub fine-grained token" aria-label="GitHub fine-grained token" autocomplete="off"><button class="pill">Keep</button></form>
           <span class="ed__h">Contents: read &amp; write on ${REPO} only. Stored in this browser, never in the repo.</span>`;
      saveB.disabled = !has || !dirty;
      saveB.textContent = has ? 'Save & publish' : 'Waiting for token';
      tok.querySelector('form')?.addEventListener('submit', e => { e.preventDefault(); const v = e.target.querySelector('input').value.trim(); if (v) { localStorage.setItem(TOK, v); sync(); } });
      tok.querySelector('[data-forget]')?.addEventListener('click', () => { localStorage.removeItem(TOK); sync(); });
      if (!st.textContent || /^(No changes|\d+ change)/.test(st.textContent)) say(dirty ? 'Unsaved changes' : 'No changes yet. Click any text to edit it, or an image to replace it.');
    };
    const set = on => {
      editing = on;
      btn.setAttribute('aria-pressed', on); root.classList.toggle('is-editing', on); panel.hidden = !on;
      root.querySelectorAll('[data-f]').forEach(el => { if (on) el.setAttribute('contenteditable', 'true'); else el.removeAttribute('contenteditable'); });
      if (on) sync();
    };
    btn.addEventListener('click', () => set(!editing));
    root.addEventListener('input', e => {
      const el = e.target.closest?.('[data-f]'); if (!el) return;
      const i = el.closest('.notes') ? cur() : +el.closest('.slide').dataset.i, f = el.dataset.f;
      let v = el.innerHTML.trim();
      if (f === 'title' || f === 'lede') v = v.replace(/<br\s*\/?>$/,'');
      fieldOwner(list[i].o, f)[f] = v; list[i].s[f] = v;
      dirty = true; say('Unsaved changes'); sync();
    });
    root.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.closest?.('[data-f="title"],[data-f="lede"]')) e.preventDefault(); }, true);
    root.addEventListener('paste', e => {
      if (!e.target.closest?.('[data-f]')) return;
      e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
    });
    stage.addEventListener('click', e => {
      if (!editing) return;
      const img = e.target.closest?.('img[data-o]'); if (!img) return;
      e.preventDefault(); e.stopPropagation(); target = img; file.value = ''; file.click();
    }, true);
    file.addEventListener('change', async () => {
      const f = file.files[0], img = target; if (!f || !img) return;
      try {
        say('Encrypting image…');
        const webp = new Uint8Array(await (await toWebp(f)).arrayBuffer());
        const name = `deck-${Date.now().toString(36)}-${hex(crypto.getRandomValues(new Uint8Array(3)))}.bin`, ref = `enc:/assets/img/locked/${name}`;
        newBins.set(name, await encrypt(webp));
        const i = +img.closest('.slide').dataset.i;
        swap(list[i].o, img.dataset.o, ref); swap(list[i].s, img.dataset.o, ref);
        img.dataset.o = ref; img.src = URL.createObjectURL(new Blob([webp], { type: 'image/webp' })); img.hidden = false;
        encUrls.set(ref.slice(4), Promise.resolve(img.src));
        dirty = true; say('Image replaced. Unsaved changes'); sync();
      } catch (err) { say('Couldn’t use that image: ' + err.message); }
    });
    panel.querySelector('[data-discard]').addEventListener('click', () => {
      if (dirty && !confirm('Throw away unsaved edits?')) return;
      dirty = false; editing = false; newBins.clear(); location.reload();
    });
    saveB.addEventListener('click', async () => {
      saveB.disabled = true;
      try {
        for (const [name, bytes] of newBins) { say(`Uploading ${name}…`); await gh(`assets/img/locked/${name}`, bytes, 'Interviews: add locked image from the deck editor'); }
        newBins.clear();
        say('Encrypting deck…');
        const bin = await encrypt(new TextEncoder().encode(JSON.stringify(data)));
        say('Committing deck…');
        loadedSha = await gh('interviews/deck.bin', bin, 'Interviews: edit deck from the browser editor');
        dirty = false;
        say('Saved. Live in about a minute. Run build.mjs --pull to bring the edits into content.mjs.');
      } catch (err) { say('Save failed: ' + err.message); }
      sync();
    });
    set(editing);
  }

  /* ---------- player */
  function play(deck, ids, n) {
    ids = ids.filter(id => deck.caseStudies.includes(id));
    if (!ids.length) return go('#/' + deck.id);
    picks[deck.id] = ids;
    const secs = [['Intro', data.intro], ...ids.map(id => [data.caseStudies[id].name, data.caseStudies[id].slides]), ['Close', [data.outro]]];
    const list = secs.flatMap(([name, ss], si) => ss.map(s => ({ s: withVibe(s), o: s, name, si })));
    const base = `#/${deck.id}/play/${ids.join(',')}/`;
    document.title = deck.company + ' deck · ' + data.owner;
    app.innerHTML = `<div class="player"><div class="deckbar">${vibeSwitch()}${themeSwitch(deck)}<button class="seg-b" data-edit aria-pressed="${editing}">Edit</button></div>
      <div class="ed" hidden><div class="ed__s"></div><div class="ed__tok"></div><div class="ed__b">
        <button class="pill" data-discard>Discard</button><button class="pill pill--on" data-save>Save &amp; publish</button></div></div>
      <input type="file" accept="image/*" data-file hidden><div class="viewport"><div class="stage">${list.map((x, i) => slideHtml(x.s, x.name, i)).join('')}</div><aside class="notes" aria-live="polite" hidden><span class="k">Speaker notes · N to hide</span><p data-f="notes" data-empty="No notes on this slide."></p></aside></div>
      <nav class="chrome" aria-label="Slide controls"><div class="chrome__l"><b>${deck.company}</b><span></span></div>
        <div class="prog">${secs.map(([name, ss], si) => `<button style="--n:${ss.length}" data-sec="${si}" aria-label="Jump to ${name}" title="${name}"></button>`).join('')}</div>
        <div class="chrome__r"><span class="chrome__c"></span>
          <button class="ib" data-nav="-1" aria-label="Previous slide">‹</button><button class="ib" data-nav="1" aria-label="Next slide">›</button>
          <button class="ib ib--t" data-notes aria-pressed="false" aria-label="Speaker notes (N)" title="Speaker notes (N)">N</button>
          <button class="ib" data-fs aria-label="Fullscreen (F)"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 5V1h4M11 1h4v4M15 11v4h-4M5 15H1v-4"/></svg></button>
          <button class="ib" data-x aria-label="Back to picker (Esc)">×</button></div></nav></div>`;
    const root = app.querySelector('.player'), vp = root.querySelector('.viewport'), stage = root.querySelector('.stage');
    bindTheme(root, deck);
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
    const fillNotes = () => { notesEl.querySelector('p').innerHTML = list[at].s.notes || ''; };
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
      if (t.closest('input,select,textarea,[contenteditable="true"]') || e.metaKey || e.ctrlKey || e.altKey) return;
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
    editor(root, stage, list, () => at, i => slides[i]);
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
