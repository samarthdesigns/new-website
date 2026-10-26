/* STORY — extrafazant.nl motion: line reveals (yPercent 135, 1s expo.out, .07),
   DrawSVG squiggle on hover, proximity weight on heavy caps, image trail,
   pinned featured-stack, polaroid drift, marquee bands. */
(() => {
  const {RM, fine} = window.SN || {};
  const q = (s, r = document) => r.querySelector(s), qa = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---- draw-line squiggle: hidden until hover, draws in / out (power2.inOut .5s) */
  qa('[data-draw-line]').forEach(a => {
    const p = q('.squig path', a); if (!p) return;
    gsap.set(p, {drawSVG: '0%'});
    a.addEventListener('mouseenter', () => gsap.fromTo(p, {drawSVG: '0%'}, {drawSVG: '100%', duration: .5, ease: 'power2.inOut', overwrite: true}));
    a.addEventListener('mouseleave', () => gsap.to(p, {drawSVG: '100% 100%', duration: .5, ease: 'power2.inOut', overwrite: true}));
  });

  if (RM) { qa('[data-split]').forEach(x => x.style.visibility = 'visible'); return; }

  SN.fontsReady.then(() => {
    /* ---- text reveal: lines rise from yPercent 135 */
    qa('[data-split]').forEach(el => {
      el.style.visibility = 'visible';
      SplitText.create(el, {type: 'lines', mask: 'lines', linesClass: 'line', autoSplit: true, onSplit(s) {
        return gsap.from(s.lines, {yPercent: 135, duration: 1, ease: 'expo.out', stagger: .07,
          scrollTrigger: {trigger: el, start: 'top 85%', once: true}});
      }});
    });

    /* ---- proximity melt on pixel words (quickTo .4s, radius 400) — the landing's liquid pixels */
    if (fine) {
      const hv = qa('[data-weight-hover] .hv').flatMap(h => SplitText.create(h, {type: 'words,chars', wordsClass: 'ww', charsClass: 'wc'}).chars);
      const tos = hv.map(c => gsap.quickTo(c, '--elsh', {duration: .4, ease: 'power2.out'}));
      hv.forEach(c => c.style.setProperty('--elsh', 1));
      let mx = -1e4, my = -1e4, raf = 0;
      addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(tick); }, {passive: true});
      function tick() {
        raf = 0;
        hv.forEach((c, i) => {
          const r = c.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
          const d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
          tos[i](d < 400 ? 1 + (1 - d / 400) * 15 : 1);
        });
      }
    }

    /* ---- image trail in the hero */
    const hero = q('[data-image-trail]'), media = qa('[data-image-trail-media]');
    if (hero && fine && media.length) {
      let i = 0, lx = 0, ly = 0, z = 1;
      const spacing = () => innerWidth / 8;
      hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        const dx = x - lx, dy = y - ly;
        if (Math.hypot(dx, dy) < spacing()) return;
        lx = x; ly = y;
        const img = media[i++ % media.length], w = img.offsetWidth, h = img.offsetHeight;
        gsap.killTweensOf(img);
        gsap.set(img, {x: x - w / 2, y: y - h / 2, zIndex: z++, rotation: gsap.utils.random(-10, 10), autoAlpha: 1, scale: 1.3});
        gsap.timeline()
          .to(img, {scale: 1, duration: .6, ease: 'elastic.out(2,.6)'}, 0)
          .to(img, {x: `+=${dx * 4 * .25}`, y: `+=${dy * 4 * .25}`, duration: 1.5, ease: 'power4.out'}, 0)
          .to(img, {scale: .5, autoAlpha: 0, duration: .5, ease: 'back.in(2)'}, .9);
      });
    }

    /* ---- polaroids: drop in tilted, then drift with scroll */
    qa('.xcollage').forEach(c => {
      const pols = qa('.pol', c), st = q('.stk', c);
      gsap.from(pols, {yPercent: 30, rotation: (i) => (i % 2 ? 14 : -14), autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: .1,
        scrollTrigger: {trigger: c, start: 'top 80%', once: true}});
      if (st) gsap.from(st, {scale: 0, rotation: -90, duration: 1, ease: 'elastic.out(1.2,.5)', delay: .4,
        scrollTrigger: {trigger: c, start: 'top 80%', once: true}});
      pols.forEach((p, i) => gsap.to(p, {y: (i % 2 ? -1 : 1) * (30 + i * 12), ease: 'none',
        scrollTrigger: {trigger: c, start: 'top bottom', end: 'bottom top', scrub: true}}));
    });

    /* ---- featured stack: cards stacked in depth, front card falls away while the rest step forward */
    const mm = gsap.matchMedia();
    const stack = (desk) => () => {
      qa('[data-featured-stack]:not(.single)').forEach(sec => {
        const slides = qa('[data-featured-stack-slide]', sec), n = slides.length, pin = q('[data-featured-stack-pin]', sec);
        const dz = desk ? 120 : 60, dy = desk ? 40 : 18, fall = desk ? .9 : .6;
        slides.forEach((s, b) => gsap.set(s, {z: -b * dz, y: -b * dy, zIndex: n - b}));
        // desktop pins the stack beside the captions; mobile keeps it sticky above them (CSS)
        const tl = gsap.timeline({defaults: {ease: 'none'}, scrollTrigger: {trigger: sec, pin: desk ? pin : false, pinSpacing: false,
          start: desk ? 'top top' : 'top 102px', end: 'bottom bottom', scrub: .3, invalidateOnRefresh: true}});
        slides.forEach((s, w) => {
          if (w === n - 1) return;
          tl.to(s, {y: '+=' + innerHeight * fall, duration: 1, ease: 'power2.in'}, w)
            .to(s, {autoAlpha: 0, duration: .25}, w + .7);
          slides.slice(w + 1).forEach((o, k) => tl.to(o, {z: -k * dz, y: -k * dy, duration: 1, ease: 'power2.inOut'}, w));
        });
        tl.to({}, {duration: .6});
      });
      return () => gsap.set(qa('[data-featured-stack-slide]'), {clearProps: 'all'});
    };
    mm.add('(min-width: 992px)', stack(true));
    qa('.xcap').forEach(c => gsap.from(c.children, {y: 40, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: .08,
      scrollTrigger: {trigger: c, start: 'top 75%', once: true}}));
    qa('.xproj.single .xslide').forEach(s => gsap.from(s, {yPercent: 18, rotation: -4, autoAlpha: 0, duration: 1.4, ease: 'expo.out',
      scrollTrigger: {trigger: s, start: 'top 85%', once: true}}));

    /* ---- marquee bands: constant drift, sped + reversed by scroll velocity */
    qa('.xb-track').forEach((t, k) => {
      let x = 0, dir = k % 2 ? 1 : -1, hw = t.scrollWidth / 2; const on = SN.watch(t);
      addEventListener('resize', () => hw = t.scrollWidth / 2);
      gsap.ticker.add((_, dms) => {
        if (!on()) return;
        const dt = Math.min(.05, dms / 1000), v = SN.vel();
        if (Math.abs(v) > .4) dir = (v > 0 ? -1 : 1) * (k % 2 ? -1 : 1);
        x += dir * (60 + Math.min(900, Math.abs(v) * 30)) * dt;
        const h = hw; if (x < -h) x += h; if (x > 0) x -= h;
        t.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      });
    });

    /* ---- chapter hairlines draw like the landing bands */
    qa('.xch').forEach(el => gsap.fromTo(el, {'--draw': 0}, {'--draw': 1, duration: 1.6, ease: 'expo.inOut', scrollTrigger: {trigger: el, start: 'bottom 95%', once: true}}));

    ScrollTrigger.refresh();
  });
})();
