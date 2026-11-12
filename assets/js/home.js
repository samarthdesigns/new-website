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
    tl.from(pcs, {yPercent: 105, duration: 1.5, stagger: .045}, .3)
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
        const k = s.x.toFixed(2); if (k !== s.lk) { s.lk = k; s.c.parentElement.style.transform = `skewX(${k}deg)`; }
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

/* hero title swap: "Product Designer" ⇄ "Design Engineer" in the pixel font.
   Each title brings its own pixel pets that walk the x-height line, hopping tall letters and the word gap.
   Product Designer: Figma, Sketch, Illustrator, Framer. Design Engineer: Claude, GPT, Grok. */
(function(){
  const {RM, q, qa} = SN;
  const nm = q('[data-title-swap]'), layer = q('.pets'); if (!nm || !layer) return;
  const lines = qa('.tline', nm);
  const EVERY = 7000;

  /* pixel sprites: one letter per pixel, '.' empty; last two rows are the two leg frames */
  const SPR = {
    figma: {c: {R:'#F24E1E', O:'#FF7262', P:'#A259FF', B:'#1ABCFE', G:'#0ACF83', K:'#1d1d1f'}, rows: [
      '.RRRROOOO.','RRRRROOOOO','RRRRROOOOO','.RRRROOOO.','.PPPP.BBB.','PPPPPBBBBB','PPPPPBKBKB','PPPPPBBBBB','.PPPP.BBB.',
      '.GGGG.....','GGGGG.....','.GGG......'], legs: ['.K.....K..', '..K...K...']},
    sketch: {c: {L:'#FFE38A', Y:'#FDB300', O:'#EA6C00', K:'#3a2200'}, rows: [
      '..LLLLLLLL..','.LYYLLLLYYL.','OOOOOOOOOOOO','.OYKYYYYKYO.','..OYYYYYYO..','...OYYYYO...','....OYYO....','.....OO.....'],
      legs: ['....K..K....', '...K....K...']},
    illustrator: {c: {B:'#FF9A00', D:'#330000', K:'#330000'}, rows: [
      '.BBBBBBBBBB.','BDDDDDDDDDDB','BDDBBDDDBDDB','BDBDDBDDDDDB','BDBBBBDDBDDB','BDBDDBDDBDDB','BDBDDBDDBDDB','BDDDDDDDDDDB','.BBBBBBBBBB.'],
      legs: ['..K.....K...', '...K...K....']},
    framer: {c: {K:'#111111', W:'#ffffff'}, rows: [
      'KKKKKKKK','.KKKKKKK','..KKKKKK','...KKKKK','KKKKK...','KWKKWK..','KKKKKKK.','KKKKKKKK','KKKK....','KKK.....','KK......'],
      legs: ['K..K....', '.K..K...']},
    claude: {c: {C:'#D97757', K:'#1d1d1f'}, rows: [
      '..CCCCCCCC..','..CCCCCCCC..','..CKCCCCKC..','CCCKCCCCKCCC','CCCCCCCCCCCC','..CCCCCCCC..','..CCCCCCCC..'],
      legs: ['..C.C..C.C..', '...C.C..C.C.']},
    gpt: {c: {T:'#10A37F', W:'#ffffff', K:'#0b3d30'}, rows: [
      '.....TT.....','......T.....','..TTTTTTTT..','.TTTTTTTTTT.','.TWWWWWWWWT.','.TWKWWWWKWT.','.TWWWWWWWWT.','.TTTTTTTTTT.','..TTTTTTTT..'],
      legs: ['...T....T...', '....T..T....']},
    grok: {c: {K:'#111111', W:'#ffffff'}, rows: [
      '...KKKKKK...','..KKKKKKKW..','.KKKKKKKWKK.','.KWKKWKWKKK.','.KKKKKWKKKK.','.KKKKWKKKKK.','..KKWKKKKK..','..WKKKKKK...'],
      legs: ['...K....K...', '....K..K....']}
  };
  const SETS = {pd: ['figma', 'sketch', 'illustrator', 'framer'], de: ['claude', 'gpt', 'grok']};
  const rects = (rows, c, y0) => rows.map((r, y) => [...r].map((ch, x) => ch === '.' ? '' :
    `<rect x="${x}" y="${y + y0}" width="1.02" height="1.02" fill="${c[ch]}"/>`).join('')).join('');
  const makePet = name => {
    const s = SPR[name], w = s.rows[0].length, h = s.rows.length + 1;
    const el = document.createElement('div'); el.className = 'pet'; el.dataset.pet = name;
    el.innerHTML = `<div class="pet__in"><svg viewBox="0 0 ${w} ${h}"><g class="bd">${rects(s.rows, s.c, 0)}</g>` +
      `<g class="f1">${rects([s.legs[0]], s.c, h - 1)}</g><g class="f2">${rects([s.legs[1]], s.c, h - 1)}</g></svg></div>`;
    const say = document.createElement('span'); say.className = 'pet__say'; el.appendChild(say);
    layer.appendChild(el); const pet = {el, inn: el.firstElementChild, svg: el.querySelector('svg'), say, ar: w / h, flipText: name !== 'illustrator', d: 0, spd: 0, rot: 0, st: 1, fc: 1};
    el.addEventListener('pointerenter', () => annoy(pet)); el.addEventListener('pointerleave', () => calm(pet));
    return pet;
  };
  const sets = {}; lines.forEach(l => sets[l.dataset.set] = {line: l, pets: SETS[l.dataset.set].map(makePet), path: null, t0: 0});

  /* walk path for one title: ground = x-height line; arcs over letters taller than x-height and over spaces */
  const cv = document.createElement('canvas').getContext('2d');
  const build = set => {
    const fs = parseFloat(getComputedStyle(nm).fontSize); if (!fs) return null;
    cv.font = `400 ${fs}px "Geist Pixel"`;
    const m = cv.measureText('x'), xH = m.actualBoundingBoxAscent, fA = m.fontBoundingBoxAscent, fD = m.fontBoundingBoxDescent;
    const rr = layer.getBoundingClientRect(), kids = [...set.line.children];
    const ph = Math.max(14, fs * .22);
    let ground = 0; const obs = []; let start = null, end = 0;
    kids.forEach((k, i) => {
      const r = k.getBoundingClientRect(), x = r.left - rr.left;
      if (k.classList.contains('sp')) { obs.push({a: x - fs * .05, b: x + r.width + fs * .05, h: 0}); return; }
      const ch = k.textContent, mm = cv.measureText(ch);
      const il = x + (r.width - mm.width) / 2 - mm.actualBoundingBoxLeft, ir = x + (r.width - mm.width) / 2 + mm.actualBoundingBoxRight;
      ground = r.top - rr.top + (fs - (fA + fD)) / 2 + fA - xH;
      if (i === 0) { start = ir + fs * .12; return; }
      end = ir;
      const tall = mm.actualBoundingBoxAscent - xH;
      if (tall > fs * .03) obs.push({a: il, b: ir, h: tall});
    });
    /* merge obstacles with no room to land between them */
    const arcs = [];
    obs.sort((p, q) => p.a - q.a).forEach(o => {
      const a = o.a - fs * .1, b = o.b + fs * .1, last = arcs[arcs.length - 1];
      if (last && a - last.b < ph * .9) { last.b = b; last.parts.push(o); } else arcs.push({a, b, parts: [o]});
    });
    arcs.forEach(c => { let H = fs * .22;
      c.parts.forEach(o => [o.a, o.b].forEach(x => { const u = Math.min(.5, Math.max(.06, (x - c.a) / (c.b - c.a)));
        H = Math.max(H, (o.h + fs * .05) / (4 * u * (1 - u))); }));
      c.H = Math.min(H, fs * .75); });
    return {fs, ph, ground, x0: start, x1: end, arcs};
  };
  const yAt = (P, x) => { for (const c of P.arcs) if (x > c.a && x < c.b) { const u = (x - c.a) / (c.b - c.a); return P.ground - c.H * 4 * u * (1 - u); } return P.ground; };

  const size = set => { const P = set.path; set.pets.forEach(p => { p.h = P.ph; p.w = P.ph * p.ar;
    p.el.style.width = p.w + 'px'; p.el.style.height = p.h + 'px'; }); };
  /* frame-rate independent easing toward a target */
  const ease = (v, to, k, dt) => v + (to - v) * (1 - Math.exp(-k * dt));
  /* back-and-forth walk with rounded turns: speed eases to 0 at each end and back, no instant reversal */
  const walk = (m, L, e) => {
    const T = 2 * L; m = ((m % T) + T) % T;
    if (Math.abs(m - L) < e) { const a = m - L; return [L - e / 2 - a * a / (2 * e), -a / e]; }
    if (m < e || m > T - e) { const a = m < e ? m : m - T; return [e / 2 + a * a / (2 * e), a / e]; }
    return m <= L ? [m, 1] : [T - m, -1];
  };
  const SPEED = 1.1; /* in font-sizes per second */
  /* each pet carries its own distance d (in font-sizes) and a speed that eases between 0 and 1,
     so starting, stopping, hanging in the air when poked and turning around all ramp instead of snapping */
  const place = (set, dt) => {
    const P = set.path; if (!P) return; const live = !RM && now() >= set.t0;
    set.pets.forEach(p => {
      p.spd = RM ? 0 : ease(p.spd, live && !p.mad ? 1 : 0, p.mad ? 9 : 4, dt);
      p.d += dt * SPEED * p.spd;
      const lo = P.x0 + p.w / 2, hi = P.x1 - p.w / 2, e = Math.min(P.fs * .5, (hi - lo) * .2), L = Math.max(1, hi - lo + e);
      const [u, v] = walk(p.d * P.fs, L, e), x = lo - e / 2 + u, y = yAt(P, x);
      const air = y < P.ground - .5, vel = v * p.spd, dir = v >= 0 ? 1 : -1;
      const vy = dt > 0 && p.py != null ? (y - p.py) / dt : 0; p.py = y;
      const slope = (yAt(P, x + 1) - yAt(P, x - 1)) / 2 * dir;
      p.rot = ease(p.rot, air ? Math.max(-20, Math.min(20, Math.atan(slope) * 57.3 * .5 * p.spd)) : 0, 14, dt);
      p.st = ease(p.st, air ? 1 + Math.min(.12, Math.abs(vy) / (P.fs * 7)) : 1, 16, dt);
      p.fc = RM ? dir : ease(p.fc, dir, 14, dt);
      p.el.style.transform = `translate3d(${(x - p.w / 2).toFixed(2)}px,${(y - p.h).toFixed(2)}px,0) rotate(${p.rot.toFixed(2)}deg) scale(${(2 - p.st).toFixed(3)},${p.st.toFixed(3)})`;
      p.svg.style.transform = `scaleX(${(p.flipText ? p.fc : Math.abs(p.fc)).toFixed(3)})`;
      p.el.classList.toggle('is-run', !air && Math.abs(vel) > .3);
      if (p.air && !air && p.spd > .3) gsap.fromTo(p.inn, {scaleX: 1.2, scaleY: .8}, {scaleX: 1, scaleY: 1, duration: .42, ease: 'elastic.out(1,.5)', overwrite: 'auto'});
      p.air = air;
    });
  };

  /* poke a pet (on the ground or mid-jump): it hangs where it is, shakes and complains in UX speak, then eases back into its run */
  const GRUMPS = ['Give me some space!', 'Rage hover detected.', 'Not a CTA!', 'Unsolicited feedback?', 'Hover state? Rude.',
    'Accept cookies first.', 'Dark pattern alert!', 'Out of scope!', 'Flow: interrupted.', 'Ctrl+Z yourself.', 'Minimum 8px, please.',
    'Session timed out.', 'Backlog me later.', 'Too many touchpoints!', 'Unsubscribe me.', 'Press Esc, please.'];
  const BOT_GRUMPS = ['Rate limited!', 'Context window full!', 'Prompt rejected.', 'Hallucinating, brb.', 'Token budget exceeded!'];
  let lastG = '';
  const shout = p => {
    if (p.mad) return; const pool = cur === 'de' ? GRUMPS.concat(BOT_GRUMPS) : GRUMPS; let g;
    do g = pool[Math.floor(Math.random() * pool.length)]; while (g === lastG); lastG = g;
    p.mad = true; p.madT = now(); p.say.textContent = g;
    /* keep the bubble inside the window */
    const r = p.el.getBoundingClientRect(), half = p.say.offsetWidth / 2, cx = r.left + r.width / 2, vw = document.documentElement.clientWidth;
    p.say.style.marginLeft = (Math.min(0, vw - 8 - (cx + half)) + Math.max(0, 8 - (cx - half))).toFixed(0) + 'px';
    p.el.classList.add('is-mad'); clearTimeout(p.tm);
  };
  const annoy = p => { if (!p.inn.style.visibility || p.inn.style.visibility === 'hidden') return; p.hover = true; shout(p); };
  const calm = p => { p.hover = false; if (!p.mad) return; clearTimeout(p.tm);
    p.tm = setTimeout(() => { if (p.hover) return; p.el.classList.remove('is-mad'); p.mad = false; },
      Math.max(700, 1700 - (now() - p.madT) * 1000)); };
  const reset = set => { const P = set.path, n = set.pets.length;
    set.pets.forEach((p, i) => { clearTimeout(p.tm); p.mad = p.hover = false; p.el.classList.remove('is-mad');
      p.spd = 0; p.rot = 0; p.st = 1; p.fc = 1; p.py = null; p.air = false;
      const L = P ? Math.max(1, P.x1 - P.x0 - p.w) : 0;
      p.d = P ? (RM ? (L * i) / Math.max(1, n - 1) : (2 * L * i) / n + L * .08) / P.fs : 0; }); };

  let cur = 'de', on = true, raf = 0;
  const now = () => performance.now() / 1000;
  let last = 0;
  const loop = () => { raf = 0; if (!on || RM) return; const t = now(), dt = last ? Math.min(.05, t - last) : 0; last = t;
    place(sets[cur], dt); raf = requestAnimationFrame(loop); };
  const kick = () => { if (!raf && on && !RM) { last = 0; raf = requestAnimationFrame(loop); } };
  const relayout = () => Object.values(sets).forEach(s => { const had = !!s.path; s.path = build(s); if (s.path) { size(s); if (!had) reset(s); place(s, 0); } });
  new IntersectionObserver(([e]) => { on = e.isIntersecting; kick(); }).observe(nm);

  const showPets = (set, delay) => {
    reset(set);
    set.t0 = now() + delay + .75;
    if (RM) { set.pets.forEach(p => p.inn.style.visibility = 'visible'); place(set, 0); return; }
    if (!set.path) { set.pets.forEach(p => gsap.set(p.inn, {autoAlpha: 1})); return; }
    place(set, 0); const fs = set.path.fs;
    set.pets.forEach((p, i) => {
      const d = delay + i * .12;
      gsap.timeline({delay: d})
        .fromTo(p.inn, {y: -fs * 1.6, autoAlpha: 0, scaleX: .85, scaleY: 1.15}, {y: 0, autoAlpha: 1, duration: .55, ease: 'power2.in'})
        .to(p.inn, {scaleX: 1.25, scaleY: .75, duration: .08, ease: 'power1.out'})
        .to(p.inn, {scaleX: 1, scaleY: 1, duration: .45, ease: 'elastic.out(1,.45)'});
    });
  };
  const hidePets = set => { if (RM || !set.path) { set.pets.forEach(p => p.inn.style.visibility = 'hidden'); return; }
    const fs = set.path.fs;
    set.pets.forEach((p, i) => {
      p.el.classList.remove('is-run');
      gsap.timeline({delay: i * .07})
        .to(p.inn, {scaleX: 1.2, scaleY: .8, duration: .1, ease: 'power1.out'})
        .to(p.inn, {y: -fs * .28, scaleX: .9, scaleY: 1.12, duration: .26, ease: 'power2.out'})
        .to(p.inn, {y: fs * 1.3, scaleX: 1, scaleY: 1, duration: .5, ease: 'power2.in'})
        .to(p.inn, {autoAlpha: 0, duration: .2, ease: 'none'}, '-=.2');
    });
  };

  let held = false, timer = 0;
  const next = ms => { clearTimeout(timer); timer = setTimeout(swap, ms); };
  const row = nm.parentElement;
  row.addEventListener('pointerenter', () => { held = true; clearTimeout(timer); });
  row.addEventListener('pointerleave', () => { held = false; next(2500); });
  const swap = () => {
    if (held) return; next(EVERY);
    if (document.hidden) return;
    const from = sets[cur]; cur = cur === 'pd' ? 'de' : 'pd'; const to = sets[cur];
    hidePets(from);
    if (RM) { from.line.classList.remove('is-on'); to.line.classList.add('is-on'); showPets(to, 0); return; }
    const op = qa('.pc', from.line), ip = qa('.pc', to.line);
    gsap.set(ip, {yPercent: 105, '--elsh': 20}); to.line.classList.add('is-on');
    gsap.timeline()
      .to(op, {yPercent: -105, '--elsh': 20, duration: .6, ease: 'expo.in', stagger: .025}, 0)
      .add(() => from.line.classList.remove('is-on'))
      .to(ip, {yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: .04}, .35)
      .to(ip, {'--elsh': 1, duration: 1.4, ease: 'power2.out', stagger: .04}, .5);
    relayout(); showPets(to, 1.1); kick();
  };

  SN.fontsReady.then(() => requestAnimationFrame(() => {
    relayout(); showPets(sets.de, RM ? 0 : 2.2); kick();
    addEventListener('resize', () => requestAnimationFrame(relayout));
    setTimeout(relayout, 2600);
    next(EVERY);
  }));
})();

/* about photo as a screen (after jithinrp.com): grayscale, fine dot grid + scanlines, a glitch every
   few seconds (slices slip, a ghost offsets) and now and then a short burst of big pixels. WebGL; the
   plain grayscale <img> stays as the fallback. Renders only while on screen. */
(function(){
  const box = document.querySelector('[data-screen]'); if (!box) return;
  const img = box.querySelector('img');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = document.createElement('canvas'), gl = cv.getContext('webgl', {premultipliedAlpha: false, antialias: false, preserveDrawingBuffer: true});
  cv.addEventListener('webglcontextlost', () => { on = false; cancelAnimationFrame(raf); box.classList.remove('is-gl'); cv.remove(); });
  if (!gl) return;
  const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;v.y=1.-v.y;gl_Position=vec4(p,0.,1.);}';
  const FS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v;uniform sampler2D T;uniform vec2 R;uniform vec2 C;uniform float t;uniform float dpr;
  float h(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}
  vec3 tex(vec2 uv){uv=clamp(uv,0.,1.);return texture2D(T,uv*C.xy+(1.-C.xy)*vec2(.5,.3)).rgb;}
  void main(){
    vec2 uv=v;
    float gs=floor(t/3.7),gp=fract(t/3.7);
    float g=step(.3,h(vec2(gs,2.)))*smoothstep(.80,.81,gp)*(1.-smoothstep(.86,.87,gp));
    float band=floor(v.y*22.+h(vec2(gs,5.))*9.);
    uv.x+=step(.55,h(vec2(band,gs)))*(h(vec2(band,gs+3.))-.5)*.09*g;
    uv.x+=sin(v.y*46.+t*24.)*.004*g;
    float pp=fract(t/6.1),pulse=smoothstep(.50,.53,pp)*(1.-smoothstep(.58,.64,pp));
    float cell=mix(1.,22.,pulse);
    if(cell>1.5)uv=(floor(uv*R/cell)+.5)*cell/R;
    float y=dot(tex(uv),vec3(.299,.587,.114));
    y=clamp((y-.5)*1.12+.5,0.,1.);
    vec3 col=vec3(y);
    col=max(col,vec3(dot(tex(uv+vec2(.012,0.)*g),vec3(.333)))*.55*g);
    vec2 fc=gl_FragCoord.xy/dpr;
    float dm=smoothstep(.95,.35,length(fract(fc/3.)-.5)*2.);
    float sc=.88+.12*step(.5,fract(fc.y/3.));
    col*=mix(.62,1.18,dm)*sc;
    col+=(h(fc+floor(t*24.))-.5)*.05;
    col+=step(.985,h(vec2(floor(v.y*140.),floor(t*12.))))*.12*g;
    gl_FragColor=vec4(col,1.);
  }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
  const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS); if (!vs || !fs) return;
  const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n), uR = U('R'), uC = U('C'), uT = U('t'), uD = U('dpr');
  let ready = false, on = false, raf = 0, t0 = performance.now();
  const size = () => {
    const d = Math.min(devicePixelRatio || 1, 2), w = box.clientWidth, hgt = box.clientHeight;
    cv.width = Math.round(w * d); cv.height = Math.round(hgt * d); gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform2f(uR, w, hgt); gl.uniform1f(uD, d);
    /* object-fit: cover — show the part of the texture that fills the box */
    const ia = img.naturalWidth / img.naturalHeight, ba = w / hgt;
    gl.uniform2f(uC, ba < ia ? ba / ia : 1, ba < ia ? 1 : ia / ba);
  };
  const draw = now => { gl.uniform1f(uT, (now - t0) / 1000); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); if (on && !RM) raf = requestAnimationFrame(draw); };
  const start = () => {
    const tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    box.appendChild(cv); ready = true; size(); draw(performance.now());
    const px = new Uint8Array(4); let lit = 0;
    for (const [x, y] of [[.3, .3], [.5, .5], [.7, .6], [.5, .8]]) { gl.readPixels(Math.floor(cv.width * x), Math.floor(cv.height * y), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); lit += px[0] + px[1] + px[2]; }
    if (gl.getError() || !lit) { on = false; cv.remove(); return; }
    box.classList.add('is-gl');
    new ResizeObserver(() => { size(); if (!on || RM) draw(performance.now()); }).observe(box);
  };
  new IntersectionObserver(([e]) => {
    on = e.isIntersecting;
    if (on && !ready) { img.loading = 'eager'; img.complete && img.naturalWidth ? start() : img.addEventListener('load', start, {once: true}); return; }
    cancelAnimationFrame(raf); if (on && ready && !RM) raf = requestAnimationFrame(draw);
  }, {rootMargin: '200px'}).observe(box);
})();

/* hero lede: starts as "I code", backspaces and retypes "I brew" (the real text in the HTML stays "brew" for no-JS, SEO and reduced motion) */
(function(){
  const {RM, q} = SN; const el0 = q('.typo'); if (!el0 || RM) return;
  const from = el0.dataset.typo, to = el0.textContent; el0.textContent = from;
  SN.fontsReady.then(() => setTimeout(() => {
    const el = q('.typo'); el.classList.add('is-typing');
    let txt = from; const steps = [];
    for (let i = from.length; i > 0; i--) steps.push([from.slice(0, i - 1), 70]);
    steps.push(['', 260]);
    for (let i = 1; i <= to.length; i++) steps.push([to.slice(0, i), 95 + Math.random() * 60]);
    let k = 0; const tick = () => { if (k >= steps.length) { setTimeout(() => el.classList.remove('is-typing'), 900); return; }
      const [s, ms] = steps[k++]; el.textContent = s; setTimeout(tick, ms); };
    setTimeout(tick, 450);
  }, 1500));
})();
