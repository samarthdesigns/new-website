/* shared: Lenis + GSAP wiring */
(function(){
  document.documentElement.classList.add('js');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SN = window.SN = {RM, fine: matchMedia('(hover:hover) and (pointer:fine)').matches};
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  if (window.Draggable) gsap.registerPlugin(Draggable);
  if (window.DrawSVGPlugin) gsap.registerPlugin(DrawSVGPlugin);
  const opts = JSON.parse(document.body.dataset.lenis || '{}');
  if (!RM && window.Lenis) {
    const lenis = SN.lenis = new Lenis(Object.assign({lerp:.1, wheelMultiplier:1}, opts));
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  ScrollTrigger.config({ignoreMobileResize: true});
  /* true while el is near the viewport — tickers skip work for offscreen pieces */
  const vis = new WeakMap(), io = new IntersectionObserver(es => es.forEach(e => vis.set(e.target, e.isIntersecting)), {rootMargin: '200px 0px'});
  SN.watch = el => { if (el) { vis.set(el, true); io.observe(el); } return () => !el || vis.get(el); };
  SN.vel = () => SN.lenis ? SN.lenis.velocity : 0;
  SN.to = (target) => SN.lenis ? SN.lenis.scrollTo(target, {offset:0, duration:1.4}) : (typeof target==='number'?scrollTo(0,target):document.querySelector(target)?.scrollIntoView({behavior:'smooth'}));
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const h = a.getAttribute('href'); e.preventDefault();
    SN.to(h === '#' ? 0 : h);
  });
  SN.fontsReady = (document.fonts ? document.fonts.ready : Promise.resolve());
})();

/* ================= DESIGN SYSTEM MOTION (from the landing page, after jithinrp.com) ================= */
(function(){
  const {RM, fine} = SN;
  const q = (s, r=document) => r.querySelector(s), qa = (s, r=document) => [...r.querySelectorAll(s)];
  SN.q = q; SN.qa = qa;

  /* navbar: hairline + compact once scrolled */
  const nb = q('.navbar');
  if (nb) { const f = () => nb.classList.toggle('is-scrolled', scrollY > 8); f(); addEventListener('scroll', f, {passive:true}); }

  /* footer local time (visitor's clock) */
  qa('[data-local-time]').forEach(el => { const t = () => el.textContent = new Date().toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit', timeZone:'America/Los_Angeles'}); t(); setInterval(t, 30000); });

  if (RM) { qa('[data-reveal]').forEach(el => el.style.opacity = 1); return; }

  SN.fontsReady.then(() => {
    const ex = 'expo.out';

    /* reveals: y40 + opacity → 1.2s expo.out, batched at top 88%, stagger min(.08, .4/n) */
    ScrollTrigger.batch('[data-reveal]', {start: 'top 88%', once: true,
      onEnter: b => gsap.fromTo(b, {y: 40, opacity: 0}, {y: 0, opacity: 1, duration: 1.2, ease: ex, stagger: Math.min(.08, .4 / b.length)})});

    /* liquid display heads: condense from blur, melt away on leave */
    qa('[data-liquid]').forEach(h => {
      SplitText.create(h, {type: 'lines', linesClass: 'line', autoSplit: true, onSplit(s){
        gsap.set(s.lines, {transformOrigin: '50% 100%'});
        /* fresh tweens each time (overwrite) so a melt can never leave a head stuck hidden */
        const show = up => gsap.fromTo(s.lines,
          {autoAlpha: 0, yPercent: up ? -35 : 35, scaleY: 1.25},
          {autoAlpha: 1, yPercent: 0, scaleY: 1, duration: 1.1, ease: 'power3.out', stagger: .12, overwrite: true});
        const melt = up => gsap.to(s.lines, {autoAlpha: 0, yPercent: up ? -30 : 30, scaleY: 1.2, duration: .55, ease: 'power2.in', stagger: .06, overwrite: true});
        gsap.set(s.lines, {autoAlpha: 0, transformOrigin: '50% 100%', force3D: true});
        const st = ScrollTrigger.create({trigger: h, start: 'top 92%', end: 'bottom top',
          onEnter: () => show(false), onEnterBack: () => show(true), onLeave: () => melt(true), onLeaveBack: () => melt(false)});
        if (st.isActive) show(false);
        return st;
      }});
    });

    /* lazy images change page height → keep trigger positions fresh */
    let rz, bh = document.body.offsetHeight; const refresh = () => { clearTimeout(rz); rz = setTimeout(() => {
      if (SN.lenis && SN.lenis.isScrolling) return refresh();
      const h = document.body.offsetHeight; if (Math.abs(h - bh) > 2) { bh = h; ScrollTrigger.refresh(); } }, 200); };
    new ResizeObserver(refresh).observe(document.body);
    /* safety net: any liquid head sitting in view but hidden gets shown once scrolling settles */
    let idle; const heal = () => { clearTimeout(idle); idle = setTimeout(() => qa('[data-liquid] .line').forEach(l => {
      const r = l.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight && +getComputedStyle(l).opacity < .05)
        gsap.to(l, {autoAlpha: 1, yPercent: 0, scaleY: 1, duration: 1, ease: 'power3.out', overwrite: true});
    }), 250); };
    addEventListener('scroll', heal, {passive: true});

    /* hairlines draw: horizontal bands (bottom 95%), vertical dividers (top 90%) */
    qa('.band,.hero,.about,[data-draw-h]').forEach(el => gsap.fromTo(el, {'--draw': 0}, {'--draw': 1, duration: 1.6, ease: 'expo.inOut',
      scrollTrigger: {trigger: el, start: 'bottom 95%', once: true}}));
    qa('.vrule,.work__mid,[data-draw-v]').forEach(el => gsap.fromTo(el, {'--draw': 0}, {'--draw': 1, duration: 1.4, ease: 'expo.inOut',
      scrollTrigger: {trigger: el, start: 'top 90%', once: true}}));

    /* scroll lean: skewY ±3.2 from velocity, spring 55/10 */
    const lean = qa('[data-lean]');
    if (lean.length) { let y = 0, v = 0, last = '';
      gsap.ticker.add((t, dms) => { const dt = Math.min(.05, dms / 1000), tg = gsap.utils.clamp(-3.2, 3.2, -SN.vel() * .09);
        v += (55 * (tg - y) - 10 * v) * dt; y += v * dt;
        const s = Math.abs(y) < .002 && Math.abs(v) < .002 ? '' : `skewY(${y.toFixed(3)}deg)`;
        if (s !== last) { last = s; lean.forEach(el => el.style.transform = s); } }); }

    /* reading progress */
    const pv = q('.progress__v'), pl = q('.progress__line i');
    if (pv) ScrollTrigger.create({start: 0, end: 'max', onUpdate: s => { const t = Math.round(s.progress * 100) + '%'; if (pv.textContent !== t) pv.textContent = t; pl.style.transform = `scaleY(${s.progress.toFixed(4)})`; }});

    /* cursor pill over [data-cursor-pill]: quickTo .35 power3 + skew lean */
    const pill = q('.cursor-pill');
    if (pill && fine) {
      const t = q('.cursor-pill__t', pill);
      const xTo = gsap.quickTo(pill, 'x', {duration: .35, ease: 'power3'}), yTo = gsap.quickTo(pill, 'y', {duration: .35, ease: 'power3'});
      const skTo = gsap.quickTo(pill, 'skewX', {duration: .5, ease: 'power3'});
      let px = 0, on = null;
      addEventListener('pointermove', e => { xTo(e.clientX + 14); yTo(e.clientY + 18); skTo(gsap.utils.clamp(-14, 14, (e.clientX - px) * -.6)); px = e.clientX;
        const el = e.target.closest && e.target.closest('[data-cursor-pill]');
        if (el !== on) { on = el;
          if (el) { t.textContent = el.dataset.cursorPill; gsap.to(pill, {autoAlpha: 1, scale: 1, duration: .45, ease: 'back.out(2)', overwrite: 'auto'}); }
          else gsap.to(pill, {autoAlpha: 0, scale: .6, duration: .3, overwrite: 'auto'}); } }, {passive: true});
      gsap.set(pill, {scale: .6, transformOrigin: '0 0'});
    }
    /* whole-row click for [data-href] */
    qa('[data-href]').forEach(r => r.addEventListener('click', e => { if (!e.target.closest('a')) (SN.go || (u => location.href = u))(r.dataset.href); }));
  });
})();

/* ================= shared page intro + pixel titles (non-landing pages reuse the landing's motion) ================= */
(function(){
  if (document.body.classList.contains('pg-home')) return;
  const {RM, q, qa} = SN;
  const titles = qa('[data-pixel-title]');
  /* fit pixel titles to their container width */
  const fit = () => titles.forEach(t => { t.style.fontSize = ''; const w = t.parentElement.clientWidth, sw = t.scrollWidth;
    if (sw > w) t.style.fontSize = parseFloat(getComputedStyle(t).fontSize) * w / sw + 'px'; });
  SN.fontsReady.then(() => { fit(); addEventListener('resize', fit); if (RM) return;
    const ex = 'expo.out', tl = gsap.timeline({defaults: {ease: ex}});
    qa('[data-intro-lines]').forEach(el => {
      const s = SplitText.create(el, {type: 'lines', mask: 'lines', linesClass: 'line'});
      tl.from(s.lines, {yPercent: 110, duration: 1.3, stagger: .09}, .1);
    });
    if (qa('[data-intro-item]').length) tl.from('[data-intro-item]', {y: 14, autoAlpha: 0, duration: 1, stagger: .05}, .35);
    if (q('.hero')) tl.fromTo('.hero', {'--draw': 0}, {'--draw': 1, duration: 1.6, ease: 'expo.inOut'}, .6);
    titles.forEach(t => {
      const pcs = qa('.pc', t); pcs.forEach(c => c.style.setProperty('--elsh', 20));
      const play = () => gsap.timeline({defaults: {ease: ex}})
        .from(pcs, {yPercent: 105, duration: 1.5, stagger: .045}, 0)
        .to(pcs, {'--elsh': 1, duration: 1.6, ease: 'power2.out', stagger: .045}, .15);
      const r = t.getBoundingClientRect();
      if (r.top < innerHeight) tl.add(play(), .3);
      else ScrollTrigger.create({trigger: t, start: 'top 90%', once: true, onEnter: play});
      /* liquidPixels hover: melt then elastic settle */
      qa('.char', t).forEach(c => c.addEventListener('pointerenter', () => {
        const p = c.firstElementChild;
        gsap.timeline({overwrite: true}).to(p, {'--melt': 19, duration: .5, ease: 'power2.out'})
          .to(p, {'--melt': 0, duration: 1.4, ease: 'elastic.out(1,.4)'}, '+=.5');
      }));
    });
  });
})();

/* "Listen to what I like": nav pill plays a small playlist through a hidden YouTube player.
   Silent until clicked; the on/off choice, track and position are remembered (localStorage).
   While it plays, internal links open in a full-screen frame over this page, so the player here never unloads
   and the music runs on uninterrupted. Pages inside the frame drive this player through window.SNMusic. */
(function(){
  const btn = document.querySelector('.nav__music'); if (!btn) return;
  const lab = btn.querySelector('.nav__music-l');
  const SONGS = [
    ['20Ov0cDPZy8', "Free Fallin'", 'John Mayer'],
    ['IjcE8SxupX8', 'Taaj', 'Lost Stories'],
    ['KQetemT1sWc', 'Here Comes the Sun', 'The Beatles'],
    ['2IE3T9mcqyM', 'Prey', 'The Neighbourhood'],
    ['zvCBSSwgtg4', 'Ho Hey', 'The Lumineers']
  ];
  let host = null; try { if (parent !== window && parent.SNMusic) host = parent.SNMusic; } catch (e) {}
  const M = host || (window.SNMusic = engine());

  function engine(){
    const KEY = 'sn-music'; let st = {}; try { st = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
    const m = {i: (st.i | 0) % SONGS.length, on: false}, subs = new Set();
    let player = null, ready = null, fails = 0;
    const emit = () => subs.forEach(f => { try { f(m); } catch (e) { subs.delete(f); } });
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify({i: m.i, on: m.on, t: player && player.getCurrentTime ? player.getCurrentTime() : 0})); } catch (e) {} };
    const load = () => ready || (ready = new Promise(res => {
      const box = document.createElement('div');
      box.style.cssText = 'position:fixed;left:0;bottom:0;width:2px;height:2px;opacity:0;pointer-events:none;overflow:hidden;z-index:-1';
      box.innerHTML = '<div id="sn-yt"></div>'; document.body.appendChild(box);
      const make = () => { player = new YT.Player('sn-yt', {width: 2, height: 2, videoId: SONGS[m.i][0],
        playerVars: {autoplay: 0, controls: 0, disablekb: 1, playsinline: 1, rel: 0, start: Math.floor(st.t || 0)},
        events: {onReady: () => res(player),
          onStateChange: e => { if (e.data === 1) { fails = 0; if (!m.on) { m.on = true; emit(); save(); } } if (e.data === 0) m.next(); },
          onError: () => { if (++fails < SONGS.length) m.next(); else { m.on = false; emit(); } }}}); };
      if (window.YT && YT.Player) make();
      else { const prev = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = () => { prev && prev(); make(); };
        const sc = document.createElement('script'); sc.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(sc); }
    }));
    const start = p => { p.unMute(); p.setVolume(70); p.playVideo(); };
    m.sub = f => { subs.add(f); f(m); return () => subs.delete(f); };
    m.play = () => { m.on = true; emit(); save(); load().then(start); };
    m.pause = () => { m.on = false; emit(); save(); if (player && player.pauseVideo) player.pauseVideo(); };
    m.pick = k => { m.i = k; st.t = 0; m.on = true; emit(); save();
      load().then(p => { p.unMute(); p.setVolume(70); p.loadVideoById(SONGS[k][0]); }); };
    m.next = () => { m.i = (m.i + 1) % SONGS.length; st.t = 0; if (player) player.loadVideoById(SONGS[m.i][0]); emit(); save(); };
    addEventListener('pagehide', save);
    /* it was on last time: carry on. Browsers that hold sound until a tap get it back on the first tap or key press. */
    if (st.on) {
      m.on = true;
      const evs = ['pointerdown', 'keydown'], off = () => evs.forEach(t => removeEventListener(t, kick, true));
      function kick(e){ off(); if (!(e.target.closest && e.target.closest('.music'))) m.play(); }
      load().then(p => { start(p); setTimeout(() => { if (p.getPlayerState && p.getPlayerState() !== 1) {
        m.on = false; emit(); evs.forEach(t => addEventListener(t, kick, true)); } }, 2500); });
    }
    return m;
  }

  /* host page only: while music is on, internal links open in the frame instead of reloading this page */
  if (!host) {
    let frame = null, title0 = document.title;
    const internal = u => u.origin === location.origin && /(\.html|\/)$/.test(u.pathname);
    const close = () => { if (!frame) return; frame.remove(); frame = null; document.title = title0;
      document.documentElement.classList.remove('sn-framed'); gsap.ticker.wake(); if (SN.lenis) SN.lenis.start(); };
    const open = url => {
      if (frame) { frame.src = url; return; }
      frame = document.createElement('iframe'); frame.className = 'sn-frame'; frame.title = 'Samarth Nayyar';
      frame.src = url; document.body.appendChild(frame);
      history.pushState({sn: 1}, '', url);
      frame.addEventListener('load', () => {
        try { const w = frame.contentWindow; history.replaceState({sn: 1}, '', w.location.href); document.title = w.document.title; } catch (e) {}
        if (!frame.classList.contains('is-in')) { frame.classList.add('is-in');
          document.documentElement.classList.add('sn-framed'); if (SN.lenis) SN.lenis.stop(); setTimeout(() => gsap.ticker.sleep(), 500); }
      });
    };
    SN.go = url => { const u = new URL(url, location.href); if (M.on && internal(u)) open(u.href); else location.href = u.href; };
    document.addEventListener('click', e => {
      if (!M.on || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest('a[href]'); if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const u = new URL(a.href, location.href); if (!internal(u)) return;
      e.preventDefault(); open(u.href);
    });
    /* back past the first framed page returns to this one */
    addEventListener('popstate', e => { if (frame && !(e.state && e.state.sn)) close(); });
  } else {
    /* inside the frame: links that leave the site take the whole window with them */
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]'); if (!a || e.defaultPrevented || (a.target && a.target !== '_self')) return;
      const u = new URL(a.href, location.href); if (u.origin === location.origin) return;
      e.preventDefault(); top.location.href = u.href;
    });
  }

  /* ui: pill toggles play; hovering (or a tap on touch screens) shows the playlist */
  const wrap = document.createElement('div'); wrap.className = 'music';
  btn.replaceWith(wrap); wrap.append(btn);
  const list = document.createElement('ul'); list.className = 'music__list'; list.setAttribute('aria-label', 'Songs');
  list.innerHTML = SONGS.map((s, k) => `<li><button type="button" data-k="${k}"><span class="music__n">${String(k + 1).padStart(2, '0')}</span><span class="music__s"><b>${s[1]}</b><small>${s[2]}</small></span><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span></button></li>`).join('');
  wrap.append(list);
  const touch = !matchMedia('(hover:hover)').matches;
  const setOpen = v => wrap.classList.toggle('is-open', v);
  btn.addEventListener('click', () => {
    if (!touch) return M.on ? M.pause() : M.play();
    if (!M.on) { M.play(); setOpen(true); } else if (!wrap.classList.contains('is-open')) setOpen(true); else { M.pause(); setOpen(false); }
  });
  list.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; const k = +b.dataset.k;
    if (k === M.i && M.on) M.pause(); else M.pick(k); if (touch) setTimeout(() => setOpen(false), 450); });
  document.addEventListener('pointerdown', e => { if (!wrap.contains(e.target)) setOpen(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });

  /* label swap: old text slides up and out, new text rises in */
  const say = txt => { if (lab.textContent === txt) return;
    lab.classList.add('is-out');
    setTimeout(() => { lab.textContent = txt; lab.classList.remove('is-out'); lab.classList.add('is-in');
      requestAnimationFrame(() => requestAnimationFrame(() => lab.classList.remove('is-in'))); }, 280); };
  const paint = m => { const s = SONGS[m.i];
    btn.classList.toggle('is-on', m.on); wrap.classList.toggle('is-on', m.on); btn.setAttribute('aria-pressed', m.on);
    say(m.on ? `${s[1]} · ${s[2]}` : 'Listen to what I like');
    btn.setAttribute('aria-label', m.on ? `Pause music: ${s[1]} by ${s[2]}` : 'Listen to what I like (plays music)');
    list.querySelectorAll('[data-k]').forEach(b => b.classList.toggle('is-cur', +b.dataset.k === m.i)); };
  const unsub = M.sub(paint);
  addEventListener('pagehide', unsub);
})();
