/* STRIP: each case study told as a short 8-bit story, full screen. Pixel Samarth walks through it chapter by chapter
   (brief, problem, research, decision, build, result) and acts each one out. Everything is drawn at native pixel size,
   then scaled up by a whole number of device pixels, so nothing blurs. The whole thing is a pure function of time,
   so seeking and stepping are free. */
(function () {
  const INK = '#1c1b1f', BG = '#f6f6f4', PAPER = '#ffffff', GREY = '#d6d5d0', MID = '#9a9a96', FLOOR = '#ecebe6';
  const cl = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v, lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => k * k * (3 - 2 * k), at = (t, a, b) => t >= a && t < b;
  const rad = a => a * Math.PI / 180, dir = a => [Math.sin(rad(a)), Math.cos(rad(a))];
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const rgb = c => { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const dark = (c, k = .56) => '#' + rgb(c).map(v => Math.round(v * k).toString(16).padStart(2, '0')).join('');

  /* ---------- heads, drawn by hand, facing right. N marks where the neck meets ---------- */
  const HEADS = {
    me: ['.....hhh..', '..HHHHHhh.', '.HHHHHHHHh', 'HHHHHHHHH.', 'HHHHHHSSS.', 'HHHEsSGLeG', 'HHHEsSSSSS', '.HHsSSSSS.', '..HsSSSm..', '...sSSSS..', '....sSS...'],
    man: ['..........', '..HHHHHH..', '.HHHHHHHH.', '.HHHHSSSS.', '.HEsSSSeS.', '.HEsSSSSSS', '..HsSSSSS.', '..HsSSSm..', '...sSSSS..', '....sSS...'],
    woman: ['..HHHHH...', '.HHHHHHHH.', 'HHHHHHHSS.', 'HHHHHSSSS.', 'HHHHsSSeS.', 'HHHHsSSSSS', 'HHHHsSSSS.', 'HHHHsSSm..', 'HHH.sSSS..', '.H...sS...'],
    old: ['..........', '...HHHH...', '..HHSSSS..', '.HHSSSSSS.', '.HEsSSSeS.', '.HEsSSSSSS', '..HsSSSSS.', '..HsSMMMM.', '...sSSSS..', '....sSS...'],
    cop: ['..CCCCC...', '.CCCCCCC..', '.CCCCCCCcc', '.HHsSSSS..', '.HEsSSSeS.', '.HEsSSSSSS', '..HsSSSSS.', '..HsSMMMM.', '...sSSSS..', '....sSS...'],
    hood: ['..TTTTT...', '.TTTTTTTT.', 'TTTTTTTTT.', 'TTTTTsSSS.', 'TTTTsSSeS.', 'TTTTsSSSSS', 'TTTTsSSSS.', '.TTTsSSm..', '..TTsSSS..', '...TTsS...'],
    bun: ['.HH.......', 'HHHHHHH...', 'HHHHHHHHH.', 'HHHHHHSSS.', '.HEsSSSeS.', '.HEsSSSSSS', '..HsSSSSS.', '..HsSSSm..', '...sSSSS..', '....sSS...']};
  /* the neck point inside each head: [column, row just under the jaw] */
  const NECK = [5, 10], NECKS = {me: [5, 11]};
  const LOOKS = {
    me: {head: 'me', hair: '#1a1411', hairHi: '#3b2c23', skin: '#b47a52', skinD: '#97613f', top: '#e4dccb', topD: '#cbbfa8', pant: '#5a3b2d', pantD: '#452c21', shoe: '#fbfbf9', sole: '#bdbdb7', sleeve: .55},
    suit: {head: 'man', hair: '#2a2420', skin: '#e0b48f', skinD: '#c49271', top: '#3d4250', topD: '#2d313c', shirt: '#f2f2f2', pant: '#2d3240', pantD: '#22262f', shoe: '#2a2220', sole: '#141414', sleeve: 1},
    exec: {head: 'old', hair: '#a5a5a2', skin: '#d8a882', skinD: '#ba8a66', top: '#2f3542', topD: '#232833', shirt: '#f2f2f2', pant: '#2c3140', pantD: '#21252f', shoe: '#2a2220', sole: '#141414', sleeve: 1},
    woman: {head: 'woman', hair: '#3a2a20', skin: '#c68e66', skinD: '#a8724f', top: '#d9a441', topD: '#bc8a30', pant: '#3b4a6b', pantD: '#2e3a55', shoe: '#7a4a3a', sole: '#4a2a20', sleeve: 1},
    dev: {head: 'bun', hair: '#2a1d16', skin: '#9c6a48', skinD: '#7f5438', top: '#6f8fb8', topD: '#58749a', pant: '#2f3440', pantD: '#23272f', shoe: '#e9e9e6', sole: '#a4a4a0', sleeve: .55},
    saree: {head: 'woman', hair: '#1d1612', skin: '#9c6a48', skinD: '#7f5438', top: '#d9772b', topD: '#ba601f', pant: '#d9772b', pantD: '#ba601f', shoe: '#6b3f2a', sole: '#3a2216', sleeve: .4, skirt: 1},
    shop: {head: 'old', hair: '#d0d0cc', skin: '#9c6a48', skinD: '#7f5438', top: '#efe4c8', topD: '#d6c9a6', pant: '#d8cfba', pantD: '#bfb59d', shoe: '#6b3f2a', sole: '#3a2216', sleeve: 1},
    cop: {head: 'cop', hair: '#1d1612', skin: '#8d5b3e', skinD: '#71462e', cap: '#5a4630', capD: '#3d2f1f', top: '#b89a5e', topD: '#9a7f48', pant: '#b89a5e', pantD: '#9a7f48', shoe: '#2a2220', sole: '#141414', sleeve: .55},
    teen: {head: 'hood', hair: '#1d1612', skin: '#6a4a36', skinD: '#523828', top: '#4a5163', topD: '#383d4b', pant: '#2c3140', pantD: '#21252f', shoe: '#e9e9e6', sole: '#a4a4a0', sleeve: 1, k: .84},
    kid: {head: 'man', hair: '#1d1612', skin: '#a8724f', skinD: '#8a5a3c', top: '#6fa0d8', topD: '#5487c0', pant: '#3b4a6b', pantD: '#2e3a55', shoe: '#e9e9e6', sole: '#a4a4a0', sleeve: .5, k: .78},
    pal: {head: 'man', hair: '#1d1612', skin: '#8d5b3e', skinD: '#71462e', top: '#5f8f6a', topD: '#4b7555', pant: '#3b3f4a', pantD: '#2c2f38', shoe: '#e9e9e6', sole: '#a4a4a0', sleeve: .55},
    girl: {head: 'bun', hair: '#5a3a26', skin: '#e0b48f', skinD: '#c49271', top: '#c86f8a', topD: '#a95a72', pant: '#3b4a6b', pantD: '#2e3a55', shoe: '#e9e9e6', sole: '#a4a4a0', sleeve: .55}};

  /* ---------- poses. Angles in degrees: 0 points down, 90 points forward, 180 points up ---------- */
  const STAND = {t: 0, ua: 4, fa: 8, ub: -4, fb: 0, tf: 3, sf: -1, tb: -3, sb: -4, ffa: 90, fba: 90, head: 'level'};
  const P = o => Object.assign({}, STAND, o);
  const POSE = {
    stand: P({}),
    cup: P({ua: 8, fa: 96, item: 'latte'}),
    sip: P({ua: 12, fa: 160, item: 'latte', t: -2, head: 'up'}),
    phone: P({ua: 4, fa: 132, ub: 2, fb: 124, item: 'phone', head: 'down'}),
    point: P({ua: 82, fa: 90}),
    pointUp: P({ua: 130, fa: 150}),
    present: P({ua: 50, fa: 66, ub: -8, fb: 4}),
    write: P({ua: 108, fa: 126, item: 'marker'}),
    reach: P({ua: 72, fa: 82}),
    think: P({ua: 18, fa: 170, ub: 12, fb: 86}),
    tablet: P({ub: 16, fb: 100, item2: 'tablet', ua: 24, fa: 114, item: 'pen', head: 'down'}),
    pad: P({ub: 14, fb: 104, item2: 'pad', ua: 22, fa: 114, item: 'pen', head: 'down'}),
    cheer: P({ua: 168, fa: 176, ub: 172, fb: 180}),
    fist: P({ua: 150, fa: 186}),
    wave: P({ua: 150, fa: 196}),
    shake: P({ua: 46, fa: 80}),
    shrug: P({ua: 30, fa: 120, ub: 26, fb: 114, t: -1}),
    camera: P({ua: 56, fa: 156, ub: 48, fb: 150, item: 'camera'}),
    card: P({ua: 80, fa: 130, item: 'card'}),
    cash: P({ua: 34, fa: 104, ub: 28, fb: 98, item: 'cash'}),
    cart: P({t: 8, ua: 62, fa: 86, ub: 58, fb: 84}),
    water: P({ua: 62, fa: 94, item: 'can', t: 4}),
    snap: P({ua: 72, fa: 64}),
    type: P({sit: 17, t: 6, tf: 90, sf: 30, tb: 86, sb: 24, ffa: 92, fba: 92, ua: 18, fa: 86, ub: 14, fb: 84}),
    sitPhone: P({sit: 17, t: 4, tf: 90, sf: 30, tb: 86, sb: 24, ua: 8, fa: 132, ub: 6, fb: 124, item: 'phone', head: 'down'}),
    sit: P({sit: 17, t: 0, tf: 90, sf: 30, tb: 86, sb: 24, ua: 20, fa: 70, ub: 16, fb: 66}),
    sitTalk: P({sit: 17, t: 2, tf: 90, sf: 30, tb: 86, sb: 24, ua: 42, fa: 82, ub: 16, fb: 66}),
    relax: P({sit: 17, t: -10, tf: 84, sf: 30, tb: 80, sb: 8, ua: 160, fa: 250, ub: 166, fb: 248}),
    crouch: P({t: 24, tf: 80, sf: -22, tb: 30, sb: -76, fba: 150, ua: 44, fa: 64, ub: 22, fb: 40}),
    crouchPhone: P({t: 18, tf: 80, sf: -22, tb: 30, sb: -76, fba: 150, ua: 30, fa: 122, ub: 22, fb: 112, item: 'phone', head: 'down'}),
    kick: P({tf: 62, sf: 44, ffa: 118, tb: -2, sb: -4, ua: 36, fa: 56, ub: -30, fb: -18, t: -3, head: 'down'}),
    knee: P({tf: 96, sf: 8, ffa: 96, tb: -1, sb: -3, ua: 30, fa: 50, ub: -26, fb: -12, t: 0, head: 'down'}),
    guitar: P({ub: 58, fb: 104, ua: 22, fa: 62, item: 'guitar'}),
    sleepy: P({sit: 17, t: 14, tf: 88, sf: 30, tb: 84, sb: 24, ua: 30, fa: 70, ub: 14, fb: 60, head: 'down'})};

  /* a walk cycle with planted feet: 8 hand-set keys (contact, down, pass, up ...), phase from distance travelled */
  const STRIDE = 38, WALK = [[24, 8, 104], [15, 6, 92], [4, 1, 90], [-9, -7, 80], [-20, -30, 58], [-9, -56, 46], [14, -36, 78], [27, 2, 100]];
  const legAt = p => { const f = p * 8, i = Math.floor(f) % 8, j = (i + 1) % 8, k = ease(f - Math.floor(f)); return WALK[i].map((v, n) => lerp(v, WALK[j][n], k)); };
  function walkPose(dist, extra) {
    const p = (Math.floor(dist / STRIDE * 16) / 16) % 1, [tf, sf, ffa] = legAt(p), [tb, sb, fba] = legAt((p + .5) % 1), s = Math.cos(p * Math.PI * 2);
    return Object.assign(P({t: 1, tf, sf, ffa, tb, sb, fba, ua: -15 * s, fa: -15 * s + 12 + 14 * Math.max(0, -s), ub: 15 * s, fb: 15 * s + 12 + 14 * Math.max(0, s)}), extra || {});
  }
  const mix = (a, b, k) => { const o = Object.assign({}, k < .5 ? a : b);
    for (const key in STAND) if (typeof STAND[key] === 'number') o[key] = lerp(a[key] ?? STAND[key], b[key] ?? STAND[key], k);
    if (a.sit && b.sit) o.sit = lerp(a.sit, b.sit, k); return o; };
  /* keyframes: [[time, pose], ...], eased, sampled at 15 fps for a hand-animated feel */
  const keys = (t, fr) => { t = Math.floor(t * 15) / 15; if (t <= fr[0][0]) return fr[0][1];
    for (let i = 1; i < fr.length; i++) if (t < fr[i][0]) return mix(fr[i - 1][1], fr[i][1], ease((t - fr[i - 1][0]) / (fr[i][0] - fr[i - 1][0])));
    return fr[fr.length - 1][1]; };
  /* a gentle two-frame motion on one joint (talking hands, typing, strumming) */
  const wig = (t, pose, key, amp, hz = 4) => Object.assign({}, pose, {[key]: pose[key] + (Math.floor(t * hz * 2) % 2 ? amp : -amp)});

  /* ---------- hand-held things, pixel by pixel. g = grip point ---------- */
  const ITEMS = {
    latte: {g: [2, 7], rows: ['k.....', '.k....', '..k...', 'cckccc', 'cWWWWc', 'cLILLc', 'cLLLIc', 'cDLDDc', 'cDDDDc', '.cccc.'],
      pal: {k: '#2f7a55', c: '#dce8ec', W: '#f4ece0', I: '#eef7fa', L: '#c99f78', D: '#8a5a3a'}},
    phone: {g: [0, 2], rows: ['KK', 'KZ', 'KZ', 'KK'], pal: {K: '#2a2a2e', Z: '#8fd0ff'}},
    tablet: {g: [1, 3], rows: ['KK', 'KZ', 'KZ', 'KZ', 'KZ', 'KK'], pal: {K: '#2a2a2e', Z: '#cfe8ff'}},
    pad: {g: [1, 2], rows: ['WWW', 'WGW', 'WWW', 'WGW'], pal: {W: PAPER, G: GREY}},
    camera: {g: [0, 1], rows: ['.KK.', 'KKKK', 'KZKK', 'KKKK'], pal: {K: '#2a2a2e', Z: '#8fd0ff'}},
    card: {g: [0, 3], rows: ['WWWWW', 'WKKKW', 'WKZKW', 'WKKKW', 'WWWWW'], pal: {W: PAPER, K: '#2a2a2e', Z: '#8fd0ff'}},
    cash: {g: [0, 1], rows: ['GGGG', 'GgGG', 'GGGG'], pal: {G: '#7fbf73', g: '#4c8f45'}},
    can: {g: [0, 3], rows: ['......K', '.KK..K.', 'KCCCCK.', 'CCCCCC.', 'CCCCCC.', '.CCCC..'], pal: {K: '#6d8a8f', C: '#8fb3b8'}}};

  /* ---------- the figure: tapered limbs, hand-drawn head, outlines in a darker shade of each part ---------- */
  const FW = 88, FH = 100, HX = 44, HY = 60, cache = new Map();
  function figure(pose, lookName) {
    const key = lookName + JSON.stringify(pose, (k, v) => typeof v === 'number' ? Math.round(v) : v);
    let f = cache.get(key); if (f) return f;
    const L = LOOKS[lookName], K = L.k || 1, px = new Array(FW * FH).fill(null);
    /* flat fills. A part drawn over another gets a soft edge where they overlap (inner); the silhouette gets one outline at the end */
    const paint = (m, inner) => { if (inner) m.forEach((c, i) => { const x = i % FW, y = (i / FW) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const j = (y + dy) * FW + x + dx; if (x + dx >= 0 && x + dx < FW && y + dy >= 0 && y + dy < FH && !m.has(j) && px[j]) px[j] = dark(c, .74); } });
      m.forEach((c, i) => px[i] = c); };
    /* tapered capsule from a to b, radius r0 to r1; col can be a function of (along 0..1, across -1..1) */
    const seg = (m, a, b, r0, r1, col) => { const vx = b[0] - a[0], vy = b[1] - a[1], ll = vx * vx + vy * vy || 1e-6, len = Math.sqrt(ll), R = Math.max(r0, r1);
      for (let y = Math.floor(Math.min(a[1], b[1]) - R - 1); y <= Math.ceil(Math.max(a[1], b[1]) + R + 1); y++)
        for (let x = Math.floor(Math.min(a[0], b[0]) - R - 1); x <= Math.ceil(Math.max(a[0], b[0]) + R + 1); x++) {
          if (x < 0 || y < 0 || x >= FW || y >= FH) continue; const cx = x + .5 - a[0], cy = y + .5 - a[1];
          const s = cl((cx * vx + cy * vy) / ll), dx = cx - s * vx, dy = cy - s * vy, r = lerp(r0, r1, s);
          if (dx * dx + dy * dy <= r * r) m.set(y * FW + x, typeof col === 'function' ? col(s, (vx * cy - vy * cx) / len / r) : col); }
      return m; };
    const add = (a, v, k) => [a[0] + v[0] * k, a[1] + v[1] * k];
    const sit = pose.sit, hip = [HX + .5, HY + .5], up = [Math.sin(rad(pose.t)), -Math.cos(rad(pose.t))];
    const leg = (th, sh, fa) => { const k = add(hip, dir(th), 13 * K), a = add(k, dir(sh), 13 * K); return {k, a, toe: add(a, dir(fa), 4.6), heel: add(a, dir(fa), -1.4)}; };
    const LF = leg(pose.tf, pose.sf, pose.ffa), LB = leg(pose.tb, pose.sb, pose.fba);
    const sh = add(hip, up, 17.5 * K), neck = add(hip, up, 24 * K);
    const arm = (u, f) => { const s0 = add(sh, up, -1), e = add(s0, dir(u), 11 * K), w = add(e, dir(f), 10 * K); return {s0, e, w, h: add(w, dir(f), 1.4)}; };
    const AF = arm(pose.ua, pose.fa), AB = arm(pose.ub, pose.fb);
    const item = (m, name, hand, fa) => { if (!name || name === 'guitar') return;
      if (name === 'pen' || name === 'marker') { const d = dir(fa); for (let i = 1; i <= 3; i++) { const p = add(hand, d, i + .6); m.set(Math.floor(p[1]) * FW + Math.floor(p[0]), name === 'pen' ? '#2a2a2e' : '#c8372d'); } return; }
      const it = ITEMS[name], ox = Math.round(hand[0] - it.g[0] - .5), oy = Math.round(hand[1] - it.g[1] - .5);
      it.rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') m.set((oy + y) * FW + ox + x, it.pal[ch]); })); };
    const limbArm = (A, far, it, fa) => { const m = new Map(), top = far ? L.topD : L.top, skin = far ? L.skinD : L.skin, sl = L.sleeve;
      seg(m, A.s0, A.e, 1.5, 1.2, s => s < sl * 1.6 ? top : skin); seg(m, A.e, A.w, 1.15, 1, s => sl >= 1 ? (s > .82 ? skin : top) : skin);
      if (sl >= 1) seg(m, A.e, A.w, 1.15, 1.05, s => s > .82 ? skin : top);
      paint(m, !far); const mi = new Map(); item(mi, it, A.h, fa); if (mi.size) paint(mi, true);
      paint(seg(new Map(), A.w, A.h, 1.15, 1.15, skin), !far); };
    const limbLeg = (G, far) => { const m = new Map(), pant = far ? L.pantD : L.pant;
      if (L.skirt) { seg(m, hip, G.k, 2.6, 2.8, pant); seg(m, G.k, G.a, 2.4, 1.3, s => s > .78 ? (far ? L.skinD : L.skin) : pant); }
      else { seg(m, hip, G.k, 2.1, 1.75, pant); seg(m, G.k, G.a, 1.65, 1.3, pant); }
      const sm = new Map(); seg(sm, add(G.heel, [0, 1], 1), add(G.toe, [0, 1], 1), 1.25, 1.1, far ? dark(L.shoe, .9) : L.shoe);
      sm.forEach((c, i) => { m.set(i, sm.has(i + FW) ? c : L.sole); }); paint(m, !far); };
    /* back to front: far arm, far leg, near leg, body, neck, head, guitar, near arm */
    limbArm(AB, true, pose.item2 === 'tablet' || pose.item2 === 'pad' ? null : pose.item2, pose.fb);
    limbLeg(LB, true); limbLeg(LF, false);
    const tm = new Map(); seg(tm, add(hip, up, -1.5), sh, 3.5, 3.9, (s, u) => {
      if (L.shirt && s > .55 && u > .35) return L.shirt; if (s < .1 && !L.skirt) return L.topD; return u < -.62 ? L.topD : L.top; });
    paint(tm);
    if (pose.item2 === 'tablet' || pose.item2 === 'pad') { const mi = new Map(); item(mi, pose.item2, AB.h, pose.fb); paint(mi, true); }
    paint(seg(new Map(), add(sh, up, -.5), add(neck, up, .5), 1.4, 1.3, L.skin));
    const hr = HEADS[L.head], hm = new Map();
    const HP = {H: L.hair, h: L.hairHi || L.hair, S: L.skin, s: L.skinD, E: L.skinD, G: '#26201c', L: '#a9c3cf', e: '#1c1b1f', m: '#7b3b2c', M: L.hair, C: L.cap, c: L.capD, T: L.top};
    const tilt = pose.head === 'down' ? [1, 1] : pose.head === 'up' ? [-1, -1] : [0, 0], NK = NECKS[L.head] || NECK;
    const hx = Math.round(neck[0] - NK[0] + tilt[0] * .5), hy = Math.round(neck[1] - NK[1] + tilt[1]);
    hr.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') hm.set((hy + y) * FW + hx + x, HP[ch]); })); paint(hm);
    let gtr = null;
    if (pose.item === 'guitar') { const g = new Map(), n = [.87, -.49], c1 = add(add(hip, up, 4.5), [4, 0], 1), c2 = add(c1, n, 5.2), wood = '#d58c47', woodD = '#a8662f';
      seg(g, c1, c1, 5, 5, wood); seg(g, c2, c2, 3.8, 3.8, wood); paint(g, true);
      const nk = new Map(); seg(nk, add(c2, n, 2), add(c2, n, 15), .9, .8, '#5a3a22'); seg(nk, add(c2, n, 15), add(c2, n, 17.5), 1.2, 1.2, '#3c2616'); paint(nk, true);
      const sh2 = new Map(); seg(sh2, add(c1, n, 1.6), add(c1, n, 1.6), 1.2, 1.2, '#2b1a10'); sh2.forEach((c, i) => px[i] = c);
      const br = add(c1, n, -2.2); px[Math.floor(br[1]) * FW + Math.floor(br[0])] = woodD; px[Math.floor(br[1]) * FW + Math.floor(br[0]) + 1] = woodD; gtr = {c1, n}; }
    limbArm(AF, false, pose.item, pose.fa);
    const solid = px.slice(); for (let i = 0; i < px.length; i++) { if (solid[i]) continue; const x = i % FW, y = (i / FW) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= FW || yy >= FH) continue; const c = solid[yy * FW + xx]; if (c) { px[i] = dark(c, .5); break; } } }
    let low = 0; px.forEach((c, i) => { if (c) low = Math.max(low, (i / FW) | 0); });
    const cv = document.createElement('canvas'); cv.width = FW; cv.height = FH; const x = cv.getContext('2d'), id = x.createImageData(FW, FH);
    px.forEach((c, i) => { if (!c) return; const [r, gg, b] = rgb(c); id.data[i * 4] = r; id.data[i * 4 + 1] = gg; id.data[i * 4 + 2] = b; id.data[i * 4 + 3] = 255; });
    x.putImageData(id, 0, 0);
    f = {cv, low, sit, hand: AF.h, hand2: AB.h, head: [neck[0] + 1, neck[1] - (NK[1] + 1)], foot: LF.toe, foot2: LB.toe, knee: LF.k};
    if (cache.size > 900) cache.clear(); cache.set(key, f); return f;
  }

  /* ---------- small sprites: the pets (smaller than me now), the ball, notes, hearts ---------- */
  const sprite = (rows, pal) => { const c = document.createElement('canvas'); c.width = Math.max(...rows.map(r => r.length)); c.height = rows.length; const x = c.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((ch, i) => { if (ch !== '.' && pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, y, 1, 1); } })); return c; };
  const SPR = {
    figma: {c: {R: '#F24E1E', O: '#FF7262', P: '#A259FF', B: '#1ABCFE', G: '#0ACF83', K: '#1c1b1f'}, rows: ['.RROO.', 'RRROOO', '.RROO.', '.PPBB.', 'PPPBKB', '.PPBB.', '.GG...', 'GGG...', '.G....'], legs: ['.K..K.', 'K....K']},
    claude: {c: {C: '#D97757', K: '#1c1b1f'}, rows: ['.CCCCCC.', '.CKCCKC.', 'CCCCCCCC', '.CCCCCC.'], legs: ['.C.C.CC.', 'C.C..C.C']},
    framer: {c: {K: '#1c1b1f', W: '#ffffff'}, rows: ['KKKKKK', '.KKKKK', '..KKKK', 'KKKKK.', 'KWKWK.', 'KKKKKK', 'KKK...', 'KK....'], legs: ['K..K..', '.K..K.']},
    gpt: {c: {T: '#10A37F', W: '#ffffff', K: '#0b3d30'}, rows: ['...TT...', '.TTTTTT.', 'TWWWWWWT', 'TWKWWKWT', 'TWWWWWWT', '.TTTTTT.'], legs: ['..T..T..', '.T....T.']}};
  const PETS = ['figma', 'claude', 'framer', 'gpt'].map(n => { const s = SPR[n]; return {n, f: s.legs.map(l => sprite([...s.rows, l], s.c)), w: s.rows[0].length, h: s.rows.length + 1}; });
  const BALLS = [['..kkk..', '.kWWWk.', 'kWWKWWk', 'kWKKKWk', 'kWWKWgk', '.kWWgk.', '..kkk..'], ['..kkk..', '.kKWWk.', 'kKKWWWk', 'kWWWWWk', 'kWWWKKk', '.kgWKk.', '..kkk..']]
    .map(r => sprite(r, {k: '#3a3a3e', K: '#1c1b1f', W: '#ffffff', g: '#cfcfcf'}));
  const NOTES = [sprite(['..K', '..K', '..K', 'KKK', 'KK.'], {K: INK}), sprite(['.KKK', '.K.K', '.K.K', 'KK.K', 'KKKK'], {K: INK})];
  const HEART = sprite(['.R.R.', 'RRRRR', 'RRRRR', '.RRR.', '..R..'], {R: '#e3728a'});

  /* ---------- 3x5 bitmap font, so in-scene labels stay pixel-sharp ---------- */
  const FONT = {A: '.#./#.#/###/#.#/#.#', B: '##./#.#/##./#.#/##.', C: '.##/#../#../#../.##', D: '##./#.#/#.#/#.#/##.', E: '###/#../##./#../###', F: '###/#../##./#../#..',
    G: '.##/#../#.#/#.#/.##', H: '#.#/#.#/###/#.#/#.#', I: '###/.#./.#./.#./###', J: '..#/..#/..#/#.#/.#.', K: '#.#/#.#/##./#.#/#.#', L: '#../#../#../#../###',
    M: '#...#/##.##/#.#.#/#...#/#...#', N: '#..#/##.#/#.##/#..#/#..#', O: '.#./#.#/#.#/#.#/.#.', P: '##./#.#/##./#../#..', Q: '.#./#.#/#.#/##./.##', R: '##./#.#/##./#.#/#.#',
    S: '.##/#../.#./..#/##.', T: '###/.#./.#./.#./.#.', U: '#.#/#.#/#.#/#.#/###', V: '#.#/#.#/#.#/#.#/.#.', W: '#...#/#...#/#.#.#/##.##/#...#', X: '#.#/#.#/.#./#.#/#.#',
    Y: '#.#/#.#/.#./.#./.#.', Z: '###/..#/.#./#../###', 0: '###/#.#/#.#/#.#/###', 1: '.#./##./.#./.#./###', 2: '##./..#/.#./#../###', 3: '##./..#/.#./..#/##.',
    4: '#.#/#.#/###/..#/..#', 5: '###/#../##./..#/##.', 6: '.##/#../###/#.#/###', 7: '###/..#/.#./.#./.#.', 8: '###/#.#/###/#.#/###', 9: '###/#.#/###/..#/##.',
    '.': './././././#', ',': './././#/#', ':': './#/./#/.', '%': '#.#/..#/.#./#../#.#', '+': '.../.#./###/.#./...', '-': '.../.../###/.../...', '$': '.##/##./.#./.##/##.',
    '!': '#/#/#/./#', '?': '##./..#/.#./.../.#.', '/': '..#/..#/.#./#../#..', '>': '#../.#./..#/.#./#..', '<': '..#/.#./#../.#./..#', "'": '#/#/./././', '=': '.../###/.../###/...', '#': '#.#/###/#.#/###/#.#',
    '→': '..../..#./####/..#./....', '✓': '...#/..#./#.#./.#../....', '×': '.../#.#/.#./#.#/...'};
  const glyph = ch => FONT[ch] ? FONT[ch].split('/') : null;
  const textW = s => [...String(s).toUpperCase()].reduce((w, ch) => w + (ch === ' ' ? 3 : (glyph(ch) || ['###'])[0].length) + 1, 0) - 1;

  /* ---------- player ---------- */
  const SCENES = {};
  const SPEED = 40, GAP = 156, BAND = 128, MINW = 236;
  const words = s => String(s).split(/\s+/).length;
  function Player(root, id, meta) {
    const sc = SCENES[id];
    root.innerHTML = `<div class="strip__stage"><canvas class="strip__cv" role="img" aria-label="Pixel animation telling this case study"></canvas><div class="strip__says" aria-hidden="true"></div>
        <div class="strip__intro" aria-hidden="true"><span class="strip__intro-k">The story of</span><strong>${meta.title}</strong><span>${meta.lede}</span></div>
        <div class="strip__end" hidden><button type="button" class="strip__pill" data-again>Watch again</button><button type="button" class="strip__pill strip__pill--solid" data-read>Read the case study</button></div></div>
      <div class="strip__foot"><p class="strip__chap"><span class="strip__n"></span><span class="strip__k"></span></p><p class="strip__cap" aria-live="polite"></p>
        <div class="strip__bar"><button type="button" class="strip__btn" data-prev aria-label="Previous">&larr;</button><button type="button" class="strip__btn strip__btn--play" data-play aria-label="Pause">Pause</button><button type="button" class="strip__btn" data-next aria-label="Next">&rarr;</button><div class="strip__segs"></div></div></div>`;
    const stage = root.querySelector('.strip__stage'), cv = root.querySelector('canvas'), out = cv.getContext('2d'), says = root.querySelector('.strip__says');
    const capEl = root.querySelector('.strip__cap'), kEl = root.querySelector('.strip__k'), segs = root.querySelector('.strip__segs'), nEl = root.querySelector('.strip__n'), playB = root.querySelector('[data-play]');
    const intro = root.querySelector('.strip__intro'), end = root.querySelector('.strip__end');
    root.style.setProperty('--accent', sc.accent || INK);
    const buf = document.createElement('canvas'), ctx = buf.getContext('2d');
    let W = 260, H = 140, S = 4, dpr = 1, G = 120, cam = 0;

    /* timeline: walk in, act, walk on, act ... then a little finale. Each chapter stays long enough to read its caption. */
    const beats = sc.beats, segsT = []; let T = 1.6, x = -GAP * .62;
    segsT.push({k: 'idle', i: 0, t0: 0, t1: T, x0: x, x1: x});
    beats.forEach((b, i) => { b.X = i * GAP; const to = b.X + (b.at || 0), wd = Math.abs(to - x) / SPEED;
      b.d = Math.max(b.d || 4, words(b.c) / 3.4 + 1 - wd * .55);
      segsT.push({k: 'walk', i, t0: T, t1: T + wd, x0: x, x1: to}); b.w0 = T; T += wd; x = to;
      segsT.push({k: 'act', i, t0: T, t1: T + b.d, x0: x, x1: x}); b.t0 = T; T += b.d; });
    const fin = FINALES[sc.finale || 'keepy'], FX = (beats.length - 1) * GAP + GAP * .8;
    segsT.push({k: 'walk', i: beats.length, t0: T, t1: T + (FX - x) / SPEED, x0: x, x1: FX}); T += (FX - x) / SPEED;
    segsT.push({k: 'fin', i: beats.length, t0: T, t1: T + fin.d, x0: FX, x1: FX}); const finT0 = T; T += fin.d; const TOTAL = T + .4;
    const segAt = t => segsT.find(s => t < s.t1) || segsT[segsT.length - 1];
    const heroX = t => { if (t <= 0) return segsT[0].x0; const s = segAt(t); return s.k === 'walk' ? lerp(s.x0, s.x1, cl((t - s.t0) / (s.t1 - s.t0))) : s.x0; };
    const camC = t => { const s = segAt(Math.max(0, t)), c = i => i >= beats.length ? FX + 16 : beats[i].X + (beats[i].cx ?? 44);
      if (s.k === 'idle') return c(0); if (s.k === 'walk') { if (s.i === 0) return c(0); const k = ease(cl((t - s.t0) / (s.t1 - s.t0))); return lerp(c(s.i - 1), c(s.i), k); } return c(s.i); };
    beats.forEach((b, i) => { const d = document.createElement('button'); d.type = 'button'; d.setAttribute('aria-label', `${i + 1}. ${b.k || ''}`); d.title = b.k || '';
      d.addEventListener('click', () => { seek(b.t0 - .01); }); segs.appendChild(d); });

    /* drawing kit, in world pixels */
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x) - cam, Math.round(y), Math.round(w), Math.round(h)); };
    const g = {
      INK, PAPER, GREY, MID, BG, at, cl, ease, lerp, hash, dark, get G() { return G; }, get W() { return W; }, accent: sc.accent || INK, R,
      px: (x, y, c) => R(x, y, 1, 1, c),
      line(x0, y0, x1, y1, c = INK) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
        const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1; let e = dx + dy;
        for (;;) { R(x0, y0, 1, 1, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } },
      box(x, y, w, h, fill = PAPER, edge = INK) { R(x, y, w, h, edge); R(x + 1, y + 1, w - 2, h - 2, fill); },
      rbox(x, y, w, h, fill = PAPER, edge = INK) { R(x + 1, y, w - 2, h, edge); R(x, y + 1, w, h - 2, edge); R(x + 1, y + 1, w - 2, h - 2, fill); },
      text(s, x, y, c = INK, align = 'left', z = 1) { s = String(s).toUpperCase(); const tw = textW(s) * z; let cx = Math.round(align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x);
        for (const ch of s) { if (ch === ' ') { cx += 3 * z + z; continue; } const gl = glyph(ch) || glyph('?');
          gl.forEach((r, yy) => [...r].forEach((b, xx) => { if (b === '#') R(cx + xx * z, y + yy * z, z, z, c); })); cx += (gl[0].length + 1) * z; } },
      textW,
      img(im, x, y, flip, a = 1) { ctx.globalAlpha = a; if (flip) { ctx.save(); ctx.translate(Math.round(x) - cam + im.width, Math.round(y)); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0); ctx.restore(); }
        else ctx.drawImage(im, Math.round(x) - cam, Math.round(y)); ctx.globalAlpha = 1; },
      sprite: (rows, pal) => sprite(rows, pal),
      shadow(x, w) { R(x - w / 2, G + 1, w, 1, 'rgba(28,27,31,.12)'); },
      person(x, pose, look = 'me', face = 1) { const f = figure(pose, look), y = f.sit ? Math.min(Math.round(G - f.sit - HY), G - f.low - 1) : G - f.low - 1;
        const ox = face > 0 ? Math.round(x) - HX : Math.round(x) - (FW - 1 - HX); if (!f.sit) g.shadow(x, 14); g.img(f.cv, ox, y, face < 0);
        const map = p => [face > 0 ? ox + p[0] : ox + FW - p[0], y + p[1]]; return {hand: map(f.hand), hand2: map(f.hand2), head: map(f.head), foot: map(f.foot), knee: map(f.knee)}; },
      /* furniture and props */
      desk(x, w = 34, h = 14) { R(x, G - h, w, 2, '#8a6a4a'); R(x, G - h + 2, w, 1, dark('#8a6a4a')); R(x + 1, G - h + 3, 2, h - 3, '#6e5238'); R(x + w - 3, G - h + 3, 2, h - 3, '#6e5238'); },
      chair(x, face = 1) { const bx = face > 0 ? x - 6 : x + 5; R(x - 5, G - 17, 11, 2, '#3a3a3e'); R(x - 1, G - 15, 2, 12, '#3a3a3e'); R(x - 5, G - 3, 11, 1, '#3a3a3e'); R(x - 5, G - 2, 1, 2, '#3a3a3e'); R(x + 5, G - 2, 1, 2, '#3a3a3e'); R(bx, G - 35, 2, 19, '#3a3a3e'); },
      stool(x) { R(x - 5, G - 17, 11, 2, '#8a6a4a'); R(x - 4, G - 15, 1, 15, '#6e5238'); R(x + 4, G - 15, 1, 15, '#6e5238'); R(x - 4, G - 7, 9, 1, '#6e5238'); },
      monitor(x, y, w, h, fill = PAPER) { g.rbox(x, y, w, h, fill, '#2a2a2e'); R(x + w / 2 - 1, y + h, 2, 2, '#2a2a2e'); R(x + w / 2 - 4, y + h + 2, 8, 1, '#2a2a2e'); },
      laptop(x, y, face = 1) { R(x, y, 10, 1, '#2a2a2e'); if (face > 0) g.line(x + 10, y, x + 13, y - 7, '#2a2a2e'); else g.line(x, y, x - 3, y - 7, '#2a2a2e'); },
      board(x, y, w, h, fill = PAPER) { g.box(x, y, w, h, fill, '#3a3a3e'); R(x + 3, y + h, 1, G - y - h, '#3a3a3e'); R(x + w - 4, y + h, 1, G - y - h, '#3a3a3e'); },
      screen(x, y, w, h, fill = PAPER) { g.rbox(x, y, w, h, fill, '#2a2a2e'); },
      phone(x, y, w = 24, h = 40, fill = PAPER) { g.rbox(x, y, w, h, '#2a2a2e', '#2a2a2e'); R(x + 2, y + 3, w - 4, h - 6, fill); R(x + w / 2 - 2, y + 1, 4, 1, '#55555b'); },
      sticky(x, y, c = '#fdd76b') { R(x, y, 6, 6, c); R(x + 1, y + 2, 4, 1, 'rgba(0,0,0,.16)'); R(x + 1, y + 4, 3, 1, 'rgba(0,0,0,.16)'); },
      lines(x, y, w, n, c = GREY, gap = 3) { for (let i = 0; i < n; i++) R(x, y + i * gap, i % 3 === 2 ? w * .6 : w, 1, c); },
      bars(x, y, w, n, c = GREY) { g.lines(x, y, w, n, c); },
      pop: (t, a, d = .25) => cl((t - a) / d),
      night(k) { if (k > 0) { ctx.fillStyle = `rgba(22,26,48,${.5 * k})`; ctx.fillRect(0, 0, W, H); } },
      flash(k) { if (k > 0) { ctx.fillStyle = `rgba(255,255,255,${k})`; ctx.fillRect(0, 0, W, H); } },
      heart: (x, y, a = 1) => g.img(HEART, x, y, false, a), note: (x, y, a, n = 0) => g.img(NOTES[n % 2], x, y, false, a),
      ball(x, y, spin = 0) { g.img(BALLS[Math.floor(spin) % 2], x - 3, y - 3); },
      clock(x, y, ring, t) { const j = ring ? ((Math.floor(t * 16) % 2) ? 1 : -1) : 0; R(x + j, y, 2, 1, INK); R(x + 5 + j, y, 2, 1, INK);
        g.box(x + j, y + 1, 7, 7); R(x + 3 + j, y + 3, 1, 2, INK); R(x + 4 + j, y + 4, 1, 1, INK); if (ring) { R(x + 3, y - 3, 1, 2, g.accent); } },
      toggle(x, y, on, c = '#2e9e5b') { R(x + 1, y, 9, 5, INK); R(x, y + 1, 11, 3, INK); R(x + 1, y + 1, 9, 3, on ? c : GREY); R(on ? x + 6 : x + 1, y + 1, 4, 3, PAPER); }};

    /* speech bubbles: crisp HTML text anchored to pixels */
    const bubs = new Map();
    function bubble(list) { const seen = new Set(), k = S / dpr, ox = cv.offsetLeft, oy = cv.offsetTop, sw = stage.clientWidth;
      list.filter(Boolean).forEach(o => { const key = o.text; seen.add(key); let el = bubs.get(key);
        if (!el) { el = document.createElement('span'); el.className = 'strip__say' + (o.who === 'me' ? '' : ' strip__say--npc'); el.textContent = o.text; says.appendChild(el); bubs.set(key, el); requestAnimationFrame(() => el.classList.add('is-on')); }
        const w = el.offsetWidth, ax = ox + (o.x - cam) * k, left = Math.max(8 + w / 2, Math.min(sw - 8 - w / 2, ax));
        el.style.left = left + 'px'; el.style.top = Math.max(el.offsetHeight + 14, oy + o.y * k) + 'px'; el.style.setProperty('--tail', `${cl(50 + (ax - left) / w * 100, 12, 88)}%`); });
      bubs.forEach((el, key) => { if (!seen.has(key)) { bubs.delete(key); el.classList.remove('is-on'); setTimeout(() => el.remove(), 200); } }); }

    function resize() { dpr = Math.min(devicePixelRatio || 1, 3); const r = stage.getBoundingClientRect(), dw = Math.floor(r.width * dpr), dh = Math.floor(r.height * dpr); if (dw < 40 || dh < 40) return;
      S = Math.max(2, Math.min(Math.floor(dh / BAND), Math.floor(dw / MINW))); W = Math.floor(dw / S); H = Math.floor(dh / S);
      G = Math.min(H - 8, Math.round((H + BAND) / 2) - 12);
      buf.width = W; buf.height = H; cv.width = W * S; cv.height = H * S; cv.style.width = (W * S / dpr) + 'px'; cv.style.height = (H * S / dpr) + 'px';
      out.imageSmoothingEnabled = false; }

    let clock = 0, playing = false, curBeat = -1, ended = false;
    function render() {
      if (!stage.isConnected || buf.width < 2) return;
      const t = clock, s = segAt(t), hx = heroX(t); cam = Math.round(camC(t) - W / 2);
      ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H); ctx.fillStyle = FLOOR; ctx.fillRect(0, G + 1, W, H - G);
      R(cam - 2, G, W + 4, 1, '#cfcdc6');
      for (let i = Math.floor(cam / 19) - 1; i < (cam + W) / 19 + 1; i++) { if (hash(i) > .5) R(i * 19 + hash(i + 1) * 16, G + 3 + Math.floor(hash(i + 2) * 7), 2 + Math.floor(hash(i + 3) * 3), 1, '#dddbd3'); }
      let said = [];
      /* props of every chapter near the camera; t is chapter-local (negative before it starts) */
      beats.forEach((b, i) => { if (b.X + 170 < cam || b.X - 110 > cam + W) return; const bt = t - b.t0; b.draw && b.draw(g, s.i > i && s.k !== 'idle' ? Math.max(bt, b.d) : bt, b.X); });
      /* the pets trail behind, using where I was a moment ago */
      PETS.forEach((p, i) => { const lag = .5 + i * .34, px = heroX(t - lag) - 13 - i * 11, moving = Math.abs(heroX(t - lag) - heroX(t - lag - .05)) > .3;
        let x = px, y = G - p.h + 1, fr = moving ? Math.floor((t * 9 + i) % 2) : Math.floor((t * 1.2 + i * .3) % 2);
        if (moving) y -= Math.floor(Math.abs(Math.sin(t * 9 + i)) * 1.6);
        if (s.k === 'fin' && fin.pet) [x, y] = fin.pet(t - finT0, p, i, x, y, hx, g);
        g.shadow(x + p.w / 2, p.w - 1); g.img(p.f[fr], x, Math.round(y)); });
      /* me */
      let pose, face = 1, bt = t - (s.t0 || 0), mode = null, wk = 0;
      if (s.k === 'idle') pose = POSE.cup;
      else if (s.k === 'walk') { wk = cl((t - s.t0) / (s.t1 - s.t0)); mode = s.i === 0 || s.i >= beats.length ? 'cup' : ['ball', 'guitar', 'sip'][(s.i - 1) % 3];
        const dist = Math.max(0, hx - segsT[0].x0), mid = wk > .14 && wk < .86, ph = Math.floor(t * 5) % 2;
        pose = walkPose(dist, mode === 'cup' ? {ua: 8, fa: 96, item: 'latte'}
          : mode === 'sip' ? (wk > .4 && wk < .64 ? {ua: 12, fa: 160, item: 'latte', t: 0, head: 'up'} : {ua: 8, fa: 96, item: 'latte'})
          : mode === 'guitar' && mid ? {ub: 58, fb: 104, ua: 22, fa: ph ? 70 : 54, item: 'guitar', t: 1} : null); }
      else if (s.k === 'act') { const b = beats[s.i], r = b.me ? b.me(bt, g) : POSE.stand; pose = r.pose || r; face = r.face || 1; said = b.say ? b.say(bt) || [] : []; }
      else { const r = fin.me(t - finT0); pose = r.pose || r; face = r.face || 1; said = fin.say ? fin.say(t - finT0) || [] : []; }
      const sitX = s.k === 'act' && beats[s.i].seatX != null ? beats[s.i].X + beats[s.i].seatX : null;
      const me = g.person(sitX != null && pose.sit ? sitX : hx, pose, 'me', face);
      if (mode === 'ball') dribble(wk, hx, t, s);
      if (mode === 'guitar' && wk > .14 && wk < .86) for (let k = 0; k < 4; k++) { const a = (t * .8 + k / 4) % 1; g.note(me.head[0] + 6 + k * 3 + Math.sin(a * 6 + k) * 2, me.head[1] - 2 - a * 16, cl((1 - a) * 1.6), k); }
      if (mode === 'sip' && wk > .44 && wk < .62) { const a = (t * 3) % 1; g.px(me.hand[0] + 4, me.hand[1] - 9 - a * 3, 'rgba(140,200,220,.8)'); }
      if (s.k === 'fin' && fin.fx) fin.fx(t - finT0, g, me, hx);
      if (s.k === 'act' && beats[s.i].fx) beats[s.i].fx(bt, g, me, beats[s.i].X);
      out.drawImage(buf, 0, 0, W * S, H * S);
      bubble(said.map(o => o && (o.who === 'me' ? {...o, x: me.head[0] + 1, y: me.head[1] - 2} : {...o, x: beats[s.i].X + o.x, y: G + o.y})));
      const bi = Math.min(beats.length - 1, s.i);
      if (bi !== curBeat) { curBeat = bi; capEl.textContent = beats[bi].c; kEl.textContent = beats[bi].k || ''; nEl.textContent = String(bi + 1).padStart(2, '0') + ' / ' + String(beats.length).padStart(2, '0');
        [...segs.children].forEach((d, j) => { d.classList.toggle('is-done', j < bi); d.classList.toggle('is-on', j === bi); }); }
      const b = beats[bi], k = s.k === 'idle' ? 0 : cl((t - b.w0) / (b.t0 + b.d - b.w0));
      segs.children[bi].style.setProperty('--k', s.i > bi ? 1 : k);
      intro.classList.toggle('is-on', t < 2.6);
    }
    /* walking with the ball: it drops in, I dribble it along, then flick it up and away */
    function dribble(wk, hx, t, s) {
      const len = s.t1 - s.t0, tt = t - s.t0, G0 = G - 4;
      if (wk < .16) { const k = wk / .16; g.ball(hx + 14, G0 - 70 * (1 - k) ** 2 * (k < .7 ? 1 : 1) , tt * 6); return; }
      if (wk > .86) { const k = (wk - .86) / .14; g.ball(hx + 12 + k * 40, G0 - Math.sin(k * Math.PI * .9) * 52 - k * 30, tt * 8); return; }
      const dist = hx - segsT[0].x0, p = (dist / STRIDE) % 1, push = Math.max(0, Math.sin(p * Math.PI * 2));
      g.ball(hx + 11 + push * 3, G0 - (push > .9 ? 1 : 0), dist / 4);
    }
    const seek = t => { clock = cl(t, 0, TOTAL); curBeat = -1; ended = false; end.hidden = true; [...segs.children].forEach(d => d.style.setProperty('--k', 0)); render(); };
    const step = d => { const s = segAt(clock), i = Math.min(beats.length - 1, s.i) + (s.k === 'walk' && d > 0 && s.i < beats.length ? 0 : d);
      if (i < 0) return seek(0); if (i >= beats.length) return seek(finT0); seek(beats[i].t0 + (playing ? 0 : Math.min(beats[i].d * .7, 3.2))); };
    const setPlay = v => { if (v && ended) seek(0); playing = v; playB.textContent = v ? 'Pause' : 'Play'; playB.setAttribute('aria-label', v ? 'Pause' : 'Play'); };
    playB.addEventListener('click', () => setPlay(!playing));
    root.querySelector('[data-prev]').addEventListener('click', () => step(-1));
    root.querySelector('[data-next]').addEventListener('click', () => step(1));
    root.querySelector('[data-again]').addEventListener('click', () => { seek(0); setPlay(true); });
    root.querySelector('[data-read]').addEventListener('click', () => meta.onRead && meta.onRead());
    cv.addEventListener('click', () => setPlay(!playing));
    new ResizeObserver(() => { resize(); render(); }).observe(stage);
    let last = 0, raf = 0;
    const loop = now => { const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (playing) { clock += dt; if (clock >= TOTAL) { clock = TOTAL; setPlay(false); ended = true; end.hidden = false; } } render(); raf = requestAnimationFrame(loop); };
    resize();
    return {
      start(rm) { cancelAnimationFrame(raf); seek(rm ? beats[0].t0 + Math.min(beats[0].d * .7, 3) : 0); setPlay(!rm); last = performance.now(); raf = requestAnimationFrame(loop); },
      stop() { cancelAnimationFrame(raf); setPlay(false); }, seek, render, step, toggle: () => setPlay(!playing), get total() { return TOTAL; }, beats, finT0, get clock() { return clock; }};
  }

  /* ---------- finales: what I do once the story's told ---------- */
  const juggle = (t, n0) => { const T0 = .7, P0 = .62; if (t < T0) return {k: -1}; const i = Math.floor((t - T0) / P0), ph = ((t - T0) / P0) % 1; return {i, ph, k: i % 2}; };
  const FINALES = {
    keepy: {d: 7, me(t) { if (t > 5.9) return POSE.cheer; const j = juggle(t); if (j.k < 0 || t > 5.66) return POSE.stand;
        return j.ph < .2 ? (j.k ? POSE.knee : POSE.kick) : POSE.stand; },
      fx(t, g, me, hx) { const top = (k) => k ? g.G - 30 : g.G - 12; let x = hx + 9, y;
        if (t < .7) y = g.G - 90 + (t / .7) ** 2 * (90 - 12);
        else if (t < 5.66) { const j = juggle(t), h = 16 + (j.i % 3) * 5, base = j.k ? g.G - 30 : g.G - 12; y = base - 4 * h * j.ph * (1 - j.ph); x = hx + (j.k ? 8 : 10); }
        else { const k = (t - 5.66) / .5; y = g.G - 12 - k * 30; x = hx + 9 - k * 2; if (k > 1) { y = me.hand[1] - 4; x = me.hand[0]; } }
        g.ball(x, y, t * 6); },
      say: t => [at(t, 5.9, 7) && {who: 'me', text: 'Still got it.'}]},
    guitar: {d: 6.6, me: t => t < .4 || t > 6 ? POSE.stand : wig(t, POSE.guitar, 'fa', 8, 3),
      fx(t, g, me) { for (let k = 0; k * .45 < t - .5 && k < 13; k++) { const a = t - .5 - k * .45; if (a > 1.8) continue; g.note(me.head[0] + 5 + (k % 3) * 5 + Math.sin(a * 4) * 2, me.head[1] - 2 - a * 14, cl(1.8 - a), k); } },
      pet: (t, p, i, x, y) => [x, y - (t > .5 && t < 6 ? Math.floor(Math.abs(Math.sin(t * 7 + i)) * 2) : 0)],
      say: t => [at(t, 1, 3.8) && {who: 'me', text: 'Four chords. Played with feeling.'}]},
    pet: {d: 6, me: t => t < .3 || t > 5.4 ? {pose: POSE.stand, face: t < .3 ? 1 : -1} : {pose: wig(t, POSE.crouch, 'fa', 8, 2), face: -1},
      pet: (t, p, i, x, y, hx) => i === 0 && t > .2 ? [lerp(x, hx - 22, cl(t / .6)), y - (t > 5.2 && t < 5.6 ? Math.floor(Math.sin((t - 5.2) * 8) * 4) : 0)] : [x, y],
      fx(t, g, me, hx) { for (let k = 0; k * .7 < t - .8 && k < 7; k++) { const a = t - .8 - k * .7; if (a > 1.5) continue; g.heart(hx - 20 + Math.sin(a * 5 + k) * 2, g.G - 18 - a * 12, cl(1.5 - a)); } },
      say: t => [at(t, 1, 4.4) && {who: 'me', text: 'Who’s a good little Figma?'}]},
    coffee: {d: 5.4, me: t => t < .4 ? POSE.cup : t < 1.8 ? POSE.sip : t < 2.4 ? POSE.cup : t < 3.6 ? POSE.sip : POSE.cup,
      fx(t, g, me) { if ((t > .5 && t < 1.8) || (t > 2.5 && t < 3.6)) { const a = (t * 3) % 1; g.px(me.hand[0] + 4, me.hand[1] - 9 - a * 3, 'rgba(140,200,220,.8)'); } },
      say: t => [at(t, 1.8, 5) && {who: 'me', text: 'Iced latte. Always.'}]}};

  /* ---------- full-screen story, opened from the case study's "Comic Strip" button ---------- */
  window.SNStrip = {scene: (id, def) => { SCENES[id] = def; }, POSE, P, keys, wig, walkPose, figure, LOOKS, Player};
  const boot = () => {
    const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const box = document.querySelector('[data-comic-strip]'); if (!box) return;
    const img = box.querySelector('img'), id = box.dataset.strip || (img && (img.getAttribute('src') || '').split('/').pop().replace(/\.\w+$/, ''));
    if (!id || !SCENES[id]) return;
    const title = (document.querySelector('.chero__t') || {}).textContent || document.title, lede = (document.querySelector('.chero__lede') || {}).textContent || '';
    const ov = document.createElement('div'); ov.className = 'story'; ov.hidden = true; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', `${title}, as an 8-bit story`); ov.tabIndex = -1;
    ov.innerHTML = `<div class="story__top"><p class="story__ttl"><span class="story__kick">The story</span><span>${title}</span></p><button type="button" class="story__x" aria-label="Close the story"><span></span><span></span></button></div><div class="strip"></div>`;
    document.body.appendChild(ov);
    let opener = null, pl = null;
    const close = () => { if (ov.hidden) return; pl && pl.stop(); ov.classList.remove('is-open'); setTimeout(() => { ov.hidden = true; }, 260);
      window.SN && SN.lenis && SN.lenis.start(); document.documentElement.style.overflow = ''; opener && opener.focus({preventScroll: true}); };
    const open = btn => { opener = btn; ov.hidden = false; document.documentElement.style.overflow = 'hidden'; window.SN && SN.lenis && SN.lenis.stop();
      requestAnimationFrame(() => { ov.classList.add('is-open'); if (!pl) pl = Player(ov.querySelector('.strip'), id, {title, lede, onRead: close}); window.__strip = pl; pl.start(RM); ov.focus({preventScroll: true}); }); };
    ov.querySelector('.story__x').addEventListener('click', close);
    document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-comic-open]'); if (!b) return; e.preventDefault(); e.stopImmediatePropagation(); open(b); }, true);
    ov.addEventListener('keydown', e => { if (!pl) return;
      if (e.key === 'Escape') { e.stopPropagation(); close(); } else if (e.key === 'ArrowRight') pl.step(1); else if (e.key === 'ArrowLeft') pl.step(-1);
      else if (e.key === ' ' && !(e.target.closest && e.target.closest('button'))) { e.preventDefault(); pl.toggle(); } });
    if (/[?&]strip/.test(location.search)) open(document.querySelector('[data-comic-open]'));
  };
  document.readyState === 'complete' ? setTimeout(boot) : addEventListener('DOMContentLoaded', () => setTimeout(boot));
})();
