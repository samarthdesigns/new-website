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
  qa('[data-local-time]').forEach(el => { const t = () => el.textContent = new Date().toLocaleTimeString([], {hour:'numeric', minute:'2-digit'}); t(); setInterval(t, 30000); });

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
        const tl = gsap.timeline({paused: true}).fromTo(s.lines,
          {autoAlpha: 0, yPercent: 35, scaleY: 1.25, filter: 'blur(12px)'},
          {autoAlpha: 1, yPercent: 0, scaleY: 1, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out', stagger: .12});
        const melt = up => gsap.to(s.lines, {autoAlpha: 0, yPercent: up ? -30 : 30, scaleY: 1.2, filter: 'blur(10px)', duration: .55, ease: 'power2.in', stagger: .06, overwrite: true});
        const st = ScrollTrigger.create({trigger: h, start: 'top 92%', end: 'bottom 8%',
          onEnter: () => tl.restart(), onEnterBack: () => tl.restart(), onLeave: () => melt(true), onLeaveBack: () => melt(false)});
        gsap.set(s.lines, {autoAlpha: 0});
        return st;
      }});
    });

    /* hairlines draw: horizontal bands (bottom 95%), vertical dividers (top 90%) */
    qa('.band,.hero,.about,[data-draw-h]').forEach(el => gsap.fromTo(el, {'--draw': 0}, {'--draw': 1, duration: 1.6, ease: 'expo.inOut',
      scrollTrigger: {trigger: el, start: 'bottom 95%', once: true}}));
    qa('.vrule,.pillar+.pillar,.place+.place,.work__mid,[data-draw-v]').forEach(el => gsap.fromTo(el, {'--draw': 0}, {'--draw': 1, duration: 1.4, ease: 'expo.inOut',
      scrollTrigger: {trigger: el, start: 'top 90%', once: true}}));

    /* scroll lean: skewY ±3.2 from velocity, spring 55/10 */
    const lean = qa('[data-lean]');
    if (lean.length) { let y = 0, v = 0;
      gsap.ticker.add((t, dms) => { const dt = Math.min(.05, dms / 1000), tg = gsap.utils.clamp(-3.2, 3.2, -SN.vel() * .09);
        v += (55 * (tg - y) - 10 * v) * dt; y += v * dt; const s = `skewY(${y.toFixed(3)}deg)`; lean.forEach(el => el.style.transform = s); }); }

    /* reading progress */
    const pv = q('.progress__v'), pl = q('.progress__line i');
    if (pv) ScrollTrigger.create({start: 0, end: 'max', onUpdate: s => { pv.textContent = Math.round(s.progress * 100) + '%'; pl.style.transform = `scaleY(${s.progress})`; }});

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
    qa('[data-href]').forEach(r => r.addEventListener('click', e => { if (!e.target.closest('a')) location.href = r.dataset.href; }));
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
