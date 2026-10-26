/* LANDING — aashish hero choreography + jithin kinetics */
(function(){
  const {RM, fine} = SN;
  const q = (s, r=document) => r.querySelector(s), qa = (s, r=document) => [...r.querySelectorAll(s)];

  /* ---- aashish: project reel cycles inside the title */
  const reelImgs = qa('.reel img'); let ri = 0;
  if (reelImgs.length > 1 && !RM) setTimeout(function cycle(){
    const cur = reelImgs[ri]; ri = (ri + 1) % reelImgs.length; const nx = reelImgs[ri];
    reelImgs.forEach(i => i.classList.remove('out'));
    cur.classList.remove('on'); cur.classList.add('out');
    void nx.offsetWidth; nx.classList.add('on');
    setTimeout(cycle, 2200);
  }, 3000);

  /* ---- aashish: draggable paper cutouts with throw + pointer tilt */
  if (window.Draggable) qa('.cutout').forEach(c => {
    Draggable.create(c, {
      bounds: '.stage', inertia: false, zIndexBoost: true,
      onPress(){ c.classList.add('is-grabbed'); },
      onRelease(){ c.classList.remove('is-grabbed'); },
      onDrag(){ gsap.to(c, {rotation: gsap.utils.clamp(-18, 18, this.deltaX * 1.6), duration: .4, overwrite: 'auto'}); },
      onDragEnd(){ gsap.to(c, {rotation: 0, duration: 1.2, ease: 'elastic.out(1,.4)'}); }
    });
  });
  if (fine && !RM) {
    const stage = q('.stage');
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
      qa('.cutout .dock', stage).forEach((d, i) => gsap.to(d, {x: nx * (10 + i * 4), y: ny * (8 + i * 3), duration: 1.2, ease: 'power3.out', overwrite: 'auto'}));
    });
  }

  if (RM) { qa('[data-reveal],.wg-copy').forEach(el => el.style.opacity = 1); qa('.wg-entry').forEach(x => x.classList.add('is-visible')); qa('[data-split]').forEach(x => x.style.visibility='visible'); return; }

  SN.fontsReady.then(init);

  function init(){
    const ex = 'expo.out';

    /* ---- jithin: masked lede lines rise (yPercent 110, 1.3s, stagger .09) */
    qa('[data-split]').forEach(el => {
      el.style.visibility = 'visible';
      SplitText.create(el, {type: 'lines', mask: 'lines', linesClass: 'line', autoSplit: true, onSplit(s){
        return gsap.from(s.lines, {yPercent: 110, duration: 1.3, ease: ex, stagger: .09,
          scrollTrigger: {trigger: el, start: 'top 85%', once: true}});
      }});
    });
    /* meta items y14 + autoAlpha stagger .05 */
    qa('[data-items]').forEach(el => gsap.from(el.children, {y: 14, autoAlpha: 0, duration: 1, ease: ex, stagger: .05,
      scrollTrigger: {trigger: el, start: 'top 90%', once: true}}));

    /* ---- jithin: pixel title — chars rise while droplets (--elsh 20) settle into squares (1) */
    const pch = qa('.pch'), pc = qa('.pc');
    pc.forEach(c => c.style.setProperty('--elsh', 20));
    gsap.timeline({scrollTrigger: {trigger: '.pixel-name', start: 'top 92%', once: true}})
      .from(pc, {yPercent: 105, duration: 1.5, ease: ex, stagger: .045}, 0)
      .to(pc, {'--elsh': 1, duration: 1.8, ease: 'power2.out', stagger: .045}, .15);
    /* hover a char: melt back to droplets, then elastic settle */
    pch.forEach(c => c.addEventListener('pointerenter', () => {
      gsap.timeline().to(c, {'--melt': 19, duration: .5, ease: 'power2.out'}).to(c, {'--melt': 0, duration: 1.4, ease: 'elastic.out(1,.4)'});
    }));

    /* ---- jithin heroKinetics: cursor warmth field + idle ripple + scroll-speed, per-letter springs */
    const st = pch.map((c, i) => ({c, f: 0, sk: 0, v: 0, k: 70 - i * 4}));
    let mx = -9999, my = -9999, last = performance.now(), ripple = 0, rippleT = 0;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, {passive: true});
    gsap.ticker.add(() => {
      const now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now;
      rippleT += dt; if (rippleT > 6.5) { rippleT = 0; ripple = 0; }
      ripple += dt * 900;
      const vel = SN.vel(), sp = Math.min(8, Math.abs(vel) * .6);
      const a = 1 - Math.exp(-dt * 9);
      st.forEach((s, i) => {
        const r = s.c.getBoundingClientRect(); if (r.bottom < -50 || r.top > innerHeight + 50) return;
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const d2 = (mx - cx) ** 2 + (my - cy) ** 2;
        const warm = 13 * Math.exp(-d2 / (2 * 170 * 170));
        const rd = Math.abs(cx - ripple); const rip = rippleT < 2.2 ? 6 * Math.exp(-(rd * rd) / (2 * 90 * 90)) : 0;
        const target = warm + rip + sp;
        s.f += (target - s.f) * a;
        s.c.style.setProperty('--field', s.f.toFixed(2));
        /* damped spring skew from Lenis velocity */
        const tgt = gsap.utils.clamp(-14, 14, -vel * .9);
        const acc = s.k * (tgt - s.sk) - 10 * s.v; s.v += acc * dt; s.sk += s.v * dt;
        s.c.style.transform = `skewX(${s.sk.toFixed(2)}deg)`;
      });
    });

    /* ---- hairlines draw (expo.inOut 1.6s) */
    qa('[data-draw]').forEach(h => gsap.fromTo(h, {'--draw': 0}, {'--draw': 1, duration: 1.6, ease: 'expo.inOut',
      scrollTrigger: {trigger: h, start: 'top 95%', once: true}}));

    /* ---- jithin: liquid headings — condense from blur, melt out on leave */
    qa('.liquid').forEach(h => {
      SplitText.create(h, {type: 'lines', linesClass: 'line', autoSplit: true, onSplit(s){
        gsap.set(s.lines, {transformOrigin: '50% 100%'});
        return gsap.fromTo(s.lines, {filter: 'blur(12px)', yPercent: 35, scaleY: 1.25, autoAlpha: 0},
          {filter: 'blur(0px)', yPercent: 0, scaleY: 1, autoAlpha: 1, duration: 1.1, ease: 'power3.out', stagger: .12,
           scrollTrigger: {trigger: h, start: 'top 85%', end: 'bottom top', toggleActions: 'play reverse play reverse'}});
      }});
    });

    /* ---- scroll reveals: y40 + opacity, 1.2s expo.out, batched at top 88% */
    ScrollTrigger.batch('[data-reveal]', {start: 'top 88%', once: true,
      onEnter: b => gsap.to(b, {y: 0, opacity: 1, duration: 1.2, ease: ex, stagger: .1})});

    /* ---- aashish: work gallery pixel clear */
    qa('.wg-entry').forEach(w => ScrollTrigger.create({trigger: w, start: 'top 80%', once: true, onEnter: () => w.classList.add('is-visible')}));
    const wh = q('.wg-heading h2 span');
    if (wh) gsap.from(wh, {yPercent: 110, duration: 1.3, ease: ex, scrollTrigger: {trigger: wh, start: 'top 88%', once: true}});

    /* ---- jithin: velocity marquee (70px/s base + |vel|*38, cap 1400) with lean spring + ELSH speed */
    const track = q('.vm-track');
    if (track) {
      let x = 0, dir = -1, lean = 0, lv = 0, spd = 0; const half = () => track.scrollWidth / 2;
      gsap.ticker.add((t, dms) => {
        const dt = Math.min(.05, dms / 1000), v = SN.vel();
        if (Math.abs(v) > .4) dir = v > 0 ? -1 : 1;
        const speed = Math.min(1400, 70 + Math.abs(v) * 38);
        x += dir * speed * dt; const h = half(); if (x < -h) x += h; if (x > 0) x -= h;
        const acc = 55 * (gsap.utils.clamp(-12, 12, v * .8) - lean) - 10 * lv; lv += acc * dt; lean += lv * dt;
        spd += (Math.min(19, Math.abs(v) * 1.2) - spd) * (1 - Math.exp(-dt * 6));
        track.style.transform = `translate3d(${x}px,0,0) skewX(${(-lean).toFixed(2)}deg)`;
        track.style.setProperty('--speed', spd.toFixed(2));
      });
    }

    /* ---- jithin: scroll lean on sections (skewY ±3.2, spring 55/10) */
    const leanEls = qa('.do-grid,.wg-grid,.brands .brand-row');
    let ly = 0, lyv = 0;
    gsap.ticker.add((t, dms) => {
      const dt = Math.min(.05, dms / 1000), tgt = gsap.utils.clamp(-3.2, 3.2, SN.vel() * .12);
      const acc = 55 * (tgt - ly) - 10 * lyv; lyv += acc * dt; ly += lyv * dt;
      leanEls.forEach(el => el.style.transform = `skewY(${ly.toFixed(3)}deg)`);
    });

    /* ---- reading progress */
    const pct = q('.progress .pct'), bar = q('.progress .rail i');
    ScrollTrigger.create({start: 0, end: 'max', onUpdate: s => { pct.textContent = Math.round(s.progress * 100) + '%'; bar.style.transform = `scaleY(${s.progress})`; }});

    /* ---- hero parallax on scroll */
    gsap.to('.hero-title', {yPercent: -40, ease: 'none', scrollTrigger: {trigger: '.stage', start: 'top top', end: 'bottom top', scrub: true}});
    gsap.to('.thread', {yPercent: 18, ease: 'none', scrollTrigger: {trigger: '.stage', start: 'top top', end: 'bottom top', scrub: true}});

    /* ---- jithin: cursor pill with skew */
    const pill = q('.cursor-pill'), pl = q('span', pill);
    if (fine && pill) {
      gsap.set(pill, {xPercent: -50, yPercent: -50, scale: .6});
      const xTo = gsap.quickTo(pill, 'x', {duration: .45, ease: 'power3'}), yTo = gsap.quickTo(pill, 'y', {duration: .45, ease: 'power3'});
      let px = 0;
      addEventListener('pointermove', e => { xTo(e.clientX); yTo(e.clientY); const sk = gsap.utils.clamp(-20, 20, (e.clientX - px) * .8); px = e.clientX; gsap.to(pill, {skewX: sk, duration: .3, overwrite: 'auto'}); gsap.to(pill, {skewX: 0, duration: .6, delay: .1}); });
      qa('[data-cursor]').forEach(el => {
        el.addEventListener('pointerenter', () => { pl.textContent = el.dataset.cursor; gsap.to(pill, {opacity: 1, scale: 1, duration: .4, ease: 'back.out(2)'}); });
        el.addEventListener('pointerleave', () => gsap.to(pill, {opacity: 0, scale: .6, duration: .3}));
      });
    }
  }
})();
