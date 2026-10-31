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
  const ownedCount = id => data.sections.filter(s => s.owner === id).reduce((n, s) => n + s.slides.length, 0);
  const ownerPos = id => data.sections.findIndex(s => s.owner === id);
  function picker(deck) {
    document.title = deck.company + ' · ' + data.owner;
    const sel = picks[deck.id] ||= [...deck.caseStudies];
    app.innerHTML = `<div class="page">${top('', deck)}
      <section class="head"><div><a class="back" href="#/">← All decks</a><h1 class="disp" style="margin-top:18px">${deck.company}</h1></div>
        <p>Pick one or more case studies. They sit between the intro and the thank-you. Arrange slides and sections once the deck is open.</p></section>
      <div class="picks">${deck.caseStudies.map(id => { const c = data.caseStudies[id]; return `
        <button class="pick" data-cs="${id}" aria-pressed="false">
          <span class="pick__img"><img src="${c.card}" alt="" loading="lazy"></span><span class="pick__n"></span>
          <span class="pick__s"><span class="k">${c.name} · ${ownedCount(id)} slides</span><h2 class="pick__t">${c.short}</h2><p class="pick__l">${c.lede}</p>
          <span class="chips">${c.tags.map(t => `<span class="chip">${t}</span>`).join('')}</span></span></button>`; }).join('')}</div>
      <div class="bar"><span class="bar__s"></span><div class="bar__r">
        <button class="go" data-go>Open deck →</button></div></div></div>`;
    bindTop(deck);
    const sync = () => {
      const ordered = [...sel].sort((a, b) => ownerPos(a) - ownerPos(b));
      app.querySelectorAll('.pick').forEach(b => {
        const n = ordered.indexOf(b.dataset.cs);
        b.setAttribute('aria-pressed', n > -1);
        b.querySelector('.pick__n').textContent = n > -1 ? n + 1 : '';
      });
      const total = data.sections.filter(s => s.owner === 'intro' || s.owner === 'close' || sel.includes(s.owner)).reduce((n, s) => n + s.slides.length, 0);
      app.querySelector('.bar__s').textContent = sel.length
        ? `Intro → ${ordered.map(id => data.caseStudies[id].short).join(' → ')} → Thank you · ${total} slides`
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
    if (v.stats) return `<div class="stats" style="--n:${v.stats.length}">${v.stats.map(([b, s], j) => `<div><b data-p="visual.stats.${j}.0">${b}</b><span data-p="visual.stats.${j}.1">${s}</span></div>`).join('')}</div>`;
    if (v.imgs) return `<div class="car" data-car><div class="car__track">${v.imgs.map((m, i) => `<figure class="${i ? '' : 'is-on'}">${
      m.src.startsWith('enc:') ? `<span class="load">Unlocking…</span><img data-o="${m.src}" data-enc="${m.src.slice(4)}" alt="${m.alt}" hidden>` : `<img src="${m.src}" alt="${m.alt}" loading="lazy">`
    }</figure>`).join('')}</div><div class="car__ui"><span class="car__cap" data-cap>${v.imgs[0].alt}</span>${v.imgs.length > 1
      ? `<span class="car__nav"><button data-d="-1" aria-label="Previous image">‹</button><span data-c>01 / ${pad(v.imgs.length)}</span><button data-d="1" aria-label="Next image">›</button></span>` : ''}</div></div>`;
    return '';
  }
  function slideHtml(s, sec, i) {
    let r = 0;
    const R = () => `data-r style="--i:${r++}"`;
    const kick = `<div class="s-kick" ${R()}><span class="k">${s.t === 'cover' ? `<b data-f="kicker">${s.kicker}</b>` : `<b data-secn>${sec}</b>${s.kicker ? ` · <span data-f="kicker">${s.kicker}</span>` : ''}`}</span><span class="k" data-g="owner">${data.owner}</span></div>`;
    const title = `<h2 class="disp s-title" data-f="title" ${R()}>${s.title}</h2>`;
    const body = s.body ? `<div class="s-body" data-f="body" ${R()}>${s.body}</div>` : '';
    const vis = s.visual ? `<div class="vis" ${R()}>${visual(s.visual)}</div>` : '';
    const ai = s.ai ? `<span class="ai-tag">Contains AI-generated imagery</span>` : '';
    let inner;
    if (s.t === 'cover') inner = `${kick}<div class="s-grid"><div>${title}<p class="lede" data-f="lede" ${R()}>${s.lede}</p>
      <div class="chips" ${R()}>${s.chips.map((c, j) => `<span class="chip" data-p="chips.${j}">${c}</span>`).join('')}</div>
      <div class="facts" ${R()}>${s.facts.map(([k, v], j) => `<div><span data-p="facts.${j}.0">${k}</span><b data-p="facts.${j}.1">${v}</b></div>`).join('')}</div></div>${vis}</div>`;
    else if (s.t === 'split') inner = `${kick}<div class="s-grid"><div>${title}${body}</div>${vis}</div>`;
    else if (s.t === 'stack') inner = `${kick}<div class="s-head">${title}${body}</div>${vis}`;
    else inner = `${kick}<div style="flex:1;display:flex;flex-direction:column;justify-content:center">${title}${body}${
      s.contact ? `<div class="contact" ${R()}>${s.contact.map(([l, t, h], j) => `<a href="${h}" target="_blank" rel="noopener noreferrer"><span class="k" data-p="contact.${j}.0">${l}</span><span data-p="contact.${j}.1">${t}</span></a>`).join('')}</div>` : ''}</div>`;
    // every image remembers its source in the deck data (data-o) so the editor can swap it; enc: sources decrypt on wake
    inner = inner.replace(/<img\b([^>]*?)\ssrc="([^"]+)"/g, (m, a, src) =>
      src.startsWith('enc:') ? `<img${a} data-o="${src}" data-enc="${src.slice(4)}"` : `<img${a} data-o="${src}" src="${src}"`);
    return `<section class="slide t-${s.t === 'center' ? 'end' : s.t}${s.flip ? ' is-flip' : ''}${s.hidden ? ' is-hidden' : ''}" data-i="${i}" aria-roledescription="slide">${inner}${ai}<span class="hid-tag">Hidden · skipped in fullscreen</span></section>`;
  }

  /* ---------- widgets */
  // Same case-review screen in four token sets (representational)
  const THEMES = ['Base', 'Theme A', 'Theme B', 'Theme C'];
  const crSt = (c, t) => `<span class="cr__st ${c}">${t}</span>`;
  const crDots = steps => `<div class="cr__dots">${steps.map(([bg, txt, track]) => `<i style="background:${bg}">${txt}</i><span style="background:${track}"></span>`).join('')}</div>`;
  const crBase = () => {
    const G = '#2e8b57', R = '#c6283b', N = '#c9ced8';
    const row = (cls, n, title, st, extra = '') => `<tr class="${cls}"><td>${n}</td><td><b>${title}</b>${extra}</td><td>${st}</td></tr>`;
    const sub = (cls, n, txt, st) => `<tr class="cr__sub ${cls}"><td></td><td>${n}. ${txt}</td><td>${st}</td></tr>`;
    const meta = (l, chip) => `<div class="cr__meta">${l ? `<span class="cr__ln">${l}</span>` : '<span></span>'}<span>AI Agents used: <span class="cr__chip">${chip}</span></span></div>`;
    const ex = (k, title, step, txt, chips) => `<div class="cr__ex ${k}"><div><b>${title}</b><span class="cr__badge" style="background:${k === 'bl' ? '#8e1b2b' : '#7d7432'}">${step}</span></div><p>${txt}</p><div class="cr__acts">${chips.map(c => `<span class="cr__chip">${c}</span>`).join('')}<em>Dismiss</em></div></div>`;
    return `<div class="cr cr--base">
      <div class="cr__hd"><span class="cr__back">← Back to Dashboard</span><span class="cr__av"><i></i>Dan James<u></u><span class="cr__asst">💬 Assistant</span></span></div>
      <div class="cr__body"><div class="cr__card">
        <div class="cr__prog"><p>43% (3 of 8 steps completed)</p>${crDots([[G, '✓', G], [G, '✓', R], [R, '✕', R], [R, '✕', N], [N, 5, N], [N, 6, N], [N, 7, N], [N, 8, N]])}</div>
        <table><tr><th>Step</th><th>Process Details</th><th>Status</th></tr>
          ${row('c', 1, 'Download Bank Feeds', crSt('ok', 'Completed'), meta('Hide all sub-steps (2) ⌃', 'Database Connect'))}
          ${sub('c', 'a', 'Extract daily transaction reports from bank accounts', crSt('ok', 'Completed'))}
          ${sub('c', 'b', 'Filter for deposits from property accounts', crSt('rv', 'Review Suggested'))}
          ${row('', 2, 'Match Payments to Tenants', crSt('ok', 'Completed'), meta('Hide all sub-steps (2) ⌃', 'Information Logging'))}
          ${sub('', 'a', 'Cross-reference deposit amounts and dates', crSt('ok', 'Completed'))}
          ${sub('', 'b', 'Flag unmatched or partial payments', crSt('ok', 'Completed'))}
          ${row('c', 3, 'Verify Payment Sources', crSt('rv', 'Review Suggested'), `<div class="cr__desc">Match ACH transfers to CRM records</div>${meta('', 'Database Connect')}`)}
          ${row('r', 4, 'Record in Property Management System', crSt('ok', 'Completed'), meta('Hide all sub-steps (2) ⌃', 'Information Logging'))}
          ${sub('r', 'a', 'Enter payment details (date, amount, method)', crSt('ok', 'Completed'))}
          ${sub('r', 'b', 'Assign to correct property, unit, and lease term', crSt('bad', 'Review Needed'))}
          ${row('', 5, 'Reconcile with Ledger', crSt('hold', 'On hold till review'), `<div class="cr__desc">Compare PMS entries with general ledger balances</div>${meta('', 'Information Logging')}`)}
        </table></div>
        <div class="cr__side">
          <h4>C-6775 | Rent Collection &amp; Reconciliation</h4>
          <p class="cr__desc">Ensures accurate tracking, recording, and reconciliation of rental payments across all managed properties—without tenant interaction</p>
          <div class="cr__kv"><div><b>Created on:</b> 7/11/2026</div><div><b>Type:</b> Inquiry</div>
            <div><b>Status:</b><span class="cr__pill" style="background:#fbe1e3;color:#b3233a">👁 Pending Review</span></div>
            <div><b>Priority:</b><span class="cr__pill" style="background:#e3e9f3;color:#36445c">⚑ High</span></div></div>
          <div class="cr__tabs"><span>Exceptions and Blockers (4)</span><span>Case History</span><em>AI Confidence: <b style="color:#c6283b">52%</b></em></div>
          <h5>Blockers (1): <span style="text-transform:none;letter-spacing:0;font-weight:500">Stopping process completion</span></h5>
          ${ex('bl', 'Failed Payment Recording in PMS', 'Step 4', 'Tried to record a confirmed payment in the Property Management System, but it failed; likely due to system error, duplicate entry flag, or incorrect unit mapping.', ['Try Again ↺', 'Open PMS ↗', 'Call Support'])}
          <h5>Exceptions (3): <span style="text-transform:none;letter-spacing:0;font-weight:500">Potential verification needed</span></h5>
          ${ex('ex', 'Unidentified Payment Source', 'Step 1', 'Found a payment without a clear tenant or unit link. Could be from a shared account, guarantor, or new resident not yet in system.', ['Review Source ↗', 'Match Manually'])}
          ${ex('ex', 'Partial Rent Payment', 'Step 1', 'This payment is less than full rent but not marked as an approved partial. May need context before posting.', ['Verify Reason ↗', 'Flag for Ops'])}
        </div></div></div>`;
  };
  // Themes A, B, C: the Base case content in each theme's layout and chrome
  const crTheme = (k, name) => {
    const G = '#2e8b57', O = 'var(--warn)', N = '#c9ced8', tint = c => `color-mix(in srgb, ${c} 35%, #e4e6ea)`;
    const dots = [[G, '✓'], [G, '✓'], [O, '✕'], [O, '✕'], [N, 5], [N, 6], [N, 7], [N, 8]];
    const meta = (l, chip) => `<div class="cr__meta">${l ? `<span class="cr__ln">${l}</span>` : '<span></span>'}<span>AI Agents used: <span class="cr__chip">✎ ${chip}</span></span></div>`;
    const row = (n, title, st, extra = '') => `<tr><td>${n}</td><td><b>${title}</b>${extra}</td><td>${st}</td></tr>`;
    const sub = (n, txt, st) => `<tr class="cr__sub"><td></td><td>${n}. ${txt}</td><td>${st}</td></tr>`;
    const ex = (title, step, txt, acts) => `<div class="cr__ex"><div><b>${title}</b><span class="cr__badge">${step}</span></div><p>${txt}</p><div class="cr__acts">${acts.map(a => `<span>${a}</span>`).join('')}<em>Dismiss</em></div></div>`;
    return `<div class="cr cr--t cr--${k}">
      <div class="cr__hd"><span class="cr__logo">${name}</span><span class="cr__nav">DASHBOARD ⌄</span><span class="cr__av"><i></i>Dan James</span></div>
      <div class="cr__top"><span class="cr__ln">← Back to Dashboard</span><span class="cr__btn cr__ok">Approve ✓</span><span class="cr__btn cr__no">Reject ✕</span></div>
      <div class="cr__body"><div class="cr__card">
        <div class="cr__prog"><p>43% (3 of 8 steps completed)</p>${crDots(dots.map(([c, t], i) => [c, t, tint((dots[i + 1] || dots[i])[0])]))}<span class="cr__conf">AI Confidence: <b>52%</b></span></div>
        <table><tr><th>Step</th><th>Process Details</th><th>Status</th></tr>
          ${row(1, 'Download Bank Feeds', crSt('ok', 'Completed'), meta('Hide all sub-steps (2) ⌃', 'Database Connect'))}
          ${sub('a', 'Extract daily transaction reports from bank accounts', crSt('ok', 'Completed'))}
          ${sub('b', 'Filter for deposits from property accounts', crSt('rv', 'Review Suggested'))}
          ${row(2, 'Match Payments to Tenants', crSt('ok', 'Completed'), meta('Hide all sub-steps (2) ⌃', 'Information Logging'))}
          ${sub('a', 'Cross-reference deposit amounts and dates', crSt('ok', 'Completed'))}
          ${sub('b', 'Flag unmatched or partial payments', crSt('ok', 'Completed'))}
          ${row(3, 'Verify Payment Sources', crSt('rv', 'Review Suggested'), `<div class="cr__desc">Match ACH transfers to CRM records</div>${meta('', 'Database Connect')}`)}
          ${row(4, 'Record in Property Management System', crSt('ok', 'Completed'), meta('Hide all sub-steps (2) ⌃', 'Information Logging'))}
          ${sub('a', 'Enter payment details (date, amount, method)', crSt('ok', 'Completed'))}
          ${sub('b', 'Assign to correct property, unit, and lease term', crSt('bad', 'Review Needed'))}
          ${row(5, 'Reconcile with Ledger', crSt('hold', 'On hold till review'), `<div class="cr__desc">Compare PMS entries with general ledger balances</div>${meta('', 'Information Logging')}`)}
        </table></div>
        <div class="cr__side">
          <h4>C-6775&nbsp;&nbsp;Rent Collection &amp; Reconciliation</h4>
          <p class="cr__desc">Ensures accurate tracking, recording, and reconciliation of rental payments across all managed properties—without tenant interaction</p>
          <div class="cr__grid"><div><b>Created On:</b>7/11/2026</div><div><b>Type:</b>Inquiry</div><div><b>Status:</b><span style="color:var(--warn);font-weight:600">👁 Pending Review</span></div><div><b>Priority:</b>⚑ High</div></div>
          <div class="cr__hr"></div>
          <div class="cr__hrow"><b>Exceptions and Blockers (4)</b><span class="cr__ln">Open Case History →</span></div>
          <div class="cr__box"><h5>Blockers (1)</h5>
            ${ex('Failed Payment Recording in PMS', 'Step 4', 'Tried to record a confirmed payment in the Property Management System, but it failed; likely due to system error, duplicate entry flag, or incorrect unit mapping.', ['Try Again ↺', 'Open PMS ↗', 'Call Support'])}
            <h5>Exceptions (3)</h5>
            ${ex('Unidentified Payment Source', 'Step 1', 'Found a payment without a clear tenant or unit link. Could be from a shared account, guarantor, or new resident not yet in system.', ['Review Source ↗', 'Match Manually'])}
            ${ex('Partial Rent Payment', 'Step 1', 'This payment is less than full rent but not marked as an approved partial. May need context before posting.', ['Verify Reason ↗', 'Flag for Ops'])}
          </div>
        </div></div></div>`;
  };
  const CR = [crBase, () => crTheme('a', 'THEME A'), () => crTheme('b', 'Theme B'), () => crTheme('c', 'Theme C')];
  function themes(el, v, applyTx, setCE) {
    el.className = 'themes';
    el.innerHTML = `<div class="themes__seg" role="group" aria-label="Theme">${THEMES.map((n, i) => `<button aria-pressed="${!i}" data-t="${i}">${n}</button>`).join('')}</div>
      <div class="themes__fit"></div>
      <span class="k">Same screen, four token sets. Representational, not client brands.</span>`;
    const fit = el.querySelector('.themes__fit');
    applyTx(el, v, 'o'); setCE(el);
    const size = () => { const s = fit.firstElementChild; if (!s || !fit.clientWidth) return; const k = fit.clientWidth / 1360; s.style.transform = `scale(${k})`; fit.style.height = s.offsetHeight * k + 'px'; };
    const set = i => {
      fit.innerHTML = CR[i]();
      applyTx(fit, v, 't' + i); setCE(fit);
      el.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-pressed', b.dataset.t == i));
      size();
    };
    el.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); set(+b.dataset.t); }));
    new ResizeObserver(size).observe(fit);
    set(0);
  }
  const PIZZA_NAMES = ['You', 'Aman', 'Riya', 'Kabir'];
  function pizza(el, v, setCE) {
    const total = +el.dataset.total || 2400, who = ['#2b3d26', '#e38f9f', '#274e7a', '#fdb300'].map((c, i) => [PIZZA_NAMES[i], c]);
    const own = [0, 0, 1, 1, 2, 2, 3, 3];
    const P = (a, r = 190) => [200 + r * Math.cos(a), 200 + r * Math.sin(a)].map(n => n.toFixed(2)).join(' ');
    const rad = d => (d - 90) * Math.PI / 180;
    el.className = 'pizza';
    el.innerHTML = `<svg viewBox="0 0 400 400" role="img" aria-label="Pizza split into 8 slices; click a slice to give it to the next person">${own.map((_, i) =>
      `<path data-s="${i}" d="M200 200 L${P(rad(i * 45))} A190 190 0 0 1 ${P(rad(i * 45 + 45))} Z"></path>`).join('')}</svg>
      <div><div class="pizza__who"></div><p class="pizza__tot" data-tx="o.0">${v?.tx?.o?.[0] ?? `Bill ₹${total.toLocaleString('en-IN')} · 8 slices · tap a slice to pass it on`}</p></div>`;
    const draw = () => {
      el.querySelectorAll('path').forEach(p => p.style.fill = who[own[p.dataset.s]][1]);
      el.querySelector('.pizza__who').innerHTML = who.map(([n, c], i) => {
        const k = own.filter(o => o === i).length;
        return `<div><i style="background:${c}"></i><span><span data-pn="${i}">${v?.names?.[i] ?? n}</span><small>${k} slice${k === 1 ? '' : 's'}</small></span><b>₹${Math.round(total / 8 * k).toLocaleString('en-IN')}</b></div>`;
      }).join('');
      setCE(el);
    };
    el.querySelectorAll('path').forEach(p => p.addEventListener('click', () => { own[p.dataset.s] = (own[p.dataset.s] + 1) % who.length; draw(); }));
    draw();
  }
  // With AI / Without AI, on the How I work slide only: both versions are in the slide, the switch shows one. Kept in the URL as ?ai=off.
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
  // Tabs inside a slide (What I bring): one panel at a time, switched by the viewer.
  function tabs(el) {
    const bs = [...el.querySelectorAll('[data-tab]')], ps = [...el.querySelectorAll('[data-panel]')];
    bs.forEach((b, i) => b.addEventListener('click', e => {
      e.stopPropagation();
      bs.forEach((x, j) => { x.classList.toggle('is-on', j === i); x.setAttribute('aria-selected', j === i); });
      ps.forEach((p, j) => { p.hidden = j !== i; });
    }));
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

  /* ---------- editor helpers: edits apply to the decrypted deck in memory; Publish re-encrypts and commits via the GitHub Contents API.
     The token is typed in here by Samarth and kept only in this browser's localStorage. */
  const TOK = 'sn-interviews-gh', REPO = 'samarthdesigns/new-website', COL = 'sn-interviews-collapsed', newBins = new Map();
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
  const getPath = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
  const setPath = (o, p, v) => { const ks = p.split('.'), last = ks.pop(); ks.reduce((a, k) => a[k], o)[last] = v; };
  const EYE_OFF = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 2l12 12M6.5 6.6a2 2 0 0 0 2.8 2.8M4 4.6C2.6 5.5 1.6 6.800 1 8c1.300 2.600 3.700 4.500 7 4.500 1.200 0 2.300-.300 3.200-.700M7 3.600c.300 0 .700-.100 1-.100 3.300 0 5.700 1.900 7 4.500-.400.800-.900 1.500-1.500 2.200"/></svg>';

  /* ---------- player: slide rail + selected slide while editing; Present shows only the slideshow */
  function play(deck, ids, n) {
    ids = ids.filter(id => deck.caseStudies.includes(id));
    if (!ids.length) return go('#/' + deck.id);
    picks[deck.id] = ids;
    const base = `#/${deck.id}/play/${ids.join(',')}/`;
    document.title = deck.company + ' deck · ' + data.owner;
    app.innerHTML = `<div class="player">
      <header class="topb"><div class="topb__l"><a class="lnkb" href="#/${deck.id}" aria-label="Back to case studies">←</a><b>${deck.company}</b></div>
        <div class="topb__r">${themeSwitch(deck)}<span class="sv" aria-live="polite"></span>
          <button class="ib ib--t" data-notes aria-pressed="false" aria-label="Speaker notes (N)" title="Speaker notes (N)">N</button>
          <button class="pill" data-more aria-expanded="false" aria-label="Publishing settings">⋯</button>
          <button class="pill" data-save>Publish</button>
          <button class="pill pill--on" data-present>▶ Present</button></div>
        <div class="ed" hidden><div class="ed__tok"></div><div class="ed__b"><button class="pill" data-discard>Discard all edits</button></div></div></header>
      <aside class="rail" aria-label="Slides"></aside>
      <main class="main"><div class="viewport"><div class="stage"></div></div>
        <aside class="notes" hidden><span class="k">Speaker notes</span><p data-f="notes" data-empty="No notes on this slide."></p></aside></main>
      <nav class="chrome" aria-label="Slide controls"><div class="chrome__l"><b>${deck.company}</b><span></span></div><div class="prog"></div>
        <div class="chrome__r"><span class="chrome__c"></span>
          <button class="ib" data-nav="-1" aria-label="Previous slide">‹</button><button class="ib" data-nav="1" aria-label="Next slide">›</button>
          <button class="ib" data-x aria-label="Exit (Esc)">×</button></div></nav>
      <div class="toast" hidden><span></span><button class="lnk" data-undo>Undo</button></div>
      <input type="file" accept="image/*" data-file hidden></div>`;
    const root = app.querySelector('.player'), vp = root.querySelector('.viewport'), stage = root.querySelector('.stage'), rail = root.querySelector('.rail');
    const notesEl = root.querySelector('.notes'), notesBtn = root.querySelector('[data-notes]'), prog = root.querySelector('.prog'), file = root.querySelector('[data-file]');
    const sv = root.querySelector('.sv'), saveB = root.querySelector('[data-save]'), panel = root.querySelector('.ed'), toastEl = root.querySelector('.toast');
    bindTheme(root, deck);
    document.execCommand('defaultParagraphSeparator', false, 'p');

    let secs = [], list = [], slides = [], at = -1, playing = false, narrow = false, wasFs = false, anchor = null, drag = null, target = null, uiT = 0, toastT = 0, ctx = null;
    const sel = new Set(), undo = [];
    const collapsed = new Set(JSON.parse(localStorage.getItem(COL) || '[]'));
    const inView = s => s.owner === 'intro' || s.owner === 'close' || ids.includes(s.owner);
    const canEdit = () => !playing && !narrow;

    /* status */
    const say = t => { sv.textContent = t; };
    const syncSave = () => {
      const has = !!localStorage.getItem(TOK);
      saveB.disabled = !dirty;
      if (!/Saving|Encrypting|Uploading|Committing|failed|Live in/.test(sv.textContent) || dirty) say(dirty ? 'Unsaved changes' : '');
      const tok = panel.querySelector('.ed__tok');
      tok.innerHTML = has
        ? `<span class="k">GitHub token saved in this browser</span> <button class="lnk" data-forget>Forget</button>`
        : `<form class="ed__f"><input type="password" placeholder="GitHub fine-grained token" aria-label="GitHub fine-grained token" autocomplete="off"><button class="pill">Keep</button></form>
           <span class="ed__h">Contents: read &amp; write on ${REPO} only. Stored in this browser, never in the repo.</span>`;
      tok.querySelector('form')?.addEventListener('submit', e => { e.preventDefault(); const v = e.target.querySelector('input').value.trim(); if (v) { localStorage.setItem(TOK, v); syncSave(); } });
      tok.querySelector('[data-forget]')?.addEventListener('click', () => { localStorage.removeItem(TOK); syncSave(); });
    };
    const markDirty = () => { dirty = true; syncSave(); };
    const toast = (msg, canUndo) => {
      toastEl.querySelector('span').textContent = msg;
      toastEl.querySelector('[data-undo]').hidden = !canUndo;
      toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, 6000);
    };
    const mutate = (fn, msg) => {
      undo.push(JSON.stringify(data.sections)); if (undo.length > 40) undo.shift();
      fn(); markDirty(); build(list[at]?.o); if (msg) toast(msg, true); else toastEl.hidden = true;
    };
    const doUndo = () => {
      const snap = undo.pop(); if (!snap) return;
      const idx = at; data.sections = JSON.parse(snap); sel.clear(); toastEl.hidden = true; markDirty();
      build(null, idx);
    };

    /* editable text */
    const setCE = el => {
      el.querySelectorAll('[data-f],[data-p],[data-g],[data-secn],[data-li],[data-tx],[data-pn],[data-cap]').forEach(e => {
        if (canEdit()) e.setAttribute('contenteditable', 'true'); else e.removeAttribute('contenteditable');
      });
    };
    const applyCE = () => { root.classList.toggle('is-editing', canEdit()); setCE(stage); setCE(notesEl); };
    const editableEls = r => {
      const out = [];
      const walk = el => {
        for (const c of el.children) {
          if (c.matches(LEAF_SKIP)) continue;
          if ([...c.childNodes].some(k => k.nodeType === 3 && k.nodeValue.trim())) out.push(c); else walk(c);
        }
      };
      walk(r);
      return out;
    };
    const LEAF_SKIP = 'svg,script,style,img,.img-slot,.car__nav,[data-c],.load,[data-widget]';
    const applyTx = (r, v, key) => editableEls(r).forEach((e, i) => { e.dataset.tx = `${key}.${i}`; const o = v?.tx?.[key]?.[i]; if (o != null) e.innerHTML = o; });
    const initSlide = (el, x) => {
      const v = x.s.visual, w = el.querySelector('.vis [data-widget]');
      if (w?.dataset.widget === 'themes') themes(w, v, applyTx, setCE);
      else if (w?.dataset.widget === 'pizza') pizza(w, v, setCE);
      else if (v?.html) { const vis = el.querySelector('.vis'); if (vis) editableEls(vis).forEach((e, i) => { e.dataset.li = i; }); }
      el.querySelectorAll('[data-car]').forEach(carousel);
      el.querySelectorAll('[data-tabs]').forEach(tabs);
      el.querySelectorAll('.tools').forEach(t => { const sp = t.querySelectorAll(':scope>span'); sp.forEach((e, i) => e.style.setProperty('--a', i * 360 / sp.length - 90)); });
    };

    /* thumbnails */
    const thumbFor = i => {
      const c = slides[i].cloneNode(true);
      c.classList.remove('is-on'); c.setAttribute('inert', ''); c.removeAttribute('data-i');
      c.querySelectorAll('[contenteditable]').forEach(e => e.removeAttribute('contenteditable'));
      wake(c);
      return c;
    };
    const refreshThumb = i => {
      const box = rail.querySelector(`.th[data-i="${i}"] .th__s`);
      if (box && slides[i]) box.replaceChildren(thumbFor(i));
    };
    let thumbT = 0;
    const refreshSoon = i => { clearTimeout(thumbT); thumbT = setTimeout(() => refreshThumb(i), 250); };

    /* rail */
    const syncRail = () => {
      let num = 0;
      rail.querySelectorAll('.th').forEach(t => {
        const i = +t.dataset.i, x = list[i];
        t.classList.toggle('is-sel', sel.has(x.o));
        t.classList.toggle('is-cur', i === at);
        t.classList.toggle('is-hid', !!x.o.hidden);
        t.querySelector('.th__n').textContent = x.o.hidden ? '' : ++num;
      });
    };
    const renderRail = () => {
      rail.innerHTML = `<div class="rail__l">${secs.map((s, si) => `<div class="rs${collapsed.has(s.id) ? ' is-col' : ''}" data-s="${si}">
        <div class="rs__h" draggable="true"><button class="rs__c" aria-label="Collapse or expand ${s.name}" aria-expanded="${!collapsed.has(s.id)}">⌄</button><span class="rs__n">${s.name}</span><span class="rs__k">${s.slides.length}</span></div>
        <div class="rs__b">${s.slides.length ? '' : '<p class="rs__e">Empty. Drag slides here.</p>'}</div></div>`).join('')}</div>
        <button class="rail__add" data-addsec>+ Add section</button>`;
      list.forEach((x, i) => {
        const t = document.createElement('div');
        t.className = 'th'; t.draggable = true; t.dataset.i = i; t.tabIndex = -1;
        t.innerHTML = `<span class="th__n"></span><div class="th__f"><div class="th__s"></div><span class="th__h" title="Hidden">${EYE_OFF}</span></div>`;
        t.querySelector('.th__s').append(thumbFor(i));
        rail.querySelector(`.rs[data-s="${x.si}"] .rs__b`).append(t);
      });
      syncRail();
    };
    const saveCollapsed = () => localStorage.setItem(COL, JSON.stringify([...collapsed]));
    const flat = () => list.map(x => x.o);
    const secOf = o => secs.find(s => s.slides.includes(o));
    const takeSelected = () => { const moved = flat().filter(o => sel.has(o)); data.sections.forEach(s => { s.slides = s.slides.filter(o => !sel.has(o)); }); return moved; };
    const plural = (n, w = 'slide') => `${n} ${w}${n === 1 ? '' : 's'}`;
    const delSlides = () => {
      const n = sel.size; if (!n) return;
      const left = list.length - n;
      if (!left) return toast('A deck needs at least one slide.');
      const next = list.slice(at + 1).find(x => !sel.has(x.o))?.o || list.slice(0, at).reverse().find(x => !sel.has(x.o))?.o;
      mutate(() => { takeSelected(); list[at] = { o: next }; sel.clear(); }, `Deleted ${plural(n)}.`);
    };
    const hideSlides = () => {
      const os = [...sel], hide = os.some(o => !o.hidden);
      mutate(() => os.forEach(o => { if (hide) o.hidden = true; else delete o.hidden; }), `${hide ? 'Hidden' : 'Showing'}: ${plural(os.length)}.`);
    };
    const moveSlides = d => {
      const f = flat(), idx = f.map((o, i) => sel.has(o) ? i : -1).filter(i => i > -1);
      const anchorO = d < 0 ? f[idx[0] - 1] : f[idx.at(-1) + 1];
      if (!anchorO) return;
      mutate(() => { const s = secOf(anchorO), m = takeSelected(); s.slides.splice(s.slides.indexOf(anchorO) + (d > 0 ? 1 : 0), 0, ...m); });
    };
    const newSection = (after, slidesFrom) => {
      const sec = { id: 's' + Date.now().toString(36), name: 'New section', owner: after?.owner || secs[0].owner, slides: [] };
      mutate(() => {
        if (slidesFrom) { const s = secOf(slidesFrom), k = s.slides.indexOf(slidesFrom); sec.owner = s.owner; sec.slides = s.slides.splice(k); data.sections.splice(data.sections.indexOf(s) + 1, 0, sec); if (!s.slides.length) { data.sections.splice(data.sections.indexOf(s), 1, sec); data.sections.splice(data.sections.lastIndexOf(sec), 1, s); s.slides = sec.slides; sec.slides = []; } }
        else data.sections.splice(data.sections.indexOf(after) + 1, 0, sec);
      });
      renameSec(sec);
    };
    const moveSec = (s, d) => {
      const k = secs.indexOf(s), o = secs[k + d]; if (!o) return;
      mutate(() => { const a = data.sections; a.splice(a.indexOf(s), 1); a.splice(a.indexOf(o) + (d > 0 ? 1 : 0), 0, s); });
    };
    const removeSec = (s, keep) => {
      const k = secs.indexOf(s), n = s.slides.length;
      if (keep) {
        const to = secs[k - 1] || secs[k + 1];
        if (!to) return toast('This is the only section.');
        mutate(() => { k > 0 ? to.slides.push(...s.slides) : to.slides.unshift(...s.slides); data.sections.splice(data.sections.indexOf(s), 1); }, `Removed section “${s.name}”.`);
      } else {
        if (n >= list.length) return toast('A deck needs at least one slide.');
        const cur = list[at].o, next = s.slides.includes(cur) ? (secs[k + 1]?.slides[0] || secs[k - 1]?.slides.at(-1) || list.find(x => !s.slides.includes(x.o)).o) : cur;
        mutate(() => { data.sections.splice(data.sections.indexOf(s), 1); s.slides.forEach(o => sel.delete(o)); list[at] = { o: next }; }, `Deleted “${s.name}” and ${plural(n)}.`);
      }
    };
    function renameSec(s) {
      const el = rail.querySelector(`.rs[data-s="${secs.indexOf(s)}"] .rs__n`); if (!el) return;
      const h = el.closest('.rs__h'); h.draggable = false;
      el.setAttribute('contenteditable', 'true'); el.focus();
      getSelection().selectAllChildren(el);
      const done = () => {
        el.removeEventListener('blur', done); el.removeAttribute('contenteditable'); h.draggable = true;
        const v = el.textContent.trim();
        if (v && v !== s.name) mutate(() => { s.name = v; }); else el.textContent = s.name;
      };
      el.addEventListener('blur', done);
      el.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); el.blur(); } if (e.key === 'Escape') { el.textContent = s.name; el.blur(); } });
    }
    const closeCtx = () => { ctx?.remove(); ctx = null; };
    const openCtx = (e, items) => {
      closeCtx();
      ctx = document.createElement('div'); ctx.className = 'ctx'; ctx.setAttribute('role', 'menu');
      items.forEach(it => {
        if (it === '-') { ctx.append(Object.assign(document.createElement('hr'))); return; }
        const b = document.createElement('button'); b.textContent = it[0]; b.setAttribute('role', 'menuitem');
        if (it[2] === 'bad') b.className = 'is-bad';
        if (it[2] === 'off') b.disabled = true;
        b.addEventListener('click', () => { closeCtx(); it[1](); });
        ctx.append(b);
      });
      root.append(ctx);
      ctx.style.left = Math.min(e.clientX, innerWidth - ctx.offsetWidth - 8) + 'px';
      ctx.style.top = Math.min(e.clientY, innerHeight - ctx.offsetHeight - 8) + 'px';
      ctx.querySelector('button:not(:disabled)')?.focus();
    };
    rail.addEventListener('contextmenu', e => {
      const t = e.target.closest('.th'), h = e.target.closest('.rs__h');
      if (t) {
        e.preventDefault();
        const o = list[+t.dataset.i].o;
        if (!sel.has(o)) { sel.clear(); sel.add(o); show(+t.dataset.i); syncRail(); }
        const n = sel.size, f = flat(), hide = [...sel].some(x => !x.hidden), label = n > 1 ? plural(n) : 'slide';
        const idx = f.map((x, i) => sel.has(x) ? i : -1).filter(i => i > -1);
        openCtx(e, [
          [`${hide ? 'Hide' : 'Show'} ${label}`, hideSlides],
          ['Move up', () => moveSlides(-1), idx[0] === 0 ? 'off' : ''],
          ['Move down', () => moveSlides(1), idx.at(-1) === f.length - 1 ? 'off' : ''],
          ['Start a section here', () => newSection(null, f[idx[0]])], '-',
          [`Delete ${label}`, delSlides, 'bad'],
        ]);
      } else if (h) {
        e.preventDefault();
        const s = secs[+h.parentElement.dataset.s], k = secs.indexOf(s), hide = s.slides.some(o => !o.hidden);
        openCtx(e, [
          ['Rename', () => renameSec(s)],
          ['Move up', () => moveSec(s, -1), k ? '' : 'off'],
          ['Move down', () => moveSec(s, 1), k < secs.length - 1 ? '' : 'off'],
          [`${hide ? 'Hide' : 'Show'} all slides`, () => mutate(() => s.slides.forEach(o => { if (hide) o.hidden = true; else delete o.hidden; })), s.slides.length ? '' : 'off'],
          ['Add section below', () => newSection(s)], '-',
          ['Remove section, keep slides', () => removeSec(s, true), secs.length > 1 ? '' : 'off'],
          ['Delete section and slides', () => removeSec(s, false), 'bad'],
        ]);
      }
    });
    rail.addEventListener('click', e => {
      if (e.target.closest('[data-addsec]')) return newSection(secs.at(-1));
      const c = e.target.closest('.rs__c');
      if (c) {
        const box = c.closest('.rs'), s = secs[+box.dataset.s];
        const on = box.classList.toggle('is-col'); c.setAttribute('aria-expanded', !on);
        on ? collapsed.add(s.id) : collapsed.delete(s.id); saveCollapsed(); return;
      }
      const t = e.target.closest('.th'); if (!t) return;
      const i = +t.dataset.i, o = list[i].o;
      if (e.shiftKey && anchor) {
        const f = flat(), a = f.indexOf(anchor), [lo, hi] = a < i ? [a, i] : [i, a];
        sel.clear(); f.slice(lo, hi + 1).forEach(x => sel.add(x));
      } else if (e.ctrlKey || e.metaKey) {
        sel.has(o) && sel.size > 1 ? sel.delete(o) : sel.add(o); anchor = o;
      } else { sel.clear(); sel.add(o); anchor = o; }
      show(sel.has(o) ? i : list.findIndex(x => sel.has(x.o)));
      syncRail(); t.focus({ preventScroll: true });
    });
    rail.addEventListener('dblclick', e => { const n = e.target.closest('.rs__n'); if (n && !n.isContentEditable) renameSec(secs[+n.closest('.rs').dataset.s]); });
    const clearDrop = () => rail.querySelectorAll('.drop-b,.drop-a,.drop-in').forEach(x => x.classList.remove('drop-b', 'drop-a', 'drop-in'));
    rail.addEventListener('dragstart', e => {
      const t = e.target.closest?.('.th'), h = e.target.closest?.('.rs__h');
      if (t) {
        const o = list[+t.dataset.i].o;
        if (!sel.has(o)) { sel.clear(); sel.add(o); syncRail(); }
        drag = { type: 'slides' };
      } else if (h) drag = { type: 'sec', sec: secs[+h.parentElement.dataset.s] };
      else return;
      e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', '');
    });
    const dropSpot = e => {
      if (!drag) return null;
      if (drag.type === 'slides') {
        const t = e.target.closest('.th');
        if (t && !t.closest('.is-col')) { const r = t.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2; return { el: t, cls: after ? 'drop-a' : 'drop-b', o: list[+t.dataset.i].o, after }; }
        const s = e.target.closest('.rs');
        return s ? { el: s.querySelector('.rs__h'), cls: 'drop-in', sec: secs[+s.dataset.s] } : null;
      }
      const s = e.target.closest('.rs'); if (!s) return null;
      const r = s.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
      return { el: s, cls: after ? 'drop-a' : 'drop-b', tgt: secs[+s.dataset.s], after };
    };
    rail.addEventListener('dragover', e => { const d = dropSpot(e); clearDrop(); if (!d) return; e.preventDefault(); d.el.classList.add(d.cls); });
    rail.addEventListener('dragend', () => { clearDrop(); drag = null; });
    rail.addEventListener('drop', e => {
      const d = dropSpot(e), kind = drag; clearDrop(); drag = null;
      if (!d) return; e.preventDefault();
      if (kind.type === 'sec') {
        if (d.tgt === kind.sec) return;
        return mutate(() => { const a = data.sections; a.splice(a.indexOf(kind.sec), 1); a.splice(a.indexOf(d.tgt) + (d.after ? 1 : 0), 0, kind.sec); });
      }
      if (d.o && sel.has(d.o)) return;
      mutate(() => {
        const s = d.sec || secOf(d.o), m = takeSelected();
        if (d.sec) s.slides.unshift(...m); else s.slides.splice(s.slides.indexOf(d.o) + (d.after ? 1 : 0), 0, ...m);
      });
    });

    /* text input on the slide */
    root.addEventListener('input', e => {
      const el = e.target.closest?.('[contenteditable="true"]'); if (!el || el.closest('.rail')) return;
      undo.length = 0; toastEl.hidden = true;
      const i = el.closest('.notes') ? at : +el.closest('.slide').dataset.i, x = list[i], d = el.dataset;
      const v = el.innerHTML.trim().replace(/<br\s*\/?>$/, ''), vis = x.s.visual;
      if (d.f) { fieldOwner(x.o, d.f)[d.f] = v; x.s[d.f] = v; }
      else if (d.p) { setPath(x.s, d.p, v); }
      else if (d.g) { data[d.g] = v; }
      else if (d.secn != null) { const s = secs[x.si]; s.name = el.textContent.trim() || s.name; const lb = rail.querySelector(`.rs[data-s="${x.si}"] .rs__n`); if (lb) lb.textContent = s.name; }
      else if (d.cap != null) { const fig = el.closest('[data-car]').querySelector('figure.is-on'), k = [...fig.parentElement.children].indexOf(fig); vis.imgs[k].alt = el.textContent.trim(); fig.querySelector('img').alt = vis.imgs[k].alt; }
      else if (d.li != null) { const tpl = document.createElement('template'); tpl.innerHTML = vis.html; const src = editableEls(tpl.content)[+d.li]; if (src) { src.innerHTML = v; vis.html = tpl.innerHTML; } }
      else if (d.tx) { const [k, n2] = d.tx.split('.'); vis.tx ||= {}; vis.tx[k] ||= {}; vis.tx[k][n2] = v; }
      else if (d.pn != null) { vis.names ||= PIZZA_NAMES.slice(); vis.names[+d.pn] = el.textContent.trim(); }
      markDirty(); refreshSoon(i);
    });
    root.addEventListener('keydown', e => {
      const el = e.target.closest?.('[contenteditable="true"]');
      if (el && !el.closest('.rail') && e.key === 'Enter' && el.dataset.f !== 'body' && el.dataset.f !== 'notes') e.preventDefault();
      if (el && e.key === 'Escape') { e.stopPropagation(); el.blur(); }
    }, true);
    root.addEventListener('paste', e => {
      if (!e.target.closest?.('[contenteditable="true"]')) return;
      e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
    });

    /* images */
    stage.addEventListener('click', e => {
      refreshSoon(at);
      if (!canEdit()) return;
      const a = e.target.closest?.('a'); if (a) e.preventDefault();
      const hit = e.target.closest?.('img[data-o],.img-slot'); if (!hit) return;
      e.preventDefault(); e.stopPropagation(); target = hit; file.value = ''; file.click();
    }, true);
    file.addEventListener('change', async () => {
      const f = file.files[0], hit = target; if (!f || !hit) return;
      try {
        say('Encrypting image…');
        const webp = new Uint8Array(await (await toWebp(f)).arrayBuffer());
        const name = `deck-${Date.now().toString(36)}-${hex(crypto.getRandomValues(new Uint8Array(3)))}.bin`, ref = `enc:/assets/img/locked/${name}`;
        newBins.set(name, await encrypt(webp));
        const i = +hit.closest('.slide').dataset.i, x = list[i], url = URL.createObjectURL(new Blob([webp], { type: 'image/webp' }));
        encUrls.set(ref.slice(4), Promise.resolve(url));
        if (hit.matches('.img-slot')) x.o.visual = { img: { src: ref, alt: hit.querySelector('small')?.textContent || '' } };
        else { swap(x.o, hit.dataset.o, ref); }
        undo.length = 0; markDirty(); build(x.o);
      } catch (err) { say('Couldn’t use that image: ' + err.message); }
    });

    /* publish */
    root.querySelector('[data-more]').addEventListener('click', e => { panel.hidden = !panel.hidden; e.currentTarget.setAttribute('aria-expanded', !panel.hidden); });
    root.querySelector('[data-discard]').addEventListener('click', () => {
      if (dirty && !confirm('Throw away unsaved edits?')) return;
      dirty = false; newBins.clear(); location.reload();
    });
    saveB.addEventListener('click', async () => {
      if (!localStorage.getItem(TOK)) { panel.hidden = false; panel.querySelector('input')?.focus(); return; }
      saveB.disabled = true; dirty = false;
      try {
        for (const [name, bytes] of newBins) { say('Uploading image…'); await gh(`assets/img/locked/${name}`, bytes, 'Interviews: add locked image from the deck editor'); }
        newBins.clear();
        say('Encrypting…');
        const bin = await encrypt(new TextEncoder().encode(JSON.stringify(data)));
        say('Committing…');
        loadedSha = await gh('interviews/deck.bin', bin, 'Interviews: edit deck from the browser editor');
        say('Published. Live in about a minute.');
      } catch (err) { dirty = true; say('Publish failed: ' + err.message); }
      saveB.disabled = !dirty;
    });

    /* navigation */
    const ord = () => { const all = list.map((x, i) => i), o = all.filter(i => !((playing || narrow) && list[i].o.hidden)); return o.length ? o : all; };
    const step = d => {
      const o = ord(), p = o.indexOf(at);
      show(p > -1 ? o[Math.max(0, Math.min(o.length - 1, p + d))] : d > 0 ? (o.find(i => i > at) ?? o.at(-1)) : (o.findLast(i => i < at) ?? o[0]));
    };
    const paint = () => {
      const o = ord(), p = o.indexOf(at);
      root.querySelector('.chrome__c').textContent = `${p > -1 ? pad(p + 1) : '–'} / ${pad(o.length)}`;
      prog.querySelectorAll('button').forEach((b, si) => {
        const idx = o.filter(k => list[k].si === si);
        b.style.display = idx.length ? '' : 'none'; if (!idx.length) return;
        b.style.setProperty('--n', idx.length);
        b.style.setProperty('--f', idx.filter(k => k <= at).length / idx.length);
      });
    };
    const fillNotes = () => { notesEl.querySelector('p').innerHTML = list[at].s.notes || ''; };
    const toggleNotes = () => {
      notesEl.hidden = !notesEl.hidden;
      notesBtn.setAttribute('aria-pressed', !notesEl.hidden);
      if (!notesEl.hidden) fillNotes();
    };
    notesBtn.addEventListener('click', toggleNotes);
    const fit = () => {
      const was = narrow; narrow = innerWidth <= 760;
      root.classList.toggle('is-narrow', narrow);
      const pad2 = playing || narrow ? 0 : 56;
      stage.style.setProperty('--s', narrow ? 1 : Math.min((vp.clientWidth - pad2) / 1600, (vp.clientHeight - pad2) / 900));
      if (was !== narrow) applyCE();
    };
    function show(i) {
      i = Math.max(0, Math.min(list.length - 1, i));
      if (i === at && slides[i].classList.contains('is-on')) return;
      if (slides[at]) { slides[at].classList.remove('is-on'); refreshThumb(at); }
      at = i;
      slides[at].classList.add('is-on');
      wake(slides[at]); if (slides[at + 1]) wake(slides[at + 1]);
      if (!notesEl.hidden) fillNotes();
      notesBtn.classList.toggle('has', !!list[at].s.notes);
      root.querySelector('.chrome__l span').textContent = list[at].name;
      if (!sel.has(list[at].o)) { sel.clear(); sel.add(list[at].o); anchor = list[at].o; }
      const box = rail.querySelector(`.rs[data-s="${list[at].si}"]`);
      if (box?.classList.contains('is-col')) { box.classList.remove('is-col'); collapsed.delete(secs[list[at].si].id); saveCollapsed(); }
      syncRail();
      rail.querySelector(`.th[data-i="${at}"]`)?.scrollIntoView({ block: 'nearest' });
      paint();
      history.replaceState(null, '', base + (at + 1));
      if (narrow) vp.scrollTop = 0;
    }
    function build(keep, fallback) {
      const prev = fallback ?? at;
      secs = data.sections.filter(inView);
      list = secs.flatMap((s, si) => s.slides.map(o => ({ s: withVibe(o), o, name: s.name, si })));
      if (!list.length) return go('#/' + deck.id);
      stage.innerHTML = list.map((x, i) => slideHtml(x.s, x.name, i)).join('');
      slides = [...stage.children];
      list.forEach((x, i) => initSlide(slides[i], x));
      prog.innerHTML = secs.map((s, si) => `<button data-sec="${si}" aria-label="Jump to ${s.name}" title="${s.name}"></button>`).join('');
      prog.querySelectorAll('button').forEach((b, si) => b.addEventListener('click', () => show(ord().find(k => list[k].si === si) ?? list.findIndex(x => x.si === si))));
      at = -1;
      renderRail();
      applyCE();
      const k = keep ? list.findIndex(x => x.o === keep) : -1;
      [...sel].forEach(o => { if (!list.some(x => x.o === o)) sel.delete(o); });
      show(k > -1 ? k : Math.max(0, Math.min(prev, list.length - 1)));
    }
    root.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', () => step(+b.dataset.nav)));

    /* present */
    const enterPlay = () => {
      playing = true; root.classList.add('is-play'); document.activeElement?.blur(); closeCtx(); panel.hidden = true; applyCE();
      if (list[at].o.hidden) step(1);
      paint(); fit();
      root.requestFullscreen?.().catch(() => {});
    };
    const exitPlay = () => {
      playing = false; wasFs = false; root.classList.remove('is-play', 'show-ui');
      if (document.fullscreenElement) document.exitFullscreen();
      applyCE(); paint(); fit();
    };
    root.querySelector('[data-present]').addEventListener('click', enterPlay);
    root.querySelector('[data-x]').addEventListener('click', () => { if (narrow && !playing) go('#/' + deck.id); else exitPlay(); });
    root.querySelector('[data-undo]').addEventListener('click', doUndo);
    const onMove = () => { if (!playing) return; root.classList.add('show-ui'); clearTimeout(uiT); uiT = setTimeout(() => root.classList.remove('show-ui'), 2200); };
    root.addEventListener('mousemove', onMove);
    const onDocDown = e => { if (ctx && !ctx.contains(e.target)) closeCtx(); if (!panel.hidden && !e.target.closest('.ed,[data-more],[data-save]')) panel.hidden = true; };
    document.addEventListener('mousedown', onDocDown);
    const key = e => {
      const t = e.target instanceof Element ? e.target : document.body;
      if (t.closest('input,select,textarea,[contenteditable="true"]')) return;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) { if (canEdit()) { e.preventDefault(); doUndo(); } return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === 'Escape' && ctx) return closeCtx();
      if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !t.closest('button')) || (k === 'ArrowDown' && canEdit())) { e.preventDefault(); sel.clear(); step(1); }
      else if (k === 'ArrowLeft' || k === 'PageUp' || (k === 'ArrowUp' && canEdit())) { e.preventDefault(); sel.clear(); step(-1); }
      else if (k === 'Home') { sel.clear(); show(ord()[0]); }
      else if (k === 'End') { sel.clear(); show(ord().at(-1)); }
      else if (k === 'f' || k === 'F') playing ? exitPlay() : enterPlay();
      else if (k === 'n' || k === 'N') toggleNotes();
      else if ((k === 'Delete' || k === 'Backspace') && canEdit()) { e.preventDefault(); delSlides(); }
      else if (k === 'Escape') { if (playing) exitPlay(); else if (narrow) go('#/' + deck.id); }
    };
    let tx = 0, ty = 0;
    const ts = e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; };
    const te = e => {
      const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && !(e.target instanceof Element && e.target.closest('.car,.pizza,.themes'))) step(dx < 0 ? 1 : -1);
    };
    addEventListener('keydown', key);
    const ro = new ResizeObserver(fit); ro.observe(vp);
    vp.addEventListener('touchstart', ts, { passive: true }); vp.addEventListener('touchend', te);
    const onFs = () => {
      if (document.fullscreenElement) wasFs = true;
      else if (wasFs && playing) exitPlay();
    };
    document.addEventListener('fullscreenchange', onFs);
    const onLeave = e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    addEventListener('beforeunload', onLeave);
    player = () => { removeEventListener('keydown', key); ro.disconnect(); removeEventListener('beforeunload', onLeave); document.removeEventListener('fullscreenchange', onFs); document.removeEventListener('mousedown', onDocDown); if (document.fullscreenElement) document.exitFullscreen(); };
    fit();
    syncSave();
    build(null, (parseInt(n, 10) || 1) - 1);
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
