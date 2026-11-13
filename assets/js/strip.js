/* STRIP: an 8-bit retelling of each case study's comic strip. Pixel Samarth walks in with the pets and acts
   out every panel. Everything is drawn at native pixel size on a small canvas, then scaled up by a whole number,
   so pixels stay sharp. The whole thing is a pure function of time, so seeking and stepping are free. */
(function () {
  const INK = '#141414', BG = '#f6f6f4', PAPER = '#ffffff', GREY = '#d1d1d1', MID = '#9a9a96';
  const cl = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v, lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => k * k * (3 - 2 * k), at = (t, a, b) => t >= a && t < b;
  const rad = a => a * Math.PI / 180, dir = a => [Math.sin(rad(a)), Math.cos(rad(a))];
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  /* ---------- people ---------- */
  const HEADS = {
    me: ['..HHHHH...', '.HHHHHHHH.', 'HHHHHHHHHH', 'HHHHHHHSS.', 'HHHGGGlLG.', 'HHESSSLLS.', '.HESSSSSSS', '..SSSSSSm.', '..sSSSSS..', '...sSSS...'],
    meDown: ['..HHHHH...', '.HHHHHHHH.', 'HHHHHHHHH.', 'HHHHHHHHHH', 'HHHHHHHSS.', 'HHHGGGlLG.', 'HHESSSLLSS', '.HESSSSSm.', '..sSSSSS..', '...sSS....'],
    man: ['..HHHHH...', '.HHHHHHH..', 'HHHHHHHHH.', 'HHHHHHSSS.', 'HHHHSSSKS.', 'HHESSSSSS.', '.HESSSSSSS', '..SSSSSSm.', '..sSSSSS..', '...sSSS...'],
    woman: ['...HHHH...', 'HHHHHHHH..', 'HHHHHHHHH.', 'HHHHHHSSS.', 'HHHHSSSKS.', 'HHHSSSSSS.', 'HHHSSSSSSS', '.HHSSSSSm.', '..HsSSSS..', '...sSSS...'],
    old: ['...HHHH...', '.HHHHHHH..', 'HHHHSSSSS.', 'HHHSSSSSS.', 'HHHSSSSKS.', 'HHESSSSSS.', '.HESSSSSSS', '..SSSSMMM.', '..sSSSSS..', '...sSSS...'],
    cop: ['..CCCCCC...', '.CCCCCCCC..', '.CCCCCCCccc', 'HHHHSSSSS..', 'HHHSSSSKS..', 'HHESSSSSS..', '.HESSSSSSS.', '..SSSSMMM..', '..sSSSSS...', '...sSSS....'],
    hood: ['..TTTTTT..', '.TTTTTTTT.', 'TTTTTTTTTT', 'TTTTTssss.', 'TTTTsssKs.', 'TTTTsssss.', 'TTTTssssss', '.TTTssssm.', '..TTsss...', '...TTT....']};
  const LOOKS = {
    me: {head: 'me', hair: '#17120f', skin: '#b47a52', skinD: '#93603f', top: '#ddd4c4', topD: '#c3b8a4', band: '#fbfaf6', pocket: '#d0c6b3', pant: '#55372b', pantD: '#3f281f', shoe: '#fbfbf9', sole: '#b9b9b4'},
    suit: {head: 'man', hair: '#2a2420', skin: '#e0b48f', skinD: '#c39270', top: '#3b3f4a', topD: '#2c2f38', pant: '#2c3140', pantD: '#21252f', shoe: '#2a2220', sole: '#141414'},
    exec: {head: 'old', hair: '#9a9a9a', skin: '#d8a882', skinD: '#b98a66', top: '#2f3542', topD: '#232833', pant: '#2c3140', pantD: '#21252f', shoe: '#2a2220', sole: '#141414'},
    woman: {head: 'woman', hair: '#3a2a20', skin: '#c68e66', skinD: '#a8724f', top: '#d9a441', topD: '#bb8a30', pant: '#3b4a6b', pantD: '#2e3a55', shoe: '#7a4a3a', sole: '#4a2a20'},
    saree: {head: 'woman', hair: '#1d1612', skin: '#9c6a48', skinD: '#7f5438', top: '#d9772b', topD: '#b9601f', pant: '#d9772b', pantD: '#b9601f', shoe: '#6b3f2a', sole: '#3a2216'},
    shop: {head: 'old', hair: '#c8c8c4', skin: '#9c6a48', skinD: '#7f5438', top: '#efe4c8', topD: '#d8cba8', pant: '#d8cfba', pantD: '#bfb59d', shoe: '#6b3f2a', sole: '#3a2216'},
    cop: {head: 'cop', hair: '#1d1612', skin: '#8d5b3e', skinD: '#71462e', cap: '#5a4630', capD: '#3d2f1f', top: '#b89a5e', topD: '#9a7f48', pant: '#b89a5e', pantD: '#9a7f48', shoe: '#2a2220', sole: '#141414'},
    teen: {head: 'hood', hair: '#1d1612', skin: '#6a4a36', skinD: '#523828', top: '#3b3f4a', topD: '#2c2f38', pant: '#2c3140', pantD: '#21252f', shoe: '#c9c9c4', sole: '#8a8a86'},
    kid: {head: 'man', hair: '#1d1612', skin: '#a8724f', skinD: '#8a5a3c', top: '#6fa0d8', topD: '#5487c0', pant: '#3b4a6b', pantD: '#2e3a55', shoe: '#e9e9e6', sole: '#a4a4a0'},
    pal: {head: 'man', hair: '#1d1612', skin: '#8d5b3e', skinD: '#71462e', top: '#5f8f6a', topD: '#4b7555', pant: '#3b3f4a', pantD: '#2c2f38', shoe: '#e9e9e6', sole: '#a4a4a0'}};

  const STAND = {t: 2, ua: 5, fa: 10, ub: -4, fb: 2, tf: 3, sf: -1, tb: -4, sb: -5, ffa: 90, fba: 90, head: 'level'};
  const P = o => Object.assign({}, STAND, o);
  const POSE = {
    stand: P({}),
    cup: P({ua: 8, fa: 92, item: 'cup'}),
    sip: P({ua: 42, fa: 168, item: 'cup', t: -2}),
    phone: P({ua: 6, fa: 128, ub: 4, fb: 120, item: 'phone', head: 'down'}),
    point: P({ua: 78, fa: 92}),
    present: P({ua: 55, fa: 70, ub: -6, fb: 4}),
    write: P({ua: 112, fa: 128, item: 'marker'}),
    reach: P({ua: 72, fa: 82}),
    think: P({ua: 22, fa: 172, ub: 14, fb: 88}),
    tablet: P({ub: 18, fb: 98, item2: 'tablet', ua: 26, fa: 112, item: 'pen', head: 'down'}),
    pad: P({ub: 14, fb: 104, item2: 'pad', ua: 22, fa: 112, item: 'pen', head: 'down'}),
    cheer: P({ua: 168, fa: 176, ub: -10, fb: 4}),
    wave: P({ua: 150, fa: 196}),
    shake: P({ua: 48, fa: 78}),
    shrug: P({ua: 34, fa: 120, ub: 30, fb: 116, t: -1}),
    camera: P({ua: 58, fa: 156, ub: 50, fb: 150, item: 'camera'}),
    card: P({ua: 80, fa: 132, item: 'card'}),
    cash: P({ua: 34, fa: 104, ub: 28, fb: 98, item: 'cash', item2: 'cash'}),
    cart: P({t: 8, ua: 62, fa: 86, ub: 58, fb: 84}),
    water: P({ua: 64, fa: 92, item: 'can', t: 4}),
    snap: P({ua: 74, fa: 66}),
    type: P({sit: 13, t: 6, tf: 90, sf: 2, tb: 86, sb: -4, ffa: 92, fba: 92, ua: 16, fa: 84, ub: 12, fb: 82}),
    sitPhone: P({sit: 13, t: 4, tf: 90, sf: 2, tb: 86, sb: -4, ua: 8, fa: 132, ub: 6, fb: 124, item: 'phone', head: 'down'}),
    sit: P({sit: 13, t: 0, tf: 90, sf: 2, tb: 86, sb: -4, ua: 20, fa: 70, ub: 16, fb: 66}),
    sitTalk: P({sit: 13, t: 2, tf: 90, sf: 2, tb: 86, sb: -4, ua: 40, fa: 80, ub: 16, fb: 66}),
    relax: P({sit: 13, t: -12, tf: 84, sf: 14, tb: 80, sb: 8, ua: 160, fa: 252, ub: 166, fb: 250}),
    crouch: P({t: 26, tf: 78, sf: -24, tb: 30, sb: -78, fba: 150, ua: 42, fa: 62, ub: 20, fb: 40}),
    crouchPhone: P({t: 18, tf: 78, sf: -24, tb: 30, sb: -78, fba: 150, ua: 30, fa: 120, ub: 22, fb: 110, item: 'phone', head: 'down'}),
    kick: P({tf: 58, sf: 28, ffa: 104, ua: 40, fa: 62, ub: -34, fb: -22, t: -2}),
    guitar: P({ub: 64, fb: 96, ua: 14, fa: 70, item: 'guitar', t: 0}),
    sleepy: P({sit: 11, t: 14, tf: 88, sf: 4, tb: 84, sb: -2, ua: 30, fa: 70, ub: 14, fb: 60, head: 'down'})};
  /* a walk cycle that keeps the feet planted: phase comes from distance travelled */
  const STRIDE = 40;
  function walkPose(dist, extra) {
    const f = Math.floor((dist / STRIDE) * 10) % 10, p = f / 10 * Math.PI * 2, s = Math.sin(p), c = Math.cos(p);
    const leg = (s, c) => { const th = 22 * s; return [th, th - 6 - 44 * Math.pow(Math.max(0, c), 1.5), 90 - 22 * Math.max(0, c - .2)]; };
    const [tf, sf, ffa] = leg(s, c), [tb, sb, fba] = leg(-s, -c);
    return Object.assign(P({t: 4, tf, sf, ffa, tb, sb, fba, ua: 4 - 20 * s, fa: 18 - 20 * s + 10 * Math.max(0, -s), ub: 4 + 20 * s, fb: 18 + 20 * s + 10 * Math.max(0, s)}), extra || {});
  }
  const mix = (a, b, k) => { const o = Object.assign({}, k < .5 ? a : b);
    for (const key in STAND) if (typeof STAND[key] === 'number') o[key] = lerp(a[key] ?? STAND[key], b[key] ?? STAND[key], k);
    if (a.sit && b.sit) o.sit = lerp(a.sit, b.sit, k); return o; };
  /* keyframes: [[time, pose], ...]; eased in between, sampled at 12 fps for a hand-animated feel */
  const keys = (t, fr) => { t = Math.floor(t * 12) / 12; if (t <= fr[0][0]) return fr[0][1];
    for (let i = 1; i < fr.length; i++) if (t < fr[i][0]) return mix(fr[i - 1][1], fr[i][1], ease((t - fr[i - 1][0]) / (fr[i][0] - fr[i - 1][0])));
    return fr[fr.length - 1][1]; };
  const wig = (t, pose, key, amp, hz = 4) => Object.assign({}, pose, {[key]: pose[key] + (Math.floor(t * hz * 2) % 2 ? amp : -amp)});

  const ITEMS = {
    cup: {g: [1, 6], rows: ['..K.', '..K.', '.K..', 'cccc', 'cMMc', 'cMMc', 'cpCc', 'cCCc', '.CC.'], pal: {c: '#e3edf0', M: '#efe4d0', C: '#8b5a34', p: '#e38f9f', K: INK}},
    phone: {g: [0, 2], rows: ['KK', 'KZ', 'KZ', 'KK'], pal: {K: '#2a2a2a', Z: '#8fd0ff'}},
    tablet: {g: [1, 3], rows: ['KK', 'KZ', 'KZ', 'KZ', 'KZ', 'KK'], pal: {K: '#2a2a2a', Z: '#cfe8ff'}},
    pad: {g: [1, 2], rows: ['WWW', 'WGW', 'WWW', 'WGW'], pal: {W: PAPER, G: GREY}},
    camera: {g: [0, 1], rows: ['.KK.', 'KKKK', 'KZKK', 'KKKK'], pal: {K: '#2a2a2a', Z: '#8fd0ff'}},
    card: {g: [0, 3], rows: ['WWWWW', 'WKKKW', 'WKZKW', 'WKKKW', 'WWWWW'], pal: {W: PAPER, K: '#2a2a2a', Z: '#8fd0ff'}},
    cash: {g: [0, 1], rows: ['GGGG', 'GgGG', 'GGGG'], pal: {G: '#7fbf73', g: '#4c8f45'}},
    can: {g: [0, 3], rows: ['......K', '.KK..K.', 'KCCCCK.', 'CCCCCC.', 'CCCCCC.', '.CCCC..'], pal: {K: '#6d8a8f', C: '#8fb3b8'}}};

  const FW = 72, FH = 86, HX = 36, HY = 48, cache = new Map();
  function figure(pose, lookName) {
    const key = lookName + JSON.stringify(pose, (k, v) => typeof v === 'number' ? Math.round(v) : v);
    let f = cache.get(key); if (f) return f;
    const L = LOOKS[lookName], px = new Array(FW * FH).fill(null);
    const paint = m => { m.forEach((c, i) => { const x = i % FW, y = (i / FW) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const j = (y + dy) * FW + x + dx; if (x + dx >= 0 && x + dx < FW && !m.has(j)) px[j] = INK; } });
      m.forEach((c, i) => px[i] = c); };
    const cap = (m, a, b, r, col) => { const vx = b[0] - a[0], vy = b[1] - a[1], ll = vx * vx + vy * vy || 1e-6, len = Math.sqrt(ll);
      for (let y = Math.floor(Math.min(a[1], b[1]) - r - 1); y <= Math.ceil(Math.max(a[1], b[1]) + r + 1); y++)
        for (let x = Math.floor(Math.min(a[0], b[0]) - r - 1); x <= Math.ceil(Math.max(a[0], b[0]) + r + 1); x++) {
          if (x < 0 || y < 0 || x >= FW || y >= FH) continue; const cx = x + .5 - a[0], cy = y + .5 - a[1];
          const s = cl((cx * vx + cy * vy) / ll), dx = cx - s * vx, dy = cy - s * vy;
          if (dx * dx + dy * dy <= r * r) m.set(y * FW + x, typeof col === 'function' ? col(s, (vx * cy - vy * cx) / len) : col); }
      return m; };
    const add = (a, v, k) => [a[0] + v[0] * k, a[1] + v[1] * k];
    const sit = pose.sit, hip = [HX + .5, HY + .5];
    const up = [Math.sin(rad(pose.t)), -Math.cos(rad(pose.t))];
    const leg = (th, sh, fa) => { const k = add(hip, dir(th), 12.5), a = add(k, dir(sh), 12.5); return {k, a, toe: add(a, dir(fa), 4), heel: add(a, dir(fa), -1.5)}; };
    const LF = leg(pose.tf, pose.sf, pose.ffa), LB = leg(pose.tb, pose.sb, pose.fba);
    const sh = add(hip, up, 15), neck = add(hip, up, 17.5);
    const arm = (u, f) => { const e = add(sh, dir(u), 9), w = add(e, dir(f), 8); return {e, w, h: add(w, dir(f), 1.2)}; };
    const AF = arm(pose.ua, pose.fa), AB = arm(pose.ub, pose.fb);
    const itemPart = (name, hand, fa) => { if (!name) return;
      if (name === 'pen' || name === 'marker') { const m = new Map(), d = dir(fa); for (let i = 1; i <= 3; i++) { const p = add(hand, d, i + .6); m.set(Math.floor(p[1]) * FW + Math.floor(p[0]), name === 'pen' ? '#2a2a2a' : '#c8372d'); } paint(m); return; }
      if (name === 'guitar') return;
      const it = ITEMS[name], m = new Map(), ox = Math.round(hand[0] - it.g[0] - .5), oy = Math.round(hand[1] - it.g[1] - .5);
      it.rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') m.set((oy + y) * FW + ox + x, it.pal[ch]); })); paint(m); };
    const limbArm = (A, top, topD) => { const m = new Map(); cap(m, sh, A.e, 1.5, top); cap(m, A.e, A.w, 1.35, (s) => s > .8 ? topD : top); cap(m, A.w, A.h, 1.15, L.skin); return m; };
    const limbLeg = (G, pant) => { const m = new Map(); cap(m, hip, G.k, 1.8, pant); cap(m, G.k, G.a, 1.6, pant);
      const sm = new Map(); cap(sm, add(G.heel, [0, 1], 1), add(G.toe, [0, 1], 1), 1.3, L.shoe);
      sm.forEach((c, i) => { m.set(i, sm.has(i + FW) ? c : L.sole); }); return m; };
    /* back to front: far arm, far leg, near leg, hoodie, neck, head, near arm */
    paint(limbArm(AB, L.topD, L.topD)); itemPart(pose.item2 === 'tablet' || pose.item2 === 'pad' ? null : pose.item2, AB.h, pose.fb);
    paint(limbLeg(LB, L.pantD)); paint(limbLeg(LF, L.pant));
    const tm = new Map(); cap(tm, add(hip, up, -1.5), sh, 3.4, (s, u) => {
      if (L.band && s > .56 && s < .7) return L.band; if (s < .12) return L.topD; if (L.pocket && u > .6 && s > .14 && s < .4) return L.pocket; return L.top; });
    cap(tm, add(sh, [-2.4, .6], 1), add(sh, [-2.4, .6], 1), 2.4, L.topD); paint(tm);
    if (pose.item2 === 'tablet' || pose.item2 === 'pad') itemPart(pose.item2, AB.h, pose.fb);
    paint(cap(new Map(), sh, neck, 1.3, L.skin));
    const hr = HEADS[pose.head === 'down' && L.head === 'me' ? 'meDown' : L.head], hm = new Map();
    const HP = {H: L.hair, S: L.skin, s: L.skinD, E: L.skinD, G: '#c9ccd0', L: '#4d4038', l: '#8b7d70', m: '#6e2f22', K: INK, M: '#3a2c24', C: L.cap, c: L.capD, T: L.top};
    const hx = Math.round(neck[0] - 4.5), hy = Math.round(neck[1] - 10.5) + (pose.head === 'down' ? 1 : 0);
    hr.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') hm.set((hy + y) * FW + hx + x, HP[ch]); })); paint(hm);
    if (pose.item === 'guitar') { const g = new Map(), bx = hip[0] + 3, by = hip[1] - 4;
      cap(g, [bx - 1, by + 1], [bx + 1, by - 1], 3.6, '#c47a3a'); cap(g, [bx - 3, by + 2], [bx - 2, by + 2], 3.2, '#c47a3a');
      g.set(Math.floor(by) * FW + Math.floor(bx - 1), '#2a1a10'); g.set(Math.floor(by) * FW + Math.floor(bx), '#2a1a10');
      cap(g, [bx + 2, by - 2], AB.w, .9, '#5a3a20'); paint(g); paint(cap(new Map(), AB.w, AB.h, 1.15, L.skin)); }
    paint(limbArm(AF, L.top, L.topD)); itemPart(pose.item === 'guitar' ? null : pose.item, AF.h, pose.fa);
    /* ground contact */
    let low = 0; px.forEach((c, i) => { if (c) low = Math.max(low, (i / FW) | 0); });
    const cv = document.createElement('canvas'); cv.width = FW; cv.height = FH; const x = cv.getContext('2d'), id = x.createImageData(FW, FH);
    px.forEach((c, i) => { if (!c) return; const n = parseInt(c.slice(1), 16); id.data[i * 4] = n >> 16; id.data[i * 4 + 1] = (n >> 8) & 255; id.data[i * 4 + 2] = n & 255; id.data[i * 4 + 3] = 255; });
    x.putImageData(id, 0, 0);
    f = {cv, low, sit, hand: AF.h, hand2: AB.h, head: [neck[0], neck[1] - 11]}; if (cache.size > 600) cache.clear(); cache.set(key, f); return f;
  }

  /* ---------- the pets, same sprites as the home page ---------- */
  const SPR = {
    figma: {c: {R: '#F24E1E', O: '#FF7262', P: '#A259FF', B: '#1ABCFE', G: '#0ACF83', K: '#1d1d1f'}, rows: ['.RRRROOOO.', 'RRRRROOOOO', 'RRRRROOOOO', '.RRRROOOO.', '.PPPP.BBB.', 'PPPPPBBBBB', 'PPPPPBKBKB', 'PPPPPBBBBB', '.PPPP.BBB.', '.GGGG.....', 'GGGGG.....', '.GGG......'], legs: ['.K.....K..', '..K...K...']},
    claude: {c: {C: '#D97757', K: '#1d1d1f'}, rows: ['..CCCCCCCC..', '..CCCCCCCC..', '..CKCCCCKC..', 'CCCKCCCCKCCC', 'CCCCCCCCCCCC', '..CCCCCCCC..', '..CCCCCCCC..'], legs: ['..C.C..C.C..', '...C.C..C.C.']},
    framer: {c: {K: '#111111', W: '#ffffff'}, rows: ['KKKKKKKK', '.KKKKKKK', '..KKKKKK', '...KKKKK', 'KKKKK...', 'KWKKWK..', 'KKKKKKK.', 'KKKKKKKK', 'KKKK....', 'KKK.....', 'KK......'], legs: ['K..K....', '.K..K...']},
    gpt: {c: {T: '#10A37F', W: '#ffffff', K: '#0b3d30'}, rows: ['.....TT.....', '......T.....', '..TTTTTTTT..', '.TTTTTTTTTT.', '.TWWWWWWWWT.', '.TWKWWWWKWT.', '.TWWWWWWWWT.', '.TTTTTTTTTT.', '..TTTTTTTT..'], legs: ['...T....T...', '....T..T....']}};
  const sprite = (rows, pal) => { const c = document.createElement('canvas'); c.width = Math.max(...rows.map(r => r.length)); c.height = rows.length; const x = c.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((ch, i) => { if (ch !== '.' && pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, y, 1, 1); } })); return c; };
  const PETS = ['figma', 'claude', 'framer', 'gpt'].map(n => { const s = SPR[n]; return {n, f: s.legs.map(l => sprite([...s.rows, l], s.c)), w: s.rows[0].length, h: s.rows.length + 1}; });
  const BALL = sprite(['.KKK.', 'KWKWK', 'KKWKK', 'KWKWK', '.KKK.'], {K: INK, W: PAPER});
  const NOTE = sprite(['.KK', '.K.', '.K.', 'KK.', 'KK.'], {K: INK});
  const HEART = sprite(['.R.R.', 'RRRRR', 'RRRRR', '.RRR.', '..R..'], {R: '#e38f9f'});

  /* ---------- 3x5 bitmap font, so labels stay pixel-sharp ---------- */
  const FONT = {A: '.#./#.#/###/#.#/#.#', B: '##./#.#/##./#.#/##.', C: '.##/#../#../#../.##', D: '##./#.#/#.#/#.#/##.', E: '###/#../##./#../###', F: '###/#../##./#../#..',
    G: '.##/#../#.#/#.#/.##', H: '#.#/#.#/###/#.#/#.#', I: '###/.#./.#./.#./###', J: '..#/..#/..#/#.#/.#.', K: '#.#/#.#/##./#.#/#.#', L: '#../#../#../#../###',
    M: '#...#/##.##/#.#.#/#...#/#...#', N: '#..#/##.#/#.##/#..#/#..#', O: '.#./#.#/#.#/#.#/.#.', P: '##./#.#/##./#../#..', Q: '.#./#.#/#.#/##./.##', R: '##./#.#/##./#.#/#.#',
    S: '.##/#../.#./..#/##.', T: '###/.#./.#./.#./.#.', U: '#.#/#.#/#.#/#.#/###', V: '#.#/#.#/#.#/#.#/.#.', W: '#...#/#...#/#.#.#/##.##/#...#', X: '#.#/#.#/.#./#.#/#.#',
    Y: '#.#/#.#/.#./.#./.#.', Z: '###/..#/.#./#../###', 0: '###/#.#/#.#/#.#/###', 1: '.#./##./.#./.#./###', 2: '##./..#/.#./#../###', 3: '##./..#/.#./..#/##.',
    4: '#.#/#.#/###/..#/..#', 5: '###/#../##./..#/##.', 6: '.##/#../###/#.#/###', 7: '###/..#/.#./.#./.#.', 8: '###/#.#/###/#.#/###', 9: '###/#.#/###/..#/##.',
    '.': './././././#', ',': './././#/#', ':': './#/./#/.', '%': '#.#/..#/.#./#../#.#', '+': '.../.#./###/.#./...', '-': '.../.../###/.../...', '$': '.##/##./.#./.##/##.',
    '!': '#/#/#/./#', '?': '##./..#/.#./.../.#.', '/': '..#/..#/.#./#../#..', '>': '#../.#./..#/.#./#..', '<': '..#/.#./#../.#./..#', "'": '#/#/./././', '=': '.../###/.../###/...', '#': '#.#/###/#.#/###/#.#'};
  const glyph = ch => FONT[ch] ? FONT[ch].split('/') : null;
  const textW = s => [...s.toUpperCase()].reduce((w, ch) => w + (ch === ' ' ? 3 : (glyph(ch) || ['###'])[0].length) + 1, 0) - 1;

  /* ---------- player ---------- */
  const SCENES = {};
  const SPEED = 46, GAP = 190;
  function Player(root, id) {
    const sc = SCENES[id];
    root.innerHTML = `<div class="strip__stage"><canvas class="strip__cv" role="img" aria-label="Pixel animation of this case study's comic strip"></canvas><div class="strip__says" aria-hidden="true"></div></div>
      <div class="strip__foot"><div class="strip__bar"><button type="button" class="strip__btn" data-prev aria-label="Previous panel">&larr;</button><button type="button" class="strip__btn strip__btn--play" data-play aria-label="Pause">Pause</button><button type="button" class="strip__btn" data-next aria-label="Next panel">&rarr;</button><div class="strip__segs"></div><span class="strip__n"></span></div>
      <p class="strip__cap" aria-live="polite"></p></div>`;
    const stage = root.querySelector('.strip__stage'), cv = root.querySelector('canvas'), out = cv.getContext('2d'), says = root.querySelector('.strip__says');
    const capEl = root.querySelector('.strip__cap'), segs = root.querySelector('.strip__segs'), nEl = root.querySelector('.strip__n'), playB = root.querySelector('[data-play]');
    const buf = document.createElement('canvas'), ctx = buf.getContext('2d');
    let W = 260, H = 100, S = 4, dpr = 1, G = 88, cam = 0;

    /* timeline: walk in, act, walk on, act ... then a little finale with the pets */
    const beats = sc.beats, segsT = []; let T = 0, x = -GAP * .55;
    beats.forEach((b, i) => { b.X = i * GAP; const to = b.X + (b.at || 0), wd = Math.abs(to - x) / SPEED;
      segsT.push({k: 'walk', i, t0: T, t1: T + wd, x0: x, x1: to}); T += wd; x = to;
      segsT.push({k: 'act', i, t0: T, t1: T + b.d, x0: x, x1: x}); b.t0 = T; T += b.d; });
    const fin = FINALES[sc.finale || 'keepy'], FX = (beats.length - 1) * GAP + 150;
    segsT.push({k: 'walk', i: beats.length, t0: T, t1: T + (FX - x) / SPEED, x0: x, x1: FX}); T += (FX - x) / SPEED;
    segsT.push({k: 'fin', i: beats.length, t0: T, t1: T + fin.d, x0: FX, x1: FX}); const finT0 = T; T += fin.d; const TOTAL = T + 1.2;
    const segAt = t => segsT.find(s => t < s.t1) || segsT[segsT.length - 1];
    const heroX = t => { if (t <= 0) return segsT[0].x0; const s = segAt(t); return s.k === 'walk' ? lerp(s.x0, s.x1, cl((t - s.t0) / (s.t1 - s.t0))) : s.x0; };
    const camC = t => { const s = segAt(Math.max(0, t)), c = i => i >= beats.length ? FX + 20 : beats[i].X + (beats[i].cx ?? 56);
      if (s.k === 'walk') { if (s.i === 0) return c(0); const k = ease(cl((t - s.t0) / (s.t1 - s.t0))); return lerp(c(s.i - 1), c(s.i), k); } return c(s.i); };
    beats.forEach((b, i) => { const d = document.createElement('button'); d.type = 'button'; d.setAttribute('aria-label', `Panel ${i + 1}`); d.addEventListener('click', () => { seek(b.t0 - .01); }); segs.appendChild(d); });

    /* drawing kit, in world pixels */
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x) - cam, Math.round(y), Math.round(w), Math.round(h)); };
    const g = {
      INK, PAPER, GREY, MID, BG, at, cl, ease, lerp, hash, get G() { return G; }, get W() { return W; }, accent: sc.accent || INK, R,
      px: (x, y, c) => R(x, y, 1, 1, c),
      line(x0, y0, x1, y1, c = INK) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
        const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1; let e = dx + dy;
        for (;;) { R(x0, y0, 1, 1, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } },
      box(x, y, w, h, fill = PAPER, edge = INK) { R(x, y, w, h, edge); R(x + 1, y + 1, w - 2, h - 2, fill); },
      text(s, x, y, c = INK, align = 'left') { s = String(s).toUpperCase(); let cx = Math.round(align === 'center' ? x - textW(s) / 2 : align === 'right' ? x - textW(s) : x);
        for (const ch of s) { if (ch === ' ') { cx += 4; continue; } const gl = glyph(ch) || glyph('?');
          gl.forEach((r, yy) => [...r].forEach((b, xx) => { if (b === '#') R(cx + xx, y + yy, 1, 1, c); })); cx += gl[0].length + 1; } },
      textW,
      img(im, x, y, flip, a = 1) { ctx.globalAlpha = a; if (flip) { ctx.save(); ctx.translate(Math.round(x) - cam + im.width, Math.round(y)); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0); ctx.restore(); }
        else ctx.drawImage(im, Math.round(x) - cam, Math.round(y)); ctx.globalAlpha = 1; },
      sprite: (rows, pal) => sprite(rows, pal),
      person(x, pose, look = 'me', face = 1) { const f = figure(pose, look), y = f.sit ? Math.round(G - f.sit - HY) : G - f.low - 1;
        const ox = face > 0 ? Math.round(x) - HX : Math.round(x) - (FW - 1 - HX); g.img(f.cv, ox, y, face < 0);
        const map = p => [face > 0 ? ox + p[0] : ox + FW - p[0], y + p[1]]; return {hand: map(f.hand), hand2: map(f.hand2), head: map(f.head)}; },
      /* props */
      desk(x, w = 34, h = 13) { R(x, G - h, w, 2, INK); R(x + 1, G - h + 2, 1, h - 2, INK); R(x + w - 2, G - h + 2, 1, h - 2, INK); },
      chair(x, face = 1) { const bx = face > 0 ? x - 5 : x + 4; R(x - 4, G - 13, 9, 2, INK); R(x - 3, G - 11, 1, 11, INK); R(x + 3, G - 11, 1, 11, INK); R(bx, G - 26, 1, 14, INK); },
      monitor(x, y, w, h, fill = PAPER) { g.box(x, y, w, h, fill); R(x + w / 2 - 1, y + h, 2, 2, INK); R(x + w / 2 - 4, y + h + 2, 8, 1, INK); },
      laptop(x, y, face = 1) { if (face > 0) { R(x, y, 9, 1, INK); g.line(x + 9, y, x + 12, y - 7); } else { R(x, y, 9, 1, INK); g.line(x, y, x - 3, y - 7); } },
      board(x, y, w, h, fill = PAPER) { g.box(x, y, w, h, fill); R(x + 3, y + h, 1, G - y - h, INK); R(x + w - 4, y + h, 1, G - y - h, INK); },
      screen(x, y, w, h, fill = PAPER) { R(x + 1, y, w - 2, h, INK); R(x, y + 1, w, h - 2, INK); R(x + 1, y + 1, w - 2, h - 2, fill); },
      sticky(x, y, c = '#fdd76b') { R(x, y, 6, 6, c); R(x + 1, y + 2, 4, 1, 'rgba(0,0,0,.18)'); R(x + 1, y + 4, 3, 1, 'rgba(0,0,0,.18)'); },
      bars(x, y, w, n, c = GREY) { for (let i = 0; i < n; i++) R(x, y + i * 3, i % 2 ? w * .6 : w, 1, c); },
      pop: (t, a) => cl((t - a) / .25), /* 0..1 appear */
      night(k) { if (k > 0) { ctx.fillStyle = `rgba(22,26,48,${.5 * k})`; ctx.fillRect(0, 0, W, H); } },
      flash(k) { if (k > 0) { ctx.fillStyle = `rgba(255,255,255,${k})`; ctx.fillRect(0, 0, W, H); } },
      heart: (x, y, a = 1) => g.img(HEART, x, y, false, a), ball: (x, y) => g.img(BALL, x, y), note: (x, y, a) => g.img(NOTE, x, y, false, a),
      clock(x, y, ring, t) { const j = ring ? ((Math.floor(t * 16) % 2) ? 1 : -1) : 0; R(x + j, y, 2, 1, INK); R(x + 5 + j, y, 2, 1, INK);
        g.box(x + j, y + 1, 7, 7); R(x + 3 + j, y + 3, 1, 2, INK); R(x + 4 + j, y + 4, 1, 1, INK); if (ring) { R(x + 3, y - 3, 1, 2, g.accent); } },
      toggle(x, y, on, c = '#2e9e5b') { R(x + 1, y, 9, 5, INK); R(x, y + 1, 11, 3, INK); R(x + 1, y + 1, 9, 3, on ? c : GREY); R(on ? x + 6 : x + 1, y + 1, 4, 3, PAPER); }};
    const LOOK_OF = n => n;

    /* speech bubbles: crisp HTML text anchored to pixels */
    const bubs = new Map();
    function bubble(list) { const seen = new Set(), k = S / dpr, ox = cv.offsetLeft, oy = cv.offsetTop, sw = stage.clientWidth;
      list.filter(Boolean).forEach(o => { const key = o.text; seen.add(key); let el = bubs.get(key);
        if (!el) { el = document.createElement('span'); el.className = 'strip__say' + (o.who === 'me' ? '' : ' strip__say--npc'); el.textContent = o.text; says.appendChild(el); bubs.set(key, el); requestAnimationFrame(() => el.classList.add('is-on')); }
        const w = el.offsetWidth, ax = ox + (o.x - cam) * k, left = Math.max(6 + w / 2, Math.min(sw - 6 - w / 2, ax));
        el.style.left = left + 'px'; el.style.top = (oy + o.y * k) + 'px'; el.style.setProperty('--tail', `${cl(50 + (ax - left) / w * 100, 12, 88)}%`); });
      bubs.forEach((el, key) => { if (!seen.has(key)) { bubs.delete(key); el.classList.remove('is-on'); setTimeout(() => el.remove(), 200); } }); }

    function resize() { dpr = Math.min(devicePixelRatio || 1, 3); const r = stage.getBoundingClientRect(), dw = Math.floor(r.width * dpr), dh = Math.floor(r.height * dpr); if (dw < 20 || dh < 20) return;
      S = Math.max(2, Math.floor(dh / 100)); W = Math.floor(dw / S); H = Math.floor(dh / S); G = H - 11;
      buf.width = W; buf.height = H; cv.width = W * S; cv.height = H * S; cv.style.width = (W * S / dpr) + 'px'; cv.style.height = (H * S / dpr) + 'px';
      out.imageSmoothingEnabled = false; }

    let clock = 0, playing = false, curBeat = -1;
    function render() {
      if (!stage.isConnected || buf.width < 2) return;
      const t = clock, s = segAt(t), hx = heroX(t); cam = Math.round(camC(t) - W / 2);
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
      R(cam - 2, G, W + 4, 1, INK);
      for (let i = Math.floor(cam / 23) - 1; i < (cam + W) / 23 + 1; i++) { if (hash(i) > .55) R(i * 23 + hash(i + 1) * 20, G + 3 + Math.floor(hash(i + 2) * 6), 2, 1, GREY); }
      let me = null, said = [], fx = [];
      /* props of every beat near the camera; t is beat-local (negative before it starts) */
      beats.forEach((b, i) => { if (b.X + 140 < cam || b.X - 90 > cam + W) return; const bt = t - b.t0, bt2 = bt > b.d ? b.d + Math.min(bt - b.d, .001) : bt;
        const r = b.draw && b.draw(g, bt > b.d && i < beats.length - 1 && s.i > i ? b.d : bt, b.X); });
      /* pets trail behind using where I was a moment ago */
      const petting = s.k === 'fin' && sc.finale === 'pet' ? PETS[(beats.length) % 4] : null;
      PETS.forEach((p, i) => { const lag = .45 + i * .32, px = heroX(t - lag) - 12 - i * 13, moving = Math.abs(heroX(t - lag) - heroX(t - lag - .05)) > .3;
        let x = px, y = G - p.h, fr = moving ? Math.floor((t * 8 + i) % 2) : Math.floor((t * 1.5 + i * .3) % 2);
        if (moving) y -= Math.abs(Math.sin(t * 9 + i)) * 1.5;
        if (s.k === 'fin') { const ft = t - finT0; fin.pet && ([x, y] = fin.pet(ft, p, i, x, y, hx, g)); }
        g.img(p.f[fr], x, Math.round(y)); });
      /* me */
      let pose, face = 1, bt = t - (s.t0 || 0);
      let mode = null, wk = 0;
      if (s.k === 'walk') { wk = cl((t - s.t0) / (s.t1 - s.t0)); mode = s.i === 0 || s.i >= beats.length ? 'cup' : ['sip', 'ball', 'guitar', 'sip'][(s.i - 1) % 4];
        const dist = Math.max(0, hx - segsT[0].x0), mid = wk > .2 && wk < .8;
        pose = walkPose(dist, mode === 'cup' ? {ua: 8, fa: 92, item: 'cup'}
          : mode === 'sip' ? (wk > .4 && wk < .62 ? {ua: 42, fa: 168, item: 'cup', t: 1} : {ua: 8, fa: 92, item: 'cup'})
          : mode === 'guitar' && mid ? {ub: 64, fb: 96, ua: 14, fa: 70 + (Math.floor(t * 6) % 2 ? 9 : -9), item: 'guitar', t: 1}
          : mode === 'ball' && mid ? {ua: 40, fa: 62, ub: 34, fb: 58} : null); }
      else if (s.k === 'act') { const b = beats[s.i], r = b.me ? b.me(bt, g) : POSE.stand; pose = r.pose || r; face = r.face || 1; said = b.say ? b.say(bt) || [] : []; }
      else { const r = fin.me(t - finT0); pose = r.pose || r; face = r.face || 1; said = fin.say ? fin.say(t - finT0) : []; }
      const sitX = s.k === 'act' && beats[s.i].seatX != null ? beats[s.i].X + beats[s.i].seatX : null;
      me = g.person(sitX != null && pose.sit ? sitX : hx, pose, 'me', face);
      if (mode === 'ball' && wk > .2 && wk < .8) { const ph = ((wk - .2) / .6 * 7) % 1; g.ball(hx + 5, G - 16 - 4 * 18 * ph * (1 - ph) - 2); }
      if (mode === 'guitar' && wk > .2 && wk < .8) for (let k = 0; k < 4; k++) { const a = ((t * .9 + k / 4) % 1); g.note(me.head[0] + 4 + k * 4 + Math.sin(a * 6) * 2, me.head[1] - a * 12, cl((1 - a) * 1.5)); }
      if (s.k === 'fin' && fin.fx) fin.fx(t - finT0, g, me, hx);
      if (s.k === 'act' && beats[s.i].fx) beats[s.i].fx(bt, g, me, beats[s.i].X);
      beats.forEach((b, i) => { if (b.over && Math.abs(i - s.i) <= 1) b.over(g, t - b.t0, b.X); });
      out.drawImage(buf, 0, 0, W * S, H * S);
      bubble(said.map(o => o && (o.who === 'me' ? {...o, x: me.head[0] + 1, y: me.head[1] - 1} : {...o, x: beats[s.i].X + o.x, y: G + o.y})));
      const bi = Math.min(beats.length - 1, s.i);
      if (bi !== curBeat) { curBeat = bi; capEl.textContent = beats[bi].c; nEl.textContent = `${bi + 1} / ${beats.length}`;
        [...segs.children].forEach((d, j) => { d.classList.toggle('is-done', j < bi); d.classList.toggle('is-on', j === bi); }); }
      const b = beats[bi], k = cl((t - (bi ? beats[bi].t0 - (beats[bi].t0 - segsT[bi * 2].t0) : 0)) / ((b.t0 + b.d) - segsT[bi * 2].t0));
      segs.children[bi].style.setProperty('--k', s.i > bi ? 1 : k);
    }
    const seek = t => { clock = cl(t, 0, TOTAL); curBeat = -1; [...segs.children].forEach(d => d.style.setProperty('--k', 0)); render(); };
    const step = d => { const s = segAt(clock), i = Math.min(beats.length - 1, s.i) + d; if (i < 0) return seek(0);
      if (i >= beats.length) return seek(finT0); seek(beats[i].t0 + (playing ? 0 : beats[i].d * .7)); };
    const setPlay = v => { playing = v; playB.textContent = v ? 'Pause' : 'Play'; playB.setAttribute('aria-label', v ? 'Pause' : 'Play'); };
    playB.addEventListener('click', () => setPlay(!playing));
    root.querySelector('[data-prev]').addEventListener('click', () => step(-1));
    root.querySelector('[data-next]').addEventListener('click', () => step(1));
    root.addEventListener('keydown', e => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
    cv.addEventListener('click', () => setPlay(!playing));
    new ResizeObserver(() => { resize(); render(); }).observe(stage);
    let last = 0, raf = 0;
    const loop = now => { const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (playing) { clock += dt; if (clock >= TOTAL) clock = 0; } render(); raf = requestAnimationFrame(loop); };
    resize();
    return {
      start(rm) { cancelAnimationFrame(raf); setPlay(!rm); seek(rm ? beats[0].t0 + beats[0].d * .7 : 0); last = performance.now(); raf = requestAnimationFrame(loop); },
      stop() { cancelAnimationFrame(raf); setPlay(false); }, seek, render, get total() { return TOTAL; }, beats, finT0};
  }

  /* ---------- finales: what I do once the story's told ---------- */
  const FINALES = {
    keepy: {d: 6, me(t) { const ph = ((t - .6) / .6) % 1; if (t < .6 || t > 4.2) return t > 4.6 ? POSE.cheer : POSE.stand;
        return ph < .22 ? POSE.kick : POSE.stand; },
      fx(t, g, me, hx) { const foot = g.G - 9, fx = hx + 7; let x = fx, y;
        if (t < .6) y = g.G - 60 + (t / .6) ** 2 * 51; else if (t < 4.2) { const ph = ((t - .6) / .6) % 1; y = foot - 4 * 22 * ph * (1 - ph); }
        else { const k = (t - 4.2) / 1.4; x = fx + k * 70; y = Math.min(g.G - 6, foot - 4 * 30 * k * (1 - k) + (k > 1 ? 0 : 0)); }
        if (t < 6) g.ball(x - 2, y - 5); },
      say: t => [at(t, 4.4, 6) && {who: 'me', text: 'Still got it.'}]},
    guitar: {d: 6.4, me: t => t < .4 || t > 5.8 ? POSE.stand : wig(t, POSE.guitar, 'fa', 9, 3),
      fx(t, g, me) { for (let k = 0; k * .5 < t - .5 && k < 11; k++) { const a = t - .5 - k * .5; if (a > 1.8) continue; g.note(me.head[0] + 4 + (k % 3) * 5 + Math.sin(a * 4) * 2, me.head[1] - 2 - a * 12, cl(1.8 - a)); } },
      pet: (t, p, i, x, y) => [x, y - (t > .5 && t < 5.8 ? Math.abs(Math.sin(t * 7 + i)) * 2 : 0)],
      say: t => [at(t, 1, 3.6) && {who: 'me', text: 'Four chords. Played with feeling.'}]},
    pet: {d: 6, me: t => t < .3 || t > 5.4 ? {pose: POSE.stand, face: t < .3 ? 1 : -1} : {pose: wig(t, POSE.crouch, 'fa', 8, 2), face: -1},
      pet: (t, p, i, x, y, hx) => i === 0 && t > .2 ? [lerp(x, hx - 24, cl(t / .6)), y - (t > 5.2 ? Math.sin((t - 5.2) * 8) * 4 * (t < 5.6) : 0)] : [x, y],
      fx(t, g, me, hx) { for (let k = 0; k * .7 < t - .8 && k < 7; k++) { const a = t - .8 - k * .7; if (a > 1.5) continue; g.heart(hx - 22 + Math.sin(a * 5 + k) * 2, g.G - 18 - a * 12, cl(1.5 - a)); } },
      say: t => [at(t, 1, 4.4) && {who: 'me', text: 'Who’s a good little Figma?'}]},
    coffee: {d: 5, me: t => t < .4 ? POSE.cup : t < 1.6 ? POSE.sip : t < 2.2 ? POSE.cup : t < 3.4 ? POSE.sip : POSE.cup,
      say: t => [at(t, 1.6, 4.6) && {who: 'me', text: 'Cold brew. Always.'}]}};

  /* ---------- wiring into the comic drawer ---------- */
  window.SNStrip = {scene: (id, def) => { SCENES[id] = def; }, POSE, P, keys, wig, walkPose, figure, LOOKS, Player};
  const boot = () => {
    const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('[data-comic-strip]').forEach(box => {
      const img = box.querySelector('img'), id = box.dataset.strip || (img && (img.getAttribute('src') || '').split('/').pop().replace(/\.\w+$/, ''));
      if (!id || !SCENES[id]) return;
      const el = document.createElement('div'); el.className = 'strip'; el.tabIndex = -1; box.replaceChildren(el); box.classList.add('has-strip');
      const note = box.parentElement.querySelector('.comic-drawer__note'); if (note) note.textContent = 'An 8-bit retelling of the original comic strip. Coded with AI.';
      const pl = Player(el, id), dr = box.closest('.comic-drawer');
      if (!dr) { pl.start(RM); return; }
      let open = false; new MutationObserver(() => { const o = dr.classList.contains('is-open'); if (o === open) return; open = o; o ? setTimeout(() => pl.start(RM), 300) : pl.stop(); })
        .observe(dr, {attributes: true, attributeFilter: ['class']});
      if (/[?&]strip/.test(location.search)) { window.__strip = pl; dr.querySelector('[data-comic-open]'); document.querySelector('[data-comic-open]')?.click(); }
    });
  };
  document.readyState === 'complete' ? setTimeout(boot) : addEventListener('DOMContentLoaded', () => setTimeout(boot));
})();
