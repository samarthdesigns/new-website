/* LANDING — jithinrp.com: intro timeline, liquid pixel name, hero kinetics, velocity marquee, hero parallax.
   Reveals, liquid heads, hairlines, lean, progress, cursor pill come from base.js. */
(function(){
  const {RM, fine, q, qa} = SN;
  if (RM) return;
  SN.fontsReady.then(() => {
    const ex = 'expo.out';
    /* fit the pixel name to the container width */
    const nm = q('.hero__name'), fit = () => { nm.style.fontSize = ''; const w = nm.parentElement.clientWidth, sw = nm.scrollWidth;
      nm.style.fontSize = Math.min(250, parseFloat(getComputedStyle(nm).fontSize) * w / sw) + 'px'; };
    fit(); addEventListener('resize', fit);
    const pcs = qa('.hero__name .pc'), chs = qa('.hero__name .char');
    pcs.forEach(c => c.style.setProperty('--elsh', 20));

    /* introTimeline */
    const tl = gsap.timeline({defaults: {ease: ex}});
    qa('[data-intro-lines]').forEach(el => {
      const s = SplitText.create(el, {type: 'lines', mask: 'lines', linesClass: 'line'});
      tl.from(s.lines, {yPercent: 110, duration: 1.3, stagger: .09}, .1);
    });
    tl.from('[data-intro-item]', {y: 14, autoAlpha: 0, duration: 1, stagger: .05}, .35)
      .from(pcs, {yPercent: 105, duration: 1.5, stagger: .045}, .3)
      .to(pcs, {'--elsh': 1, duration: 1.6, ease: 'power2.out', stagger: .045}, .45)
      .fromTo('.hero', {'--draw': 0}, {'--draw': 1, duration: 1.6, ease: 'expo.inOut'}, .6);

    /* liquidPixels: hover a letter → droplets, elastic settle */
    chs.forEach(c => c.addEventListener('pointerenter', () => {
      const p = c.firstElementChild;
      gsap.timeline({overwrite: true}).to(p, {'--melt': 19, duration: .5, ease: 'power2.out'})
        .to(p, {'--melt': 0, duration: 1.4, ease: 'elastic.out(1,.4)'}, '+=.5');
    }));

    /* heroKinetics: cursor warmth + idle ripple + scroll speed → --field; velocity spring → skewX */
    const st = pcs.map((c, i) => ({c, f: 0, x: 0, v: 0, k: Math.max(20, 70 - i * 4)}));
    let mx = -1e4, my = -1e4, time = 0;
    if (fine) addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, {passive: true});
    const row = q('.hero__name');
    gsap.ticker.add((t, dms) => {
      const step = Math.min(.05, dms / 1000); time += step;
      const rr = row.getBoundingClientRect(); if (rr.bottom < 0 || rr.top > innerHeight) return;
      const vel = SN.vel(), sp = Math.min(9, Math.abs(vel) * .3), a = 1 - Math.exp(-step * 9);
      const ripple = ((time % 6.5) / 1.6) * 1.5 - .25;
      const tgt = gsap.utils.clamp(-9, 9, -vel * .22);
      st.forEach(s => {
        const r = s.c.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = mx - cx, dy = (my - cy) * 1.3;
        const u = (cx - rr.left) / rr.width;
        const warm = 13 * Math.exp(-(dx * dx + dy * dy) / (2 * 170 * 170));
        const rip = 6 * Math.exp(-((u - ripple) ** 2) / (2 * .07 * .07));
        s.f += (warm + rip + sp - s.f) * a;
        s.c.style.setProperty('--field', s.f.toFixed(2));
        s.v += (s.k * (tgt - s.x) - 11 * s.v) * step; s.x += s.v * step;
        s.c.style.transform = `skewX(${s.x.toFixed(2)}deg)`;
      });
    });

    /* setupMarquee: base 70px/s + |vel|*38 (cap 1400), direction follows scroll, lean spring, --speed melts pixels */
    const track = q('.marquee__track');
    if (track) {
      let x = 0, dir = -1, speed = 70, lean = 0, lv = 0, spd = 0;
      gsap.ticker.add((t, dms) => {
        const step = Math.min(.05, dms / 1000), v = SN.vel();
        if (Math.abs(v) > .3) dir = v > 0 ? -1 : 1;
        speed += (70 + Math.min(1400, Math.abs(v) * 38) - speed) * (1 - Math.exp(-step * 5));
        x += dir * speed * step; const h = track.scrollWidth / 2; if (x <= -h) x += h; if (x > 0) x -= h;
        lv += (60 * (gsap.utils.clamp(-10, 10, -v * .25) - lean) - 10 * lv) * step; lean += lv * step;
        spd += (Math.min(19, Math.abs(v) * .45) - spd) * (1 - Math.exp(-step * 6));
        track.style.transform = `translate3d(${x.toFixed(2)}px,0,0) skewX(${lean.toFixed(2)}deg)`;
        track.style.setProperty('--speed', spd.toFixed(2));
      });
    }

    /* heroParallax: scroll depth per layer + pointer tilt */
    const layers = [['.hero__lede', .28, -12], ['.hero__meta', .12, -6], ['.hero__name-row', -.1, 16]].map(([s, k, m]) => ({el: q(s), k, m}));
    const tilt = {x: 0, y: 0}, tt = {x: 0, y: 0};
    if (fine) addEventListener('pointermove', e => { tt.x = e.clientX / innerWidth - .5; tt.y = e.clientY / innerHeight - .5; }, {passive: true});
    const hero = q('.hero');
    gsap.ticker.add(() => {
      tilt.x += (tt.x - tilt.x) * .06; tilt.y += (tt.y - tilt.y) * .06;
      const y = Math.min(scrollY, hero.offsetHeight + 200), near = Math.max(0, 1 - y / hero.offsetHeight);
      layers.forEach(l => l.el && (l.el.style.translate = `${(tilt.x * l.m * near).toFixed(2)}px ${(y * l.k + tilt.y * l.m * .6 * near).toFixed(2)}px`));
    });
  });
})();
