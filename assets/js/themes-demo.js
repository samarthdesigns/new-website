/* VOYAGE — white-label demo from the interviews deck: one case-review screen in four token sets. Rendered only after the page's Output password unlocks, since it redraws a locked product screen. */
(function(){
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
  function mount(el) {
    if (el.dataset.on) return; el.dataset.on = 1;
    el.innerHTML = `<div class="themes__seg" role="group" aria-label="Theme">${THEMES.map((n, i) => `<button type="button" aria-pressed="${!i}" data-t="${i}">${n}</button>`).join('')}</div>
      <div class="themes__fit"></div>
      <p class="dg-foot">Same screen, four token sets. A simplified code demo with neutral themes, not client branding.</p>`;
    const fit = el.querySelector('.themes__fit');
    const size = () => { const s = fit.firstElementChild; if (!s || !fit.clientWidth) return; const k = fit.clientWidth / 1360; s.style.transform = `scale(${k})`; fit.style.height = s.offsetHeight * k + 'px'; };
    const set = i => {
      fit.innerHTML = CR[i]();
      el.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-pressed', b.dataset.t == i));
      size();
    };
    el.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => set(+b.dataset.t)));
    new ResizeObserver(size).observe(fit);
    set(0);
    el.classList.remove('is-locked');
  }
  const els = [...document.querySelectorAll('[data-themes]')];
  if (!els.length) return;
  els.forEach(el => { const b = el.querySelector('[data-themes-open]');
    b && b.addEventListener('click', () => { const lk = document.querySelector('[data-lock]'); if (!lk) return;
      lk.scrollIntoView({behavior: 'smooth', block: 'center'}); const c = lk.querySelector('.mlock__cta'); c && !c.hidden && c.click(); }); });
  document.addEventListener('sn:unlock', () => els.forEach(mount));
})();
