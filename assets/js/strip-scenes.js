/* STRIP SCENES: one 8-bit retelling per case study, panel by panel, following its comic strip.
   Each beat: c = caption, d = seconds, draw(g, t, X) = props behind me, me(t) = my pose, say(t) = bubbles,
   fx(t, g, me, X) = things in front of me. t is local to the beat. X is where I stand. */
(function () {
  const S = window.SNStrip; if (!S) return;
  const PO = S.POSE, P = S.P, K = S.keys, wig = S.wig;
  const at = (t, a, b) => t >= a && t < b;
  const ME = (t, a, b, text) => at(t, a, b) && {who: 'me', text};
  const NPC = (t, a, b, text, x, y = -56) => at(t, a, b) && {who: 'npc', text, x, y};
  const RED = '#d0402f', GREEN = '#2e9e5b', YEL = '#fdd76b', BLUE = '#3b6fd8';

  /* small drawing helpers on top of the engine kit */
  const tag = (g, x, y, s, fill = YEL, c = g.INK) => { const w = g.textW(String(s).toUpperCase()) + 6; g.box(x, y, w, 9, fill); g.text(s, x + 3, y + 2, c); return w; };
  const phone = (g, x, y, w = 22, h = 36, fill = g.PAPER) => { g.screen(x, y, w, h, '#2a2a2a'); g.R(x + 2, y + 3, w - 4, h - 6, fill); };
  const cross = (g, x, y, w, h, k = 1, c = RED) => { if (k <= 0) return; g.line(x, y, x + w * k, y + h * k, c); if (k > .5) g.line(x + w, y, x + w - w * (k - .5) * 2, y + h * (k - .5) * 2, c); };
  const ring = (g, x, y, w, h, k = 1, c = RED) => { const n = Math.floor(28 * k); for (let i = 0; i < n; i++) { const a = i / 28 * Math.PI * 2; g.px(x + w / 2 + Math.cos(a) * w / 2, y + h / 2 + Math.sin(a) * h / 2, c); } };
  const stars = (g, x, y, n, c = '#e8a900') => { for (let i = 0; i < n; i++) { const sx = x + i * 6; g.R(sx + 1, y, 1, 1, c); g.R(sx, y + 1, 3, 1, c); g.R(sx + 1, y + 2, 1, 1, c); } };
  const bars = (g, x, y, vals, c, hi) => vals.forEach((v, i) => g.R(x + i * 5, y - v, 3, v, i === hi ? RED : c));
  const lamp = (g, x, on) => { g.R(x, g.G - 13 - 10, 1, 10, g.INK); g.R(x - 1, g.G - 24, 6, 2, g.INK); if (on) g.R(x, g.G - 22, 4, 1, YEL); };
  const shelf = (g, x, w, rows, seed) => { const G = g.G; g.R(x, G - 44, 1, 44, g.INK); g.R(x + w - 1, G - 44, 1, 44, g.INK);
    for (let r = 0; r < rows; r++) { const y = G - 8 - r * 12; g.R(x, y, w, 1, g.INK);
      for (let i = 0; i < w - 4; i += 4) { const h = 4 + Math.floor(g.hash(seed + r * 31 + i) * 5), c = ['#e3a35a', '#7fb3d5', '#c8d86a', '#e07a5f', '#9a8fc9'][Math.floor(g.hash(seed + i + r) * 5)]; g.R(x + 2 + i, y - h, 3, h, c); } } };
  const say = (t, ...list) => list;
  const talk = t => wig(t, PO.present, 'fa', 6, 2);
  const settle = (t, pose) => K(t, [[0, PO.stand], [.35, pose]]);

  /* ===================== Voyage ===================== */
  S.scene('ai-native-design-system', {accent: BLUE, finale: 'coffee', beats: [
    {c: 'A pre-sales team winning $1M to $100M deals. Every pitch needed its own custom demo.', d: 4.6,
      draw(g, t, X) { g.desk(X + 54, 34); g.monitor(X + 60, g.G - 33, 20, 14);
        ['DEMO 1', 'DEMO 2', 'DEMO 3'].forEach((s, i) => { const p = g.pop(t, .6 + i * .5); if (p) tag(g, X + 18 + i * 4, g.G - 74 + i * 11 - (1 - p) * 3, s, g.PAPER); });
        g.person(X + 92, t > 2.6 ? talk(t) : PO.stand, 'suit', -1); },
      me: t => settle(t, PO.phone),
      say: t => say(t, NPC(t, 2.6, 4.6, 'Need another one by Friday.', 92))},
    {c: 'The problem: every demo was built from scratch, then lost in someone’s inbox.', d: 4.6, seatX: 0,
      draw(g, t, X) { g.chair(X); g.desk(X + 8, 36); g.monitor(X + 14, g.G - 31, 16, 12); g.monitor(X + 32, g.G - 31, 10, 12, '#eef3ff');
        const n = Math.min(6, Math.floor(Math.max(0, t) * 1.6)); for (let i = 0; i < n; i++) g.box(X + 50 + (i % 2) * 2, g.G - 15 - i * 3, 14, 3, g.PAPER);
        if (t > 3.2) { const k = g.cl((t - 3.2) / .8); for (let i = 0; i < 4; i++) g.R(X + 70 + k * 30 + i * 3, g.G - 20 - k * 20 + i * 4, 3, 2, g.GREY); } },
      me: t => wig(t, PO.type, 'fa', 6, 3),
      say: t => say(t, ME(t, 1.2, 3.6, 'Built from scratch. Again.'))},
    {c: 'Two to three months as a researcher, not a designer: talking to everyone who touched these deals.', d: 5,
      draw(g, t, X) { g.person(X + 66, t > .8 ? talk(t) : PO.stand, 'woman', -1); g.person(X + 92, PO.stand, 'exec', -1);
        if (g.pop(t, 2.4)) { g.box(X + 18, g.G - 10, 34, 10, '#f3e7c8'); g.text('GOD DOC', X + 35, g.G - 7, g.INK, 'center'); } },
      me: t => t < .4 ? settle(t, PO.pad) : wig(t, PO.pad, 'fa', 6, 3),
      say: t => say(t, NPC(t, .8, 2.6, 'We redo the same slides every time.', 66), NPC(t, 2.8, 5, 'Five to ten years of work, in one place.', 92))},
    {c: 'I studied 15 existing design systems, then narrowed it to four as real reference points.', d: 4.8,
      draw(g, t, X) { g.board(X + 22, g.G - 62, 64, 36);
        const keep = [2, 6, 9, 13]; for (let i = 0; i < 15; i++) { const cx = X + 26 + (i % 5) * 12, cy = g.G - 58 + Math.floor(i / 5) * 10, p = g.pop(t, .2 + i * .08);
          if (!p) continue; const k = keep.includes(i); g.box(cx, cy, 9, 7, k && t > 3 ? '#cfe0ff' : g.PAPER); if (!k) cross(g, cx, cy, 8, 6, g.cl((t - 2 - i * .05) / .3)); } },
      me: t => K(t, [[0, PO.stand], [.4, PO.write], [2.4, PO.write], [3, PO.point]]),
      say: t => say(t, ME(t, 3.2, 4.8, 'These four. The rest is noise.'))},
    {c: 'The system, Voyage, scaled to 84,000 elements across the org’s biggest financial clients.', d: 5.4,
      draw(g, t, X) { const brand = ['#1f4fa8', '#b3122e', '#0b7a5a', '#4b2a86'][Math.max(0, Math.floor((t - 2.6) * 1.6)) % 4];
        g.screen(X + 26, g.G - 64, 58, 34, t > 2.6 ? brand : g.PAPER); g.R(X + 54, g.G - 30, 2, 30, g.INK);
        g.text('84,000', X + 55, g.G - 56, t > 2.6 ? g.PAPER : g.INK, 'center'); g.text('ELEMENTS', X + 55, g.G - 49, t > 2.6 ? g.PAPER : g.INK, 'center');
        for (let i = 0; i < 4; i++) g.R(X + 32 + i * 13, g.G - 40, 9, 5, t > 2.6 ? 'rgba(255,255,255,.5)' : g.GREY);
        g.toggle(X + 90, g.G - 34, t > 2.4); },
      me: t => K(t, [[0, PO.stand], [1.6, PO.stand], [2.2, P({ua: 74, fa: 70})], [2.6, P({ua: 66, fa: 58})]]),
      say: t => say(t, ME(t, 2.8, 5.4, 'One click. Any client’s brand.'))},
    {c: 'Result: $500M+ in deals won in one year, including a single deal worth over $100M.', d: 4.6,
      draw(g, t, X) { g.board(X + 22, g.G - 60, 70, 32); g.text('$500M+ IN DEALS', X + 57, g.G - 54, g.INK, 'center');
        if (g.pop(t, 1)) g.text('ONE DEAL: $100M+', X + 57, g.G - 46, BLUE, 'center'); if (g.pop(t, 1.8)) g.text('50+ DESIGNERS', X + 57, g.G - 38, GREEN, 'center'); },
      me: t => t < 2.4 ? settle(t, PO.point) : wig(t, PO.cheer, 'ua', 4, 3),
      say: t => say(t, ME(t, 2.6, 4.6, 'Okay. That worked.'))}]});

  /* ===================== Airtel ===================== */
  S.scene('airtel', {accent: RED, finale: 'pet', beats: [
    {c: 'Airtel Payments Bank’s merchant app served over a million shopkeepers, mostly on old, low-powered phones.', d: 4.8,
      draw(g, t, X) { shelf(g, X + 74, 30, 3, 7); g.R(X + 40, g.G - 14, 36, 2, g.INK); g.R(X + 41, g.G - 12, 34, 12, '#c9a46a'); g.R(X + 41, g.G - 12, 34, 1, g.INK);
        g.person(X + 62, PO.phone, 'shop', -1); },
      me: t => settle(t, PO.shake),
      say: t => say(t, ME(t, .4, 2.4, 'Show me how you use it.'), NPC(t, 2.6, 4.8, 'Same three things. Every day.', 62))},
    {c: 'The app had 60+ features. All of them lived on one crowded home screen.', d: 4.6,
      draw(g, t, X) { phone(g, X + 30, g.G - 72, 38, 60); const n = Math.min(64, Math.floor(Math.max(0, t) * 30));
        for (let i = 0; i < n; i++) g.R(X + 34 + (i % 8) * 4, g.G - 66 + Math.floor(i / 8) * 6, 3, 4, ['#d0402f', '#3b6fd8', '#e8a900', '#2e9e5b'][i % 4]); },
      me: t => t < 2.2 ? settle(t, PO.point) : PO.shrug,
      say: t => say(t, ME(t, 2.4, 4.6, '60 features. Nobody can find one.'))},
    {c: 'Field data showed something simple: almost every merchant used the same two or three features.', d: 4.6,
      draw(g, t, X) { g.board(X + 22, g.G - 62, 80, 34); for (let i = 0; i < 6; i++) g.sticky(X + 26 + (i % 3) * 9, g.G - 58 + Math.floor(i / 3) * 9, i % 2 ? YEL : '#bfe3c4');
        if (g.pop(t, 1.4)) { g.text('USES 2-3', X + 77, g.G - 55, RED, 'center'); g.text('FEATURES', X + 77, g.G - 48, RED, 'center'); ring(g, X + 57, g.G - 60, 40, 20, g.cl((t - 1.6) / .6)); } },
      me: t => K(t, [[0, PO.stand], [.4, PO.write], [1.4, PO.write], [1.8, PO.point]]),
      say: t => say(t, ME(t, 2.4, 4.6, 'Two or three. Constantly. Nothing else.'))},
    {c: 'Pin what they actually use. Let everything else stay reachable, not buried.', d: 5,
      draw(g, t, X) { phone(g, X + 30, g.G - 72, 38, 60); const k = g.cl((t - 1) / 1.2);
        for (let i = 0; i < 3; i++) g.R(X + 34 + i * 11, g.G - 66, 9, 12 * k + 2, ['#d0402f', '#3b6fd8', '#2e9e5b'][i]);
        for (let i = 0; i < 16; i++) g.R(X + 34 + (i % 8) * 4, g.G - 50 + Math.floor(i / 8) * 4 + k * 10, 2, 2, g.GREY); },
      me: t => settle(t, PO.tablet),
      say: t => say(t, ME(t, 1.6, 4.4, 'Pin what they actually use.'))},
    {c: 'I designed 100+ custom icons, grouped so merchants could spot a category by colour and shape.', d: 5,
      draw(g, t, X) { const n = Math.min(24, Math.floor(Math.max(0, t) * 10)); for (let i = 0; i < n; i++) { const c = ['#d0402f', '#3b6fd8', '#e8a900', '#2e9e5b'][Math.floor(i / 6)];
          const x = X + 24 + (i % 6) * 7, y = g.G - 66 + Math.floor(i / 6) * 7; i % 2 ? g.R(x, y, 5, 5, c) : (g.R(x + 1, y, 3, 5, c), g.R(x, y + 1, 5, 3, c)); }
        shelf(g, X + 76, 26, 3, 3); g.person(X + 90, PO.phone, 'shop', -1); if (t > 3) g.heart(X + 88, g.G - 60 - (t - 3) * 4, g.cl(5 - t)); },
      me: t => settle(t, PO.shake),
      say: t => say(t, NPC(t, 2.6, 5, 'Found it. Didn’t even read.', 90))}]});

  /* ===================== Group Alarm ===================== */
  const clocks = (g, X, x0, ringing, t) => ['6:45', '6:55', '7:05', '7:15', '7:30'].forEach((s, i) => { g.clock(X + x0 + i * 16, g.G - 64, ringing(i), t); });
  S.scene('group-alarm', {accent: '#e86a2c', finale: 'guitar', beats: [
    {c: 'Every morning, I set five separate alarms just to get out of bed by 7:30.', d: 5, seatX: 4,
      draw(g, t, X) { g.night(g.cl(1.2 - t / 3) * .9 * (t > 0)); g.R(X - 14, g.G - 11, 50, 4, g.PAPER); g.R(X - 14, g.G - 11, 50, 1, g.INK); g.R(X - 14, g.G - 7, 50, 1, g.INK);
        g.R(X - 14, g.G - 18, 2, 18, g.INK); g.R(X + 35, g.G - 7, 2, 7, g.INK);
        clocks(g, X, 14, i => t > .6 + i * .7 && t < .6 + i * .7 + .9, t);
        ['6:45', '6:55', '7:05', '7:15', '7:30'].forEach((s, i) => { if (t > .6 + i * .7) g.text(s, X + 17 + i * 16, g.G - 53, g.MID, 'center'); }); },
      me: t => t < 3.6 ? PO.sleepy : PO.sitPhone,
      say: t => say(t, ME(t, 3.4, 5, 'Five alarms. One intention.'))},
    {c: 'Then I saw someone else’s screenshot of the exact same mess. It wasn’t just me.', d: 4.4,
      draw(g, t, X) { if (g.pop(t, .5)) { phone(g, X + 26, g.G - 70, 30, 44); for (let i = 0; i < 5; i++) { g.text(['6:45', '6:55', '7:05', '7:15', '7:30'][i], X + 30, g.G - 64 + i * 7); g.toggle(X + 44, g.G - 65 + i * 7, true, '#e86a2c'); } } },
      me: t => settle(t, PO.phone),
      say: t => say(t, ME(t, 1.8, 4.4, 'Wait. Everyone does this?'))},
    {c: 'I researched 100+ alarm apps. Every one treated alarms as unrelated objects.', d: 4.6,
      draw(g, t, X) { const n = Math.min(60, Math.floor(Math.max(0, t) * 30)); for (let i = 0; i < n; i++) g.box(X + 22 + (i % 12) * 6, g.G - 68 + Math.floor(i / 12) * 6, 5, 5, ['#fbe3d6', '#dbe7ff', '#e3f3e6'][i % 3]);
        if (t > 2.6) g.text('NO GROUPS', X + 57, g.G - 34, RED, 'center'); },
      me: t => t < 2.4 ? settle(t, PO.point) : PO.think,
      say: t => say(t, ME(t, 2.8, 4.6, 'Nobody groups them.'))},
    {c: 'Keep the familiar path fast. Build the real behaviour, groups, as something new on top.', d: 4.8,
      draw(g, t, X) { g.board(X + 20, g.G - 64, 74, 36); g.text('SINGLE', X + 24, g.G - 60); if (g.pop(t, .6)) g.toggle(X + 26, g.G - 52, true);
        if (g.pop(t, 1.6)) { g.text('GROUP', X + 58, g.G - 60); g.box(X + 56, g.G - 53, 34, 8, '#fff3e8'); g.text('MORNING', X + 58, g.G - 51); }
        for (let i = 0; i < 5; i++) if (g.pop(t, 2.2 + i * .15)) g.clock(X + 57 + i * 7 - 1, g.G - 42, false, t), g.R(X + 58 + i * 7, g.G - 44, 0, 0, g.INK); },
      me: t => K(t, [[0, PO.stand], [.4, PO.write], [3.2, PO.write], [3.6, PO.present]]),
      say: t => say(t, ME(t, 3.4, 4.8, 'Fast path stays. Groups on top.'))},
    {c: 'The idea that made it worth building: one toggle turns the whole group off.', d: 4.8,
      draw(g, t, X) { clocks(g, X, 30, () => t < 2.2, t); g.toggle(X + 18, g.G - 40, t < 2); },
      me: t => K(t, [[0, PO.stand], [1.4, PO.reach], [1.9, P({ua: 66, fa: 60})], [2.6, PO.stand]]),
      fx(t, g) { if (t > 2 && t < 2.3) g.flash(.25); },
      say: t => say(t, ME(t, .2, 1.6, 'Not running this week?'), ME(t, 2.6, 4.8, 'One switch. Not five.'))},
    {c: 'I designed, built and published it solo with Framer: 1,000+ downloads and 20+ reviews in week one.', d: 4.8,
      draw(g, t, X) { if (g.pop(t, .6)) { g.box(X + 22, g.G - 66, 74, 20); g.text('1,000+ DOWNLOADS', X + 59, g.G - 62, g.INK, 'center'); stars(g, X + 44, g.G - 54, 5); } },
      me: t => t < 2.2 ? settle(t, PO.phone) : wig(t, PO.cheer, 'ua', 4, 3),
      say: t => say(t, ME(t, 2.4, 4.8, 'People actually had this problem.'))}]});

  /* ===================== Hope House ===================== */
  const houseIcon = (g, x, y, k, c = g.INK) => { const pts = [[0, 8], [8, 0], [16, 8], [16, 18], [0, 18], [0, 8]]; const n = Math.floor(k * 5);
    for (let i = 0; i < n; i++) g.line(x + pts[i][0], y + pts[i][1], x + pts[i + 1][0], y + pts[i + 1][1], c); if (k >= 1) g.R(x + 6, y + 12, 4, 6, c); };
  S.scene('hope-house', {accent: '#e07a5f', finale: 'pet', beats: [
    {c: 'An NGO in Vellore found a hard problem: teenagers had nowhere safe to ask about growing up.', d: 5, seatX: 0,
      draw(g, t, X) { g.chair(X); g.desk(X + 10, 40); g.person(X + 60, PO.sitTalk, 'saree', -1); g.chair(X + 60, -1); g.box(X + 20, g.G - 15, 10, 2, g.PAPER); },
      me: t => wig(t, PO.sitTalk, 'fa', 3, 1),
      say: t => say(t, NPC(t, .6, 3, 'They have nowhere safe to ask.', 60, -46), ME(t, 3.2, 5, 'Then we build them somewhere.'))},
    {c: 'The identity came from one idea: your house is your hope. Your safe place.', d: 4.6,
      draw(g, t, X) { g.box(X + 22, g.G - 64, 34, 30); houseIcon(g, X + 31, g.G - 58, g.cl((t - .5) / 1.6), '#e07a5f'); },
      me: t => settle(t, PO.write),
      say: t => say(t, ME(t, 2.4, 4.6, 'Your house is your hope.'))},
    {c: 'Every social-app pattern (profiles, names, followers) would make it worse. A name on a question kills it.', d: 4.8,
      draw(g, t, X) { [['PHOTO', 20], ['NAME', 54], ['FOLLOWS', 88]].forEach(([s, dx], i) => { if (!g.pop(t, .2 + i * .3)) return; g.box(X + dx, g.G - 58, 32, 16);
          g.text(s, X + dx + 16, g.G - 53, g.INK, 'center'); cross(g, X + dx + 1, g.G - 57, 29, 13, g.cl((t - 1.8 - i * .5) / .4)); }); },
      me: t => K(t, [[0, PO.stand], [.4, PO.point], [1.6, PO.point], [2, PO.write]]),
      say: t => say(t, ME(t, 3.4, 4.8, 'No names. No profiles.'))},
    {c: 'I split it in two: ‘Home’ for reading, safe and passive. ‘Doubts’ for asking, answered by verified experts.', d: 5,
      draw(g, t, X) { phone(g, X + 26, g.G - 70, 28, 46); g.R(X + 28, g.G - 67, 24, 6, '#e07a5f'); g.text('HOME', X + 30, g.G - 66, g.PAPER); g.bars(X + 29, g.G - 58, 20, 6);
        if (g.pop(t, 1.4)) { phone(g, X + 60, g.G - 70, 28, 46); g.R(X + 62, g.G - 67, 24, 6, '#3b6fd8'); g.text('DOUBTS', X + 64, g.G - 66, g.PAPER); g.text('?', X + 73, g.G - 52, '#3b6fd8'); g.box(X + 64, g.G - 38, 20, 5); } },
      me: t => settle(t, PO.present),
      say: t => say(t, ME(t, 2.4, 5, 'Read safely. Ask anonymously.'))},
    {c: 'No name. No profile. Just a real, trustworthy answer from someone qualified to give one.', d: 5,
      draw(g, t, X) { g.night(Math.sin(g.cl(t / 5) * Math.PI) * 1.4 > 1 ? 1 : Math.sin(g.cl(t / 5) * Math.PI) * 1.4);
        const p = g.person(X + 64, PO.crouchPhone, 'teen', -1); if (t > 1) g.R(p.hand[0] - 3, p.hand[1] - 6, 6, 4, 'rgba(143,208,255,.35)'); },
      me: t => PO.stand,
      say: t => say(t, NPC(t, .6, 2.8, 'Is this normal? Asking for me.', 64, -40), NPC(t, 3, 5, 'Yes. Here’s why. You’re okay.', 64, -40))},
    {c: 'A direct endorsement from the NGO: 93% positive feedback on anonymity.', d: 4.8,
      draw(g, t, X) { g.person(X + 40, t > 1 ? P({ua: 48, fa: 78}) : PO.stand, 'saree', -1);
        if (g.pop(t, 2.4)) { g.box(X + 54, g.G - 64, 54, 12, '#fff3ee'); g.text('93% LOVED IT', X + 81, g.G - 60, '#e07a5f', 'center'); } },
      me: t => t < 1 ? PO.stand : PO.shake,
      say: t => say(t, NPC(t, 1, 3.8, 'This finally feels like somewhere safe.', 40))}]});

  /* ===================== Insider Vibes ===================== */
  S.scene('insider-vibes', {accent: '#6b3fd8', finale: 'guitar', beats: [
    {c: 'Paytm Insider sold tickets to concerts, comedy shows and festivals. Real events, real rooms.', d: 4.6, seatX: 0,
      draw(g, t, X) { g.chair(X); g.desk(X + 8, 34); g.laptop(X + 18, g.G - 14); g.box(X + 46, g.G - 66, 22, 28, '#6b3fd8'); g.text('LIVE', X + 57, g.G - 56, g.PAPER, 'center');
        for (let i = 0; i < 3; i++) if (g.pop(t, .6 + i * .4)) g.box(X + 72 + i * 2, g.G - 58 + i * 8, 14, 6, YEL); },
      me: t => wig(t, PO.type, 'fa', 6, 3),
      say: t => say(t, ME(t, 1.8, 4.2, 'Next weekend: three sold-out shows.'))},
    {c: 'Then COVID hit. Every room they sold tickets to stopped existing, overnight.', d: 4.6,
      draw(g, t, X) { g.box(X + 24, g.G - 66, 52, 30); g.text('LOCKDOWN', X + 50, g.G - 61, g.INK, 'center'); g.bars(X + 28, g.G - 52, 44, 4);
        if (g.pop(t, 1.2)) { g.box(X + 36, g.G - 44, 60, 12, '#fff'); g.R(X + 37, g.G - 43, 58, 10, RED); g.text('ALL CANCELLED', X + 66, g.G - 40, g.PAPER, 'center'); } },
      me: t => t < 2 ? settle(t, PO.phone) : PO.shrug,
      say: t => say(t, ME(t, 2.2, 4.6, 'Every event. Cancelled.'))},
    {c: 'The company had one option: become a digital events platform, fast, or the business didn’t survive.', d: 4.8,
      draw(g, t, X) { g.desk(X + 34, 22, 12); g.chair(X + 62, -1); g.chair(X + 86, -1); g.person(X + 62, PO.sit, 'exec', -1); g.person(X + 86, PO.sitTalk, 'suit', -1); },
      me: t => K(t, [[0, PO.stand], [2.4, PO.stand], [2.8, PO.point]]),
      say: t => say(t, NPC(t, .3, 2.4, 'Online. Fast. Or we’re done.', 86, -48), ME(t, 2.8, 4.8, 'Then we bring the events online.'))},
    {c: 'I mapped user goals against business needs, and built the design system to flex. Mobile, desktop, TV.', d: 5,
      draw(g, t, X) { g.board(X + 22, g.G - 64, 80, 36); g.box(X + 26, g.G - 60, 26, 9); g.text('USERS', X + 39, g.G - 58, g.INK, 'center');
        if (g.pop(t, .8)) { g.box(X + 72, g.G - 60, 26, 9); g.text('BIZ', X + 85, g.G - 58, g.INK, 'center'); g.line(X + 52, g.G - 56, X + 72, g.G - 56); }
        let tx = X + 26; ['MOBILE', 'DESKTOP', 'TV'].forEach((s, i) => { const w = g.textW(s) + 6; if (g.pop(t, 2 + i * .4)) tag(g, tx, g.G - 44, s, ['#fdd76b', '#bfe3c4', '#cbd8ff'][i]); tx += w + 2; }); },
      me: t => K(t, [[0, PO.stand], [.4, PO.write], [3.6, PO.write], [4, PO.tablet]]),
      say: t => say(t, ME(t, 3.4, 5, 'Flex, don’t lock in.'))},
    {c: 'Midway, engineering moved from Angular to React. The flexible system barely slowed us down.', d: 4.6,
      draw(g, t, X) { g.board(X + 24, g.G - 60, 60, 30); g.text('ANGULAR', X + 54, g.G - 54, g.INK, 'center'); if (g.pop(t, .8)) g.text('-> REACT', X + 54, g.G - 44, '#3b6fd8', 'center'); },
      me: t => K(t, [[0, PO.shrug], [2, PO.shrug], [2.4, PO.snap]]),
      say: t => say(t, ME(t, 2.4, 4.6, 'Same system. Keep shipping.'))},
    {c: 'Result: 50,000+ paying users in the first month, 62% came back. The business survived by building something new.', d: 5,
      draw(g, t, X) { g.screen(X + 24, g.G - 66, 62, 38); for (let i = 0; i < 8; i++) if (g.pop(t, .2 + i * .15)) g.R(X + 28 + (i % 4) * 14, g.G - 61 + Math.floor(i / 4) * 12, 12, 10, ['#cbd8ff', '#fbe3d6', '#e3f3e6', '#f4e3ff'][i % 4]);
        if (g.pop(t, 1.8)) g.text('50,000+ PAYING', X + 55, g.G - 36, '#6b3fd8', 'center'); },
      me: t => t < 2.2 ? settle(t, PO.point) : wig(t, PO.cheer, 'ua', 4, 3),
      say: t => say(t, ME(t, 2.4, 5, '62% came back for more.'))}]});

  /* ===================== MakeMyTrip ===================== */
  const flow = (g, X, t) => { g.board(X + 22, g.G - 64, 82, 36); ['FIND', 'SEAT', 'PAY'].forEach((s, i) => { g.box(X + 26 + i * 26, g.G - 54, 22, 10); g.text(s, X + 37 + i * 26, g.G - 51, g.INK, 'center'); if (i) g.line(X + 22 + i * 26, g.G - 49, X + 26 + i * 26, g.G - 49); }); };
  S.scene('makemytrip', {accent: '#e8432d', finale: 'keepy', beats: [
    {c: 'MakeMyTrip’s bus platform served 82 million people. In my first month, I didn’t design anything. I audited.', d: 4.8,
      draw(g, t, X) { flow(g, X, t); for (let i = 0; i < 5; i++) if (g.pop(t, .8 + i * .4)) g.R(X + 32 + i * 15, g.G - 40, 2, 2, RED); },
      me: t => K(t, [[0, PO.stand], [.4, PO.point], [1.8, PO.write], [3, PO.point]]),
      say: t => say(t, ME(t, 2.6, 4.8, 'Here’s everywhere we’re losing people.'))},
    {c: 'Fix this, they said. Users drop off right between seat selection and payment.', d: 4.6,
      draw(g, t, X) { flow(g, X, t); g.person(X + 116, t > .4 ? talk(t) : PO.stand, 'exec', -1);
        if (t > 1) { const k = g.cl((t - 1) / 1.2); for (let i = 0; i < 3; i++) g.px(X + 76, g.G - 43 + k * (12 + i * 5), RED); } },
      me: t => settle(t, PO.think),
      say: t => say(t, NPC(t, .4, 2.6, 'Fix this. They drop off here.', 116))},
    {c: 'The obvious fix was to strip the checkout down. But the cross-sell drove major revenue. I didn’t cut it.', d: 5,
      draw(g, t, X) { flow(g, X, t); if (g.pop(t, .8)) { g.box(X + 58, g.G - 31, 46, 16, '#fde3e2'); g.text('CROSS-SELL', X + 81, g.G - 28, RED, 'center'); g.text('= REVENUE', X + 81, g.G - 21, RED, 'center'); }
        if (t > 2.8) { const k = g.cl((t - 2.8) / .6); g.R(X + 26 + k * 52, g.G - 42, 22, 2, '#e8a900'); } },
      me: t => K(t, [[0, PO.think], [2.4, PO.think], [2.8, PO.point]]),
      say: t => say(t, ME(t, 2.8, 5, 'Keep it. Just move it after the seat.'))},
    {c: 'Buses come in wildly different layouts. One seat system adapted to any of them, without a hand-built screen each.', d: 5,
      draw(g, t, X) { const L = [[2, 1, 2], [2, 2], [1, 2]][Math.floor(Math.max(0, t) / 1.6) % 3]; g.box(X + 28, g.G - 66, 50, 34);
        let cx = X + 32; L.forEach(col => { for (let c = 0; c < col; c++) { for (let r = 0; r < 5; r++) g.box(cx, g.G - 62 + r * 6, 5, 5, r === 2 && c === 0 ? GREEN : g.PAPER); cx += 6; } cx += 4; }); },
      me: t => settle(t, PO.tablet),
      say: t => say(t, ME(t, 1.6, 4.4, 'Sleeper, seater, double-decker. One system.'))},
    {c: 'Result: checkout time down 72%, drop-off down 34%. Revenue driver intact, just moved out of the way.', d: 5.2,
      draw(g, t, X) { const bx = X + 120 - g.cl(t / 1.6) * 60; g.R(bx, g.G - 22, 56, 18, '#e8432d'); g.R(bx, g.G - 22, 56, 1, g.INK);
        for (let i = 0; i < 5; i++) g.R(bx + 4 + i * 10, g.G - 19, 7, 6, '#cfe8ff'); g.R(bx + 8, g.G - 4, 6, 4, g.INK); g.R(bx + 42, g.G - 4, 6, 4, g.INK);
        if (g.pop(t, 2)) { g.box(X + 20, g.G - 64, 34, 18); g.text('72%', X + 37, g.G - 61, GREEN, 'center'); g.text('FASTER', X + 37, g.G - 54, g.INK, 'center'); }
        if (g.pop(t, 2.5)) { g.box(X + 58, g.G - 64, 34, 18); g.text('-34%', X + 75, g.G - 61, RED, 'center'); g.text('DROP-OFF', X + 75, g.G - 54, g.INK, 'center'); } },
      me: t => t < 2.8 ? PO.stand : wig(t, PO.cheer, 'ua', 4, 3),
      say: t => say(t, ME(t, 3, 5.2, 'Shipped to 82 million people.'))}]});

  /* ===================== MoneyLingo ===================== */
  S.scene('moneylingo', {accent: '#2c8a5a', finale: 'coffee', beats: [
    {c: 'Our team set out to fix financial literacy. First concept: a board game about building wealth, played together.', d: 5, seatX: 0,
      draw(g, t, X) { g.chair(X); g.desk(X + 8, 70, 12); g.R(X + 20, g.G - 14, 30, 2, '#c9e3c8'); for (let i = 0; i < 4; i++) g.R(X + 22 + i * 7, g.G - 15, 2, 1, ['#d0402f', '#3b6fd8', '#e8a900', '#2c8a5a'][i]);
        g.person(X + 58, PO.sitTalk, 'woman', -1); g.chair(X + 58, -1); g.person(X + 80, PO.sit, 'pal', -1); g.chair(X + 80, -1); },
      me: t => K(t, [[0, PO.sit], [1.4, PO.sit], [1.8, P(Object.assign({}, PO.sit, {ua: 30, fa: 104, ub: 26, fb: 98, item: 'cash', item2: 'cash'}))]]),
      say: t => say(t, NPC(t, .4, 2.4, 'Your turn. Invest or save?', 58, -46))},
    {c: '“This is actually kind of stressful.”', d: 3.8, seatX: 0,
      draw(g, t, X) { g.chair(X); },
      me: t => Object.assign({}, PO.sit, {ua: 30, fa: 104, ub: 26, fb: 98, item: 'cash', item2: 'cash'}),
      fx(t, g, me) { if (t > .4) for (let i = 0; i < 3; i++) g.px(me.head[0] + 6 + i * 2, me.head[1] - 6 - ((t * 6 + i) % 3), '#3b6fd8'); },
      say: t => say(t, ME(t, .4, 3.8, 'This is actually kind of stressful.'))},
    {c: 'People avoid money conversations because they feel judged. Our board game recreated that exact anxiety.', d: 4.6,
      draw(g, t, X) { g.board(X + 22, g.G - 62, 60, 34); ['CONFUSING', 'TENSE', 'TOO BIG'].forEach((s, i) => { if (g.pop(t, .4 + i * .5)) tag(g, X + 26 + (i % 2) * 18, g.G - 58 + i * 10, s); }); },
      me: t => K(t, [[0, PO.stand], [.4, PO.write], [2, PO.write], [2.4, PO.think]]),
      say: t => say(t, ME(t, 2.6, 4.6, 'We rebuilt the anxiety. Oops.'))},
    {c: 'The pivot: a quiz. The feedback loop never punished a wrong answer; it explained what to focus on next.', d: 4.8,
      draw(g, t, X) { phone(g, X + 28, g.G - 72, 34, 56); g.bars(X + 32, g.G - 66, 24, 2); g.box(X + 32, g.G - 58, 26, 6, t > 1 && t < 1.8 ? '#fde3c8' : g.PAPER); g.box(X + 32, g.G - 50, 26, 6);
        if (g.pop(t, 1.8)) { g.box(X + 22, g.G - 40, 46, 18, '#fde9a8'); g.text('NOT QUITE', X + 45, g.G - 36, g.INK, 'center'); g.text('TRY THIS', X + 45, g.G - 29, '#2c8a5a', 'center'); } },
      me: t => settle(t, PO.point),
      say: t => say(t, ME(t, 2.4, 4.8, 'No red X. Just a next step.'))},
    {c: 'Even the colour palette was deliberate: trustworthy blues, because money already makes people anxious enough.', d: 4.6,
      draw(g, t, X) { g.board(X + 22, g.G - 62, 64, 34); ['#d0402f', '#e8a900', '#9a8fc9', '#3b6fd8', '#2a5aa8', '#7fb3d5'].forEach((c, i) => { const x = X + 28 + (i % 3) * 18, y = g.G - 58 + Math.floor(i / 3) * 13; g.R(x, y, 12, 9, c); if (i >= 3) ring(g, x - 3, y - 3, 18, 15, g.cl((t - 1.5 - (i - 3) * .4) / .4), g.INK); if (i < 3 && t > 3) g.R(x, y, 12, 9, 'rgba(246,246,244,.75)'); }); },
      me: t => K(t, [[0, PO.stand], [.4, PO.write]]),
      say: t => say(t, ME(t, 3, 4.6, 'Calm colours for a tense topic.'))},
    {c: 'What shipped: a quiz and a market simulation. Same person, same mechanic, a much calmer experience.', d: 4.6,
      draw(g, t, X) { g.person(X + 64, PO.phone, 'woman', -1); g.person(X + 86, P({ua: 120, fa: 160}), 'pal', -1); },
      me: t => settle(t, PO.phone),
      say: t => say(t, ME(t, .8, 2.8, 'Same mechanic. Calmer experience.'), NPC(t, 2.8, 4.6, 'One more round!', 86))}]});

  /* ===================== Paytm Chat ===================== */
  S.scene('paytm-chat', {accent: '#00b9f1', finale: 'keepy', beats: [
    {c: 'In 2020, Google Pay let you chat while sending money. Paytm didn’t have that. Users started switching.', d: 4.8, seatX: 0,
      draw(g, t, X) { g.chair(X); g.desk(X + 8, 36); g.monitor(X + 16, g.G - 33, 22, 16); g.R(X + 19, g.G - 30, 10, 3, '#cfe8ff'); g.R(X + 25, g.G - 25, 10, 3, '#e3f3e6');
        for (let i = 0; i < 4; i++) { const k = g.cl((t - .8 - i * .5) / 1.4); if (k > 0) g.person(X + 60 + k * 50 + i * 4, S.walkPose(k * 80 + i * 10), ['kid', 'woman', 'pal', 'suit'][i], 1); } },
      me: t => K(t, [[0, PO.type], [2.6, PO.type], [3, PO.sitTalk]]),
      say: t => say(t, ME(t, 3, 4.8, 'Hey! Where’s everyone going?'))},
    {c: 'Whatever we built would sit on Paytm’s homepage, used by 100M+ people a month.', d: 4.4,
      draw(g, t, X) { g.screen(X + 24, g.G - 66, 66, 38, '#e9f8fe'); g.R(X + 24, g.G - 66, 66, 7, '#00b9f1'); g.text('PAYTM', X + 28, g.G - 64, g.PAPER);
        if (g.pop(t, .8)) g.text('100M+ A MONTH', X + 57, g.G - 52, g.INK, 'center'); g.bars(X + 30, g.G - 44, 50, 4); },
      me: t => settle(t, PO.present),
      say: t => say(t, ME(t, 1.6, 4.4, 'No pressure, then.'))},
    {c: 'Paytm never had chat before. Every bubble needed sign-off. This is a regulated space.', d: 4.8,
      draw(g, t, X) { for (let i = 0; i < 5; i++) g.box(X + 30 + (i % 2), g.G - 6 - i * 3, 24, 3, g.PAPER);
        ['LEGAL', 'BUSINESS', 'MGMT'].forEach((s, i) => { if (g.pop(t, .8 + i * .9)) { g.box(X + 58, g.G - 60 + i * 11, 50, 9, '#fff'); g.text(s + ' OK', X + 83, g.G - 58 + i * 11, RED, 'center'); } }); },
      me: t => K(t, [[0, PO.stand], [.4, PO.card], [3.4, PO.card], [3.8, PO.shrug]]),
      say: t => say(t, ME(t, 3.8, 4.8, 'One bubble. Three sign-offs.'))},
    {c: 'We designed every message state in depth. In payments, trust is the whole product.', d: 4.6,
      draw(g, t, X) { ['SENT', 'DLVD', 'READ', 'LIKE'].forEach((s, i) => { if (!g.pop(t, .3 + i * .7)) return; const x = X + 22 + i * 24;
          g.box(x, g.G - 60, 12, 10, i === 3 ? '#fde3e8' : '#e9f8fe'); g.text(i === 3 ? '+' : i === 2 ? '=' : '>', x + 5, g.G - 57, '#00b9f1'); g.text(s, x + 6, g.G - 46, g.INK, 'center'); if (i) g.R(x - 9, g.G - 55, 6, 1, g.GREY); }); },
      me: t => settle(t, PO.tablet),
      say: t => say(t, ME(t, 3, 4.6, 'Trust is the whole product.'))},
    {c: 'For splitting a group bill, we didn’t build a form. We built a pizza: slices as shares, adjustable live.', d: 5.4,
      draw(g, t, X) { const cx = X + 60, cy = g.G - 46, r = 17;
        for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = x * x + y * y; if (d > r * r) continue; const a = (Math.atan2(y, x) + Math.PI) / (Math.PI * 2), sl = Math.floor(a * 6);
          const gone = t > 3 && sl < Math.floor((t - 3) * 3); if (gone) continue; const edge = d > (r - 2) * (r - 2) || Math.abs(a * 6 - Math.round(a * 6)) < .04;
          g.px(cx + x, cy + y, edge ? '#c47a3a' : (g.hash(x * 7 + y * 13) > .9 ? '#c8372d' : '#f1c55c')); }
        for (let i = 0; i < 6; i++) if (t > 3 && i < Math.floor((t - 3) * 3)) { const a = i / 6 * Math.PI * 2 - Math.PI + .5, k = g.cl((t - 3 - i / 3) / .6);
          const x = cx + Math.cos(a) * (r + 6 * k), y = cy + Math.sin(a) * (r + 6 * k) - k * 6; g.R(x - 2, y - 2, 5, 5, '#e8a900'); g.R(x - 1, y - 1, 3, 3, '#fdd76b'); } },
      me: t => K(t, [[0, PO.stand], [.6, PO.point], [2.8, PO.point], [3.2, PO.snap]]),
      say: t => say(t, ME(t, .8, 2.8, 'Who had how much? Drag a slice.'), ME(t, 3.4, 5.4, 'Split. Paid. Done.'))},
    {c: 'Send money, and the interface reacts instantly, proving Paytm’s whole promise: this is fast.', d: 4.8,
      draw(g, t, X) { if (g.pop(t, 1)) { g.box(X + 22, g.G - 62, 60, 14, '#00b9f1', g.INK); g.text('MONEY SENT', X + 52, g.G - 57, g.PAPER, 'center'); }
        if (t > 1.2) for (let i = 0; i < 18; i++) { const a = g.hash(i) * 6.28, k = g.cl((t - 1.2) / 1.4); g.R(X + 52 + Math.cos(a) * 30 * k, g.G - 55 + Math.sin(a) * 18 * k + k * k * 14, 2, 1, ['#d0402f', '#e8a900', '#2e9e5b', '#3b6fd8'][i % 4]); } },
      me: t => t < 1 ? settle(t, PO.phone) : wig(t, PO.cheer, 'ua', 4, 3),
      say: t => say(t, ME(t, 1.6, 4.8, 'Sent. Instantly.'))}]});

  /* ===================== Planteria ===================== */
  const plant = (g, x, k, wilt) => { g.R(x - 4, g.G - 8, 9, 8, '#c4683a'); g.R(x - 5, g.G - 9, 11, 2, '#a8552c'); const h = 4 + Math.floor(k * 14);
    g.R(x, g.G - 9 - h, 1, h, '#3f7d3a'); for (let i = 0; i < Math.floor(h / 3); i++) { const y = g.G - 11 - i * 3, s = i % 2 ? 1 : -1; g.R(s > 0 ? x + 1 : x - 3, y + (wilt ? 1 : 0), 3, 2, wilt ? '#a6a35a' : '#5fae54'); } };
  S.scene('planteria', {accent: '#3f7d3a', finale: 'pet', beats: [
    {c: 'For a graduate UX course, we took on a common problem: people buy plants and don’t know how to keep them alive.', d: 4.8,
      draw(g, t, X) { plant(g, X + 40, .2, true); g.board(X + 56, g.G - 60, 40, 28); g.text('PLANTERIA', X + 76, g.G - 55, '#3f7d3a', 'center'); g.sticky(X + 60, g.G - 46); g.sticky(X + 70, g.G - 46, '#bfe3c4'); },
      me: t => K(t, [[0, PO.stand], [.4, P({t: 18, ua: 70, fa: 110})], [2.4, PO.shrug]]),
      say: t => say(t, ME(t, .6, 2.4, 'Bought a plant. Now what?'), ME(t, 2.6, 4.8, 'It’s not looking great.'))},
    {c: 'I led competitive research against the two closest products, Planta and Nature ID, to find the real gap.', d: 4.4,
      draw(g, t, X) { phone(g, X + 30, g.G - 66, 22, 36, '#e3f3e6'); phone(g, X + 58, g.G - 66, 22, 36, '#eef7e0'); if (g.pop(t, 2)) g.text('GAP?', X + 88, g.G - 50, RED); },
      me: t => K(t, [[0, PO.stand], [.4, PO.point], [1.8, PO.think]]),
      say: t => say(t, ME(t, 2.2, 4.4, 'Both identify. Neither keeps it alive.'))},
    {c: 'Instead of guessing what to build first, we prioritized what every persona needed in common.', d: 4.6,
      draw(g, t, X) { ['APT', 'PARENT', 'OFFICE'].forEach((s, i) => { if (!g.pop(t, .2 + i * .3)) return; const x = X + 20 + i * 31; g.box(x, g.G - 62, 29, 30); g.text(s, x + 15, g.G - 58, g.INK, 'center');
          ['REMIND', 'CARE'].forEach((r, j) => { g.text(r, x + 15, g.G - 48 + j * 8, g.MID, 'center'); if (t > 1.8 + j * .6) g.R(x + 3, g.G - 42 + j * 8, 23, 1, GREEN); }); }); },
      me: t => settle(t, PO.point),
      say: t => say(t, ME(t, 2.6, 4.6, 'Reminders and care. Everyone needs both.'))},
    {c: 'We tested with 8 users across 8 tasks. The feedback was honest, and we rebuilt the confusing parts.', d: 4.8,
      draw(g, t, X) { g.desk(X + 48, 34); g.laptop(X + 56, g.G - 14, -1); g.person(X + 76, PO.sitTalk, 'woman', -1); g.chair(X + 76, -1); },
      me: t => settle(t, PO.pad),
      say: t => say(t, NPC(t, .4, 2.8, 'Wait, where am I supposed to look?', 76, -48), ME(t, 3, 4.8, 'Noted. Rebuilding that.'))},
    {c: 'I built the whole visual design system myself, down to the watering-can animation.', d: 5.2,
      draw(g, t, X) { plant(g, X + 34, g.cl((t - 1.4) / 2.4), t < 1.6); },
      me: t => K(t, [[0, PO.stand], [.6, PO.water]]),
      fx(t, g, me) { if (t > 1) for (let i = 0; i < 4; i++) { const k = ((t * 2 + i / 4) % 1); g.px(me.hand[0] + 8 + k * 2, me.hand[1] - 2 + k * 14, '#7fb3d5'); } },
      say: t => say(t, ME(t, 3, 5.2, 'Okay, little guy. You’ll make it.'))}]});

  /* ===================== Poll Police ===================== */
  const tnMap = (g, x, y, k = 1) => { const rows = ['..XXXX..', '.XXXXXX.', 'XXXXXXXX', 'XXXXXXX.', '.XXXXXX.', '.XXXXX..', '..XXXX..', '..XXX...', '...XX...'];
    rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === 'X') g.R(x + i * 3, y + j * 3, 3, 3, (i + j) % 3 === 0 ? '#e8a35a' : (i + j) % 3 === 1 ? '#7fb3d5' : '#9fd39a'); })); };
  S.scene('poll-police', {accent: '#5a4630', finale: 'guitar', beats: [
    {c: 'Tamil Nadu Police came to our university design group with a real problem: voters didn’t know where to go.', d: 4.8,
      draw(g, t, X) { g.board(X + 22, g.G - 64, 40, 36); tnMap(g, X + 30, g.G - 62); g.person(X + 82, t > .4 ? talk(t) : PO.stand, 'cop', -1); },
      me: t => settle(t, PO.pad),
      say: t => say(t, NPC(t, .4, 2.8, 'Many don’t feel safe going.', 82), ME(t, 3, 4.8, 'So show them where. Clearly.'))},
    {c: '“This is what most people actually carry. Design for this.”', d: 4.4,
      draw(g, t, X) { const p = g.person(X + 60, PO.card, 'cop', -1); g.R(p.hand[0] - 3, p.hand[1] - 5, 5, 7, '#2a2a2a'); g.line(p.hand[0] - 2, p.hand[1] - 4, p.hand[0], p.hand[1], '#8a8a86'); },
      me: t => settle(t, PO.think),
      say: t => say(t, NPC(t, .2, 2.6, 'No rich media. The oldest phone.', 60), ME(t, 2.8, 4.4, 'Got it. Built for that.'))},
    {c: 'Tamil Nadu has over 70 million people. The devices in their hands would define everything we built.', d: 4.4,
      draw(g, t, X) { if (g.pop(t, .4)) { g.text('70,000,000', X + 56, g.G - 66, g.INK, 'center'); } for (let i = 0; i < 30; i++) if (g.pop(t, .8 + i * .04)) g.R(X + 26 + (i % 10) * 6, g.G - 54 + Math.floor(i / 10) * 7, 3, 5, '#2a2a2a'); },
      me: t => K(t, [[0, PO.stand], [.4, PO.phone]]),
      say: t => say(t, ME(t, 2.2, 4.4, 'Every one of these matters.'))},
    {c: 'We colour-coded the app by district, so an officer could recognise a colleague’s district instantly.', d: 4.8,
      draw(g, t, X) { ['#e8572a', '#3b6fd8', '#2e9e5b'].forEach((c, i) => { if (!g.pop(t, .3 + i * .5)) return; const x = X + 24 + i * 24; phone(g, x, g.G - 64, 20, 34); g.R(x + 2, g.G - 61, 16, 8, c); g.text('D' + (i + 1), x + 10, g.G - 59, g.PAPER, 'center'); g.bars(x + 4, g.G - 50, 12, 4); }); },
      me: t => settle(t, PO.tablet),
      say: t => say(t, ME(t, 2.2, 4.8, 'Colour first. Read it in a glance.'))},
    {c: 'It launched across three districts: station info for voters, live coordination for police.', d: 4.8,
      draw(g, t, X) { g.screen(X + 20, g.G - 82, 76, 14, '#1d2b20'); g.text('3 DISTRICTS LIVE', X + 58, g.G - 77, '#7fe08a', 'center');
        g.person(X + 70, PO.phone, 'cop', -1); g.person(X + 92, P({ua: 48, fa: 78}), 'cop', -1); },
      me: t => t < 2 ? settle(t, PO.stand) : wig(t, PO.cheer, 'ua', 4, 3),
      say: t => say(t, NPC(t, .4, 2.4, 'Booth 14 is clear.', 92), ME(t, 2.6, 4.8, 'Millions of real people. Wow.'))}]});

  /* ===================== Snapshot ===================== */
  S.scene('snapshot', {accent: '#c2410c', finale: 'keepy', beats: [
    {c: 'For a graduate design course, we explored an idea: help people recreate famous photos where they’re standing.', d: 4.6,
      draw(g, t, X) { g.desk(X + 16, 60, 12); for (let i = 0; i < 5; i++) if (g.pop(t, .2 + i * .3)) { const x = X + 22 + i * 11; g.box(x, g.G - 22 - (i % 2) * 2, 10, 8, g.PAPER); g.R(x + 1, g.G - 21 - (i % 2) * 2, 8, 4, ['#7fb3d5', '#e3a35a', '#9fd39a', '#e07a5f', '#9a8fc9'][i]); } },
      me: t => settle(t, P({t: 16, ua: 60, fa: 100})),
      say: t => say(t, ME(t, 2, 4.6, 'What if you could take this one?'))},
    {c: 'We ran 10 interviews and an 80+ response survey to see how people actually take photos.', d: 4.6,
      draw(g, t, X) { g.board(X + 22, g.G - 64, 60, 36); const k = g.cl(t / 1.4); bars(g, X + 30, g.G - 32, [8, 12, 6, 22, 9, 5].map(v => Math.round(v * k)), '#7fb3d5', t > 1.8 ? 3 : -1);
        if (t > 2) ring(g, X + 41, g.G - 58, 11, 30, g.cl((t - 2) / .5)); },
      me: t => K(t, [[0, PO.stand], [.4, PO.point]]),
      say: t => say(t, ME(t, 2.4, 4.6, 'Tips. They want tips while shooting.'))},
    {c: '“No feed? That’s how apps grow.” “This app has one job: help you take a better photo.”', d: 5,
      draw(g, t, X) { g.person(X + 60, t < 2.6 ? talk(t) : PO.shrug, 'woman', -1); },
      me: t => K(t, [[0, PO.stand], [2.4, PO.stand], [2.8, P({ua: 70, fa: 120, item: 'camera'})]]),
      say: t => say(t, NPC(t, .3, 2.4, 'No feed? That’s how apps grow.', 60), ME(t, 2.6, 5, 'One job: a better photo.'))},
    {c: 'The core idea: feedback arrives while you’re holding up the camera, not afterwards in an edit screen.', d: 5,
      draw(g, t, X) { g.person(X + 80, t > 3 ? PO.cheer : P({ua: 8, fa: 20, ub: 6, fb: 18}), 'pal', -1);
        if (g.pop(t, .8)) { g.box(X + 14, g.G - 72, 62, 10, '#fff7e0'); g.text('TIP: TILT LEFT', X + 45, g.G - 69, '#c2410c', 'center'); } },
      me: t => settle(t, PO.camera),
      fx(t, g) { if (t > 2.6 && t < 3) g.flash(.7 - (t - 2.6) * 1.7); },
      say: t => say(t, ME(t, 3.2, 5, 'Got it on the first try.'))},
    {c: 'Usability scores went from 76.25 to 82.27, and participants asked when they could actually use it.', d: 4.8,
      draw(g, t, X) { g.board(X + 22, g.G - 64, 54, 36); const k = g.cl(t / 1.2), k2 = g.cl((t - .8) / 1.2);
        g.R(X + 32, g.G - 32 - 20 * k, 10, 20 * k, '#7fb3d5'); g.R(X + 54, g.G - 32 - 26 * k2, 10, 26 * k2, '#2e9e5b'); g.text('76', X + 37, g.G - 62, g.INK, 'center'); if (k2 >= 1) g.text('82', X + 59, g.G - 62, GREEN, 'center'); },
      me: t => t < 2 ? settle(t, PO.point) : wig(t, PO.cheer, 'ua', 4, 3),
      say: t => say(t, NPC(t, 2.2, 4.8, 'When can I download it?', 100, -50))}]});

  /* ===================== Storewell ===================== */
  const fridge = (g, x, open) => { g.box(x, g.G - 50, 30, 50, '#eef1f2'); g.R(x + 1, g.G - 34, 28, 1, g.INK);
    if (open) { g.R(x + 1, g.G - 49, 28, 48, '#fff7dc'); ['VEG', 'DAIRY', 'MEAT', 'OPEN'].forEach((s, i) => { g.R(x + 1, g.G - 38 + i * 10, 28, 1, g.GREY); g.text(s, x + 15, g.G - 46 + i * 10, '#8a6a2a', 'center'); }); g.R(x - 8, g.G - 50, 8, 50, '#dfe3e5'); } else g.R(x + 25, g.G - 46, 1, 8, g.INK); };
  S.scene('storewell', {accent: '#2e9e5b', finale: 'coffee', beats: [
    {c: 'For a graduate HCI course, we tackled grocery waste. Instead of only interviewing people, we followed them while they shopped.', d: 5,
      draw(g, t, X) { shelf(g, X + 60, 40, 3, 11); const k = g.cl(t / 4); g.person(X + 30 + k * 20, S.walkPose(k * 40), 'woman', 1); g.R(X + 40 + k * 20, g.G - 14, 14, 9, g.INK); g.R(X + 41 + k * 20, g.G - 13, 12, 7, '#eef1f2'); },
      me: t => settle(t, PO.pad),
      say: t => say(t, ME(t, 2.6, 5, 'Watch what they do, not what they say.'))},
    {c: 'What we saw didn’t match the interviews: people consistently bought more once they were in the store.', d: 4.4,
      draw(g, t, X) { g.R(X + 28, g.G - 18, 26, 13, g.INK); g.R(X + 29, g.G - 17, 24, 11, '#eef1f2'); g.R(X + 31, g.G - 4, 3, 3, g.INK); g.R(X + 48, g.G - 4, 3, 3, g.INK);
        const n = Math.min(10, Math.floor(Math.max(0, t) * 3)); for (let i = 0; i < n; i++) g.R(X + 31 + (i % 5) * 4, g.G - 22 - Math.floor(i / 5) * 4, 3, 4, ['#e07a5f', '#9fd39a', '#e3a35a', '#7fb3d5', '#f1c55c'][i % 5]);
        g.box(X + 62, g.G - 44, 22, 26); g.text('LIST', X + 73, g.G - 41, g.INK, 'center'); g.bars(X + 65, g.G - 34, 14, 4); },
      me: t => settle(t, PO.point),
      say: t => say(t, ME(t, 2.2, 4.4, 'The list said four things.'))},
    {c: '“This changes where the app actually needs to step in.”', d: 4.4,
      draw(g, t, X) { g.board(X + 20, g.G - 62, 72, 32); g.text('PEOPLE BUY MORE', X + 56, g.G - 55, g.INK, 'center'); if (g.pop(t, .8)) g.text('IN PERSON', X + 54, g.G - 47, g.INK, 'center'); if (t > 1.4) g.R(X + 36, g.G - 40, 36 * g.cl((t - 1.4) / .6), 1, g.INK); },
      me: t => K(t, [[0, PO.stand], [.4, PO.write], [2, PO.write], [2.4, PO.present]]),
      say: t => say(t, ME(t, 2.4, 4.4, 'So the app steps in here.'))},
    {c: 'We used words people already use (‘stock’, not groceries) and made the interface look like their fridge.', d: 4.8,
      draw(g, t, X) { phone(g, X + 30, g.G - 72, 34, 58, '#f4f7f8'); g.text('STOCK', X + 47, g.G - 66, '#2e9e5b', 'center'); for (let r = 0; r < 3; r++) { g.R(X + 34, g.G - 46 + r * 11, 26, 1, g.GREY);
        for (let i = 0; i < 3; i++) if (g.pop(t, .6 + r * .4 + i * .15)) g.R(X + 36 + i * 8, g.G - 52 + r * 11, 5, 6, ['#e07a5f', '#f4f4f4', '#9fd39a'][(i + r) % 3]); } },
      me: t => settle(t, PO.point),
      say: t => say(t, ME(t, 2.2, 4.8, 'It looks like their fridge.'))},
    {c: 'Our first version tried to solve everything at once. Testing told us clearly to scale it back.', d: 4.6,
      draw(g, t, X) { phone(g, X + 26, g.G - 70, 30, 50); for (let i = 0; i < 6; i++) { const drop = t > 2.2 && i > 1 ? g.cl((t - 2.2 - i * .1) / .5) : 0; if (drop < 1) g.R(X + 30 + (i % 2) * 12, g.G - 64 + Math.floor(i / 2) * 13 + drop * 30, 10, 10, ['#9fd39a', '#e07a5f', '#7fb3d5', '#e8a900', '#9a8fc9', '#e3a35a'][i]); }
        g.box(X + 62, g.G - 60, 40, 18, '#fff3ee'); g.text('TOO MUCH', X + 82, g.G - 56, RED, 'center'); g.text('AT ONCE', X + 82, g.G - 49, RED, 'center'); },
      me: t => K(t, [[0, PO.shrug], [2, PO.shrug], [2.4, PO.snap]]),
      say: t => say(t, ME(t, 2.6, 4.6, 'Fewer things. Done well.'))},
    {c: 'It shipped as a tested prototype, grounded in what people actually did, not just what they said.', d: 4.6,
      draw(g, t, X) { fridge(g, X + 40, t > 1); },
      me: t => K(t, [[0, PO.stand], [.6, PO.reach], [1.2, PO.think]]),
      say: t => say(t, ME(t, 2, 4.6, 'Opened can, use first. Got it.'))}]});

  /* ===================== Winuall ===================== */
  S.scene('winuall', {accent: '#6b5bd8', finale: 'guitar', beats: [
    {c: 'Winuall helped India’s paper-based coaching institutes move online when COVID shut every classroom. I was the sole designer.', d: 5, seatX: 0,
      draw(g, t, X) { g.chair(X); g.desk(X + 8, 40); g.laptop(X + 18, g.G - 14); for (let s = 0; s < 2; s++) { const n = 6 - Math.floor(g.cl(t / 4) * 5); for (let i = 0; i < n; i++) g.box(X + 32 + s * 10, g.G - 16 - i * 2, 9, 2, g.PAPER); } },
      me: t => wig(t, PO.type, 'fa', 6, 3),
      say: t => say(t, ME(t, 2, 5, 'Four products. From nothing.'))},
    {c: 'The same app had to work for teenagers during the day and their teachers late at night.', d: 5,
      draw(g, t, X) { const n = t > 2.4; g.R(X + 70, g.G - 70, 50, 70, n ? '#2b2e46' : '#fff6d8'); if (!n) { g.R(X + 104, g.G - 66, 6, 6, '#f1c55c'); g.text('NOON', X + 74, g.G - 66); } else { g.text('11PM', X + 74, g.G - 66, g.PAPER); }
        if (!n) g.person(X + 92, PO.phone, 'kid', -1); else { g.desk(X + 72, 30); lamp(g, X + 76, true); g.person(X + 96, Object.assign({}, PO.sit, {ua: 60, fa: 110, item: 'pen'}), 'saree', -1); g.chair(X + 96, -1); } },
      me: t => settle(t, PO.think),
      say: t => say(t, ME(t, 3, 5, 'Same app. Opposite days.'))},
    {c: '“What if the app’s default just matched their day?”', d: 4,
      draw(g, t, X) {},
      me: t => K(t, [[0, PO.think], [1.2, PO.think], [1.6, PO.snap]]),
      fx(t, g, me) { if (t > 1.4) { const x = me.head[0] + 2, y = me.head[1] - 14, on = Math.floor(t * 4) % 4 !== 0; g.R(x, y, 5, 5, on ? '#fdd76b' : '#efe4c0'); g.R(x - 1, y + 1, 7, 3, on ? '#fdd76b' : '#efe4c0'); g.R(x + 1, y + 5, 3, 2, g.MID); } },
      say: t => say(t, ME(t, 1.6, 4, 'What if the default matched their day?'))},
    {c: 'Light mode by default for students, who use it in daylight. Dark mode for teachers, who use it at night.', d: 4.8,
      draw(g, t, X) { phone(g, X + 26, g.G - 66, 24, 40, '#ffffff'); g.bars(X + 30, g.G - 58, 14, 6, '#c9c9e8'); g.R(X + 34, g.G - 70, 8, 2, '#f1c55c');
        if (g.pop(t, 1)) { phone(g, X + 58, g.G - 66, 24, 40, '#24263a'); g.bars(X + 62, g.G - 58, 14, 6, '#55587a'); g.R(X + 68, g.G - 70, 4, 2, '#c9c9e8'); } },
      me: t => settle(t, PO.present),
      say: t => say(t, ME(t, 2, 4.8, 'Both can switch. Most never do.'))},
    {c: 'These were people moving from notebooks to software. Guidance had to live inside the product, where they got stuck.', d: 4.6,
      draw(g, t, X) { phone(g, X + 30, g.G - 66, 26, 42); g.bars(X + 34, g.G - 58, 16, 5); if (g.pop(t, 1.2)) { g.box(X + 52, g.G - 62, 38, 12, '#fff7c8'); g.text('TAP HERE', X + 71, g.G - 58, g.INK, 'center'); g.line(X + 52, g.G - 53, X + 46, g.G - 50); } },
      me: t => settle(t, PO.tablet),
      say: t => say(t, ME(t, 2.2, 4.6, 'Help, right where they’re stuck.'))},
    {c: 'Result: institutes serving thousands of students each moved fully online, on one design system across four products.', d: 4.8, seatX: 0,
      draw(g, t, X) { g.chair(X, 1); ['SITE', 'PORTAL', 'STUDENT', 'ADMIN'].forEach((s, i) => { if (g.pop(t, .3 + i * .4)) tag(g, X + 24 + (i % 2) * 38, g.G - 64 + Math.floor(i / 2) * 12, s, ['#e3e0ff', '#fdd76b', '#bfe3c4', '#ffd8cc'][i]); }); },
      me: t => K(t, [[0, PO.sit], [2.2, PO.sit], [2.6, P(Object.assign({}, PO.sit, {t: -8, ua: 150, fa: 230, ub: 150, fb: 230}))]]),
      say: t => say(t, ME(t, 2.6, 4.8, 'Fully online. Nice.'))}]});

})();
