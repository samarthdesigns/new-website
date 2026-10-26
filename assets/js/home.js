/* LANDING — jithinrp.com: intro timeline, liquid pixel name, hero kinetics, velocity marquee, hero parallax.
   Reveals, liquid heads, hairlines, lean, progress, cursor pill come from base.js. */
(function(){
  const {RM, fine, q, qa} = SN;
  /* skills banner: fresh random order on every visit (both copies match so the loop stays seamless) */
  const mq = q('[data-shuffle]');
  if (mq) { const gs = qa('.marquee__group', mq), words = qa('span:not(.marquee__plus)', gs[0]).map(s => s.textContent);
    for (let k = words.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [words[k], words[j]] = [words[j], words[k]]; }
    gs.forEach(g => qa('span:not(.marquee__plus)', g).forEach((s, k) => s.textContent = words[k])); }
  /* past-employers carousel: CSS loop, paused while offscreen */
  const pm = q('.prow__marquee');
  if (pm) new IntersectionObserver(([e]) => pm.classList.toggle('is-off', !e.isIntersecting)).observe(pm);
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
    const row = q('.hero__name'), rowOn = SN.watch(row);
    /* letter centres relative to the row, measured once (and on resize) instead of every frame */
    let cen = [], rw = 1; const measure = () => { const rr = row.getBoundingClientRect(); rw = rr.width || 1;
      cen = pcs.map(c => { const r = c.getBoundingClientRect(); return [r.left - rr.left + r.width / 2, r.top - rr.top + r.height / 2]; }); };
    measure(); setTimeout(measure, 2600); addEventListener('resize', () => requestAnimationFrame(measure));
    gsap.ticker.add((t, dms) => {
      const step = Math.min(.05, dms / 1000); time += step;
      if (!rowOn()) return;
      const rr = row.getBoundingClientRect();
      const vel = SN.vel(), sp = Math.min(9, Math.abs(vel) * .3), a = 1 - Math.exp(-step * 9);
      const ripple = ((time % 6.5) / 1.6) * 1.5 - .25;
      const tgt = gsap.utils.clamp(-9, 9, -vel * .22);
      st.forEach((s, i) => {
        const cx = rr.left + cen[i][0], cy = rr.top + cen[i][1];
        const dx = mx - cx, dy = (my - cy) * 1.3;
        const u = cen[i][0] / rw;
        const warm = 13 * Math.exp(-(dx * dx + dy * dy) / (2 * 170 * 170));
        const rip = 6 * Math.exp(-((u - ripple) ** 2) / (2 * .07 * .07));
        s.f += (warm + rip + sp - s.f) * a;
        const f = s.f.toFixed(1); if (f !== s.lf) { s.lf = f; s.c.style.setProperty('--field', f); }
        s.v += (s.k * (tgt - s.x) - 11 * s.v) * step; s.x += s.v * step;
        const k = s.x.toFixed(2); if (k !== s.lk) { s.lk = k; s.c.style.transform = `skewX(${k}deg)`; }
      });
    });

    /* setupMarquee: base 70px/s + |vel|*38 (cap 1400), direction follows scroll, lean spring, --speed melts pixels */
    const track = q('.marquee__track');
    if (track) {
      let x = 0, dir = -1, speed = 70, lean = 0, lv = 0, spd = 0, ls = '', hw = track.scrollWidth / 2;
      const on = SN.watch(track); addEventListener('resize', () => hw = track.scrollWidth / 2);
      gsap.ticker.add((t, dms) => {
        if (!on()) return;
        const step = Math.min(.05, dms / 1000), v = SN.vel();
        if (Math.abs(v) > .3) dir = v > 0 ? -1 : 1;
        speed += (70 + Math.min(1400, Math.abs(v) * 38) - speed) * (1 - Math.exp(-step * 5));
        x += dir * speed * step; const h = hw; if (x <= -h) x += h; if (x > 0) x -= h;
        lv += (60 * (gsap.utils.clamp(-10, 10, -v * .25) - lean) - 10 * lv) * step; lean += lv * step;
        spd += (Math.min(19, Math.abs(v) * .45) - spd) * (1 - Math.exp(-step * 6));
        track.style.transform = `translate3d(${x.toFixed(2)}px,0,0) skewX(${lean.toFixed(2)}deg)`;
        const sv = spd.toFixed(1); if (sv !== ls) { ls = sv; track.style.setProperty('--speed', sv); }
      });
    }

    /* heroParallax: scroll depth per layer + pointer tilt */
    const layers = [['.hero__lede', .28, -12], ['.hero__meta', .12, -6], ['.hero__name-row', -.1, 16]].map(([s, k, m]) => ({el: q(s), k, m}));
    const tilt = {x: 0, y: 0}, tt = {x: 0, y: 0};
    if (fine) addEventListener('pointermove', e => { tt.x = e.clientX / innerWidth - .5; tt.y = e.clientY / innerHeight - .5; }, {passive: true});
    const hero = q('.hero'), heroOn = SN.watch(hero);
    let hh = hero.offsetHeight; addEventListener('resize', () => hh = hero.offsetHeight);
    gsap.ticker.add((t, dms) => {
      if (!heroOn()) return;
      const a = 1 - Math.exp(-Math.min(.05, dms / 1000) * 3.7); /* frame-rate independent: same feel at 60 or 120hz */
      tilt.x += (tt.x - tilt.x) * a; tilt.y += (tt.y - tilt.y) * a;
      const y = Math.min(scrollY, hh + 200), near = Math.max(0, 1 - y / hh);
      layers.forEach(l => l.el && (l.el.style.translate = `${(tilt.x * l.m * near).toFixed(2)}px ${(y * l.k + tilt.y * l.m * .6 * near).toFixed(2)}px`));
    });
  });
})();
