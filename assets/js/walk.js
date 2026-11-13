/* WALK — pixel Samarth walks left to right with the pets, sips cold brew, juggles, plays guitar,
   pets the pets, and stops at each case study to act out its comic strip. Canvas, 1 unit = 1 sprite pixel. */
(function () {
  const root = document.querySelector('[data-walk]'); if (!root) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = root.querySelector('.walk__stage'), cv = stage.querySelector('canvas'), ctx = cv.getContext('2d');
  const bubLayer = stage.querySelector('.walk__bubbles'), card = root.querySelector('.walk__card');
  const playBtn = root.querySelector('[data-walk-play]'), nextBtn = root.querySelector('[data-walk-next]');
  const countEl = root.querySelector('[data-walk-count]'), dotsEl = root.querySelector('.walk__dots');
  const INK = '#141414', FOREST = '#2b3d26', LINE = '#d1d1d1', WOOD = '#c9a27a', POST = '#bdbdb6';
  const cl = v => v < 0 ? 0 : v > 1 ? 1 : v, at = (t, a, b) => t >= a && t < b;
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  /* ---------- pixel buffers ---------- */
  const Buf = (w, h) => ({w, h, px: new Array(w * h).fill(null)});
  const bset = (b, x, y, c) => { if (x >= 0 && y >= 0 && x < b.w && y < b.h) b.px[y * b.w + x] = c; };
  const bget = (b, x, y) => (x >= 0 && y >= 0 && x < b.w && y < b.h) ? b.px[y * b.w + x] : null;
  const bline = (x0, y0, x1, y1, f) => {
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (;;) { f(x0, y0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  };
  const outline = (b, c) => { const add = [];
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) if (!bget(b, x, y) && (bget(b, x - 1, y) || bget(b, x + 1, y) || bget(b, x, y - 1) || bget(b, x, y + 1))) add.push([x, y]);
    add.forEach(([x, y]) => bset(b, x, y, c)); };
  const toCanvas = b => { const c = document.createElement('canvas'); c.width = b.w; c.height = b.h; const x = c.getContext('2d');
    b.px.forEach((col, i) => { if (col) { x.fillStyle = col; x.fillRect(i % b.w, (i / b.w) | 0, 1, 1); } }); return c; };
  const grid = (rows, pal, pad = 0, ol) => { const b = Buf(rows[0].length + pad * 2, rows.length + pad * 2);
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') bset(b, x + pad, y + pad, pal[ch]); })); if (ol) outline(b, ol); return toCanvas(b); };

  /* ---------- me: drawn from the photo — swept-back black hair, round tinted shades, cream colour-block hoodie,
     brown corduroys, white sneakers, iced coffee ---------- */
  const PAL = {H: '#17120f', h: '#3b2d25', S: '#b47a52', s: '#93603f', F: '#c6c9cd', L: '#4a4440', l: '#8f857c', m: '#6e2f22', T: '#ffffff',
    B: '#ddd4c4', b: '#c3b8a5', W: '#fbfaf6', w: '#e6e2d8', P: '#53352a', p: '#3a251c', K: '#ffffff', k: '#a4a4a4',
    c: '#e3edf0', M: '#efe4d0', C: '#8b5a34', q: '#e38f9f', G: '#6f9b6a', g: '#557d51', n: '#6fbf73', A: '#2b2b2b', Z: '#8fd0ff', X: '#141414'};
  const OUT = '#2a211c', ARM_EDGE = '#9a8f7e';
  const HEAD = [
    '....hHHHHh......',
    '...HHHHHHHHH....',
    '..HHHHHHHHHHH...',
    '..HHHHHHHHHHHH..',
    '..HHHHHSSSSSHH..',
    '..HHHSSSSSSSSS..',
    '..HHSFFFFSFFFFS.',
    '..HSFFLLFFFLLFS.',
    '..SsSFLlFSFLlFS.',
    '..SSSSFFSSSFFSS.',
    '...SSSSSSSSSSSs.',
    '...SSSSSmTTTTm..',
    '....SSSSSmmmS...',
    '.....SSSSSSS....',
    '......sSSs......'];
  const TORSO = [
    '....BBBsSBBB....',
    '...BBBBBBBBBB...',
    '..BBBBBBBBBBBB..',
    '..BBBBBBBBBBBB..',
    '..WWWWWWWWWWWW..',
    '..WWWWWWWWWWWW..',
    '..wWWWWWWWWWWw..',
    '..BBBBBBBBBBBB..',
    '..BbbbbbbbbbbB..',
    '..BbBBBBBBBBbB..',
    '..bbbbbbbbbbbb..'];
  const LEGS = {
    stand: ['...PPPPPPPPPP...', '....PPPP.PPPP...', '....PPP..PPP....', '....pPP..pPP....', '....KKKk.KKKk...'],
    walkA: ['...PPPPPPPPPP...', '...PPPP..PPPP...', '..PPP.....PPP...', '..pPP......pPP..', '.KKKk......KKKk.'],
    walkB: ['...PPPPPPPPPP...', '....PPPPPPPP....', '.....PPPPPP.....', '.....pPPPPP.....', '.....KKKKKKk....'],
    kick:  ['...PPPPPPPPPPP..', '....PPP..PPPPPK.', '....PPP....KKKK.', '....pPP.........', '....KKKk........'],
    crouch: ['..PPPPPPPPPPPP..', '.KKKkPP..PPKKKk.']};
  const ITEMS = {
    cup: [[15, 12], ['..X.', '..X.', '.X..', 'cccc', 'cMMc', 'cMMc', 'cqCc', 'cCCc', '.CC.']],
    cupsip: [[13, 11], ['X...', '.X..', 'cccc', 'cMMc', 'cMMc', 'cqCc', 'cCCc', '.CC.']],
    phone: [[14, 9], ['XXX', 'XZX', 'XZX', 'XXX']],
    camera: [[18, 10], ['XXXX', 'XZZX', 'XXXX']],
    can: [[17, 13], ['.g..g....', '.gggg....', 'GGGGGG...', 'GGGGGGg..', 'GGGGGG.g.', '.GGGG...g']],
    cash: [[18, 15], ['nnnn', 'ngnn', 'nnnn']]};
  /* front-arm shapes: sleeve polyline from the shoulder, then the hand */
  const ARMS = {
    down: [[[11, 17], [12, 24]], [12, 25]], fwd: [[[11, 17], [13, 23]], [13, 24]], back: [[[10, 17], [9, 23]], [9, 24]],
    cup: [[[11, 17], [11, 20], [14, 21]], [15, 20]], sip: [[[11, 17], [14, 17], [15, 15]], [15, 14]],
    point: [[[11, 17], [17, 15]], [18, 14], [20, 14]], reach: [[[11, 17], [12, 20], [17, 20]], [18, 20]],
    phone: [[[11, 17], [12, 21], [14, 15]], [14, 13]], camera: [[[11, 17], [17, 14]], [18, 13]],
    cheer: [[[11, 17], [13, 10]], [13, 8]], wave: [[[11, 17], [15, 11]], [16, 9]],
    write1: [[[11, 17], [17, 16]], [18, 15]], write2: [[[11, 17], [17, 18]], [18, 17]],
    strum1: [[[11, 17], [11, 21], [8, 22]], [7, 22]], strum2: [[[11, 17], [11, 21], [8, 24]], [7, 24]],
    can: [[[11, 17], [16, 16]], [17, 15]], cash: [[[11, 17], [12, 20], [16, 19]], [17, 18]]};
  const ITEM_OF = {cup: 'cup', sip: 'cupsip', phone: 'phone', camera: 'camera', can: 'can', cash: 'cash'};
  const CW = 38, CH = 38, OX = 10, OY = 5, cache = new Map();
  function charFrame(p) {
    const key = JSON.stringify(p); if (cache.has(key)) return cache.get(key);
    const b = Buf(CW, CH), cy = p.crouch ? 3 : (p.dy || 0);
    const S = (x, y, c, t = b) => bset(t, x + OX, y + OY, c);
    const P = (rows, x, y, t = b) => rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') S(x + i, y + j, PAL[ch], t); }));
    if (p.crouch) P(LEGS.crouch, 0, 29); else { const L = LEGS[p.legs || 'stand']; P(L, 0, 26); if (cy < 0) P([L[0]], 0, 25); }
    P(TORSO, 0, 15 + cy); P(HEAD, 0, cy);
    /* a layer drawn over the body gets a soft inner edge where it overlaps, so a beige sleeve still reads on a beige hoodie */
    const layer = (draw, edge) => { const o = Buf(CW, CH); draw(o);
      o.px.forEach((c, i) => { if (c) b.px[i] = c; });
      o.px.forEach((c, i) => { if (!c) return; const x = i % CW, y = (i / CW) | 0;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { if (!bget(o, x + dx, y + dy) && bget(b, x + dx, y + dy)) bset(b, x + dx, y + dy, edge); }); }); };
    if (p.item === 'guitar') layer(o => {
      const Wd = '#c47a3a', Hi = '#d99a5b', N = '#5a3a20', D = '#2a1a10';
      for (let y = -5; y <= 5; y++) for (let x = -6; x <= 6; x++) {
        const up = ((x - 1) / 2.8) ** 2 + ((y + 1.5) / 2.6) ** 2 <= 1, lo = ((x + 1) / 3.6) ** 2 + ((y - 1.2) / 3.2) ** 2 <= 1;
        if (up || lo) S(5 + x, 23 + y + cy, y > 2 ? Hi : Wd, o); }
      bline(13, 18 + cy, 15, 18 + cy, (x, y) => S(x, y, PAL.b, o));
      bline(9, 21 + cy, 20, 16 + cy, (x, y) => { S(x, y, N, o); S(x, y + 1, N, o); });
      S(20, 15 + cy, D, o); S(21, 15 + cy, D, o); S(21, 14 + cy, D, o); S(22, 14 + cy, D, o);
      S(5, 22 + cy, D, o); S(6, 22 + cy, D, o); S(5, 23 + cy, D, o); S(6, 23 + cy, D, o);
      [[16, 17], [17, 17], [16, 18], [17, 18]].forEach(([x, y]) => S(x, y + cy, PAL.S, o));
    }, '#7a4a1e');
    let A = ARMS[p.arm || 'down'];
    if (p.arm === 'pat') A = [[[11, 17], [17, p.hy]], [18, p.hy]];
    layer(o => {
      const [pts, hand, finger] = A;
      for (let i = 0; i < pts.length - 1; i++) bline(pts[i][0], pts[i][1] + cy, pts[i + 1][0], pts[i + 1][1] + cy, (x, y) => {
        S(x, y, PAL.B, o); S(x + 1, y, PAL.B, o); S(x, y + 1, PAL.B, o); S(x + 1, y + 1, PAL.b, o); });
      const it = ITEMS[ITEM_OF[p.arm]]; if (it) P(it[1], it[0][0], it[0][1] + cy, o);
      const e = pts[pts.length - 1]; S(e[0], e[1] + cy, PAL.A, o);
      [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([dx, dy]) => S(hand[0] + dx, hand[1] + dy + cy, dx && dy ? PAL.s : PAL.S, o));
      if (finger) { S(finger[0] - 1, finger[1] + cy, PAL.S, o); S(finger[0], finger[1] + cy, PAL.S, o); }
      if (p.arm === 'write1' || p.arm === 'write2') { S(hand[0] + 2, hand[1] - 1 + cy, INK, o); S(hand[0] + 3, hand[1] - 2 + cy, INK, o); }
    }, ARM_EDGE);
    outline(b, OUT);
    const c = toCanvas(b); cache.set(key, c); return c;
  }

  /* ---------- the pets (same sprites as the home hero) ---------- */
  const SPR = {
    figma: {c: {R: '#F24E1E', O: '#FF7262', P: '#A259FF', B: '#1ABCFE', G: '#0ACF83', K: '#1d1d1f'}, rows: [
      '.RRRROOOO.', 'RRRRROOOOO', 'RRRRROOOOO', '.RRRROOOO.', '.PPPP.BBB.', 'PPPPPBBBBB', 'PPPPPBKBKB', 'PPPPPBBBBB', '.PPPP.BBB.',
      '.GGGG.....', 'GGGGG.....', '.GGG......'], legs: ['.K.....K..', '..K...K...']},
    claude: {c: {C: '#D97757', K: '#1d1d1f'}, rows: [
      '..CCCCCCCC..', '..CCCCCCCC..', '..CKCCCCKC..', 'CCCKCCCCKCCC', 'CCCCCCCCCCCC', '..CCCCCCCC..', '..CCCCCCCC..'],
      legs: ['..C.C..C.C..', '...C.C..C.C.']},
    framer: {c: {K: '#111111', W: '#ffffff'}, rows: [
      'KKKKKKKK', '.KKKKKKK', '..KKKKKK', '...KKKKK', 'KKKKK...', 'KWKKWK..', 'KKKKKKK.', 'KKKKKKKK', 'KKKK....', 'KKK.....', 'KK......'],
      legs: ['K..K....', '.K..K...']},
    gpt: {c: {T: '#10A37F', W: '#ffffff', K: '#0b3d30'}, rows: [
      '.....TT.....', '......T.....', '..TTTTTTTT..', '.TTTTTTTTTT.', '.TWWWWWWWWT.', '.TWKWWWWKWT.', '.TWWWWWWWWT.', '.TTTTTTTTTT.', '..TTTTTTTT..'],
      legs: ['...T....T...', '....T..T....']}};
  const NAMES = {figma: 'Figma', claude: 'Claude', framer: 'Framer', gpt: 'GPT'};
  const pets = ['figma', 'claude', 'framer', 'gpt'].map((name, i) => { const s = SPR[name];
    return {name, i, f: [0, 1].map(k => grid([...s.rows, s.legs[k]], s.c)), w: s.rows[0].length, h: s.rows.length + 1, x: 0, d: 0, hop: 0, moving: false}; });
  const BALL = grid(['.WWW.', 'WXWXW', 'WWXWW', 'WXWXW', '.WWW.'], {W: '#ffffff', X: INK}, 1, INK);
  const NOTE = grid(['.XX', '.X.', '.X.', 'XX.', 'XX.'], {X: INK});
  const HEART = grid(['.R.R.', 'RRRRR', 'RRRRR', '.RRR.', '..R..'], {R: '#e38f9f'});

  /* ---------- renderer ---------- */
  let dpr = 1, s = 3, vw = 300, vh = 150, G = 130, cam = 0;
  const resize = () => { const r = stage.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 3);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    s = Math.max(2, Math.floor(cv.height / 112)); vw = cv.width / s; vh = cv.height / s; G = Math.floor(vh - Math.max(10, (vh - 100) * .5 + 10)); ctx.imageSmoothingEnabled = false; };
  const RS = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x * s), Math.round(y * s), Math.round(w * s), Math.round(h * s)); };
  const R = (x, y, w, h, c) => RS(Math.round(x) - cam, y, w, h, c);
  const L = (x0, y0, x1, y1, c) => bline(Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1), (x, y) => R(x, y, 1, 1, c));
  const D = (img, x, y, flip, a = 1) => { const X = (Math.round(x) - cam) * s, Y = Math.round(y) * s; ctx.globalAlpha = a;
    if (flip) { ctx.save(); ctx.translate(X + img.width * s, Y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, img.width * s, img.height * s); ctx.restore(); }
    else ctx.drawImage(img, X, Y, img.width * s, img.height * s); ctx.globalAlpha = 1; };
  const T = (str, x, y, size, c, align = 'left') => { ctx.font = `${size * s}px "Geist Pixel", monospace`; ctx.textBaseline = 'top'; ctx.textAlign = align; ctx.fillStyle = c;
    ctx.fillText(str, Math.round((Math.round(x) - cam) * s), Math.round(y * s)); };
  const sw = (x, on, col = FOREST) => { R(x + 2, G - 11, 1, 11, POST); R(x, G - 15, 5, 7, LINE); R(x + 1, G - 14, 3, 5, '#fff'); R(x + 1, on ? G - 12 : G - 14, 3, 3, on ? col : '#9a9a9a'); };
  const table = (x, w) => { R(x, G - 16, w, 2, '#8a5a3c'); R(x + 2, G - 14, 2, 14, '#8a5a3c'); R(x + w - 4, G - 14, 2, 14, '#8a5a3c'); };
  const board = (x, y, w, h) => { R(x - 1, y - 1, w + 2, h + 2, LINE); R(x, y, w, h, '#fff'); };

  /* ---------- case-study stops, each acting out its comic strip ---------- */
  const ME = text => ({who: 'me', text});
  const NPC = (text, x, y) => ({who: 'npc', text, x, y});
  const ST = [
    {id: 'voyage', name: 'Voyage, an AI-native design system', href: 'case-studies/ai-native-design-system.html',
      line: 'Every pitch demo was built from scratch. I built Voyage, an AI-native design system that grew to 84,000 elements and helped win $500M+ in deals in one year.',
      dur: 6.6, pose: t => ({arm: t < 2 ? 'point' : t < 2.6 ? 'reach' : t > 4.8 ? 'cheer' : 'down'}),
      says: t => [at(t, .2, 2) && ME('Every demo built from scratch?'), at(t, 2.7, 4.8) && ME('One click. Any client’s brand.')],
      draw(t, X) { const bx = X + 30, by = G - 48;
        R(bx + 3, by + 27, 1, G - by - 27, POST); R(bx + 22, by + 27, 1, G - by - 27, POST); board(bx, by, 26, 26);
        const sets = [['#cfcfcf', '#bababa', '#e2e2e2'], ['#1f4e8c', '#6fa0d8', '#c7d9ee'], ['#c8102e', '#f08a96', '#fde0e4'], ['#1c7c54', '#73c49b', '#d6efe2'], [FOREST, '#fdb300', '#e38f9f']];
        const k = t < 2.4 ? 0 : Math.min(4, 1 + Math.floor((t - 2.4) / .7));
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (t >= (r * 3 + c) * .15) R(bx + 2 + c * 8, by + 2 + r * 8, 6, 6, sets[k][r]);
        sw(X + 19, t >= 2.3); if (t > 3) T('84,000 ELEMENTS', bx + 13, by - 9, 5, INK, 'center'); }},
    {id: 'insider', name: 'Paytm Insider Vibes', href: 'case-studies/insider-vibes.html',
      line: 'COVID shut every room Paytm Insider sold tickets to, overnight. We launched Insider Vibes, a live events platform, in about six months: 50,000+ paying users in the first month.',
      dur: 6.8, pose: t => ({arm: t < 2.2 ? 'phone' : t < 3 ? 'down' : t < 5.2 ? 'point' : 'cheer'}),
      says: t => [at(t, .2, 2.2) && ME('Lockdown. Every event, cancelled.'), at(t, 3, 5.2) && ME('Fine. We bring the events online.')],
      draw(t, X) { const bx = X + 28, by = G - 52, w = 34, h = 24;
        R(bx + 4, by + h, 1, G - by - h, POST); R(bx + w - 5, by + h, 1, G - by - h, POST);
        if (t < 2.4) { R(bx, by, w, h, '#c8372d'); T('ALL EVENTS', bx + w / 2, by + 6, 5, '#fff', 'center'); T('CANCELLED', bx + w / 2, by + 13, 5, '#fff', 'center'); }
        else { board(bx, by, w, h); if (((t * 2) | 0) % 2 === 0) R(bx + 3, by + 3, 2, 2, '#e5533d'); T('LIVE', bx + 7, by + 2, 4, INK);
          const k = cl((t - 2.6) / 2); for (let i = 0; i < Math.floor(k * 14); i++) R(bx + 3 + i * 2, by + h - 4 - Math.round(i * i * .06 + i * .2), 2, 2, FOREST); }
        const n = Math.floor(cl((t - 3) / 2.4) * 14), cols = ['#e38f9f', '#274e7a', '#fdb300', '#2b3d26', '#c8372d', '#8a5a3c', '#6fa0d8'];
        for (let pass = 1; pass >= 0; pass--) for (let i = 0; i < n; i++) { const row = i >= 7 ? 1 : 0; if (row !== pass) continue;
          const px = X + 66 + (i % 7) * 4 + row * 2, base = G - row * 3; R(px, base - 6, 2, 5, cols[i % 7]); R(px, base - 9, 2, 2, ['#b47a52', '#8d5b3e', '#e0b48f'][i % 3]); R(px, base - 1, 1, 1, INK); R(px + 1, base - 1, 1, 1, INK); }
        if (t > 4.4) T('50,000+ IN MONTH ONE', X + 80, G - 22, 4, INK, 'center'); }},
    {id: 'winuall', name: 'Winuall', href: 'case-studies/winuall.html',
      line: 'Winuall moved paper-based coaching institutes online when COVID shut every classroom. Light mode by default for students at noon, dark mode for teachers at 11pm.',
      dur: 6.4, pose: t => ({arm: t < 2 ? 'phone' : t < 2.6 ? 'reach' : t > 5 ? 'cheer' : 'down'}),
      says: t => [at(t, .2, 2) && ME('Students at noon. Teachers at 11pm.'), at(t, 2.8, 5.2) && ME('What if the default just matched their day?')],
      night(t) { return t < 0 ? 0 : cl((t - 2.4) / .6) * (t > this.dur ? cl(1 - (t - this.dur) / 1.2) : 1); },
      draw(t, X) { const n = this.night(t), dark = n > .5;
        sw(X + 19, t >= 2.3);
        R(X + 30, G - 48, 16, 28, INK); R(X + 31, G - 46, 14, 24, dark ? '#1d1f24' : '#fff');
        for (let i = 0; i < 4; i++) R(X + 33, G - 43 + i * 5, i % 2 ? 7 : 10, 2, dark ? '#4a4d57' : '#d6d6d6');
        R(X + 30, G - 20, 1, 20, POST); R(X + 45, G - 20, 1, 20, POST);
        R(X + 52, G - 18, 26, 2, WOOD); R(X + 54, G - 16, 2, 16, WOOD); R(X + 74, G - 16, 2, 16, WOOD);
        R(X + 68, G - 20, 6, 2, INK); R(X + 70, G - 29, 1, 9, INK); R(X + 64, G - 31, 7, 3, INK);
        R(X + 56, G - 22, 8, 4, '#f4f2ec');
        if (n < .5) { R(X + 44, G - 84, 7, 7, '#fdb300'); R(X + 42, G - 81, 1, 1, '#fdb300'); R(X + 52, G - 81, 1, 1, '#fdb300'); R(X + 47, G - 87, 1, 1, '#fdb300'); R(X + 47, G - 76, 1, 1, '#fdb300'); }
        else { R(X + 44, G - 84, 7, 7, '#f4f2ec'); R(X + 47, G - 85, 5, 6, '#3a3f5c'); } },
      post(t, X) { const n = this.night(t); if (n <= 0) return; ctx.globalAlpha = .35 * n;
        for (let j = 0; j < 12; j++) R(X + 63 - j * .5, G - 28 + j, 9 + j, 1, '#fdb300'); ctx.globalAlpha = 1; R(X + 65, G - 28, 5, 1, '#ffe38a'); }},
    {id: 'paytm', name: 'Paytm Chat', href: 'case-studies/paytm-chat.html',
      line: 'Paytm Chat put chat inside payments for 100M+ users. To split a group bill we didn’t build a form. We built a pizza: slices as shares, adjustable in real time.',
      dur: 6.4, pose: t => ({arm: t < 3.4 ? 'point' : t > 4.4 ? 'cheer' : 'down'}),
      says: t => [at(t, .2, 2.8) && ME('Splitting the bill? Make it a pizza.'), at(t, 3.8, 5.8) && ME('Sent. Instantly.')],
      draw(t, X) { table(X + 26, 30); const cx = X + 41, cy = G - 29;
        for (let dy = -10; dy <= 10; dy++) for (let dx = -10; dx <= 10; dx++) { const d = Math.hypot(dx, dy); if (d > 10.3) continue;
          const k = Math.floor((Math.atan2(dy, dx) + Math.PI) / (Math.PI / 4)) % 8; if (t >= .8 + k * .32) continue;
          R(cx + dx, cy + dy, 1, 1, d > 8.4 ? '#d39b55' : hash(dx * 31 + dy * 17) > .9 ? '#c0392b' : '#f3c64f'); }
        R(cx, G - 18, 1, 2, '#8a5a3c');
        for (let k = 0; k < 8; k++) { const tk = t - (.8 + k * .32); if (tk <= 0 || tk > 1.2) continue; const a = (k + .5) * Math.PI / 4 - Math.PI;
          ctx.globalAlpha = cl(1.2 - tk); R(cx + Math.cos(a) * (12 + tk * 6), cy + Math.sin(a) * (12 + tk * 6) - tk * 8, 3, 3, '#fdb300'); ctx.globalAlpha = 1; }
        if (t > 3.6) { R(X + 44, G - 64, 36, 10, '#00b9f1'); R(X + 46, G - 54, 3, 2, '#00b9f1'); T('MONEY SENT', X + 46, G - 62, 4, '#fff');
          L(X + 73, G - 59, X + 74, G - 58, '#fff'); L(X + 75, G - 59, X + 77, G - 61, '#fff');
          const cols = ['#e38f9f', '#fdb300', '#00b9f1', FOREST, '#c8372d'];
          if (t < 6.4) for (let i = 0; i < 26; i++) R(X + 36 + hash(i) * 50, G - 72 + (t - 3.6) * 22 * (.5 + hash(i + 9)), 1, 2, cols[i % 5]); } }},
    {id: 'airtel', name: 'Airtel Payments Bank', href: 'case-studies/airtel.html',
      line: 'Airtel Payments Bank’s merchant app served over a million shopkeepers. Field data showed they used the same two or three features every day, so those stay pinned and the rest stop crowding them.',
      dur: 6.4, pose: t => ({arm: t < 1.6 ? 'phone' : t < 4.6 ? 'point' : 'cheer'}),
      says: t => [at(t, .2, 1.6) && ME('60+ features on one screen?'), at(t, 2.8, 4.6) && ME('Pin what they actually use.'),
        at(t, 4.8, 6.4) && NPC('Yes. Just these three.', 41, -38)],
      draw(t, X) { for (let i = 0; i < 17; i++) { R(X + 23 + i * 2, G - 50, 2, 5, i % 2 ? '#fff' : '#e40000'); if (i % 2 === 0) R(X + 23 + i * 2, G - 45, 2, 1, '#e40000'); }
        R(X + 23, G - 50, 34, 1, '#b30000'); R(X + 24, G - 44, 2, 28, '#8a5a3c'); R(X + 55, G - 44, 2, 28, '#8a5a3c');
        R(X + 37, G - 27, 8, 11, '#e9e2d0'); R(X + 38, G - 34, 6, 7, '#9c6a48'); R(X + 38, G - 35, 6, 2, '#e8e8e8'); R(X + 38, G - 31, 2, 1, INK);
        R(X + 23, G - 17, 36, 2, '#a8835c'); R(X + 24, G - 15, 34, 15, WOOD); R(X + 27, G - 20, 4, 3, '#fdb300'); R(X + 49, G - 21, 5, 4, '#6fa0d8');
        R(X + 62, G - 52, 16, 30, INK); R(X + 63, G - 50, 14, 26, '#fff');
        const cols = ['#e40000', '#fdb300', '#274e7a', '#0ACF83', '#A259FF', '#FF7262', '#1ABCFE', '#8a5a3c'], keep = [0, 4, 8];
        let gone = 0; for (let i = 0; i < 15; i++) { const k = keep.indexOf(i);
          if (k < 0) { if (t >= 1.6 + (gone++) * .08) continue; R(X + 64 + (i % 3) * 4, G - 48 + Math.floor(i / 3) * 5, 3, 3, cols[i % 8]); }
          else if (t < 2.8) R(X + 64 + (i % 3) * 4, G - 48 + Math.floor(i / 3) * 5, 3, 3, cols[i % 8]);
          else R(X + 64 + k * 4.5, G - 48, 4, 4, cols[i % 8]); }
        if (t >= 2.8) T('PINNED', X + 70, G - 42, 3, INK, 'center'); }},
    {id: 'hope', name: 'Hope House', href: 'case-studies/hope-house.html',
      line: 'An NGO in Vellore needed a safe place for teenagers to ask questions about growing up. ‘Doubts’ lets them ask anonymously, answered by verified professionals. 93% positive feedback on anonymity.',
      dur: 6.8, pose: t => ({arm: t < 2.5 ? ((t * 6 | 0) % 2 ? 'write1' : 'write2') : t > 5.6 ? 'cheer' : 'down'}),
      says: t => [at(t, .2, 2.4) && ME('Your house is your hope.'), at(t, 3.1, 4.5) && NPC('Can I ask without my name?', 63, -31),
        at(t, 4.7, 6.6) && ME('No name. No profile. Just a real answer.')],
      draw(t, X) { L(X + 29, G, X + 33, G - 46, '#8a5a3c'); L(X + 47, G, X + 43, G - 46, '#8a5a3c'); R(X + 26, G - 26, 24, 1, '#8a5a3c');
        board(X + 27, G - 46, 22, 18);
        const pts = []; const seg = (a, b, c, d) => bline(a, b, c, d, (x, y) => pts.push([x, y]));
        seg(3, 9, 11, 2); seg(11, 2, 19, 9); seg(5, 9, 5, 16); seg(17, 9, 17, 16); seg(5, 16, 17, 16); seg(10, 16, 10, 12); seg(10, 12, 12, 12); seg(12, 12, 12, 16);
        const n = Math.floor(cl(t / 2.4) * pts.length); for (let i = 0; i < n; i++) R(X + 27 + pts[i][0], G - 46 + pts[i][1], 1, 1, FOREST);
        const p = cl((t - 2.8) / .3); if (p > 0) { const o = Math.round((1 - p) * 6);
          R(X + 61, G - 8, 2, 8, '#2c3140'); R(X + 64, G - 8, 2, 8, '#2c3140'); R(X + 59, G - 20 + o, 8, 13 - o, '#3b3f4a');
          R(X + 59, G - 27 + o, 8, 7, '#3b3f4a'); R(X + 60, G - 25 + o, 4, 4, '#262932'); R(X + 58, G - 15 + o, 3, 3, '#9fd0ff'); }
        if (t > 4.6 && t < 7.5) D(HEART, X + 61, G - 34 - (t - 4.6) * 5, false, cl(7.5 - t)); }},
    {id: 'mmt', name: 'MakeMyTrip bus checkout', href: 'case-studies/makemytrip.html',
      line: 'MakeMyTrip’s bus booking served 82M people a month. Instead of cutting the cross-sell, I moved when it appeared: 72% faster checkout, 34% lower drop-off.',
      dur: 6.8, pose: t => ({arm: t < 4.4 ? 'point' : t > 5.2 ? 'cheer' : 'down'}),
      says: t => [at(t, .2, 2.4) && ME('Here’s everywhere we’re losing people.'), at(t, 2.6, 4.4) && ME('Keep the cross-sell. Just move it.')],
      draw(t, X) { board(X + 30, G - 64, 38, 12); R(X + 32, G - 62, 13, 8, '#eaf2fb'); T('SEAT', X + 33, G - 61, 4, '#0b5fa5');
        R(X + 53, G - 62, 13, 8, '#eaf2fb'); T('PAY', X + 55, G - 61, 4, '#0b5fa5'); R(X + 46, G - 58, 5, 1, INK); R(X + 50, G - 59, 1, 3, INK);
        if (t < 2.6) { if ((t * 4 | 0) % 2 === 0) { R(X + 48, G - 70, 2, 4, '#e5533d'); R(X + 48, G - 65, 2, 1, '#e5533d'); } } else R(X + 47, G - 69, 3, 3, '#2e9e5b');
        R(X + 49, G - 52, 1, 30, POST);
        const bx = t < 0 ? X + 160 : t < 1.6 ? X + 160 - (1 - (1 - t / 1.6) ** 3) * 130 : t < 4.6 ? X + 30 : X + 30 + ((t - 4.6) ** 2) * 90;
        if (bx < X + 200) { R(bx, G - 24, 44, 20, '#f4f6f8'); R(bx, G - 24, 44, 3, '#eb2026'); R(bx, G - 8, 44, 4, '#0b5fa5');
          for (let i = 0; i < 5; i++) R(bx + 3 + i * 7, G - 19, 5, 5, '#9fd0f5'); R(bx + 39, G - 20, 4, 8, '#9fd0f5');
          R(bx + 5, G - 4, 6, 4, INK); R(bx + 31, G - 4, 6, 4, INK); R(bx + 7, G - 3, 2, 2, '#9a9a9a'); R(bx + 33, G - 3, 2, 2, '#9a9a9a');
          if ((t < 1.6 && t >= 0) || t > 4.6) for (let i = 0; i < 3; i++) R(bx + (t > 4.6 ? -8 - i * 5 : 46 + i * 5), G - 18 + i * 4, 4, 1, POST); }
        if (t > 5.2) { T('72% FASTER', X + 48, G - 42, 5, FOREST, 'center'); T('34% LESS DROP-OFF', X + 48, G - 33, 4, INK, 'center'); } }},
    {id: 'poll', name: 'Poll Police', href: 'case-studies/poll-police.html',
      line: 'Tamil Nadu Police needed polling-station info voters could trust and coordination tools for officers on low-power phones. Colour-coded by district, it launched across three districts.',
      dur: 6.4, pose: t => ({arm: t < 1.8 ? 'phone' : t < 4.4 ? 'point' : 'cheer'}),
      says: t => [at(t, .2, 1.9) && NPC('Build for the oldest phone in the field.', 63, -32), at(t, 2.2, 4.4) && ME('Colour by district. Readable at a glance.')],
      draw(t, X) { board(X + 26, G - 52, 26, 22); R(X + 30, G - 30, 1, 30, POST); R(X + 47, G - 30, 1, 30, POST);
        const ds = [[1.6, X + 28, G - 50, 10, 9, '#f08a24'], [2, X + 39, G - 50, 11, 7, '#2f6fd6'], [2.4, X + 28, G - 40, 22, 8, '#2e9e5b']];
        ds.forEach(([a, x, y, w, h, c]) => R(x, y, w, h, t >= a ? c : '#ececec'));
        if (t > 3.2) T('3 DISTRICTS LIVE', X + 39, G - 61, 4, FOREST, 'center');
        R(X + 61, G - 10, 2, 10, '#6b5536'); R(X + 64, G - 10, 2, 10, '#6b5536'); R(X + 59, G - 22, 8, 12, '#b89a5e'); R(X + 59, G - 13, 8, 1, '#5a4630');
        R(X + 58, G - 21, 1, 8, '#b89a5e'); R(X + 60, G - 29, 6, 7, '#8d5b3e'); R(X + 59, G - 31, 8, 2, '#5a4630'); R(X + 60, G - 25, 3, 1, INK); R(X + 60, G - 27, 1, 1, INK); }},
    {id: 'snapshot', name: 'Snapshot', href: 'case-studies/snapshot.html',
      line: 'Snapshot helps people recreate famous photos where they’re standing. The pose tip arrives while you’re still holding the camera, not afterwards in an edit screen.',
      dur: 6.2, pose: t => ({arm: t < 2.6 ? 'camera' : t > 4.6 ? 'cheer' : 'down'}),
      says: t => [at(t, .2, 2) && ME('Tip shows up while the camera’s up.'), at(t, 3, 4.8) && ME('One job: a better photo.')],
      draw(t, X) { for (let j = 0; j < 38; j++) { const w = 2 + Math.floor(j * .32); R(X + 57 - w / 2, G - 38 + j, w, 1, j % 12 === 11 ? '#a9a9a3' : '#c9c9c4'); }
        R(X + 55, G - 6, 4, 6, '#f6f6f4');
        if (at(t, .3, 2.4)) { const c = [[X + 44, G - 44, 1, 1], [X + 69, G - 44, -1, 1], [X + 44, G - 2, 1, -1], [X + 69, G - 2, -1, -1]];
          c.forEach(([x, y, a, b]) => { R(Math.min(x, x + a * 3), y, 4, 1, INK); R(x, Math.min(y, y + b * 3), 1, 4, INK); }); }
        if (at(t, .8, 2.4)) { R(X + 46, G - 54, 22, 7, INK); T('TILT UP', X + 57, G - 53, 4, '#fff', 'center'); }
        if (t > 2.6) { board(X + 26, G - 68, 18, 21); R(X + 27, G - 67, 16, 14, '#bfe3f5'); R(X + 34, G - 62, 2, 9, '#9a9a95'); R(X + 32, G - 55, 6, 2, '#9a9a95'); R(X + 27, G - 54, 16, 1, '#7fbf73'); } },
      post(t) { if (at(t, 2.3, 2.9)) RS(0, 0, vw, vh, `rgba(255,255,255,${(1 - (t - 2.3) / .6) * .9})`); }},
    {id: 'moneylingo', name: 'MoneyLingo', href: 'case-studies/moneylingo.html',
      line: 'Our first MoneyLingo concept was a board game with real money on the table, and it recreated the anxiety people already feel. The pivot: a quiz that never punishes a wrong answer.',
      dur: 6.6, pose: t => ({arm: t < 2.3 ? 'cash' : t < 5 ? 'point' : 'cheer'}),
      says: t => [at(t, .2, 2.2) && ME('This is actually kind of stressful.'), at(t, 3.4, 5.6) && ME('Same mechanic. Calmer experience.')],
      draw(t, X) { table(X + 26, 32);
        if (t < 2.4) { R(X + 28, G - 19, 28, 3, '#3e8e5e'); const cs = ['#fdb300', '#e38f9f', '#6fa0d8', '#fff'];
          for (let i = 0; i < 7; i++) R(X + 29 + i * 4, G - 20, 3, 1, cs[i % 4]); R(X + 50, G - 22, 6, 3, '#7fbf73'); R(X + 34, G - 22, 2, 2, '#fff');
          if (t > .6) R(X + 4, G - 28 + ((t * 6) % 3), 1, 2, '#6fb7e6'); }
        else { R(X + 34, G - 50, 18, 34, INK); R(X + 35, G - 48, 16, 30, '#fff'); T('?', X + 43, G - 46, 5, INK, 'center');
          R(X + 37, G - 37, 12, 4, t >= 3.2 ? '#f2b8b8' : '#e6e6e6'); R(X + 37, G - 31, 12, 4, t >= 4.2 ? '#bfe6c8' : '#e6e6e6');
          if (t >= 3.2) { L(X + 46, G - 36, X + 47, G - 35, '#c8372d'); L(X + 47, G - 36, X + 46, G - 35, '#c8372d'); }
          if (t >= 4.2) { L(X + 45, G - 29, X + 46, G - 28, FOREST); L(X + 46, G - 28, X + 48, G - 30, FOREST); } } }},
    {id: 'planteria', name: 'Planteria', href: 'case-studies/planteria.html',
      line: 'Planteria is for people who buy plants and don’t know how to keep them alive. We tested it with 8 users across 8 tasks and rebuilt the parts that confused them.',
      dur: 6.4, pose: t => ({arm: t < 3.2 ? 'can' : t > 4.8 ? 'cheer' : 'down'}),
      says: t => [at(t, .2, 1.6) && ME('Bought a plant. Now what?'), at(t, 3.6, 5.8) && ME('Okay, little guy. You’ll make it.')],
      draw(t, X) { R(X + 27, G - 9, 10, 2, '#a85a3a'); R(X + 28, G - 7, 8, 7, '#c96f4a');
        const g = t < 0 ? 0 : cl((t - 1.2) / 2.4), H = 6 + Math.round(g * 12), lean = (1 - g) * 5;
        const stem = g < .5 ? '#a3a04a' : '#3e8a45', leaf = g < .5 ? '#c2b24a' : '#4caf50'; let tx = X + 32, ty = G - 10;
        for (let j = 0; j < H; j++) { const x = X + 32 + Math.round(lean * (j / H) ** 2), y = G - 10 - j + Math.round(lean * (j / H) ** 2 * .6);
          R(x, y, 1, 1, stem); if (j % 3 === 2) { R(x - 2, y, 2, 1, leaf); R(x + 1, y - 1, 2, 1, leaf); } tx = x; ty = y; }
        if (g >= 1) R(tx - 1, ty - 2, 3, 2, '#e38f9f');
        if (at(t, .6, 3.2)) for (let i = 0; i < 4; i++) { const ph = (t * 2 + i / 4) % 1; R(X + 26 + ph * 3, G - 13 + ph * 4, 1, 1, '#5aa9e6'); }
        if (t > 3.6) { board(X + 44, G - 52, 24, 14); R(X + 47, G - 48, 4, 4, '#fdb300'); R(X + 54, G - 48, 4, 4, '#5aa9e6'); R(X + 61, G - 48, 4, 4, '#4caf50'); T('CARE', X + 56, G - 43, 3, INK, 'center'); } }},
    {id: 'storewell', name: 'Storewell', href: 'case-studies/storewell.html',
      line: 'For Storewell we followed people while they actually shopped. The app calls it ‘stock’, not groceries, and looks like a fridge, a mental model people already have.',
      dur: 6.2, pose: t => ({arm: t < 1 ? 'point' : t < 1.6 ? 'reach' : t > 4.6 ? 'cheer' : 'down'}),
      says: t => [at(t, .1, 1.4) && ME('People buy more in person.'), at(t, 2, 4.6) && ME('So the app looks like their fridge.')],
      draw(t, X) { const fx = X + 20;
        if (t < 1.4) { R(fx, G - 44, 20, 44, '#c9c9c4'); R(fx + 1, G - 43, 18, 42, '#fafafa'); R(fx + 1, G - 32, 18, 1, '#c9c9c4'); R(fx + 16, G - 28, 1, 8, '#9a9a9a'); R(fx + 16, G - 40, 1, 5, '#9a9a9a'); }
        else { R(fx, G - 44, 20, 44, '#c9c9c4'); R(fx + 1, G - 43, 18, 42, '#eaf4f6');
          [G - 32, G - 21, G - 10].forEach(y => R(fx + 1, y, 18, 1, '#c9c9c4'));
          T('VEG', fx + 10, G - 42, 3, INK, 'center'); R(fx + 3, G - 35, 3, 3, '#4caf50'); R(fx + 7, G - 34, 3, 2, '#e5533d'); R(fx + 12, G - 36, 4, 4, '#7fbf73');
          T('DAIRY', fx + 10, G - 31, 3, INK, 'center'); R(fx + 3, G - 26, 3, 5, '#fff'); R(fx + 7, G - 25, 4, 4, '#f3e6b0'); R(fx + 13, G - 26, 3, 5, '#fff');
          R(fx + 3, G - 15, 4, 5, '#9a9a9a'); R(fx + 9, G - 14, 6, 4, '#e38f9f');
          R(fx + 20, G - 44, 4, 44, '#c9c9c4'); R(fx + 21, G - 43, 2, 42, '#fafafa'); }
        const cx = X + 50; R(cx, G - 20, 18, 1, '#9a9a9a'); R(cx, G - 20, 1, 12, '#9a9a9a'); R(cx + 17, G - 20, 1, 12, '#9a9a9a'); R(cx + 1, G - 9, 16, 1, '#9a9a9a');
        for (let i = 1; i < 4; i++) R(cx + i * 4, G - 19, 1, 10, '#d6d6d6');
        R(cx + 2, G - 24, 3, 4, '#e5533d'); R(cx + 6, G - 22, 5, 2, '#f3c64f'); R(cx + 12, G - 25, 4, 5, '#4caf50'); R(cx + 17, G - 25, 1, 5, '#9a9a9a'); R(cx + 17, G - 25, 3, 1, '#9a9a9a');
        R(cx + 2, G - 7, 2, 2, INK); R(cx + 14, G - 7, 2, 2, INK); R(cx + 2, G - 8, 14, 1, '#9a9a9a'); }},
    {id: 'alarm', name: 'Group Alarm', href: 'case-studies/group-alarm.html',
      line: 'I set five alarms every morning and every app treated them as five unrelated events. Group Alarm turns the whole group off with one toggle. Designed, built and published solo: 1,000+ downloads in week one.',
      dur: 6.2, pose: t => ({arm: t < 2 ? 'down' : t < 2.6 ? 'reach' : t > 4.4 ? 'cheer' : 'down'}),
      says: t => [at(t, .1, 2) && ME('Five alarms. One intention.'), at(t, 2.6, 4.6) && ME('One switch, not five.')],
      draw(t, X) { const on = t >= 2.3;
        R(X + 21, G - 11, 1, 11, POST); R(X + 18, G - 15, 8, 4, on ? '#2e9e5b' : '#c9c9c4'); R(on ? X + 22 : X + 19, G - 14, 3, 2, '#fff');
        R(X + 30, G - 13, 48, 2, WOOD); R(X + 32, G - 11, 2, 11, WOOD); R(X + 74, G - 11, 2, 11, WOOD);
        for (let i = 0; i < 5; i++) { const cx = X + 32 + i * 9, ring = !on, j = ring ? (((t * 20 + i) | 0) % 2 ? -1 : 1) : 0;
          R(cx + j, G - 22, 2, 1, '#e5533d'); R(cx + 5 + j, G - 22, 2, 1, '#e5533d'); R(cx + j, G - 21, 7, 7, '#e5533d'); R(cx + 1 + j, G - 20, 5, 5, '#fff');
          R(cx + 3 + j, G - 19, 1, 2, INK); R(cx + 3 + j, G - 17, 2, 1, INK); R(cx + j, G - 14, 1, 1, INK); R(cx + 6 + j, G - 14, 1, 1, INK);
          if (ring && ((t * 6 + i) | 0) % 2) { R(cx + 3, G - 27, 1, 3, INK); R(cx + 3, G - 23 - 0, 1, 0, INK); } }
        if (on) T('MORNING RUN: OFF', X + 54, G - 32, 4, FOREST, 'center'); }}
  ];

  /* ---------- the in-between bits: coffee, keepy-uppy, guitar, petting ---------- */
  const SIP = ['Cold brew. Always.', 'Fuel for the next one.', 'Okay. Back to work.', 'Still cold. Still good.'];
  const STRUM = ['Four chords. Played with feeling.', 'This one’s for the pets.', 'Wonderwall? No.'];
  const PAT = n => `Who’s a good little ${NAMES[n]}?`;
  let sipN = 0, strumN = 0, patN = 0;
  const IDLE = {
    coffee: {dur: 3.6, pose: t => ({arm: t < .5 ? 'cup' : t < 1.4 ? 'sip' : t < 1.9 ? 'cup' : t < 2.6 ? 'sip' : 'cup'}), says: (t, b) => [at(t, 1.5, 3.5) && ME(SIP[b.n % SIP.length])]},
    keepy: {dur: 5.4, pose: t => { const ph = t < .5 ? 1 : ((t - .5) / .55) % 1, k = t >= .5 && t < 3.85 && (ph < .14 || ph > .92);
        return {legs: k || at(t, 3.75, 3.95) ? 'kick' : 'stand', arm: t > 4.5 ? 'cheer' : 'down'}; },
      says: t => [at(t, 4.4, 5.4) && ME('Nice header.')]},
    guitar: {dur: 5, pose: t => ({arm: t < .3 || t > 4.7 ? 'down' : ((t / .2) | 0) % 2 ? 'strum1' : 'strum2', item: t < .3 || t > 4.7 ? undefined : 'guitar'}),
      says: (t, b) => [at(t, 1, 3.4) && ME(STRUM[b.n % STRUM.length])]},
    pet: {dur: 4.6, pose: (t, b) => { const p = pets[b.n % pets.length], hy = 26 - p.h + (((t / .25) | 0) % 2);
        return t < .15 || t > 4.3 ? {arm: 'down'} : {crouch: t > .45 && t < 4, flip: true, arm: t > .45 && t < 4 ? 'pat' : 'down', hy}; },
      says: (t, b) => [at(t, 1, 3.6) && ME(PAT(pets[b.n % pets.length].name))]}};
  const IDLE_ORDER = ['coffee', 'keepy', 'guitar', 'pet'];

  /* ---------- timeline ---------- */
  const START = 70, SPEED = 32;
  const beats = []; let x = START;
  ST.forEach((st, i) => { x += 150; beats.push({k: 'walk', to: x}); const kind = IDLE_ORDER[i % 4];
    beats.push({k: 'idle', kind, dur: IDLE[kind].dur, n: Math.floor(i / 4)}); x += 90; beats.push({k: 'walk', to: x}); st.x = x; beats.push({k: 'stop', st, dur: st.dur}); });
  x += 130; beats.push({k: 'walk', to: x}); const END_X = x; beats.push({k: 'end', dur: 7});

  let clock = 0, bi = 0, bt = 0, px = START, walkD = 0, hasCup = true, paused = RM, visible = true, fade = 0, cupHidden = false;
  const ball = {on: false};
  const resetPets = () => pets.forEach((p, i) => { p.x = px - 18 - i * 15; p.hop = 0; });
  resetPets();

  const enter = () => { const b = beats[bi]; bt = 0;
    if (b.k === 'stop') { b.st.t0 = clock; hasCup = false; showCard(b.st); }
    if (b.k === 'idle') { hasCup = b.kind === 'coffee'; if (b.kind === 'keepy') ball.on = true; }
    if (b.k === 'end') showEnd();
    updateDots(); };
  const next = () => { if (bi < beats.length - 1) { bi++; enter(); } else restart(); };
  const restart = () => { bi = 0; bt = 0; px = START; walkD = 0; hasCup = true; ST.forEach(st => st.t0 = null); resetPets(); fade = 1; hideCard(); enter(); };
  const jump = i => { const idx = beats.findIndex(b => b.k === 'stop' && b.st === ST[i]); if (idx < 0) return;
    ST.forEach((st, j) => st.t0 = j < i ? clock - 100 : null); bi = idx - 1; px = beats[bi].to - 50; bt = 0; hasCup = false; ball.on = false;
    resetPets(); fade = 1; hideCard(); updateDots(); };

  /* ---------- UI: card, bubbles, dots ---------- */
  const upcoming = () => ST.find(st => st.t0 == null);
  function showCard(st) { const i = ST.indexOf(st) + 1;
    card.innerHTML = `<span class="walk__k">Stop ${String(i).padStart(2, '0')} / ${ST.length}</span><h2>${st.name}</h2><p>${st.line}</p><a href="${st.href}">Read the case study <span aria-hidden="true">→</span></a>`;
    card.classList.add('is-on'); }
  function hideCard() { card.classList.remove('is-on'); const n = upcoming();
    card.innerHTML = n ? `<span class="walk__k">Next stop</span><h2>${n.name}</h2>` : ''; }
  function showEnd() { card.innerHTML = `<span class="walk__k">That’s the walk</span><h2>Thanks for walking with me</h2><p>Thirteen stops, one cold brew and four very patient pets. It loops from the start in a moment.</p><a href="case-studies.html">See all the work <span aria-hidden="true">→</span></a>`;
    card.classList.add('is-on'); }
  ST.forEach((st, i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', `Jump to stop ${i + 1}: ${st.name}`); b.title = st.name;
    b.addEventListener('click', () => jump(i)); dotsEl.appendChild(b); });
  function updateDots() { const now = beats[bi].k === 'stop' ? beats[bi].st : null, done = ST.filter(st => st.t0 != null).length;
    [...dotsEl.children].forEach((d, i) => { d.classList.toggle('is-done', ST[i].t0 != null && ST[i] !== now); d.classList.toggle('is-now', ST[i] === now); });
    countEl.textContent = `${String(done).padStart(2, '0')} / ${ST.length}`; }
  const bubs = new Map();
  function bubbles(list) { const seen = new Set();
    list.filter(Boolean).forEach(o => { const id = o.who + o.text; seen.add(id); let el = bubs.get(id);
      if (!el) { el = document.createElement('span'); el.className = 'walk__say'; el.textContent = o.text; bubLayer.appendChild(el); bubs.set(id, el); requestAnimationFrame(() => el.classList.add('is-on')); }
      const W = stage.clientWidth, k = s / dpr, w = el.offsetWidth, ax = (o.x - cam) * k, ay = o.y * k;
      const left = Math.max(8 + w / 2, Math.min(W - 8 - w / 2, ax)); el.style.left = left + 'px'; el.style.top = ay + 'px'; el.style.setProperty('--tail', `${50 + (ax - left) / w * 100}%`); });
    bubs.forEach((el, id) => { if (!seen.has(id)) { bubs.delete(id); el.classList.remove('is-on'); setTimeout(() => el.remove(), 250); } }); }

  /* ---------- update + draw ---------- */
  function update(dt) {
    clock += dt; const b = beats[bi];
    if (b.k === 'walk') { const d = Math.min(SPEED * dt, b.to - px); px += d; walkD += d; if (px >= b.to - 1e-6) next();
      const last = ST.filter(st => st.t0 != null).pop(); if (card.classList.contains('is-on') && last && px > last.x + 45) hideCard(); }
    else { bt += dt; if (bt >= b.dur) next(); }
    const B = beats[bi], petting = B.k === 'idle' && B.kind === 'pet' ? pets[B.n % pets.length] : null; let j = 0;
    pets.forEach(p => { let tx;
      if (p === petting) tx = px - 3 - p.w; else tx = px - 18 - (j++) * 15 - (petting ? 6 : 0);
      const v = Math.max(-46, Math.min(46, (tx - p.x) * 4)); p.x += v * dt; p.d += Math.abs(v * dt); p.moving = Math.abs(v) > 3;
      if (p.hop > 0) p.hop = Math.max(0, p.hop - dt); });
    fade = Math.max(0, fade - dt * 2);
  }
  function petY(p) { const B = beats[bi]; let y = G - p.h;
    if (p.moving) y -= Math.abs(Math.sin(p.d * .45)) * 1.5;
    if (B.k === 'idle' && B.kind === 'guitar' && bt > .3 && bt < 4.7) y -= Math.abs(Math.sin(bt * 8 + p.i)) * 2;
    if (p.hop > 0) y -= Math.sin(p.hop / .5 * Math.PI) * 6; return Math.round(y); }
  function scenery() {
    RS(0, 0, vw, vh, '#f6f6f4');
    const layer = (f, T, fn) => { const c = cam * f; for (let i = Math.floor(c / T) - 1; i <= Math.floor((c + vw) / T) + 1; i++) fn(i * T - c, i); };
    layer(.15, 150, (sx, i) => { const y = 14 + hash(i) * 34, w = 14 + hash(i + 3) * 14; RS(sx + hash(i + 1) * 80, y, w, 4, '#ebebe6'); RS(sx + hash(i + 1) * 80 + 4, y - 3, w - 8, 3, '#ebebe6'); });
    layer(.35, 26, (sx, i) => { if (hash(i * 7) < .45) return; const h = 18 + Math.floor(hash(i) * 40), w = 12 + Math.floor(hash(i + 5) * 12);
      RS(sx, G - h, w, h, '#eeede8'); for (let y = G - h + 4; y < G - 4; y += 6) for (let xx = 3; xx < w - 3; xx += 5) if (hash(i * 13 + y + xx) > .5) RS(sx + xx, y, 2, 2, '#e6e5df'); });
    layer(.6, 64, (sx, i) => { if (hash(i * 3 + 1) < .35) return; const o = hash(i) * 30, r = 6 + Math.floor(hash(i + 2) * 4);
      RS(sx + o + r - 1, G - 12, 2, 12, '#ddd5c8'); for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)) * 2; RS(sx + o + r - w / 2, G - 12 - r + dy, w, 1, '#e2e7da'); } });
    RS(0, G, vw, 1, LINE); RS(0, G + 1, vw, vh - G, '#efeee9');
    layer(1, 23, (sx, i) => { if (hash(i * 11) > .5) { RS(sx, G - 1, 1, 1, '#cfd3c6'); RS(sx + 2, G - 2, 1, 2, '#cfd3c6'); } if (hash(i * 5) > .6) RS(sx + 9, G + 4 + hash(i) * 8, 2, 1, '#e2e1db'); });
  }
  function ballPos(t, me) { /* falls in, six juggles off the right foot, a big kick backwards onto the first pet's head, then it rolls away */
    const fx = me + 17, foot = G - 8, p0 = pets[0];
    if (t < .5) return [fx, G - 70 + (t / .5) ** 2 * (70 - 8)];
    if (t < 3.8) { const ph = ((t - .5) / .55) % 1; return [fx, foot - 4 * 16 * ph * (1 - ph)]; }
    const tx = p0.x + p0.w / 2 - 3, ty = petY(p0) - 6;
    if (t < 4.8) { const k = (t - 3.8); return [fx + (tx - fx) * k, foot + (ty - foot) * k - 4 * 40 * k * (1 - k)]; }
    if (Math.abs(t - 4.8) < .03 && !p0.hop) p0.hop = .5;
    const k = t - 4.8; return [tx - k * 60, Math.min(G - 7, ty + k * k * 200 - k * 30)];
  }
  function draw() {
    cam = Math.round(px - vw * (vw < 220 ? .24 : .3));
    scenery();
    ST.forEach(st => { if (st.x - cam > vw + 10 || st.x + 100 - cam < 0) return; st.draw(st.t0 == null ? -1 : clock - st.t0, st.x); });
    const endT = beats[bi].k === 'end' ? bt : -1;
    if (END_X - cam < vw + 10) { R(END_X + 30, G - 20, 2, 20, '#8a5a3c'); R(END_X + 22, G - 34, 30, 14, WOOD); T('MORE SOON', END_X + 37, G - 30, 4, INK, 'center'); }
    pets.forEach(p => D(p.f[p.moving ? ((p.d / 3) | 0) % 2 : ((clock * 1.5) | 0) % 2], p.x, petY(p)));
    const B = beats[bi]; let pose, says = [];
    if (B.k === 'walk') { const f = Math.floor(walkD / 5) % 4; pose = {legs: f % 2 ? 'walkB' : 'walkA', dy: f % 2 ? -1 : 0, arm: hasCup ? 'cup' : ['fwd', 'down', 'back', 'down'][f]}; }
    else if (B.k === 'stop') { pose = Object.assign({legs: 'stand'}, B.st.pose(bt)); says = B.st.says(bt); }
    else if (B.k === 'idle') { pose = Object.assign({legs: 'stand'}, IDLE[B.kind].pose(bt, B)); says = IDLE[B.kind].says(bt, B); }
    else { pose = {legs: 'stand', arm: ((bt * 3) | 0) % 2 ? 'wave' : 'cheer'}; says = [at(bt, .3, 4) && ME('That’s the walk. Thanks for coming.')]; }
    if (poke > clock) says = [ME(pokeLine)];
    const fr = charFrame(pose), me = Math.round(px), drawX = pose.flip ? me - (CW - OX - 16) : me - OX;
    D(fr, drawX, G - 31 - OY, pose.flip);
    if (B.k === 'idle' && B.kind === 'keepy' && ball.on) { const [bx, by] = ballPos(bt, me); if (bt < 5.3) D(BALL, bx, by); }
    if (B.k === 'idle' && B.kind === 'guitar') for (let k = 0; k <= Math.floor(bt / .45); k++) { const a = bt - k * .45; if (a > 1.6 || k * .45 > 4.3) continue;
      D(NOTE, me + 10 + (k % 3) * 4 + Math.sin(a * 4) * 2, G - 36 - a * 14, false, cl(1.6 - a)); }
    if (B.k === 'idle' && B.kind === 'pet' && at(bt, .6, 4.3)) { const p = pets[B.n % pets.length]; for (let k = 0; k <= Math.floor((bt - .6) / .7); k++) { const a = bt - .6 - k * .7; if (a > 1.4) continue;
      D(HEART, p.x + p.w / 2 - 2 + Math.sin(a * 5 + k) * 2, G - p.h - 8 - a * 12, false, cl(1.4 - a)); } }
    pets.forEach(p => { if (p.heart > clock) { const a = 1 - (p.heart - clock); D(HEART, p.x + p.w / 2 - 2, petY(p) - 7 - a * 10, false, cl(1 - a)); } });
    ST.forEach(st => { if (st.t0 == null || !st.night) return; const t = clock - st.t0, n = st.night(t); if (n > 0) RS(0, 0, vw, vh, `rgba(20,24,52,${.32 * n})`); if (st.post) st.post(t, st.x); });
    ST.forEach(st => { if (st.t0 != null && st.post && !st.night) st.post(clock - st.t0, st.x); });
    if (fade > 0) RS(0, 0, vw, vh, `rgba(246,246,244,${fade})`);
    const headY = G - 34 + (pose.crouch ? 3 : 0), stX = B.k === 'stop' ? B.st.x : 0;
    bubbles(says.filter(Boolean).map(o => o.who === 'me' ? {...o, x: me + (pose.flip ? 6 : 9), y: headY} : {...o, x: stX + o.x, y: G + o.y}));
  }

  /* ---------- poke me or a pet ---------- */
  let poke = 0, pokeLine = '';
  const POKES = ['Hey! Enjoy the walk.', 'Careful, the coffee’s cold, not spill-proof.', 'Psst, every stop links to the full case study.'];
  cv.addEventListener('click', e => { const r = cv.getBoundingClientRect(), wx = (e.clientX - r.left) * dpr / s + cam, wy = (e.clientY - r.top) * dpr / s;
    const p = pets.find(p => wx >= p.x - 2 && wx <= p.x + p.w + 2 && wy >= G - p.h - 4 && wy <= G + 2);
    if (p) { p.hop = .5; p.heart = clock + 1; return; }
    if (wx >= px - 2 && wx <= px + 20 && wy >= G - 34 && wy <= G) { pokeLine = POKES[(Math.random() * POKES.length) | 0]; poke = clock + 2.2; } });

  /* ---------- loop ---------- */
  const setPaused = v => { paused = v; playBtn.textContent = v ? 'Play' : 'Pause'; playBtn.setAttribute('aria-pressed', String(!v)); };
  playBtn.addEventListener('click', () => setPaused(!paused));
  nextBtn.addEventListener('click', () => { const n = upcoming(); n ? jump(ST.indexOf(n)) : restart(); setPaused(false); });
  addEventListener('keydown', e => { if (!visible || /input|textarea/i.test(e.target.tagName)) return;
    if (e.key === ' ' && e.target === document.body) { e.preventDefault(); setPaused(!paused); } if (e.key === 'ArrowRight') nextBtn.click(); });
  new IntersectionObserver(es => es.forEach(en => visible = en.isIntersecting)).observe(stage);
  new ResizeObserver(() => { resize(); draw(); }).observe(stage);
  resize(); setPaused(paused); enter(); hideCard();
  let last = performance.now();
  const loop = now => { const dt = Math.min(.05, (now - last) / 1000); last = now; if (visible && !document.hidden) { if (!paused) update(dt); draw(); } requestAnimationFrame(loop); };
  (document.fonts ? document.fonts.load('10px "Geist Pixel"') : Promise.resolve()).then(() => requestAnimationFrame(loop));
})();
