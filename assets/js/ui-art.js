/* Interactive UI artifacts. Every [data-ua] root becomes a small working app.
   It plays itself while on screen. The moment someone touches it, autoplay stops and it's theirs;
   a replay button brings the demo back. Reduced motion and thumbnails get the finished state. */
(function () {
  'use strict';
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = {};
  function $(r, s) { return r.querySelector(s); }
  function $$(r, s) { return [].slice.call(r.querySelectorAll(s)); }
  function h(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  var I = {
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    dots: '<svg viewBox="0 0 24 24" class="f"><circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/></svg>',
    call: '<svg viewBox="0 0 24 24"><path d="M6.6 3.5h3l1.6 4.3-2.1 1.4a11 11 0 0 0 5.7 5.7l1.4-2.1 4.3 1.6v3a2 2 0 0 1-2.1 2A16.5 16.5 0 0 1 4.6 5.6a2 2 0 0 1 2-2.1z"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    smile: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M8.7 14.2a4 4 0 0 0 6.6 0M9.2 9.6h.01M14.8 9.6h.01"/></svg>',
    mic: '<svg viewBox="0 0 24 24"><rect x="9" y="3.5" width="6" height="10.5" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
    tick: '<svg viewBox="0 0 24 24"><path d="M5.5 12.5l4 4 9-9"/></svg>',
    ticks: '<svg viewBox="0 0 30 24" class="tk"><path d="M2.5 12.5l4 4 9-9M12.5 15.5l1 1 9-9"/></svg>',
    chev: '<svg viewBox="0 0 24 24"><path d="M9.5 6l6 6-6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M6 9.5l6 6 6-6"/></svg>',
    bank: '<svg viewBox="0 0 24 24"><path d="M3.5 9.5L12 4l8.5 5.5M5.5 10v7.5M18.5 10v7.5M10 10v7.5M14 10v7.5M3.5 20h17"/></svg>',
    rupee: '<svg viewBox="0 0 24 24"><path d="M7 4.5h10M7 9h10M7 4.5h3.5a4.5 4.5 0 0 1 0 9H7l7.5 7"/></svg>',
    replay: '<svg viewBox="0 0 24 24"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4.2h4.2"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>',
    file: '<svg viewBox="0 0 24 24"><path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4"/></svg>',
    folder: '<svg viewBox="0 0 24 24"><path d="M3.5 6.5h6l2 2h9v10h-17z"/></svg>'
  };
  var SBI = '<span class="ua-sbi"><svg viewBox="0 0 20 14" class="f"><rect x="0" y="9" width="3.4" height="5" rx="1"/><rect x="5.3" y="6" width="3.4" height="8" rx="1"/><rect x="10.6" y="3" width="3.4" height="11" rx="1"/><rect x="15.9" y="0" width="3.4" height="14" rx="1"/></svg>'
    + '<svg viewBox="0 0 18 14" class="f"><path d="M9 13.5l2.6-3.2a4.2 4.2 0 0 0-5.2 0zM3.3 7.4a8.8 8.8 0 0 1 11.4 0l1.6-2a11.6 11.6 0 0 0-14.6 0zM.2 3.6l1.6 2a12.6 12.6 0 0 1 14.4 0l1.6-2a15.3 15.3 0 0 0-17.6 0z"/></svg>'
    + '<span class="ua-bat"><i></i></span></span>';

  /* ================= engine ================= */
  function setup(root) {
    if (root.__ua) return; var def = W[root.dataset.ua]; if (!def) return; root.__ua = 1;
    var timers = [], fxT = [], handlers = [], auto = true, running = false;
    var ctx = {
      root: root, instant: false,
      fx: function (ms, fn) { if (ctx.instant) { fn(); return; } fxT.push(setTimeout(fn, ms)); },
      on: function (sel, fn) { handlers.push([sel, fn]); },
      tap: function (sel) {
        var el = typeof sel === 'string' ? $(root, sel) : sel; if (!el) return;
        var a = el.getBoundingClientRect(), b = root.getBoundingClientRect(), k = root.offsetWidth ? b.width / root.offsetWidth : 1;
        if (a.width) { tapEl.style.left = (a.left + a.width / 2 - b.left) / k + 'px'; tapEl.style.top = (a.top + a.height / 2 - b.top) / k + 'px';
          tapEl.classList.remove('on'); void tapEl.offsetWidth; tapEl.classList.add('on'); }
        el.click();
      }
    };
    var tapEl = document.createElement('span'); tapEl.className = 'ua-tap'; tapEl.setAttribute('aria-hidden', 'true');
    var inst = def(root, ctx);
    root.appendChild(tapEl);
    var rp = h('<button class="ua-replay" type="button" aria-label="Replay">' + I.replay + '</button>'); root.appendChild(rp);
    root.addEventListener('click', function (e) {
      for (var i = 0; i < handlers.length; i++) { var el = e.target.closest(handlers[i][0]); if (el && root.contains(el)) handlers[i][1](el, e); }
    });
    function take(e) { if (e.target.closest('.ua-replay')) return; if (auto) { auto = false; clear(timers); root.classList.add('ua-user'); root.style.opacity = ''; } }
    root.addEventListener('pointerdown', take, true);
    root.addEventListener('keydown', take, true);
    rp.addEventListener('click', function (e) { e.stopPropagation(); auto = true; root.classList.remove('ua-user'); start(); });
    function clear(a) { a.forEach(clearTimeout); a.length = 0; }
    function start() {
      clear(timers); clear(fxT); root.style.transition = ''; root.style.opacity = '';
      ctx.instant = true; inst.reset(); ctx.instant = false; if (inst.begin) inst.begin(); running = true;
      inst.script.forEach(function (s) { timers.push(setTimeout(function () { typeof s[1] === 'function' ? s[1]() : ctx.tap(s[1]); }, s[0])); });
      timers.push(setTimeout(function () { root.style.transition = 'opacity .4s'; root.style.opacity = '0'; }, inst.loop - 450));
      timers.push(setTimeout(start, inst.loop));
    }
    function stop() { clear(timers); running = false; if (auto) { clear(fxT); root.style.opacity = ''; } }
    ctx.instant = true; inst.final(); ctx.instant = false;
    if (RM || root.closest('.th')) { root.classList.add('ua-user', 'ua-still'); return; }
    var slide = root.closest('.slide');
    function check(vis) { if (vis && auto && !running) start(); else if (!vis && running) stop(); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
      es.forEach(function (e) { check(e.isIntersecting && (!slide || slide.classList.contains('is-on'))); });
    }, { threshold: 0.3 }).observe(root); else start();
    if (slide) new MutationObserver(function () { check(slide.classList.contains('is-on')); }).observe(slide, { attributes: true, attributeFilter: ['class'] });
  }

  /* ================= Paytm chat kit ================= */
  var AVC = { RS: '#7b61ff', AM: '#f0794f', KP: '#12a37f', NJ: '#e0a400', ME: '#002970' };
  function av(ini, cls) { return '<span class="ua-av ' + (cls || '') + '" style="background:' + (AVC[ini] || '#7b61ff') + '">' + ini + '</span>'; }
  function phone(o) {
    return '<div class="ua-ph' + (o.cls ? ' ' + o.cls : '') + '"><div class="ua-sb"><b>9:41</b>' + SBI + '</div>'
      + '<div class="ua-ab"><span class="ua-ib">' + I.back + '</span>' + av(o.ini) + '<span class="ua-nm"><b>' + o.name + '</b><small>' + (o.sub || 'Online') + '</small></span>'
      + '<span class="ua-ib">' + I.call + '</span><button type="button" class="ua-ib ua-keb" aria-label="More options">' + I.dots + '</button></div>'
      + '<div class="ua-bd"><div class="ua-sc"></div></div>'
      + '<div class="ua-cp"><span class="ua-ib ua-plus">' + I.plus + '</span><span class="ua-in">Message<span class="ua-ib">' + I.smile + '</span></span>'
      + '<button type="button" class="ua-pay"><span>' + I.rupee + '</span>Pay</button><span class="ua-mic">' + I.mic + '</span></div>'
      + '<div class="ua-menu"><span>View profile</span><span>Media, links and docs</span><button type="button" class="pay"><span>' + I.rupee + '</span>Pay ' + o.name.split(' ')[0] + '</button><span>Search</span><span>Mute notifications</span></div>'
      + '<div class="ua-scrim"></div>'
      + '<div class="ua-sheet"><span class="ua-grab"></span><div class="ua-sh__to"><span class="ua-sh__av"></span><span><b class="ua-sh__nm"></b><small class="ua-sh__upi"></small></span></div>'
      + '<div class="ua-sh__amt"><i>₹</i><b></b><span class="ua-caret"></span></div><div class="ua-sh__note"></div>'
      + '<div class="ua-sh__src"><span class="ua-sh__bk">' + I.bank + '</span><span><b>Bank account ••4821</b><small>UPI · Paytm</small></span>' + I.down + '</div>'
      + '<button type="button" class="ua-sh__pay"><span class="t"></span><i class="ua-spin"></i></button></div></div>';
  }
  function msg(t, out, time) { return h('<div class="ua-m' + (out ? ' out' : '') + '"><span>' + t + '</span><small>' + time + (out ? I.ticks : '') + '</small></div>'); }
  function day(t) { return h('<span class="ua-day">' + t + '</span>'); }
  function stRow(label, time) { return '<div class="ua-pc__s"><span class="ua-pc__ic">' + I.tick + '<i class="ua-spin"></i></span><span class="w">Processing</span><span class="o">' + label + '</span><time>' + time + '</time></div>'; }
  function payCard(o) {
    return h('<div class="ua-pc out ' + (o.st || 'ok') + '"><div class="ua-pc__b"><span class="ua-pc__l">' + (o.lbl || 'You paid') + '</span><span class="ua-pc__a"><i>₹</i>' + o.amt + '</span>'
      + (o.note ? '<span class="ua-pc__n">' + o.note + '</span>' : '') + '</div>' + stRow('Paid', o.time)
      + '<div class="ua-pc__f"><span>UPI Ref ' + o.ref + '</span><span class="lk">Details' + I.chev + '</span></div></div>');
  }
  function reqCard(o) {
    return h('<div class="ua-pc rx req"><div class="ua-pc__b"><span class="ua-pc__l">' + o.from + ' requested</span><span class="ua-pc__a"><i>₹</i>' + o.amt + '</span><span class="ua-pc__n">' + o.note + '</span></div>'
      + '<div class="ua-pc__act"><button type="button" class="dec">Decline</button><button type="button" class="p">Pay</button></div>' + stRow('You paid', o.time).replace('ua-pc__s', 'ua-pc__s ua-pc__done')
      + '<div class="ua-pc__s ua-pc__dec"><span>Declined</span><time>' + o.time + '</time></div></div>');
  }
  function splitCard() {
    var ppl = [['RS', 1], ['KP', 1], ['ME', 0], ['NJ', 0]];
    return h('<div class="ua-pc rx split"><div class="ua-pc__b"><span class="ua-pc__l">Riya split a bill · 4 people</span><span class="ua-pc__a"><i>₹</i>1,280</span><span class="ua-pc__n">Pizza night 🍕 · ₹320 each</span></div>'
      + '<div class="ua-spl"><span class="ua-spl__av">' + ppl.map(function (p) { return '<span class="' + (p[1] ? 'pd' : '') + (p[0] === 'ME' ? ' me' : '') + '" style="background:' + AVC[p[0]] + '">' + (p[0] === 'ME' ? 'You' : p[0]) + '<i>' + I.tick + '</i></span>'; }).join('')
      + '</span><span class="ua-spl__c"><b>2</b> of 4 paid</span></div><div class="ua-spl__bar"><i></i></div>'
      + '<div class="ua-pc__act"><button type="button" class="p">Pay your share ₹320</button></div>' + stRow('You paid ₹320', '9:47 PM').replace('ua-pc__s', 'ua-pc__s ua-pc__done') + '</div>');
  }
  function Phone(ph, ctx) {
    var P = { el: ph, sc: $(ph, '.ua-sc'), cb: null };
    var sh = $(ph, '.ua-sheet');
    P.add = function (node) {
      P.sc.appendChild(node);
      if (ctx.instant) { node.classList.add('in'); P.sc.scrollTop = 1e5; }
      else { void node.offsetWidth; node.classList.add('in'); P.sc.scrollTo({ top: P.sc.scrollHeight, behavior: 'smooth' }); }
      return node;
    };
    P.clear = function () { P.sc.innerHTML = ''; ph.classList.remove('menu-on', 'sheet-on', 'nopay', 'ring'); P.cb = null; var b = $(sh, '.ua-sh__pay'); b.classList.remove('busy'); };
    P.sheet = function (s, cb) {
      ph.classList.remove('menu-on');
      $(sh, '.ua-sh__av').outerHTML = av(s.ini, 'ua-sh__av');
      $(sh, '.ua-sh__nm').textContent = 'Paying ' + s.name; $(sh, '.ua-sh__upi').textContent = s.upi;
      $(sh, '.ua-sh__note').textContent = s.note; $(sh, '.ua-sh__pay .t').textContent = 'Pay ₹' + s.amt;
      var amt = $(sh, '.ua-sh__amt b'), i = 0; amt.textContent = '';
      (function ty() { amt.textContent = s.amt.slice(0, ++i); if (i < s.amt.length) ctx.fx(90, ty); })();
      P.cb = cb; ph.classList.add('sheet-on');
    };
    P.close = function () { ph.classList.remove('sheet-on', 'menu-on'); P.cb = null; };
    P.ok = function (card, ms) { ctx.fx(ms || 900, function () { card.classList.remove('wait'); card.classList.add('ok'); }); };
    ctx.on('.ua-sh__pay', function (el) {
      if (!ph.contains(el) || !P.cb || el.classList.contains('busy')) return;
      el.classList.add('busy'); var cb = P.cb;
      ctx.fx(800, function () { el.classList.remove('busy'); ph.classList.remove('sheet-on'); P.cb = null; cb(); });
    });
    ctx.on('.ua-scrim', function (el) { if (ph.contains(el)) P.close(); });
    ctx.on('.ua-keb', function (el) { if (ph.contains(el)) { ph.classList.remove('ring'); ph.classList.toggle('menu-on'); } });
    ctx.on('.ua-menu .pay', function (el) { if (ph.contains(el)) { ph.classList.remove('menu-on'); P.onPay && P.onPay(); } });
    ctx.on('.ua-cp .ua-pay', function (el) { if (ph.contains(el)) P.onPay && P.onPay(); });
    return P;
  }
  var RIYA = { name: 'Riya Sharma', ini: 'RS', upi: 'riya.sharma@ptyes' }, ARJUN = { name: 'Arjun Mehta', ini: 'AM', upi: 'arjun.mehta@ptaxis' };
  function S(p, amt, note) { return { name: p.name, ini: p.ini, upi: p.upi, amt: amt, note: note }; }
  var refN = 0; function ref() { refN++; return '4318 2' + (100 + refN * 7) + ' ' + (6650 + refN * 113); }
  function col(cls, n, label, badge, ph, stat, statTxt, good) {
    return '<div class="ua-col ' + cls + '"><div class="ua-lbl"><i>' + n + '</i>' + label + (badge ? '<em>' + badge + '</em>' : '') + '</div>' + ph
      + (stat ? '<div class="ua-stat ' + good + '"><b>' + stat + '</b><span>' + statTxt + '</span></div>' : '') + '</div>';
  }

  /* A/B: chat first vs pay first */
  W['paytm-ab'] = function (root, ctx) {
    root.innerHTML = col('a', 'A', 'Chat first', '', phone({ name: 'Riya Sharma', ini: 'RS', cls: 'nopaybtn' }), '34%', 'left without paying', 'bad')
      + col('b', 'B', 'Pay first', 'Shipped', phone({ name: 'Arjun Mehta', ini: 'AM' }), '17%', 'left without paying', 'good');
    var A = Phone($(root, '.a .ua-ph'), ctx), B = Phone($(root, '.b .ua-ph'), ctx);
    function reset() {
      A.clear(); B.clear();
      A.add(day('Today')); A.add(msg('Hey! Back from Goa?', 0, '9:30 PM')); A.add(msg('Yes! Sending my share of the hotel', 1, '9:32 PM')); A.add(msg('Cool, whenever 🙂', 0, '9:33 PM'));
      B.add(day('Today')); B.add(msg('Dinner was so good', 0, '9:35 PM'));
    }
    A.onPay = function () { A.sheet(S(RIYA, '1,450', 'Hotel share'), function () { A.P = A.add(payCard({ amt: '1,450', note: 'Hotel share', time: '9:41 PM', ref: ref(), st: 'wait' })); A.ok(A.P); }); };
    B.onPay = function () { B.sheet(S(ARJUN, '640', 'Dinner 🍕'), function () { var c = B.add(payCard({ amt: '640', note: 'Dinner 🍕', time: '9:40 PM', ref: ref(), st: 'wait' })); B.ok(c); ctx.fx(1900, function () { B.add(msg('Got it, thanks!', 0, '9:41 PM')); }); }); };
    return {
      reset: reset, loop: 9500,
      final: function () { reset(); A.add(payCard({ amt: '1,450', note: 'Hotel share', time: '9:41 PM', ref: ref() })); B.add(payCard({ amt: '640', note: 'Dinner 🍕', time: '9:40 PM', ref: ref() })); B.add(msg('Got it, thanks!', 0, '9:41 PM')); },
      script: [[900, '.b .ua-cp .ua-pay'], [1300, '.a .ua-keb'], [2300, '.b .ua-sh__pay'], [2600, '.a .ua-menu .pay'], [3900, '.a .ua-sh__pay']]
    };
  };

  /* Payment cards: paid, request, split */
  W['paytm-cards'] = function (root, ctx) {
    root.innerHTML = phone({ name: 'Riya Sharma', ini: 'RS' });
    var P = Phone($(root, '.ua-ph'), ctx), req, sp;
    function base() { P.clear(); P.add(day('Today')); P.add(msg('Movie tonight? I booked our seats', 0, '9:36 PM')); }
    function paid1(st) { var c = P.add(payCard({ amt: '450', note: 'Movie tickets 🎬', time: '9:38 PM', ref: '4318 2097 6650', st: st })); if (st === 'wait') P.ok(c, 1100); }
    function request() { req = P.add(reqCard({ from: 'Riya', amt: '320', note: 'Cab home 🚕', time: '9:44 PM' })); }
    function split() { sp = P.add(splitCard()); }
    function paySplit() { sp.classList.add('paid'); $(sp, '.ua-spl__c b').textContent = '3'; }
    ctx.on('.req .p', function (el) { var c = el.closest('.req'); if (c.classList.contains('paid')) return; P.sheet(S(RIYA, '320', 'Cab home 🚕'), function () { c.classList.add('paid'); }); });
    ctx.on('.req .dec', function (el) { el.closest('.req').classList.add('declined'); });
    ctx.on('.split .p', function (el) { if (!sp.classList.contains('paid')) P.sheet(S(RIYA, '320', 'Pizza night 🍕'), paySplit); });
    P.onPay = function () { P.sheet(S(RIYA, '200', 'Popcorn 🍿'), function () { var c = P.add(payCard({ amt: '200', note: 'Popcorn 🍿', time: '9:49 PM', ref: ref(), st: 'wait' })); P.ok(c); }); };
    return {
      reset: base, loop: 12500,
      begin: function () { ctx.fx(400, function () { paid1('wait'); }); ctx.fx(2400, request); ctx.fx(6400, split); },
      final: function () { base(); paid1('ok'); request(); req.classList.add('paid'); split(); paySplit(); },
      script: [[3600, '.req .p'], [4900, '.ua-sh__pay'], [7800, '.split .p'], [9100, '.ua-sh__pay']]
    };
  };

  /* After launch: pay jumps into the menu; an empty chat gets a big pay button */
  W['paytm-merge'] = function (root, ctx) {
    root.innerHTML = col('p1', '1', 'No payment yet', '', phone({ name: 'Riya Sharma', ini: 'RS' }))
      + col('p2', '2', 'Empty chat', '', phone({ name: 'Arjun Mehta', ini: 'AM', sub: 'On Paytm', cls: 'nopay' }));
    var A = Phone($(root, '.p1 .ua-ph'), ctx), B = Phone($(root, '.p2 .ua-ph'), ctx);
    var empty = '<div class="ua-empty">' + av('AM', 'xl') + '<b>Arjun Mehta</b><small>arjun.mehta@ptaxis</small><span class="ua-hi">Say hi 👋</span><button type="button" class="ua-big"><span>' + I.rupee + '</span>Pay Arjun</button></div>';
    function reset() {
      A.clear(); B.clear(); B.el.classList.add('nopay');
      A.add(day('Today')); A.add(msg('Dinner was great!', 0, '9:30 PM')); A.add(msg('It was! Let me pay you back', 1, '9:31 PM'));
      B.add(h(empty));
    }
    function jump() {
      var ph = A.el, btn = $(ph, '.ua-cp .ua-pay'), keb = $(ph, '.ua-keb');
      if (ctx.instant || !btn.animate) { ph.classList.add('nopay', 'ring'); return; }
      var a = btn.getBoundingClientRect(), b = keb.getBoundingClientRect(), p = ph.getBoundingClientRect(), k = p.width / ph.offsetWidth;
      var c = btn.cloneNode(true); c.classList.add('ua-ghost'); c.style.left = (a.left - p.left) / k + 'px'; c.style.top = (a.top - p.top) / k + 'px'; ph.appendChild(c);
      ph.classList.add('nopay');
      var dx = (b.left + b.width / 2 - a.left - a.width / 2) / k, dy = (b.top + b.height / 2 - a.top - a.height / 2) / k;
      c.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + dx * .55 + 'px,' + (dy * .55 - 40) + 'px) scale(.75)', opacity: 1, offset: .55 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.2)', opacity: 0 }], { duration: 900, easing: 'cubic-bezier(.45,0,.25,1)' }).onfinish = function () { c.remove(); ph.classList.add('ring'); };
    }
    A.onPay = function () { A.sheet(S(RIYA, '850', 'Dinner 🍝'), function () { var c = A.add(payCard({ amt: '850', note: 'Dinner 🍝', time: '9:42 PM', ref: ref(), st: 'wait' })); A.ok(c); }); };
    B.onPay = function () { B.sheet(S(ARJUN, '500', 'Concert ticket 🎟️'), function () {
      var e = $(B.el, '.ua-empty'); if (e) { e.remove(); B.add(day('Today')); } B.el.classList.remove('nopay');
      var c = B.add(payCard({ amt: '500', note: 'Concert ticket 🎟️', time: '9:43 PM', ref: ref(), st: 'wait' })); B.ok(c); }); };
    ctx.on('.ua-big', function (el) { if (B.el.contains(el)) B.onPay(); });
    return {
      reset: reset, loop: 9500,
      final: function () { reset(); jump(); },
      script: [[1000, jump], [1700, '.p2 .ua-big'], [3000, '.p2 .ua-sh__pay'], [3300, '.p1 .ua-keb'], [4400, '.p1 .ua-menu .pay'], [5700, '.p1 .ua-sh__pay']]
    };
  };

  /* ================= Voyage ================= */
  function win(url, body, cls) { return '<div class="ua-win ' + (cls || '') + '"><div class="ua-win__bar"><i></i><i></i><i></i><span class="ua-url">' + url + '</span></div>' + body + '</div>'; }

  /* Research: interview notes, clustered into what kept coming back */
  W['voyage-research'] = function (root, ctx) {
    var N = [['Every pitch starts from a blank file', 'Interview', 0], ['Made for one client, so nobody can reuse it', 'Interview', 1], ['Every demo looks different', 'Interview', 2],
      ['Same patterns, built again from scratch', 'Interview', 0], ['Reusing a demo means rebuilding it', 'Interview', 1], ['Nothing looks like one company', 'Interview', 2]];
    var scat = [[3, 8, -4], [37, 4, 3], [70, 10, -2], [14, 50, 2], [50, 46, -3], [76, 54, 4]];
    var T = ['Rebuilt every time', 'Too tied to one client', 'No two demos match'];
    var board = '<div class="ua-rb"><div class="ua-rb__tool"><span class="ua-rb__t">Designer interviews<small>50+ designers · 10 years of work</small></span><button type="button" class="ua-rb__btn">Cluster</button></div><div class="ua-rb__c">'
      + T.map(function (t, i) { return '<span class="ua-rb__h" style="left:' + (3 + i * 33) + '%">' + t + '</span>'; }).join('')
      + N.map(function (n, i) { return '<div class="ua-st t' + n[2] + '" data-i="' + i + '"><p>' + n[0] + '</p><small>' + n[1] + '</small></div>'; }).join('')
      + '<div class="ua-rb__in"><span>Insight</span>Different clients, same patterns, rebuilt from scratch every time.</div></div></div>';
    root.innerHTML = win('Voyage research · synthesis', board, 'ua-rbw');
    var st = $$(root, '.ua-st'), c = $(root, '.ua-rb__c'), btn = $(root, '.ua-rb__btn'), cnt = [0, 0, 0];
    function place(on) {
      cnt = [0, 0, 0]; root.classList.toggle('clus', on); btn.textContent = on ? 'Scatter' : 'Cluster';
      st.forEach(function (s, i) { var n = N[i];
        if (on) { var r = cnt[n[2]]++; s.style.left = (3 + n[2] * 33) + '%'; s.style.top = (15 + r * 31) + '%'; s.style.transform = 'rotate(0deg)'; }
        else { s.style.left = scat[i][0] + '%'; s.style.top = scat[i][1] + '%'; s.style.transform = 'rotate(' + scat[i][2] + 'deg)'; } });
    }
    ctx.on('.ua-rb__btn', function () { place(!root.classList.contains('clus')); });
    // drag notes around
    st.forEach(function (s) {
      s.addEventListener('pointerdown', function (e) {
        e.preventDefault(); var r = c.getBoundingClientRect(), k = r.width / c.offsetWidth, x0 = e.clientX, y0 = e.clientY, l0 = s.offsetLeft, t0 = s.offsetTop;
        s.classList.add('drag'); s.setPointerCapture(e.pointerId);
        function mv(ev) { s.style.left = Math.max(0, Math.min(c.offsetWidth - s.offsetWidth, l0 + (ev.clientX - x0) / k)) + 'px'; s.style.top = Math.max(0, Math.min(c.offsetHeight - s.offsetHeight, t0 + (ev.clientY - y0) / k)) + 'px'; }
        function up() { s.classList.remove('drag'); s.removeEventListener('pointermove', mv); s.removeEventListener('pointerup', up); }
        s.addEventListener('pointermove', mv); s.addEventListener('pointerup', up);
      });
    });
    return { reset: function () { place(false); }, final: function () { place(true); }, loop: 8000, script: [[2200, '.ua-rb__btn']] };
  };

  /* Silos vs one system */
  W['voyage-demos'] = function (root, ctx) {
    function d(n, url, ac, logo, hd, k, btn) {
      return '<div class="ua-win d' + n + '" style="--ac:' + ac + '"><div class="ua-win__bar"><i></i><i></i><i></i><span class="ua-url">' + url + '</span></div>'
        + '<div class="ua-dm"><div class="ua-dm__nav"><b></b><span>' + logo + '</span><i></i><i></i></div><div class="ua-dm__h">' + hd + '</div><div class="ua-dm__k">'
        + k.map(function (x) { return '<div><small>' + x[0] + '</small><strong>' + x[1] + '</strong></div>'; }).join('') + '</div><span class="ua-dm__btn">' + btn + '</span></div></div>';
    }
    root.innerHTML = '<button type="button" class="ua-sw" role="switch" aria-checked="false"><span>Built in silos</span><i></i><span>Built on Voyage</span></button><div class="ua-demos">'
      + d(1, 'pitch-wealth.demo', '#1f4e8c', 'Wealth', 'Advisor dashboard', [['Assets', '$4.2B'], ['Clients', '1,284'], ['Net flows', '+3.1%'], ['Alerts', '6']], 'View clients')
      + d(2, 'pitch-claims.demo', '#0f7b6c', 'Claims', 'Claims overview', [['Open', '312'], ['Avg. days', '6.4'], ['Approved', '87%'], ['Escalated', '9']], 'Start a claim')
      + d(3, 'pitch-freight.demo', '#8a3b2e', 'Freight', 'Shipment tracker', [['In transit', '2,940'], ['On time', '96%'], ['Delayed', '41'], ['Issues', '12']], 'Track')
      + '</div>';
    var sw = $(root, '.ua-sw'), dm = $(root, '.ua-demos');
    function set(on) { sw.classList.toggle('on', on); dm.classList.toggle('on', on); sw.setAttribute('aria-checked', on); }
    ctx.on('.ua-sw', function () { set(!sw.classList.contains('on')); });
    return { reset: function () { set(false); }, final: function () { set(true); }, loop: 8000, script: [[2600, '.ua-sw']] };
  };

  /* Level 1: the documentation site designers built demos from */
  W['voyage-v1'] = function (root, ctx) {
    var sw = function (n, v, c) { return '<div class="ua-sw8"><i style="background:' + c + '"></i><b>' + n + '</b><code>' + v + '</code><small>' + c + '</small></div>'; };
    var PG = {
      brand: ['Start', 'Brand philosophy', '<p class="ua-dc__p">One source of truth for every demo, product line and proposal. Start here, then pick a foundation or a component.</p><div class="ua-dc__g">'
        + [['Foundations', 'Color, type, illustration, data visualization, content'], ['Components', 'Every part, in depth, with states'], ['Usage guides', 'When to use what'], ['Decisions', 'Why each rule exists']]
          .map(function (x) { return '<div class="ua-dc__c"><b>' + x[0] + '</b><span>' + x[1] + '</span></div>'; }).join('') + '</div>'],
      color: ['Foundations', 'Color', '<div class="ua-dc__sw">' + sw('Action', 'color.action', '#2f5bea') + sw('Ink', 'color.text', '#16181d') + sw('Surface', 'color.surface', '#f4f5f7')
        + sw('Success', 'color.success', '#1f8a5b') + sw('Warning', 'color.warning', '#c98a12') + sw('Danger', 'color.danger', '#c8443a') + '</div><p class="ua-dc__p">Every client theme swaps these tokens. Components never use a raw color.</p>'],
      type: ['Foundations', 'Typography', '<div class="ua-dc__ty">' + [['Display', '2.6em', 700, '40 / 48'], ['Heading', '1.9em', 700, '28 / 36'], ['Title', '1.45em', 600, '20 / 28'], ['Body', '1.15em', 400, '16 / 24'], ['Caption', '.95em', 500, '12 / 16']]
        .map(function (x) { return '<div><span style="font-size:' + x[1] + ';font-weight:' + x[2] + '">' + x[0] + '</span><small>' + x[3] + '</small></div>'; }).join('') + '</div>'],
      viz: ['Foundations', 'Data visualization', '<div class="ua-dc__ch">' + [38, 52, 46, 64, 58, 72, 80].map(function (v, i) { return '<i style="height:' + v + '%;background:' + (i === 6 ? '#2f5bea' : '#c9d4fb') + '"></i>'; }).join('')
        + '</div><p class="ua-dc__p">One highlight color per chart. Everything else stays quiet.</p>'],
      button: ['Components', 'Button', '<div class="ua-dc__pv"><span class="ua-vb p">Continue</span><span class="ua-vb s">Save draft</span><span class="ua-vb g">Cancel</span></div>'
        + '<div class="ua-dc__dd"><div class="do"><b>Do</b>One primary button per view</div><div class="dont"><b>Don\'t</b>Two primary buttons side by side</div></div>'
        + '<p class="ua-dc__p"><b>Why:</b> one clear action keeps a client demo easy to follow.</p>'],
      a11y: ['Platforms', 'Accessibility', '<ul class="ua-dc__ck">' + ['Text contrast 4.5:1 or higher', '44px minimum touch target', 'Visible focus on every control', 'Labels on every icon button'].map(function (x) { return '<li>' + I.tick + x + '</li>'; }).join('') + '</ul>']
    };
    var NAV = [['Start', [['brand', 'Brand philosophy']]], ['Foundations', [['color', 'Color'], ['type', 'Typography'], ['viz', 'Data visualization']]], ['Components', [['button', 'Button']]], ['Platforms', [['a11y', 'Accessibility']]]];
    var side = NAV.map(function (g) { return '<div class="ua-dc__grp"><small>' + g[0] + '</small>' + g[1].map(function (x) { return '<button type="button" data-pg="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>'; }).join('');
    var top = '<div class="ua-dc__top"><span class="ua-dc__logo"><i></i>Voyage<em>v1</em></span><span class="ua-dc__q">' + I.search + 'Search</span><span class="ua-dc__pf"><button type="button" data-pf="web">Web</button><button type="button" data-pf="ios">iOS</button><button type="button" data-pf="and">Android</button></span></div>';
    root.innerHTML = win('voyage / docs', top + '<div class="ua-dc"><nav class="ua-dc__nav">' + side + '</nav><div class="ua-dc__main"></div></div>', 'ua-dcw');
    var main = $(root, '.ua-dc__main'), w = $(root, '.ua-dcw');
    function go(k) { var p = PG[k]; main.innerHTML = '<small class="ua-dc__bc">' + p[0] + '</small><h4>' + p[1] + '</h4>' + p[2]; main.classList.remove('in'); void main.offsetWidth; main.classList.add('in');
      $$(root, '[data-pg]').forEach(function (b) { b.classList.toggle('on', b.dataset.pg === k); });
      var nv = $(root, '.ua-dc__nav'), on = $(nv, '.on'); if (on && nv.scrollWidth > nv.clientWidth + 2) nv.scrollTo({ left: on.offsetLeft - 16, behavior: ctx.instant ? 'auto' : 'smooth' }); }
    function pf(k) { w.dataset.pf = k; $$(root, '[data-pf]').forEach(function (b) { b.classList.toggle('on', b.dataset.pf === k); }); }
    ctx.on('[data-pg]', function (el) { go(el.dataset.pg); });
    ctx.on('[data-pf]', function (el) { pf(el.dataset.pf); });
    return { reset: function () { go('brand'); pf('web'); }, final: function () { go('button'); pf('web'); }, loop: 13000,
      script: [[1800, '[data-pg=color]'], [3600, '[data-pg=type]'], [5400, '[data-pg=viz]'], [7000, '[data-pg=button]'], [8400, '[data-pf=ios]'], [9400, '[data-pf=and]'], [10600, '[data-pg=a11y]']] };
  };

  /* Level 2: contract, context and developer version for each component */
  W['voyage-contract'] = function (root, ctx) {
    function L() { return [].slice.call(arguments).map(function (l) { return '<span>' + l + '</span>'; }).join(''); }
    var F = {
      'button.contract.md': L('<span class="h"># Button</span>', '<span class="p">purpose</span>: the main action in a view', '<span class="p">use</span>: one primary button per view', '<span class="p">never</span>: two primary buttons side by side',
        '<span class="p">tokens</span>: <span class="s">color.action · radius.md · space.3</span>', '<span class="p">states</span>: default, hover, focus, disabled, loading', '<span class="p">a11y</span>: 44px target, visible focus ring', '<span class="p">group</span>: <span class="s">Actions</span> (Button, IconButton, SplitButton)'),
      'button.context.md': L('<span class="h"># Why Button exists</span>', '<span class="c">## When to use it</span>', 'For the step that moves someone forward.', '<span class="c">## When not to</span>', 'Going somewhere else is a Link.', 'Deleting something is Button / danger.', '<span class="c">## Reasoning</span>', 'One clear action keeps a client demo easy to follow.'),
      'button.dev.html': L('<span class="k">&lt;button</span> <span class="p">class</span>=<span class="s">"v-btn"</span> <span class="p">data-variant</span>=<span class="s">"primary"</span><span class="k">&gt;</span>', '  Continue', '<span class="k">&lt;/button&gt;</span>', '', '<span class="n">.v-btn</span> {', '  background: <span class="s">var(--color-action)</span>;', '  border-radius: <span class="s">var(--radius-md)</span>;', '  padding: <span class="s">var(--space-3) var(--space-5)</span>;', '}')
    };
    var names = Object.keys(F);
    var tree = '<div class="ua-ft"><small>VOYAGE</small><span class="d">' + I.folder + 'actions</span><span class="d s">' + I.folder + 'button</span>'
      + names.map(function (n) { return '<button type="button" class="f" data-f="' + n + '">' + I.file + n.replace('button.', '') + '</button>'; }).join('')
      + '<span class="d s">' + I.folder + 'split-button</span><span class="d">' + I.folder + 'data</span><span class="d s">' + I.folder + 'card</span><span class="d s">' + I.folder + 'data-table</span></div>';
    var tabs = '<div class="ua-tabs">' + names.map(function (n) { return '<button type="button" data-f="' + n + '">' + n + '</button>'; }).join('') + '</div>';
    root.innerHTML = '<div class="ua-win ua-ed"><div class="ua-win__bar"><i></i><i></i><i></i>' + tabs + '</div><div class="ua-edb">' + tree + '<div class="ua-code"><pre></pre></div></div></div>';
    var pre = $(root, 'pre');
    function open(n) { pre.innerHTML = F[n]; pre.classList.remove('in'); void pre.offsetWidth; pre.classList.add('in'); $$(root, '[data-f]').forEach(function (b) { b.classList.toggle('on', b.dataset.f === n); }); }
    ctx.on('[data-f]', function (el) { open(el.dataset.f); });
    return { reset: function () { open(names[0]); }, final: function () { open(names[0]); }, loop: 9000, script: [[3000, '.ua-ft [data-f="button.context.md"]'], [6000, '.ua-tabs [data-f="button.dev.html"]']] };
  };

  /* Level 3: Claude Code builds from Voyage only, gaps go to a person */
  W['voyage-ai'] = function (root, ctx) {
    var term = '<div class="ua-win ua-term"><div class="ua-win__bar"><i></i><i></i><i></i><span class="ua-url">~/pitches/wealth-advisor</span></div><div class="ua-tm">'
      + '<div class="box"><b>✻</b> Claude Code<small>Voyage plugin · contracts loaded</small></div><div class="pr">Build an advisor dashboard for a wealth client</div><div class="ua-tl"></div></div></div>';
    var gap = function (n, t, p) { return '<div class="ua-gp ' + n + '"><b>' + t + '</b><p>' + p + '</p><div class="ua-gp__b"><button type="button" class="y">Approve</button><button type="button" class="n">Reject</button></div></div>'; };
    var rv = '<div class="ua-win ua-rvw"><div class="ua-win__bar"><i></i><i></i><i></i><span class="ua-url">gaps.md · review</span></div><div class="ua-rp">'
      + '<h5>gaps.md<em>Human</em></h5><div class="ua-gps">' + gap('g1', 'Risk score dial', 'Nothing in Voyage shows a score on a range.') + gap('g2', 'Advisor notes timeline', 'A data table sorted by date already covers it.') + '</div>'
      + '<h5>Chromatic</h5><div class="ua-ck"><span>Accessibility</span><span>Visual</span><span>Code</span></div>'
      + '<div class="ua-adm">' + av('VA') + 'Sent to a Voyage admin for approval</div></div></div>';
    root.innerHTML = '<div class="ua-ai">' + term + rv + '</div>';
    var tl = $(root, '.ua-tl'), built = false;
    function ln(cls, t) { var e = h('<div class="' + cls + '">' + t + '</div>'); tl.appendChild(e); if (!ctx.instant) { void e.offsetWidth; } e.classList.add('in'); return e; }
    function reset() { tl.innerHTML = ''; built = false; root.classList.remove('gaps', 'chk1', 'chk2', 'chk3', 'adm'); $$(root, '.ua-gp').forEach(function (g) { g.classList.remove('yes', 'no'); }); }
    function run() {
      ctx.fx(500, function () { ln('ln', 'Reading Voyage contracts and context'); });
      ctx.fx(1300, function () { ln('ln ok', 'Reusing components only'); });
      ctx.fx(1800, function () { ln('sub', 'App shell · KPI card · Data table · Insight panel · Line chart'); });
      ctx.fx(2700, function () { ln('ln warn', '2 needs have no component. Writing gaps.md'); ln('sub gap', 'Risk score dial'); ln('sub gap', 'Advisor notes timeline'); root.classList.add('gaps'); });
      ctx.fx(3700, function () { ln('ln ok', 'Screen built in code, gaps marked'); });
      ctx.fx(4400, function () { ln('opts', '<button type="button">Option 1</button><button type="button">Option 2</button><button type="button">Option 3</button>'); });
    }
    function build(name) {
      if (built) return; built = true;
      ctx.fx(500, function () { ln('ln', 'Creating ' + name + ': context, parent and child checked'); });
      ctx.fx(1500, function () { ln('ln ok', 'Built in code. Figma canvas on request'); });
      ctx.fx(1900, function () { root.classList.add('chk1'); }); ctx.fx(2300, function () { root.classList.add('chk2'); }); ctx.fx(2700, function () { root.classList.add('chk3'); });
      ctx.fx(3300, function () { root.classList.add('adm'); ln('ln', 'Waiting on admin approval <span class="cur"></span>'); });
    }
    ctx.on('.opts button', function (el) { $$(el.parentNode, 'button').forEach(function (b) { b.classList.toggle('on', b === el); }); });
    ctx.on('.ua-gp .y', function (el) { var g = el.closest('.ua-gp'); if (g.classList.contains('yes')) return; g.classList.remove('no'); g.classList.add('yes'); build($(g, 'b').textContent); });
    ctx.on('.ua-gp .n', function (el) { var g = el.closest('.ua-gp'); if (g.classList.contains('no') || g.classList.contains('yes')) return; g.classList.add('no'); ctx.fx(400, function () { ln('sub', $(g, 'b').textContent + ': not built, existing parts cover it'); }); });
    return {
      reset: reset, begin: run, loop: 14500,
      final: function () { reset(); run(); $(root, '.opts button').classList.add('on'); $(root, '.g1').classList.add('yes'); build('Risk score dial'); $(root, '.g2').classList.add('no'); },
      script: [[5200, '.opts button'], [6400, '.g1 .y'], [7500, '.g2 .n']]
    };
  };

  function scan(n) { var r = n || document; if (r.querySelectorAll) $$(r, '[data-ua]').forEach(setup); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { scan(); }); else scan();
  new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { if (n.matches('[data-ua]')) setup(n); scan(n); } }); }); })
    .observe(document.documentElement, { childList: true, subtree: true });
})();
