/* STRIP SCENES v3: one 30-second 12-bit story per case study.
   Every story has the same five beats: the problem, what I did, the insight, the decision, the result.
   The result always lands on one big number. Facts come straight from the case study pages.
   Each beat: c = caption, d = seconds, draw(g, t, X) = props, me(t) = my pose, say(t) = bubbles, fx = things in front of me.
   t is local to the beat (negative before it starts). X is where I stand. */
(function () {
  const S = window.SNStrip; if (!S) return;
  const PO = S.POSE, P = S.P, K = S.keys, wig = S.wig;
  const at = (t, a, b) => t >= a && t < b;
  const ME = (t, a, b, text) => at(t, a, b) && {who: 'me', text};
  const NPC = (t, a, b, text, x, y = -56) => at(t, a, b) && {who: 'npc', text, x, y};
  const RED = '#d0402f', GREEN = '#2e9e5b', YEL = '#fdd76b', BLUE = '#3b6fd8';
  const KS = ['The problem', 'What I did', 'The insight', 'The decision', 'The result'];
  /* the pets that follow me are the tools each project was built with */
  const STACK = {
    'ai-native-design-system': ['claude', 'gpt', 'figma', 'html', 'js'], 'paytm-chat': ['figma', 'usertesting', 'clevertap', 'protopie'],
    makemytrip: ['sketch', 'protopie', 'illustrator'], 'insider-vibes': ['figma', 'html', 'js', 'clevertap', 'lottie'], airtel: ['sketch', 'xd', 'protopie'],
    'poll-police': ['figma', 'html', 'js', 'reactnative'], winuall: ['sketch', 'figma', 'protopie'], 'hope-house': ['figma', 'illustrator'],
    snapshot: ['figma', 'usertesting', 'protopie'], planteria: ['figma', 'usertesting', 'aftereffects', 'lottie'], storewell: ['figma', 'usertesting', 'aftereffects', 'lottie'],
    moneylingo: ['figma', 'usertesting'], 'group-alarm': ['figma', 'sketch', 'reactnative'], 'divergent-minds-convergent-design': ['figma', 'usertesting', 'notebook']};
  const story = (id, accent, finale, beats) => S.scene(id, {accent, finale, pets: STACK[id], beats: beats.map((b, i) => ({k: KS[i], d: 4.2, ...b}))});

  /* drawing helpers on top of the engine kit */
  const tag = (g, x, y, s, fill = YEL, c = g.INK) => { const w = g.textW(String(s).toUpperCase()) + 6; g.box(x, y, w, 9, fill); g.text(s, x + 3, y + 2, c); return w; };
  const ctag = (g, x, y, s, fill = YEL, c = g.INK) => tag(g, x - (g.textW(String(s).toUpperCase()) + 6) / 2, y, s, fill, c);
  const phone = (g, x, y, w = 22, h = 36, fill = g.PAPER) => { g.screen(x, y, w, h, '#2a2a2a'); g.R(x + 2, y + 3, w - 4, h - 6, fill); };
  const cross = (g, x, y, w, h, k = 1, c = RED) => { if (k <= 0) return; g.line(x, y, x + w * Math.min(1, k * 2), y + h * Math.min(1, k * 2), c); if (k > .5) g.line(x + w, y, x + w - w * (k - .5) * 2, y + h * (k - .5) * 2, c); };
  const ring = (g, cx, cy, r, k = 1, c = RED) => { const n = Math.floor(40 * k); for (let i = 0; i < n; i++) { const a = i / 40 * Math.PI * 2; g.px(cx + Math.cos(a) * r, cy + Math.sin(a) * r, c); } };
  const disc = (g, cx, cy, r, c) => { for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); g.R(cx - w, cy + y, w * 2 + 1, 1, c); } };
  const stars = (g, x, y, n, c = '#e8a900') => { for (let i = 0; i < n; i++) { const sx = x + i * 6; g.R(sx + 1, y, 1, 1, c); g.R(sx, y + 1, 3, 1, c); g.R(sx + 1, y + 2, 1, 1, c); } };
  const tick = (g, x, y, c = GREEN) => { g.R(x, y + 2, 1, 1, c); g.R(x + 1, y + 3, 1, 1, c); g.R(x + 2, y + 2, 1, 1, c); g.R(x + 3, y + 1, 1, 1, c); g.R(x + 4, y, 1, 1, c); };
  const qmark = (g, x, y, c = RED) => g.text('?', x, y, c);
  const fly = (g, x0, y0, x1, y1, k, draw) => { if (k <= 0 || k >= 1) return; const e = g.ease(k); draw(g.lerp(x0, x1, e), g.lerp(y0, y1, e) - Math.sin(k * Math.PI) * 8); };
  const shelf = (g, x, w, rows, seed) => { const G = g.G; g.R(x, G - 44, 1, 44, g.INK); g.R(x + w - 1, G - 44, 1, 44, g.INK);
    for (let r = 0; r < rows; r++) { const y = G - 8 - r * 12; g.R(x, y, w, 1, g.INK);
      for (let i = 0; i < w - 4; i += 4) { const h = 4 + Math.floor(g.hash(seed + r * 31 + i) * 5), c = ['#e3a35a', '#7fb3d5', '#c8d86a', '#e07a5f', '#9a8fc9'][Math.floor(g.hash(seed + i + r) * 5)]; g.R(x + 2 + i, y - h, 3, h, c); } } };
  /* the result number: big pixel type that drops in, a small line under it */
  const big = (g, x, y, s, k, c = g.INK, sub) => g.stat(x, y, s, k, c, sub);
  const say = (t, ...list) => list;
  const talk = t => wig(t, PO.present, 'fa', 6, 2);
  const settle = (t, pose) => K(t, [[0, PO.stand], [.35, pose]]);
  const win = t => t < 1.6 ? settle(t, PO.point) : wig(t, PO.cheer, 'ua', 4, 3);
  const T = (t, a, d = 1) => Math.max(0, Math.min(1, (t - a) / d));
  const cnt = (t, a, rate, max) => Math.max(0, Math.min(max, Math.floor((t - a) * rate)));

  /* ===================== Voyage ===================== */
  const uiCard = (g, x, y, w, h, fill = g.PAPER, line = g.GREY) => { g.rbox(x, y, w, h, fill, '#2a2a2e'); g.R(x + 2, y + 2, w - 4, 2, line); g.lines(x + 2, y + 6, w - 6, Math.max(1, Math.floor((h - 8) / 3)), line); };
  story('ai-native-design-system', BLUE, 'coffee', [
    {c: 'Pre-sales designers rebuilt the same demo for every pitch. *Then it vanished.*',
      draw(g, t, X) { g.desk(X + 20, 86); [X + 24, X + 52, X + 80].forEach((mx, i) => { g.monitor(mx, g.G - 31, 18, 13); if (g.pop(t, .3 + i * .3)) uiCard(g, mx + 2, g.G - 29, 14, 9, '#eef3ff', '#9fb6e8'); });
        g.box(X + 92, g.G - 66, 16, 10, '#f3e7c8'); g.text('IN', X + 100, g.G - 63, g.MID, 'center');
        [0, 1, 2].forEach(i => fly(g, X + 26 + i * 28, g.G - 30, X + 96, g.G - 62, T(t, 1.6 + i * .5, .8), (x, y) => uiCard(g, x, y, 10, 7, '#eef3ff', '#9fb6e8'))); },
      me: t => t < 2.2 ? settle(t, PO.point) : PO.shrug,
      say: t => say(t, ME(t, 2.4, 4.2, 'Same screens. Again.'))},
    {c: 'I researched with 10+ designers, then built one documented system: *Voyage.*',
      draw(g, t, X) { if (t < 2) g.person(X + 92, t > .2 ? talk(t) : PO.stand, 'woman', -1);
        ['DOCS', 'PARTS', 'TYPE', 'COLOR'].forEach((s, i) => { const p = g.pop(t, 1.6 + (3 - i) * .35, .3); if (!p) return; const y = g.G - 10 - i * 10 - Math.round((1 - p) * 10);
          g.box(X + 30, y, 40, 10, ['#dbe7ff', '#cfe0ff', '#bcd2ff', '#9fbcf8'][i]); g.text(s, X + 50, y + 3, g.INK, 'center'); });
        if (g.pop(t, 3.2)) ctag(g, X + 50, g.G - 54, 'VOYAGE', BLUE, g.PAPER); },
      me: t => t < 1.6 ? settle(t, PO.pad) : K(t, [[1.6, PO.pad], [2, PO.reach], [3, PO.point]]),
      say: t => say(t, NPC(t, .3, 1.8, 'We rebuild it every pitch.', 92))},
    {c: '*Demos became products.* Each pitched to 10+ clients, re-skinned in one click.',
      draw(g, t, X) { const pal = ['#1f4fa8', '#b3122e', '#0b7a5a', '#4b2a86', '#c26b00'], c = t > 2.2 ? pal[Math.floor((t - 2.2) * 2.4) % 5] : BLUE;
        g.screen(X + 22, g.G - 66, 34, 24, c); g.R(X + 25, g.G - 62, 28, 3, 'rgba(255,255,255,.7)'); g.lines(X + 25, g.G - 56, 24, 4, 'rgba(255,255,255,.45)');
        for (let i = 0; i < 5; i++) { if (!g.pop(t, .5 + i * .2)) continue; const cy = g.G - 72 + i * 9; g.line(X + 57, g.G - 54, X + 74, cy + 3, g.GREY); g.box(X + 75, cy, 22, 7, g.PAPER); g.R(X + 77, cy + 2, 4, 3, pal[i]); g.R(X + 83, cy + 3, 11, 1, g.GREY); }
        if (g.pop(t, 1.6)) g.text('10+ CLIENTS', X + 86, g.G - 24, g.MID, 'center');
        g.toggle(X + 34, g.G - 36, t > 2.1, BLUE); },
      me: t => K(t, [[0, PO.stand], [1.4, PO.stand], [1.9, P({ua: 74, fa: 70})], [2.2, P({ua: 66, fa: 58})]]),
      say: t => say(t, ME(t, 2.6, 4.2, 'Same product. Their colours.'))},
    {c: 'Now designers build in Claude or Copilot. *A human approves every new component.*',
      draw(g, t, X) { g.desk(X + 8, 30); g.monitor(X + 14, g.G - 34, 26, 18, '#f4f1ff');
        g.box(X + 16, g.G - 32, 13, 8, '#e2dcff'); g.text('AI', X + 19, g.G - 30, '#6b3fd8'); if (g.pop(t, .6)) g.box(X + 24, g.G - 23, 14, 5, '#cfe0ff');
        const k = T(t, 1.4, .9); if (k > 0) { const x = g.lerp(X + 40, X + 58, g.ease(k)); uiCard(g, x, g.G - 56, 16, 12, '#eef3ff', '#9fb6e8'); if (k >= 1 && t < 3) g.text('NEW', x + 8, g.G - 64, g.MID, 'center'); }
        if (g.pop(t, 2.4)) { g.R(X + 72, g.G - 58, 9, 9, GREEN); tick(g, X + 74, g.G - 56, g.PAPER); }
        g.box(X + 84, g.G - 30, 22, 30, '#eef3ff'); g.text('MAIN', X + 95, g.G - 26, BLUE, 'center'); g.lines(X + 87, g.G - 19, 16, 4, '#9fb6e8');
        fly(g, X + 58, g.G - 56, X + 88, g.G - 16, T(t, 3, .8), (x, y) => uiCard(g, x, y, 12, 9, '#eef3ff', '#9fb6e8')); },
      me: t => K(t, [[0, PO.type], [2, PO.type], [2.3, PO.point], [3.4, PO.stand]]),
      say: t => say(t, ME(t, 2.2, 3.6, 'Approved.'))},
    {c: '$500M+ in deals won. 50+ designers. Turnaround cut 50%.',
      draw(g, t, X) { [10, 16, 24, 34].forEach((v, i) => { const h = Math.round(v * T(t, .2 + i * .15, .5)); g.R(X + 24 + i * 7, g.G - h, 5, h, i === 3 ? BLUE : '#9fb6e8'); });
        big(g, X + 76, g.G - 104, '$500M+', g.pop(t, 1, 1.4), BLUE, 'in enterprise deals won'); },
      me: win, say: t => say(t, ME(t, 2.8, 4.2, 'Okay. That worked.'))}]);

  /* ===================== Paytm Insider: Insider Vibes ===================== */
  const tv = (g, x, y, w = 40, h = 26, fill = '#1d2240') => { g.rbox(x, y, w, h, fill, '#2a2a2e'); g.R(x + w / 2 - 1, y + h, 2, g.G - y - h - 6, '#2a2a2e'); g.R(x + w / 2 - 8, g.G - 6, 16, 6, '#8a6a4a'); };
  const qr = (g, x, y) => { for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) if ((i < 2 && j < 2) || (i > 4 && j < 2) || (i < 2 && j > 4) || g.hash(i * 7 + j) > .55) g.R(x + i * 2, y + j * 2, 2, 2, g.INK); };
  story('insider-vibes', '#6b3fd8', 'guitar', [
    {c: 'COVID wiped out live events in three weeks. *Six months of runway left.*',
      draw(g, t, X) { g.R(X + 20, g.G - 10, 84, 10, '#3a3150'); g.R(X + 20, g.G - 10, 84, 1, g.INK); [X + 30, X + 62, X + 94].forEach((lx, i) => { g.R(lx, g.G - 70, 1, 60, g.INK); if (t < .8 + i * .6) g.R(lx - 3, g.G - 72, 7, 3, YEL); });
        g.night(T(t, .6, 2) * .9); if (g.pop(t, 2.2)) ctag(g, X + 62, g.G - 50, 'RUNWAY: 6 MO', RED, g.PAPER); },
      me: t => t < 2 ? PO.stand : PO.shrug,
      say: t => say(t, ME(t, 2.6, 4.2, 'Offline is gone.'))},
    {c: 'As lead designer, I designed *rooms* for admins, moderators and participants.',
      draw(g, t, X) { [['ADMIN', 'suit', 46, '#e8a900'], ['MOD', 'dev', 72, BLUE], ['FAN', 'girl', 98, GREEN]].forEach(([s, look, dx, c], i) => { if (!g.pop(t, .3 + i * .4)) return;
        g.person(X + dx, PO.stand, look, -1); ctag(g, X + dx, g.G - 80, s, c, g.PAPER); }); },
      me: t => settle(t, PO.present)},
    {c: 'People cast events to their TV, and 70% *hated scanning QR codes* to join.',
      draw(g, t, X) { tv(g, X + 40, g.G - 60); g.R(X + 43, g.G - 57, 34, 20, '#3a3f7a'); if (t < 2.4) qr(g, X + 53, g.G - 55); else { qr(g, X + 53, g.G - 55); cross(g, X + 51, g.G - 57, 18, 18, T(t, 2.4, .4)); }
        if (g.pop(t, 2.8)) ctag(g, X + 60, g.G - 72, '70% SAID NO', RED, g.PAPER); g.person(X + 100, t > 1 ? PO.shrug : PO.phone, 'pal', -1); },
      me: t => settle(t, PO.phone),
      say: t => say(t, NPC(t, .8, 2.6, 'Scan a code? On my TV?', 100))},
    {c: '*Same-wifi pairing* instead. And a design system that survived a full rebuild.',
      draw(g, t, X) { phone(g, X + 22, g.G - 54, 14, 24); tv(g, X + 66, g.G - 62, 36, 24, '#3a3f7a');
        for (let i = 0; i < 3; i++) if (t > .5 + i * .25) ring(g, X + 51, g.G - 46, 4 + i * 4, .25, '#6b3fd8');
        if (g.pop(t, 1.2)) { g.R(X + 70, g.G - 58, 28, 3, '#cfc6ff'); g.lines(X + 70, g.G - 52, 24, 4, '#8f86d8'); }
        const sw = t > 2.6; ctag(g, X + 84, g.G - 30, sw ? 'REACT' : 'ANGULAR', sw ? '#61dafb' : RED, g.INK); if (sw && t < 2.8) g.flash(.15); },
      me: t => settle(t, PO.point)},
    {c: '50,000+ bought tickets to the launch event. 62% came back for more.',
      draw(g, t, X) { const n = cnt(t, .2, 3, 6); for (let i = 0; i < n; i++) g.person(X + 104 - i * 9 + Math.max(0, 1 - (t - .2 - i / 3)) * 20, PO.stand, ['girl', 'pal', 'kid', 'woman', 'dev', 'suit'][i], -1);
        big(g, X + 66, g.G - 104, '50,000+', g.pop(t, 1.2, 1.4), '#6b3fd8', '62% CAME BACK'); },
      me: win}]);

  /* ===================== Paytm Chat ===================== */
  const booth = (g, x, s, c) => { g.R(x, g.G - 40, 30, 40, c); g.R(x + 2, g.G - 30, 26, 28, g.PAPER); g.R(x - 2, g.G - 44, 34, 6, c); g.text(s, x + 15, g.G - 43, g.PAPER, 'center'); };
  const pizza = (g, cx, cy, k) => { disc(g, cx, cy, 10, '#e8a35a'); disc(g, cx, cy, 8, '#f2c45a'); [[-3, -3], [3, 1], [-2, 4], [4, -4]].forEach(([a, b]) => g.R(cx + a, cy + b, 2, 2, RED));
    if (k > 0) { g.line(cx, cy, cx, cy - 10, g.INK); g.line(cx, cy, cx + 9, cy + 5, g.INK); g.line(cx, cy, cx - 9, cy + 5, g.INK); } };
  story('paytm-chat', '#00b9f1', 'pet', [
    {c: 'Google Pay added chat to payments. *Paytm users started leaving.*',
      draw(g, t, X) { booth(g, X + 22, 'PAYTM', '#00b9f1'); booth(g, X + 80, 'RIVAL', '#2e9e5b');
        ['kid', 'girl', 'pal'].forEach((l, i) => { const k = T(t, .4 + i * .6, 1.4); g.person(g.lerp(X + 40, X + 92, g.ease(k)) - i * 4, k > 0 && k < 1 ? S.walkPose((t + i) * 40) : PO.stand, l, 1); }); },
      me: t => t < 2.2 ? settle(t, PO.point) : PO.shrug,
      say: t => say(t, ME(t, 2.6, 4.2, 'They want to chat too.'))},
    {c: 'I designed chat from scratch inside Paytm’s design system, for 100M+ users.',
      draw(g, t, X) { g.board(X + 22, g.G - 66, 76, 40);
        [[26, 0, 24, '#e6f7fd'], [60, 1, 30, '#00b9f1'], [26, 2, 20, '#e6f7fd'], [56, 3, 34, '#fff3c4']].forEach(([dx, r, w, c], i) => { if (!g.pop(t, .3 + i * .4)) return; const y = g.G - 62 + r * 9; g.rbox(X + dx, y, w, 7, c, g.INK); if (i === 3) g.text('PAY', X + dx + 4, y + 1, g.INK); if (i === 1) { tick(g, X + dx + w - 9, y + 1, g.PAPER); tick(g, X + dx + w - 6, y + 1, g.PAPER); } });
        if (g.pop(t, 2.2)) g.text('100M+ USERS', X + 60, g.G - 22, g.MID, 'center'); },
      me: t => K(t, [[0, PO.stand], [.3, PO.write], [2, PO.write], [2.4, PO.point]])},
    {c: 'Interviews said it plainly: *“I come here to pay people, not chat.”*',
      draw(g, t, X) { g.person(X + 70, t > .5 ? talk(t) : PO.stand, 'suit', -1); },
      me: t => settle(t, PO.pad),
      say: t => say(t, NPC(t, .5, 4.2, 'I come here to pay people, not chat.', 70))},
    {c: 'So *pay comes first,* with a pizza for splitting the bill.',
      draw(g, t, X) { phone(g, X + 22, g.G - 70, 28, 46); const k = g.pop(t, .4); if (k) { g.rbox(X + 27, g.G - 50, 18, 10, '#00b9f1', g.INK); g.text('PAY', X + 36, g.G - 47, g.PAPER, 'center'); }
        if (g.pop(t, 1.4)) pizza(g, X + 78, g.G - 52, T(t, 2.2, .3)); if (g.pop(t, 2.6)) ctag(g, X + 78, g.G - 36, 'SPLIT 3 WAYS', YEL); },
      me: t => settle(t, PO.point),
      say: t => say(t, ME(t, 1, 2.4, 'Pay first.'))},
    {c: 'Drop-off fell from 34% to 12%. *Competitors copied it* within 6 months.',
      draw(g, t, X) { big(g, X + 64, g.G - 104, '12%', g.pop(t, .4, 1.4), '#00b9f1', 'DROP-OFF, DOWN FROM 34%');
        if (g.pop(t, 2.2)) { booth(g, X + 90, 'RIVAL', '#2e9e5b'); g.rbox(X + 95, g.G - 22, 18, 7, '#00b9f1', g.INK); g.text('PAY', X + 104, g.G - 20, g.PAPER, 'center'); } },
      me: win, say: t => say(t, ME(t, 2.6, 4.2, 'Copied in six months.'))}]);

  /* ===================== MakeMyTrip ===================== */
  const seats = (g, x, y, mode, hi) => { const L = [[4, 6, 7, 5], [4, 10, 3, 3], [3, 6, 7, 5]][mode];
    for (let r = 0; r < L[0]; r++) for (let c = 0; c < 3; c++) { if (c === 1 && mode !== 1) continue; g.R(x + c * L[2], y + r * (L[3] + 1), L[2] - 1, L[3], r * 3 + c === hi ? GREEN : '#cfd6e6'); } };
  const bus = (g, x, k) => { g.rbox(x, g.G - 30, 64, 24, '#e8432d', g.INK); for (let i = 0; i < 6; i++) g.R(x + 4 + i * 10, g.G - 26, 7, 7, '#cfe6ff'); g.R(x + 52, g.G - 18, 8, 10, '#cfe6ff');
    [x + 12, x + 50].forEach(wx => { disc(g, wx, g.G - 4, 4, g.INK); disc(g, wx, g.G - 4, 1, g.GREY); }); };
  story('makemytrip', '#e8432d', 'coffee', [
    {c: 'Bus buyers dropped off at seat selection and payment, *then called support.*',
      draw(g, t, X) { g.board(X + 22, g.G - 66, 30, 40); seats(g, X + 28, g.G - 62, 0, -1); if (t > 1.2) qmark(g, X + 54, g.G - 70);
        g.person(X + 82, t > 1.8 ? PO.phone : PO.think, 'kid', -1); if (t > 2.2 && Math.floor(t * 6) % 2) g.text('RING', X + 94, g.G - 74, RED, 'center'); },
      me: t => settle(t, PO.think),
      say: t => say(t, NPC(t, 2.4, 4.2, 'Hello, support? Which seat?', 82))},
    {c: 'I spent my first month *auditing, not designing,* then interviewed 15 riders.',
      draw(g, t, X) { g.board(X + 22, g.G - 66, 40, 34); ['FIND', 'SEAT', 'PAY'].forEach((s, i) => { if (!g.pop(t, .2 + i * .3)) return; g.box(X + 26, g.G - 62 + i * 10, 22, 8); g.text(s, X + 37, g.G - 60 + i * 10, g.INK, 'center'); if (i) g.R(X + 36, g.G - 64 + i * 10, 1, 2, g.INK); });
        g.R(X + 82, g.G - 50, 1, 50, g.INK); g.box(X + 76, g.G - 58, 14, 8, YEL); g.text('BUS', X + 83, g.G - 56, g.INK, 'center'); if (g.pop(t, 1.8)) { g.person(X + 96, PO.stand, 'girl', -1); g.text('15 RIDERS', X + 74, g.G - 24, g.MID, 'center'); } },
      me: t => K(t, [[0, PO.stand], [.3, PO.write], [1.6, PO.write], [2, PO.pad]])},
    {c: 'Stripping it down would *kill cross-sell:* flights, hotels, cabs.',
      draw(g, t, X) { phone(g, X + 26, g.G - 72, 30, 50); g.text('REVIEW', X + 41, g.G - 67, g.INK, 'center'); ['FLIGHT', 'HOTEL', 'CAB'].forEach((s, i) => { if (!g.pop(t, .4 + i * .3)) return; g.box(X + 30, g.G - 59 + i * 10, 22, 8, '#fff1ec'); g.text(s, X + 41, g.G - 57 + i * 10, '#e8432d', 'center'); });
        if (g.pop(t, 2)) { ctag(g, X + 80, g.G - 56, 'REVENUE', GREEN, g.PAPER); } },
      me: t => settle(t, PO.point),
      say: t => say(t, ME(t, 2.2, 4.2, 'Keep the cross-sell.'))},
    {c: 'I changed *when* info appears, plus one seat picker for every bus layout.',
      draw(g, t, X) { [1, 2, 3].forEach((n, i) => { const on = t > .3 + i * .5; g.box(X + 24 + i * 14, g.G - 70, 10, 10, on ? '#e8432d' : g.PAPER); g.text(n, X + 29 + i * 14, g.G - 67, on ? g.PAPER : g.INK, 'center'); });
        const m = t < 1.8 ? 0 : Math.floor((t - 1.8) * 1.2) % 3; g.board(X + 64, g.G - 66, 34, 40); seats(g, X + 69, g.G - 62, m, 4); g.text(['SLEEPER', 'SEATER', '2-DECK'][m], X + 81, g.G - 74, g.MID, 'center'); },
      me: t => settle(t, PO.present)},
    {c: '72% faster checkout. 34% lower drop-off.',
      draw(g, t, X) { bus(g, X + 40 + Math.max(0, t - 3) * 30); big(g, X + 70, g.G - 104, '72%', g.pop(t, .5, 1.4), '#e8432d', 'faster checkout & 34% lower drop-off'); },
      me: win}]);

  /* ===================== Airtel ===================== */
  const tiles = (g, x, y, n, cols = 8, s = 3) => { for (let i = 0; i < n; i++) g.R(x + (i % cols) * (s + 1), y + Math.floor(i / cols) * (s + 2), s, s + 1, ['#d0402f', '#3b6fd8', '#e8a900', '#2e9e5b'][i % 4]); };
  story('airtel', RED, 'pet', [
    {c: 'Airtel’s merchant app crammed 60+ features onto *one desktop-style home screen.*',
      draw(g, t, X) { phone(g, X + 36, g.G - 72, 38, 60); tiles(g, X + 40, g.G - 66, cnt(t, 0, 28, 64)); if (t > 2.4) for (let i = 0; i < 6; i++) g.R(X + 76 + (i % 2) * 5, g.G - 60 + i * 6 + Math.round((t - 2.4) * 6) % 6, 3, 4, ['#d0402f', '#3b6fd8', '#e8a900'][i % 3]); },
      me: t => t < 2 ? settle(t, PO.point) : PO.shrug,
      say: t => say(t, ME(t, 2.4, 4.2, 'Sixty features. On this?'))},
    {c: 'Shopkeepers used it *on cheap phones, between customers.* I studied the field data.',
      draw(g, t, X) { shelf(g, X + 76, 30, 3, 7); g.R(X + 50, g.G - 14, 36, 2, g.INK); g.R(X + 51, g.G - 12, 34, 12, '#c9a46a'); g.person(X + 70, Math.floor(t * 1.2) % 2 ? PO.phone : PO.shake, 'shop', -1); },
      me: t => settle(t, PO.pad),
      say: t => say(t, NPC(t, 1.4, 3.6, 'One sec. Customer.', 70))},
    {c: 'Most merchants use two or three features. But 5% of a million is 50,000 people.',
      draw(g, t, X) { phone(g, X + 30, g.G - 72, 38, 60); tiles(g, X + 34, g.G - 66, 64);
        if (t > .8) { g.R(X + 33, g.G - 67, 10, 7, 'rgba(255,255,255,.55)'); ring(g, X + 37, g.G - 63, 7, T(t, .8, .5), YEL); }
        if (g.pop(t, 2)) ctag(g, X + 88, g.G - 60, '5% IS 50,000', RED, g.PAPER); },
      me: t => settle(t, PO.point)},
    {c: '*Favourites on top,* categories as filters, 100+ icons over text.',
      draw(g, t, X) { phone(g, X + 30, g.G - 72, 38, 60); const k = T(t, .3, 1);
        for (let i = 0; i < 3; i++) g.R(X + 34 + i * 11, g.G - 66, 9, Math.round(2 + 8 * k), ['#d0402f', '#3b6fd8', '#2e9e5b'][i]);
        if (g.pop(t, 1.4)) for (let i = 0; i < 3; i++) g.rbox(X + 34 + i * 11, g.G - 53, 9, 5, i ? g.PAPER : '#ffe2dd', g.INK);
        if (g.pop(t, 2.2)) for (let i = 0; i < 12; i++) { const x = X + 35 + (i % 4) * 8, y = g.G - 44 + Math.floor(i / 4) * 8, c = ['#d0402f', '#3b6fd8', '#e8a900', '#2e9e5b'][i % 4]; i % 2 ? g.R(x, y, 5, 5, c) : (g.R(x + 1, y, 3, 5, c), g.R(x, y + 1, 5, 3, c)); }
        if (g.pop(t, 2.6)) g.text('100+ ICONS', X + 86, g.G - 40, g.MID, 'center'); },
      me: t => settle(t, PO.tablet)},
    {c: '14% faster feature discovery, and fewer support calls.',
      draw(g, t, X) { big(g, X + 64, g.G - 104, '14%', g.pop(t, .4, 1.4), RED, 'FASTER DISCOVERY');
        g.box(X + 92, g.G - 24, 14, 10, g.PAPER); g.R(X + 95, g.G - 22, 8, 2, g.INK); if (t < 1.6 && Math.floor(t * 8) % 2) g.text('RING', X + 99, g.G - 32, RED, 'center'); else if (t > 2) g.text('ZZ', X + 99, g.G - 32, g.MID, 'center'); },
      me: win}]);

  /* ===================== Winuall ===================== */
  story('winuall', '#6b5bd8', 'guitar', [
    {c: 'COVID closed classrooms. Coaching institutes ran *entirely on paper.*',
      draw(g, t, X) { g.board(X + 22, g.G - 66, 44, 28, '#2f4a3a'); g.text('CLOSED', X + 44, g.G - 56, g.PAPER, 'center');
        for (let i = 0; i < 3; i++) { const h = Math.round(Math.min(1, Math.max(0, t - i * .4)) * (10 + i * 4)); for (let j = 0; j < h; j += 2) g.box(X + 74 + i * 11, g.G - 2 - j, 10, 2, g.PAPER, '#c9c4b5'); } },
      me: t => t < 2 ? PO.stand : PO.shrug,
      say: t => say(t, ME(t, 2.4, 4.2, 'All of it on paper.'))},
    {c: 'As the only designer, I shipped 4 products on one design system.',
      draw(g, t, X) { [['SITE', 24, 'screen'], ['PORTAL', 48, 'screen'], ['STUDENT', 74, 'phone'], ['ADMIN', 92, 'phone']].forEach(([s, dx, kind], i) => { if (!g.pop(t, .3 + i * .45)) return;
        if (kind === 'screen') { g.screen(X + dx, g.G - 62, 20, 16, '#efedff'); g.R(X + dx + 3, g.G - 59, 14, 2, '#6b5bd8'); } else phone(g, X + dx, g.G - 66, 12, 20, '#efedff');
        g.text(s, X + dx + (kind === 'screen' ? 10 : 6), g.G - 42, g.MID, 'center'); }); if (g.pop(t, 2.4)) { g.R(X + 24, g.G - 32, 82, 2, '#6b5bd8'); g.text('ONE SYSTEM', X + 65, g.G - 28, '#6b5bd8', 'center'); } },
      me: t => settle(t, PO.present)},
    {c: 'Students and teachers want opposite things: *playful versus credible.*',
      draw(g, t, X) { g.person(X + 46, PO.cheer, 'kid', -1); g.person(X + 96, PO.stand, 'exec', -1);
        if (g.pop(t, .8)) ctag(g, X + 46, g.G - 80, 'PLAYFUL', YEL); if (g.pop(t, 1.6)) ctag(g, X + 96, g.G - 80, 'CREDIBLE', '#2f3542', g.PAPER);
        if (t > 2.2) { g.text('VS', X + 71, g.G - 40, RED, 'center'); } },
      me: t => settle(t, PO.think)},
    {c: '*One system that flexes:* light for students by day, dark for teachers by night.',
      draw(g, t, X) { const dark = t > 2; g.night(dark ? .8 : 0); if (!dark) disc(g, X + 30, g.G - 70, 5, YEL); else { disc(g, X + 30, g.G - 70, 5, '#f4f1ff'); disc(g, X + 33, g.G - 72, 4, '#3a3f60'); }
        phone(g, X + 50, g.G - 70, 28, 46, dark ? '#1e2033' : '#f6f4ff'); g.R(X + 54, g.G - 64, 20, 3, '#6b5bd8'); g.lines(X + 54, g.G - 58, 18, 5, dark ? '#4a4d6b' : '#cfcbe8');
        if (g.pop(t, 3)) tag(g, X + 74, g.G - 46, 'TIP', YEL); },
      me: t => settle(t, PO.point)},
    {c: '3 institutes, 12,000 students, 500,000+ projected reach.',
      draw(g, t, X) { big(g, X + 64, g.G - 104, '12,000', g.pop(t, .4, 1.4), '#6b5bd8', 'students & 3 institutes'); },
      me: win}]);

  /* ===================== Poll Police ===================== */
  const tnMap = (g, x, y, lit = []) => { const rows = ['..XXXX..', '.XXXXXX.', 'XXXXXXXX', 'XXXXXXX.', '.XXXXXX.', '.XXXXX..', '..XXXX..', '..XXX...', '...XX...'];
    rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === 'X') { const d = lit.find(l => l[0] === i && l[1] === j); g.R(x + i * 4, y + j * 4, 4, 4, d ? d[2] : (i + j) % 2 ? '#e4ddd0' : '#d8cfbf'); } })); };
  story('poll-police', '#5a4630', 'guitar', [
    {c: 'Tamil Nadu voters didn’t know where to vote, *or if it was safe.*',
      draw(g, t, X) { g.R(X + 80, g.G - 56, 1, 56, g.INK); g.box(X + 82, g.G - 56, 20, 7, g.PAPER); g.box(X + 59, g.G - 46, 20, 7, g.PAPER); g.text('?', X + 92, g.G - 54); g.text('?', X + 69, g.G - 44);
        g.person(X + 58, t > 1 ? PO.think : PO.stand, 'saree', 1); if (t > 1.6) qmark(g, X + 57, g.G - 76); },
      me: t => PO.stand,
      say: t => say(t, NPC(t, 2, 4.2, 'Which booth is mine?', 58))},
    {c: 'Tamil Nadu Police asked our team of five. I ran *field research.*',
      draw(g, t, X) { g.person(X + 22, PO.stand, 'dev', 1); g.person(X + 100, t > .4 ? talk(t) : PO.stand, 'cop', -1); if (g.pop(t, 1.6)) { g.person(X + 60, PO.stand, 'saree', -1); ctag(g, X + 40, g.G - 82, 'TEAM OF 5', YEL); } },
      me: t => t < 1.6 ? settle(t, PO.shake) : settle(t - 1.6, PO.pad),
      say: t => say(t, NPC(t, .4, 1.6, 'Can you help voters?', 100))},
    {c: 'Field reality: *old, low-power phones* and *many languages.*',
      draw(g, t, X) { phone(g, X + 30, g.G - 64, 22, 36, '#dcd8cc'); g.line(X + 36, g.G - 58, X + 44, g.G - 40, '#7a7a7a'); g.line(X + 44, g.G - 40, X + 40, g.G - 34, '#7a7a7a');
        [3, 0, 0].forEach((h, i) => g.R(X + 58 + i * 3, g.G - 56 - (i + 1) * 2, 2, (i + 1) * 2, i ? '#cfcdc6' : RED)); g.text('2G', X + 68, g.G - 60, RED);
        ['EN', 'TA', '?'].forEach((s, i) => { if (g.pop(t, 1.4 + i * .4)) ctag(g, X + 64 + i * 14, g.G - 40, s, g.PAPER); }); },
      me: t => settle(t, PO.point)},
    {c: '*Built for the worst phone, not the best.* Each district gets its own colour.',
      draw(g, t, X) { g.box(X + 24, g.G - 64, 32, 26, '#eef1e4'); g.lines(X + 27, g.G - 60, 26, 7, '#9a9a8a'); cross(g, X + 25, g.G - 63, 30, 24, T(t, .6, .5));
        tnMap(g, X + 66, g.G - 66, t > 1.8 ? [[2, 1, '#e8a35a'], [5, 3, '#7fb3d5'], [3, 6, '#9fd39a']].slice(0, 1 + Math.floor((t - 1.8) * 1.6)) : []); },
      me: t => settle(t, PO.present)},
    {c: 'Deployed in 3 districts at launch, built for 70M+ people.',
      draw(g, t, X) { tnMap(g, X + 22, g.G - 66, [[2, 1, '#e8a35a'], [5, 3, '#7fb3d5'], [3, 6, '#9fd39a']]); big(g, X + 84, g.G - 104, '3', g.pop(t, .4, 1.4), '#5a4630', 'districts at launch, built for 70M+ people'); },
      me: win}]);

  /* ===================== Hope House ===================== */
  story('hope-house', '#e07a5f', 'pet', [
    {c: 'Teens in an orthodox society had *nowhere safe to ask* about growing up.',
      draw(g, t, X) { g.R(X + 86, g.G - 56, 22, 56, '#8a6a4a'); g.R(X + 88, g.G - 54, 18, 54, '#a07c58'); g.R(X + 102, g.G - 28, 2, 2, g.INK);
        g.person(X + 62, PO.think, 'teen', 1); if (t > .8) qmark(g, X + 61, g.G - 78);
        if (t > 2) for (let i = 0; i < 6; i++) g.text(['!', '#', '?', '!', '%', '?'][i], X + 24 + (i % 3) * 8 + Math.sin(t * 4 + i) * 2, g.G - 70 + Math.floor(i / 3) * 8, '#9a8fc9'); },
      me: t => PO.stand,
      say: t => say(t, NPC(t, 1, 2.6, 'Who do I even ask?', 62))},
    {c: 'I was the only designer on a team of five developers, for an NGO.',
      draw(g, t, X) { g.desk(X + 26, 70); ['dev', 'pal', 'woman', 'kid', 'suit'].forEach((l, i) => { if (g.pop(t, .2 + i * .25)) g.person(X + 36 + i * 15, PO.stand, l, -1); });
        if (g.pop(t, 2)) ctag(g, X + 66, g.G - 82, '1 DESIGNER + 5 DEVS', '#e07a5f', g.PAPER); },
      me: t => settle(t, PO.wave)},
    {c: 'Nobody attaches their name to a question *they’re scared to ask.*',
      draw(g, t, X) { const k = T(t, 1.4, 1.2); g.box(X + 40, g.G - 60 + Math.round(k * 30), 44, 16, '#ffe9e3'); g.R(X + 41, g.G - 59 + Math.round(k * 30), 42, 5, '#e07a5f');
        g.text('NAME', X + 62, g.G - 52 + Math.round(k * 30), g.INK, 'center'); if (k > .1) cross(g, X + 40, g.G - 60 + Math.round(k * 30), 44, 16, T(t, 2.8, .4)); },
      me: t => K(t, [[0, PO.stand], [.8, PO.reach], [1.4, PO.reach], [2.2, PO.stand]])},
    {c: '*Anonymity is the feature.* Two tabs: learn daily, ask anonymously.',
      draw(g, t, X) { g.person(X + 98, PO.crouchPhone, 'teen', -1); phone(g, X + 30, g.G - 70, 34, 50);
        const tab = t > 2 ? 1 : 0; ['LEARN', 'ASK'].forEach((s, i) => { g.R(X + 32 + i * 15, g.G - 28, 15, 6, tab === i ? '#e07a5f' : '#efe7e3'); g.text(s, X + 39 + i * 15, g.G - 27, tab === i ? g.PAPER : g.MID, 'center'); });
        if (!tab) g.lines(X + 35, g.G - 62, 24, 8, '#d8c8c0'); else { g.text('?', X + 47, g.G - 58, '#e07a5f', 'center', 2); g.box(X + 35, g.G - 40, 24, 6); } },
      me: t => settle(t, PO.present),
      say: t => say(t, NPC(t, 2.4, 4.2, 'Asking for me.', 98, -44))},
    {c: 'Launched to a university of 50,000+ students.',
      draw(g, t, X) { [X + 104, X + 140].forEach(px => g.R(px, g.G - 76, 5, 76, '#c9b79c')); g.R(X + 100, g.G - 82, 50, 8, '#a8552c'); g.text('UNIVERSITY', X + 125, g.G - 80, g.PAPER, 'center');
        for (let i = 0; i < 4; i++) { const k = T(t, .2 + i * .6, 1.6); if (k > 0) g.person(g.lerp(X + 124, X + 30 + i * 18, k), k < 1 ? S.walkPose((t + i) * 30) : PO.phone, ['girl', 'kid', 'pal', 'woman'][i], -1); }
        big(g, X + 60, g.G - 104, '50,000+', g.pop(t, 1.4, 1.4), '#e07a5f', 'STUDENTS'); },
      me: win}]);

  /* ===================== Group Alarm ===================== */
  const clocks = (g, x, y, ringing, t, gap = 14) => { for (let i = 0; i < 5; i++) g.clock(x + i * gap, y, ringing(i), t); };
  story('group-alarm', '#e86a2c', 'guitar', [
    {c: 'I set five alarms to wake up once. Every app treats them as *five things.*', seatX: 4,
      draw(g, t, X) { g.night(Math.max(0, .9 - t / 3)); g.R(X - 14, g.G - 11, 50, 4, g.PAPER); g.R(X - 14, g.G - 11, 50, 1, g.INK); g.R(X - 14, g.G - 7, 50, 1, g.INK);
        g.R(X - 14, g.G - 18, 2, 18, g.INK); g.R(X + 35, g.G - 7, 2, 7, g.INK); clocks(g, X + 44, g.G - 64, i => t > .3 + i * .5 && t < .3 + i * .5 + .7, t); },
      me: t => t < 2.8 ? PO.sleepy : PO.sitPhone,
      say: t => say(t, ME(t, 2.8, 4.2, 'Five alarms. Again.'))},
    {c: 'I designed the *concept, flows and visuals.*',
      draw(g, t, X) { g.board(X + 22, g.G - 66, 74, 38); for (let i = 0; i < 6; i++) { if (!g.pop(t, .3 + i * .3)) continue; const x = X + 26 + (i % 3) * 23, y = g.G - 62 + Math.floor(i / 3) * 17; g.box(x, y, 20, 14, '#fff3e8'); g.lines(x + 3, y + 4, 12, 3, '#e8b48c'); } },
      me: t => K(t, [[0, PO.stand], [.3, PO.write], [3, PO.write], [3.4, PO.point]])},
    {c: 'Five alarms, *one intention:* get me up for work.',
      draw(g, t, X) { const k = T(t, 1, 1.2); for (let i = 0; i < 5; i++) g.clock(g.lerp(X + 30 + i * 14, X + 58, g.ease(k)), g.G - 60, false, t);
        if (k >= 1) { g.box(X + 46, g.G - 48, 32, 9, '#e86a2c'); g.text('WORK', X + 62, g.G - 46, g.PAPER, 'center'); } },
      me: t => settle(t, PO.think),
      say: t => say(t, ME(t, 2.6, 4.2, 'It’s one alarm, really.'))},
    {c: '*Familiar first.* Groups on top, each with its own colour, and one switch.',
      draw(g, t, X) { phone(g, X + 30, g.G - 72, 40, 58); [['WORK', '#e86a2c'], ['GYM', BLUE], ['NAP', GREEN]].forEach(([s, c], i) => { const y = g.G - 66 + i * 16;
        g.R(X + 33, y, 34, 13, c); g.text(s, X + 36, y + 2, g.PAPER); const on = !(i === 0 && t > 2); g.toggle(X + 54, y + 2, on, '#ffffff');
        if (i === 0) for (let j = 0; j < 5; j++) g.R(X + 36 + j * 4, y + 9, 2, 2, on ? g.PAPER : 'rgba(255,255,255,.35)'); }); },
      me: t => K(t, [[0, PO.stand], [1.4, PO.reach], [2, P({ua: 66, fa: 60})], [2.6, PO.stand]]),
      say: t => say(t, ME(t, 2.4, 4.2, 'One switch. Not five.'))},
    {c: '1,000+ downloads and 20+ reviews.',
      draw(g, t, X) { big(g, X + 64, g.G - 104, '1,000+', g.pop(t, .4, 1.4), '#e86a2c', 'downloads & 20+ reviews'); if (g.pop(t, 1.6)) stars(g, X + 50, g.G - 42, 5); },
      me: win}]);

  /* ===================== MoneyLingo ===================== */
  story('moneylingo', '#2c8a5a', 'coffee', [
    {c: 'Young people carry debt and *avoid learning about money.*',
      draw(g, t, X) { const p = g.person(X + 70, PO.stand, 'kid', -1); g.box(p.head[0] + 3, p.head[1] + 10, 14, 18, '#c96f4f'); g.text('DEBT', p.head[0] + 10, p.head[1] + 16, g.PAPER, 'center');
        if (g.pop(t, 1.6)) { g.box(X + 22, g.G - 62, 26, 16, g.PAPER); g.text('MONEY', X + 35, g.G - 57, '#2c8a5a', 'center'); cross(g, X + 23, g.G - 61, 24, 14, T(t, 2.2, .4)); } },
      me: t => settle(t, PO.think),
      say: t => say(t, NPC(t, 1, 2.6, 'I’ll learn later.', 70))},
    {c: 'Grad-school team. 12 interviews: people felt judged asking, *so they asked Reddit.*',
      draw(g, t, X) { g.person(X + 22, PO.pad, 'girl', 1); g.person(X + 80, t > .4 ? talk(t) : PO.stand, 'pal', -1);
        if (g.pop(t, 1.8)) { disc(g, X + 100, g.G - 74, 6, '#ff4500'); g.R(X + 97, g.G - 75, 2, 2, g.PAPER); g.R(X + 102, g.G - 75, 2, 2, g.PAPER); } if (g.pop(t, 2.4)) g.text('12 INTERVIEWS', X + 54, g.G - 84, g.MID, 'center'); },
      me: t => settle(t, PO.pad),
      say: t => say(t, NPC(t, .4, 1.8, 'Asking feels judged.', 80))},
    {c: 'Our board game flopped in testing. We *kept the game and ditched the board.*',
      draw(g, t, X) { const k = T(t, 1.6, 1); const w = Math.round(g.lerp(44, 22, k)), h = Math.round(g.lerp(30, 38, k)), x = X + 50 - w / 2, y = g.G - 30 - h;
        if (k < 1) { g.box(x, y, w, h, '#f6e7b8'); for (let i = 0; i < 4; i++) g.R(x + 3 + i * (w - 6) / 4, y + 3, 3, 3, ['#d0402f', BLUE, GREEN, '#e8a900'][i]); } else { phone(g, x, y, w, h, '#eaf6ef'); stars(g, x + 4, y + 10, 2); }
        if (t < 1.4 && t > .4) cross(g, X + 28, g.G - 60, 44, 30, T(t, .4, .5)); },
      me: t => settle(t, PO.point)},
    {c: 'Feedback never punishes you. It *cheers what you got right.*',
      draw(g, t, X) { phone(g, X + 30, g.G - 72, 40, 58, '#eaf6ef'); g.lines(X + 34, g.G - 66, 30, 2, '#9cc9ae');
        g.rbox(X + 34, g.G - 56, 32, 8, '#d7f0e0', g.INK); if (g.pop(t, .6)) stars(g, X + 46, g.G - 54, 3);
        if (g.pop(t, 1.6)) { g.rbox(X + 34, g.G - 44, 32, 8, YEL, g.INK); g.text('WORK ON IT', X + 50, g.G - 42, g.INK, 'center'); } },
      me: t => settle(t, PO.present),
      say: t => say(t, ME(t, 2.4, 4.2, 'No red X. Ever.'))},
    {c: '3 rounds of feedback and design shaped the final app.',
      draw(g, t, X) { big(g, X + 64, g.G - 104, '3 ROUNDS', g.pop(t, .4, 1.4), '#2c8a5a', 'feedback → design'); },
      me: win}]);

  /* ===================== Snapshot ===================== */
  const overlay = (g, x, k) => { for (let y = 0; y < 50; y += 3) { g.px(x, g.G - 54 + y, '#c2410c'); g.px(x + 14, g.G - 54 + y, '#c2410c'); } ring(g, x + 7, g.G - 60, 5, k, '#c2410c'); };
  story('snapshot', '#c2410c', 'guitar', [
    {c: 'Photo apps help after the shot. The moment is *when you’re holding the camera.*',
      draw(g, t, X) { g.person(X + 82, PO.wave, 'girl', -1); const k = T(t, 2.2, .8); if (k > 0) { phone(g, X + 30, g.G - 72 + Math.round((1 - k) * -10), 24, 30, '#fff1e8'); g.text('EDIT', X + 42, g.G - 62, '#c2410c', 'center'); g.text('LATE', X + 42, g.G - 54, RED, 'center'); } },
      me: t => settle(t, PO.camera),
      fx(t, g) { if (t > 1 && t < 1.15) g.flash(.4); }},
    {c: 'Grad-school team. 10 interviews, 80+ surveys, Crazy 8s, two rounds of testing.',
      draw(g, t, X) { g.person(X + 100, PO.write, 'dev', -1); g.board(X + 24, g.G - 64, 56, 32); const n = cnt(t, .2, 3, 8);
        for (let i = 0; i < n; i++) { const x = X + 27 + (i % 4) * 13, y = g.G - 61 + Math.floor(i / 4) * 14; g.box(x, y, 11, 12, '#fff1e8'); g.line(x + 2, y + 9, x + 8, y + 3, '#c2410c'); }
        if (g.pop(t, 3)) ctag(g, X + 52, g.G - 74, 'CRAZY 8S', YEL); },
      me: t => settle(t, PO.write)},
    {c: 'No app gave *real-time guidance* during capture.',
      draw(g, t, X) { for (let i = 0; i < 6; i++) { if (!g.pop(t, .2 + i * .25)) continue; const x = X + 26 + (i % 3) * 22, y = g.G - 66 + Math.floor(i / 3) * 20; g.rbox(x, y, 14, 14, ['#f4b183', '#9fb6e8', '#c8d86a', '#e07a5f', '#9a8fc9', '#7fb3d5'][i], g.INK);
        if (t > 2) qmark(g, x + 5, y + 4, g.PAPER); } },
      me: t => settle(t, PO.point),
      say: t => say(t, ME(t, 2.4, 4.2, 'Nobody helps in the moment.'))},
    {c: 'We cut the social feed and kept templates, even though only 38% ranked them.',
      draw(g, t, X) { g.box(X + 24, g.G - 64, 26, 22, g.PAPER); g.text('FEED', X + 37, g.G - 58, g.MID, 'center'); g.lines(X + 27, g.G - 50, 20, 2); cross(g, X + 25, g.G - 63, 24, 20, T(t, .5, .4));
        overlay(g, X + 70, T(t, 1.6, .6)); if (t > 1.6) g.person(X + 77, t > 2.4 ? PO.wave : PO.stand, 'girl', -1); if (g.pop(t, 2.8)) ctag(g, X + 37, g.G - 34, 'POSE GUIDE', '#c2410c', g.PAPER); },
      me: t => settle(t, PO.camera)},
    {c: 'Usability score rose from 76 to 82. *Testers asked when they could use it.*',
      draw(g, t, X) { big(g, X + 64, g.G - 104, '82', g.pop(t, .4, 1.4), '#c2410c', 'USABILITY SCORE, UP FROM 76'); },
      me: win, say: t => say(t, ME(t, 2.6, 4.2, 'When can we use it?'))}]);

  /* ===================== Storewell ===================== */
  const fridge = (g, x, open, rot) => { g.box(x, g.G - 50, 30, 50, '#eef1f2'); g.R(x + 1, g.G - 34, 28, 1, g.INK);
    if (open) { g.R(x + 1, g.G - 49, 28, 48, '#fff7dc'); for (let i = 0; i < 4; i++) { g.R(x + 1, g.G - 38 + i * 10, 28, 1, g.GREY); for (let j = 0; j < 4; j++) g.R(x + 4 + j * 6, g.G - 42 + i * 10, 4, 3, rot && (i + j) % 2 ? '#8a9a3a' : ['#e3a35a', '#7fb3d5', '#c8d86a', '#e07a5f'][j]); } g.R(x - 8, g.G - 50, 8, 50, '#dfe3e5'); }
    else g.R(x + 25, g.G - 46, 1, 8, g.INK); };
  const cart = (g, x, n) => { g.R(x, g.G - 18, 22, 1, g.INK); g.R(x, g.G - 18, 1, 12, g.INK); g.R(x + 21, g.G - 18, 1, 12, g.INK); g.R(x, g.G - 7, 22, 1, g.INK); disc(g, x + 4, g.G - 3, 2, g.INK); disc(g, x + 18, g.G - 3, 2, g.INK);
    for (let i = 0; i < n; i++) g.R(x + 2 + (i % 5) * 4, g.G - 11 - Math.floor(i / 5) * 4, 3, 3, ['#e3a35a', '#7fb3d5', '#c8d86a', '#e07a5f', '#9a8fc9'][i % 5]); };
  story('storewell', '#2e9e5b', 'coffee', [
    {c: 'Busy people overbuy groceries, then *waste them by Wednesday.*',
      draw(g, t, X) { fridge(g, X + 40, t > .6, t > 1.6); if (g.pop(t, 2)) { g.box(X + 82, g.G - 62, 22, 18, g.PAPER); g.R(X + 82, g.G - 62, 22, 5, RED); g.text('WED', X + 93, g.G - 54, g.INK, 'center'); } },
      me: t => t < 2 ? settle(t, PO.reach) : PO.shrug,
      say: t => say(t, ME(t, 2.4, 4.2, 'Bought it Sunday.'))},
    {c: 'Grad-school team. Surveys, interviews, and *shadowing shoppers* in store.',
      draw(g, t, X) { shelf(g, X + 60, 46, 3, 11); g.person(X + 22, PO.pad, 'dev', 1); g.person(X + 80 + Math.min(1, Math.max(0, t)) * 10, PO.cart, 'woman', 1); cart(g, X + 96 + Math.min(1, Math.max(0, t)) * 10, 4); },
      me: t => settle(t, PO.pad)},
    {c: 'People buy more in store than online. *That’s where the waste starts.*',
      draw(g, t, X) { shelf(g, X + 22, 40, 3, 4); shelf(g, X + 80, 30, 3, 9); cart(g, X + 60, cnt(t, .2, 6, 20)); if (t > 3) for (let i = 0; i < 3; i++) g.R(X + 62 + i * 7, g.G - 30 - ((t * 20 + i * 5) % 6), 3, 3, '#e07a5f'); },
      me: t => settle(t, PO.point),
      say: t => say(t, ME(t, 2.4, 4.2, 'In store, carts overflow.'))},
    {c: 'Help before and during the shop: a list, and stock shown *like fridge shelves.*',
      draw(g, t, X) { phone(g, X + 24, g.G - 70, 28, 46, '#ecf7f0'); for (let i = 0; i < 5; i++) { if (!g.pop(t, .3 + i * .2)) continue; g.box(X + 28, g.G - 64 + i * 7, 4, 4); if (t > 1.6 + i * .2) tick(g, X + 28, g.G - 64 + i * 7); g.R(X + 34, g.G - 63 + i * 7, 12, 1, g.GREY); }
        if (g.pop(t, 2)) { phone(g, X + 62, g.G - 70, 30, 46, '#fff7dc'); for (let i = 0; i < 4; i++) { g.R(X + 64, g.G - 58 + i * 9, 26, 1, g.GREY); for (let j = 0; j < 4; j++) g.R(X + 66 + j * 6, g.G - 62 + i * 9, 4, 3, ['#e3a35a', '#7fb3d5', '#c8d86a', '#e07a5f'][j]); } } },
      me: t => settle(t, PO.present)},
    {c: '5 flows tested with 10+ people. *They wanted it built.*',
      draw(g, t, X) { big(g, X + 64, g.G - 104, '5 FLOWS', g.pop(t, .4, 1.4), '#2e9e5b', 'TESTED WITH 10+ PEOPLE'); },
      me: win, say: t => say(t, ME(t, 2.6, 4.2, 'They asked when it ships.'))}]);

  /* ===================== Planteria ===================== */
  const plant = (g, x, k, wilt) => { g.R(x - 4, g.G - 8, 9, 8, '#c4683a'); g.R(x - 5, g.G - 9, 11, 2, '#a8552c'); const h = 4 + Math.floor(k * 14);
    g.R(x, g.G - 9 - h, 1, h, '#3f7d3a'); for (let i = 0; i < Math.floor(h / 3); i++) { const y = g.G - 11 - i * 3, s = i % 2 ? 1 : -1; g.R(s > 0 ? x + 1 : x - 3, y + (wilt ? 1 : 0), 3, 2, wilt ? '#a6a35a' : '#5fae54'); } };
  story('planteria', '#3f7d3a', 'pet', [
    {c: 'Plant owners kill plants because care advice is *scattered and contradictory.*',
      draw(g, t, X) { plant(g, X + 60, 1, t > 1.4); if (g.pop(t, .5)) ctag(g, X + 40, g.G - 60, 'WATER DAILY', g.PAPER); if (g.pop(t, 1)) ctag(g, X + 84, g.G - 48, 'WATER WEEKLY', g.PAPER); if (g.pop(t, 1.5)) ctag(g, X + 52, g.G - 72, 'MORE SUN?', g.PAPER); },
      me: t => t < 2 ? settle(t, PO.think) : PO.shrug,
      say: t => say(t, ME(t, 2.4, 4.2, 'Which one is right?'))},
    {c: 'Grad-school team. We audited competitors and mapped *three personas.*',
      draw(g, t, X) { g.person(X + 100, PO.pad, 'girl', -1); ['CASSANDRA', 'MATT', 'EMMA'].forEach((s, i) => { if (!g.pop(t, .3 + i * .5)) return; const x = X + 24 + i * 24; g.box(x, g.G - 62, 22, 26, '#eef6ea'); disc(g, x + 11, g.G - 54, 4, ['#e3a35a', '#7fb3d5', '#c86f8a'][i]); g.text(s.slice(0, 4), x + 11, g.G - 45, g.INK, 'center'); }); },
      me: t => settle(t, PO.present)},
    {c: 'Features shipped where *all three personas overlapped.*',
      draw(g, t, X) { const k = T(t, .2, 1.2); ring(g, X + 52, g.G - 56, 13, k, '#e3a35a'); ring(g, X + 68, g.G - 56, 13, k, '#7fb3d5'); ring(g, X + 60, g.G - 42, 13, k, '#c86f8a');
        if (t > 1.8) { disc(g, X + 60, g.G - 51, 3, Math.floor(t * 4) % 2 ? '#5fae54' : '#3f7d3a'); } if (g.pop(t, 2.4)) g.text('SHIP THIS', X + 60, g.G - 24, '#3f7d3a', 'center'); },
      me: t => settle(t, PO.point)},
    {c: 'Our own *calm, nature-led* design system, not an off-the-shelf kit.',
      draw(g, t, X) { ['#3f7d3a', '#5fae54', '#c8d86a', '#f3ecd8', '#a8552c'].forEach((c, i) => { if (g.pop(t, .2 + i * .2)) g.box(X + 24 + i * 10, g.G - 66, 9, 14, c); });
        plant(g, X + 86, .7, false); if (t > 1.8) { g.R(X + 66, g.G - 40, 10, 7, '#7fb3d5'); g.R(X + 76, g.G - 38, 5, 2, '#7fb3d5'); for (let i = 0; i < 3; i++) g.px(X + 82 + i, g.G - 34 + ((t * 20 + i * 3) % 12), '#7fb3d5'); } },
      me: t => settle(t, PO.water)},
    {c: 'Tested with 8+ users. They loved the feel, but *the home needed work.*',
      draw(g, t, X) { plant(g, X + 100, Math.min(1, .4 + T(t, .4, 1.4) * .6), false); big(g, X + 60, g.G - 104, '8+ USERS', g.pop(t, .6, 1.4), '#3f7d3a', 'LOVED THE FEEL'); },
      me: win}]);

  /* ===================== Divergent Minds, Convergent Design ===================== */
  const DM = '#5b5bd6';
  story('divergent-minds-convergent-design', DM, 'coffee', [
    {c: 'The faster-horses line is used to skip listening to users. *Does it hold up?*',
      draw(g, t, X) { g.person(X + 92, t > .4 && t < 2.6 ? talk(t) : PO.stand, 'exec', -1); g.board(X + 18, g.G - 64, 52, 30);
        g.text('FASTER', X + 44, g.G - 58, g.INK, 'center'); g.text('HORSES', X + 44, g.G - 50, g.INK, 'center'); if (g.pop(t, 2.4)) g.text('?', X + 64, g.G - 46, RED, 'left', 2); },
      me: t => settle(t, PO.think),
      say: t => say(t, NPC(t, .4, 2.4, 'Users don’t know what they want.', 92))},
    {c: 'So I ran a study: 8 people from 4 backgrounds, looking at the same two screens.',
      draw(g, t, X) { g.board(X + 26, g.G - 104, 58, 24); [0, 1].forEach(i => { g.screen(X + 30 + i * 26, g.G - 101, 24, 17, '#eef0ff'); g.lines(X + 33 + i * 26, g.G - 97, 16, 3, '#bdbde8'); });
        [['dev', 'DEV'], ['woman', 'ART'], ['teen', 'USER'], ['shop', 'PM']].forEach(([l, n], i) => { if (!g.pop(t, .3 + i * .35)) return; const x = X + 16 + i * 26; g.person(x, PO.stand, l, i < 2 ? 1 : -1); ctag(g, x, g.G - 75, n, i === 1 ? '#e6e3ff' : YEL); }); },
      me: t => settle(t, PO.pad), at: -18},
    {c: 'An *artistic background* mattered more than years in the industry.',
      draw(g, t, X) { const k = T(t, .4, 1.2); g.R(X + 34, g.G - 1 - Math.round(44 * k), 14, Math.round(44 * k), DM); g.R(X + 60, g.G - 1 - Math.round(20 * k), 14, Math.round(20 * k), '#bdbde8');
        if (k >= 1) { ctag(g, X + 41, g.G - 58, 'ART', '#e6e3ff'); ctag(g, X + 67, g.G - 34, 'YEARS', g.PAPER); } },
      me: t => settle(t, PO.point)},
    {k: 'The surprise', c: 'Everyday users weren’t blind to design. They cared *what a product gave them.*',
      draw(g, t, X) { const p = g.person(X + 76, PO.phone, 'teen', -1); if (g.pop(t, 1.2)) { const a = (t * .8) % 1; g.heart(p.head[0] - 2, p.head[1] - 8 - a * 6, 1 - a); }
        if (g.pop(t, .6)) { g.box(X + 24, g.G - 62, 30, 9, g.PAPER); g.text('LOOKS', X + 39, g.G - 60, g.MID, 'center'); }
        if (g.pop(t, 1.8)) { g.box(X + 24, g.G - 50, 30, 9, YEL); g.text('GIVES', X + 39, g.G - 48, g.INK, 'center'); } },
      me: t => settle(t, PO.present),
      say: t => say(t, NPC(t, 2.2, 4, 'Does it help me?', 76))},
    {c: 'And the industry makes designers *more critical, and more conformist.*',
      draw(g, t, X) { big(g, X + 64, g.G - 104, 'MORE CRITICAL', g.pop(t, .4, 1.4), DM, 'AND MORE CONFORMIST'); },
      me: win}]);
})();
