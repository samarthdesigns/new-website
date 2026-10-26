/* case studies — mecha.xyz motion: preloader counter, line masks, lineEase hairlines,
   bi-mask image reveal, dynamic section nav w/ scrubbed progress, menuEase page transition,
   hover-reveal text, custom cursor, footer revealed underneath. */
(() => {
  const {RM, fine} = window.SN || {};
  const q = (s, r = document) => r.querySelector(s), qa = (s, r = document) => [...r.querySelectorAll(s)];
  const lenis = window.SN && SN.lenis;
  CustomEase.create('menuEase', 'M0,0 C0.82,0 0.18,1 1,1');
  CustomEase.create('lineEase', '0.9, 0.01, 0.19, 1');
  const DUR = 2.0;

  const pre = q('.preloader'), overlay = q('.pt-overlay'), wrap = q('.mwrap');
  const first = !sessionStorage.getItem('sn-cs-seen');
  sessionStorage.setItem('sn-cs-seen', '1');

  if (RM) { if (pre) pre.remove(); qa('.bi-mask').forEach(m => m.remove()); return; }

  /* ---- line masks (clip-path inset(0 0 -0.3em 0), yPercent 150 → 0) */
  function maskLines(el) {
    const split = new SplitText(el, {type: 'lines', linesClass: 'line-m'});
    const inner = split.lines.map(l => { const s = document.createElement('span'); s.innerHTML = l.innerHTML; l.innerHTML = ''; l.appendChild(s); return s; });
    gsap.set(inner, {yPercent: 150});
    return inner;
  }

  /* ---- reveal-hover-text */
  qa('.ni, .bx, .mbtn').forEach(el => {
    const it = qa('.rh > span', el); if (it.length < 2) return;
    el.addEventListener('mouseenter', () => { gsap.killTweensOf(it); gsap.to(it, {yPercent: -100, duration: .45, ease: 'power2.inOut', stagger: .1}); });
    el.addEventListener('mouseleave', () => { gsap.killTweensOf(it); gsap.to(it, {yPercent: 0, duration: .45, ease: 'power2.inOut', stagger: {each: .1, from: 'end'}}); });
  });

  /* ---- custom cursor */
  const cur = q('.cur');
  if (cur && fine) {
    const x = gsap.quickTo(cur, 'x', {duration: .25, ease: 'power3'}), y = gsap.quickTo(cur, 'y', {duration: .25, ease: 'power3'});
    addEventListener('pointermove', e => { x(e.clientX); y(e.clientY); cur.classList.add('on'); });
    document.addEventListener('mouseover', e => {
      cur.classList.toggle('is-img', !!e.target.closest('[data-cursor]'));
      cur.classList.toggle('is-link', !e.target.closest('[data-cursor]') && !!e.target.closest('a,button'));
    });
  }

  /* ---- page transition: overlay rises with menuEase, page pushed up 200 */
  document.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a) return;
    const href = a.getAttribute('href') || '';
    if (a.target === '_blank' || href.startsWith('#') || href.startsWith('mailto:') || a.hostname !== location.hostname || e.metaKey || e.ctrlKey) return;
    e.preventDefault(); lenis && lenis.stop();
    gsap.set(overlay, {y: '100%'});
    gsap.to(overlay, {y: 0, duration: .9, ease: 'menuEase', delay: .15, onComplete: () => gsap.delayedCall(.3, () => location.href = a.href)});
    gsap.to([wrap, '.cs-bar'], {y: -200, duration: 1.2, ease: 'menuEase'});
  });
  addEventListener('pageshow', e => { if (e.persisted) { gsap.set(overlay, {y: '100%'}); gsap.set([wrap, '.cs-bar'], {y: 0}); lenis && lenis.start(); } });

  /* ---- preloader: counter + bar (full on first visit, short slide otherwise) */
  const heads = qa('[data-lines-in]').map(maskLines).flat();
  const intro = () => {
    gsap.to(heads, {yPercent: 0, duration: DUR, ease: 'expo.out', stagger: .1});
    gsap.from('.wm span, .bx', {yPercent: 120, duration: 1, ease: 'expo.out', stagger: .05});
    gsap.from('.mhead .rule, .ni, .oi, .mindex .hd', {scaleX: 0, transformOrigin: 'left', duration: 1.2, ease: 'lineEase', stagger: .03, delay: .2,
      onComplete() { gsap.set(this.targets(), {clearProps: 'transform'}); }});
    gsap.from('.fab', {yPercent: 140, duration: 1.2, ease: 'expo.out', delay: .4});
    gsap.from('.mintro > *, .mtables', {y: 30, autoAlpha: 0, duration: 1.4, ease: 'expo.out', stagger: .08, delay: .3});
  };
  if (pre) {
    lenis && lenis.stop();
    const n = q('.pl-n'), fill = q('.pl-bar i'), c = {v: 0};
    const tl = gsap.timeline({onComplete: () => { pre.remove(); lenis && lenis.start(); }});
    if (first) {
      tl.to(c, {v: 100, duration: 1.6, ease: 'power2.inOut', onUpdate: () => n.textContent = Math.round(c.v)})
        .to(fill, {width: '100%', duration: 1.6, ease: 'power2.inOut'}, 0)
        .to('.pl-counter, .pl-bar', {yPercent: -60, autoAlpha: 0, duration: .5, ease: 'power2.in'});
    } else gsap.set('.pl-counter, .pl-bar', {display: 'none'});
    tl.to(pre, {yPercent: -100, duration: .9, ease: 'menuEase'})
      .from(wrap, {y: 200, duration: 1.2, ease: 'menuEase'}, '<')
      .add(intro, '<.2');
  } else intro();

  SN.fontsReady.then(() => {
    /* body line reveals — reversible on leave-back (mecha) */
    qa('[data-lines]').forEach(el => {
      const lines = maskLines(el);
      ScrollTrigger.create({trigger: el, start: 'top 90%',
        onEnter: () => gsap.to(lines, {yPercent: 0, duration: DUR, ease: 'expo.out', stagger: .1, overwrite: true}),
        onLeaveBack: () => gsap.to(lines, {yPercent: 150, duration: DUR * .6, ease: 'power2.inOut', overwrite: true})});
    });
    /* hairlines draw with lineEase */
    qa('[data-line]').forEach(el => {
      const pseudo = el.classList.contains('rule') ? el : null;
      if (pseudo) gsap.set(el, {scaleX: 0});
      ScrollTrigger.create({trigger: el, start: 'top 92%', once: true, onEnter: () => {
        if (pseudo) gsap.to(el, {scaleX: 1, duration: 1.2, ease: 'lineEase'});
        else gsap.fromTo(el, {'--x': 0}, {'--x': 1, duration: 1.2, ease: 'lineEase'});
        el.classList.add('is-drawn');
      }});
    });
    /* bi-mask: height 100% → 0, power2.inOut 1.2s; image settles scale 1.12 → 1 */
    qa('.mfig').forEach(f => {
      const m = q('.bi-mask', f), img = q('img', f);
      gsap.timeline({scrollTrigger: {trigger: f, start: 'top 85%', once: true}})
        .to(m, {height: '0%', duration: 1.2, ease: 'power2.inOut'})
        .to(img, {scale: 1, duration: 1.8, ease: 'expo.out'}, '<.1');
    });

    /* dynamic section nav: active item + scrubbed width progress between ±½ viewport */
    const items = qa('.ni[data-sec]'), main = q('.ni.main');
    const setActive = it => { items.forEach(i => i.classList.remove('item-active')); it.classList.add('item-active'); };
    items.forEach(it => {
      const sec = document.getElementById(it.dataset.sec), bar = q('.prog', it); if (!sec) return;
      const st = {trigger: sec, start: 'top 50%', end: 'bottom 50%', invalidateOnRefresh: true};
      gsap.fromTo(bar, {width: '0%'}, {width: '100%', ease: 'none', scrollTrigger: {...st, scrub: true, onLeave: () => gsap.set(bar, {width: '0%'})}});
      ScrollTrigger.create({...st, onEnter: () => setActive(it), onEnterBack: () => setActive(it)});
    });
    if (main) gsap.fromTo(q('.prog', main), {width: '0%'}, {width: '100%', ease: 'none', scrollTrigger: {trigger: '.mmain', start: 'top top', end: 'bottom bottom', scrub: true}});

    /* iso art fades out as the index docks (mecha) */
    const iso = q('.iso');
    if (iso) gsap.to(iso, {autoAlpha: 0, height: 60, paddingTop: 60, ease: 'none', scrollTrigger: {trigger: '.mmain', start: 'top top', end: '+=400', scrub: true}});

    /* footer revealed underneath + its contents rise */
    const foot = q('.mfoot');
    if (foot) {
      gsap.from('.mfoot-logo', {yPercent: 60, ease: 'none', scrollTrigger: {trigger: '.mwrap', start: 'bottom bottom', end: 'bottom top', scrub: true}});
    }
    ScrollTrigger.refresh();
  });
})();
