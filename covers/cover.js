/* Cover reels: a time-pure keyframe engine. render(t) draws any instant, so the
   live preview and the frame-by-frame video export are identical. */
(() => {
const W = 1200, H = 900, LOOP = 8;
const bez = (x1, y1, x2, y2) => t => {
  let a = 0, b = 1, m = t;
  for (let i = 0; i < 24; i++) { m = (a + b) / 2; const x = 3 * (1 - m) ** 2 * m * x1 + 3 * (1 - m) * m * m * x2 + m ** 3; x < t ? a = m : b = m; }
  return 3 * (1 - m) ** 2 * m * y1 + 3 * (1 - m) * m * m * y2 + m ** 3;
};
const E = {
  lin: t => t,
  liquid: bez(.22, 1, .36, 1),
  io: bez(.65, 0, .35, 1),
  in: bez(.55, 0, .9, .4),
  back: bez(.34, 1.45, .64, 1),
};
const D = { x: 0, y: 0, s: 1, r: 0, o: 1, b: 0 };
const tracks = [], hooks = [];
const cv = document.getElementById('cv');

function mk(parent, cls, html, style) {
  const el = document.createElement('div');
  if (cls) el.className = cls;
  if (html != null) el.innerHTML = html;
  if (style) Object.assign(el.style, typeof style === 'string' ? { cssText: style } : style);
  (parent || cv).appendChild(el);
  return el;
}
// keys: [[time, {props}, ease?], ...]; each key inherits the one before it
function tr(el, keys) {
  let prev = { ...D };
  keys = keys.map(([t, p, e]) => (prev = { ...prev, ...p }, [t, prev, E[e || 'liquid']]));
  tracks.push([el, keys]);
  return el;
}
function sample(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, p1, e] = keys[i];
    if (t < t1) {
      const [t0, p0] = keys[i - 1], k = e((t - t0) / (t1 - t0)), o = {};
      for (const n in p1) o[n] = p0[n] + (p1[n] - p0[n]) * k;
      return o;
    }
  }
  return keys[keys.length - 1][1];
}
const clamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
function count(el, t0, t1, to, fmt) {
  hooks.push(t => { const k = E.liquid(clamp((t - t0) / (t1 - t0))); el.textContent = fmt(to * k); });
}
function typed(el, t0, t1, text) {
  hooks.push(t => { const n = Math.round(text.length * clamp((t - t0) / (t1 - t0))); el.textContent = text.slice(0, n); });
}
// a pointer that glides between points and pulses a ring on each click
function pointer(path, clicks, color = '#fff') {
  const c = mk(null, 'cur', '<svg width="34" height="34" viewBox="0 0 24 24"><path d="M4 2.5 19.5 12l-6.8 1.6 3.9 7-2.8 1.5-3.9-7L4 20z" fill="#141414" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>', 'left:0;top:0');
  tr(c, path);
  for (const at of clicks) {
    const ring = mk(null, 'ring', '', `left:0;top:0;--c:${color}`);
    hooks.push(t => {
      const q = sample(tracks.find(x => x[0] === c)[1], t), k = (t - at) / .55;
      ring.style.opacity = k < 0 || k > 1 ? 0 : (1 - k) * .9;
      ring.style.transform = `translate(${q.x + 6}px,${q.y + 4}px) scale(${.3 + 1.1 * E.liquid(clamp(k))})`;
      const press = Math.max(0, 1 - Math.abs(t - at) / .12);
      c.firstChild.style.transform = `scale(${1 - .14 * press})`;
    });
  }
  return c;
}
// flat phone: the frame hugs the screenshot, so nothing is cropped. P = {l,t,ar}; at() maps image fractions to canvas px
const phone = (src, l, t, ar, style = '', w = 280) => {
  const p = mk(null, 'phone', '', `left:${l}px;top:${t}px;width:${w}px;${style}`);
  const s = mk(p, 'scr');
  const imgs = [].concat(src).map(u => { const i = document.createElement('img'); i.src = u; s.appendChild(i); return i; });
  const sw = w - 14;
  return { p, s, imgs, at: (fx, fy) => ({ x: l + 7 + sw * fx - 6, y: t + 7 + sw * ar * fy - 4 }), sw };
};
const bare = (src, style) => { const i = document.createElement('img'); i.src = src; i.className = 'bare'; if (style) i.style.cssText = style; cv.appendChild(i); return i; };
// blobs drift and return, so the loop has no jump
const drift = (el, dx, s0 = 1, s1 = 1.15) => tr(el, [[0, { s: s0 }], [4, { x: dx, s: s1 }, 'io'], [8, { x: 0, s: s0 }, 'io']]);
const pop = (el, at, from = { y: 50, s: .9 }, outAt = 7.0) => tr(el, [[at, { ...from, o: 0 }], [at + .65, { x: 0, y: 0, r: from.r2 || 0, s: 1, o: 1 }, 'back'], ...out(outAt)]);
const slideIn = (im, at, w) => tr(im, [[at, { x: w }], [at + .5, { x: 0 }, 'liquid']]);
const fade = (im, at) => tr(im, [[at, { o: 0 }], [at + .35, { o: 1 }, 'io']]);
const win = (parent, srcs, style, url) => {
  const w = mk(parent, 'win', `<div class="bar"><i style="left:16px"></i><i style="left:34px"></i><i style="left:52px"></i><b>${url || ''}</b></div>`, style);
  const s = mk(w, 'scr');
  const imgs = srcs.map(u => { const i = document.createElement('img'); i.src = u; s.appendChild(i); return i; });
  return { w, s, imgs };
};
const stat = (style, cls = '') => {
  const el = mk(null, 'stat ' + cls, '<b></b><span></span>', style);
  return { el, b: el.firstChild, sub: el.lastChild };
};
const out = (t = 7.1) => [[t, {}], [t + .6, { o: 0, y: -30, s: .97 }, 'in']];
const bg = css => mk(null, 'bg', '', css);
const blob = (x, y, r, c) => mk(null, 'blob', '', `left:${x - r}px;top:${y - r}px;width:${2 * r}px;height:${2 * r}px;background:${c}`);

const COVERS = {
  /* ---------- MakeMyTrip: bus checkout ---------- */
  makemytrip() {
    bg('background:#eef3fb');
    drift(blob(1050, 120, 260, '#bcd3ff'), -60, .9, 1.15);
    drift(blob(160, 860, 240, '#ffd9c2'), 80, 1.1, .9);

    const { w, imgs: [list, review] } = win(null, ['src/mmt-list.webp', 'src/mmt-review.webp'], 'left:70px;top:150px', 'goibibo.com/bus');
    tr(w, [[0, { y: 90, o: 0, s: .93 }], [1, { y: 0, o: 1, s: 1 }], [4.6, {}], [5.6, { x: -40, s: .94, o: .9 }], ...out(7.0).map(k => [k[0], { ...k[1], x: -40, s: k[1].s || .94 }, k[2]])]);
    tr(list, [[1.1, { y: 0 }], [2.3, { y: -60 }, 'io'], [2.72, {}], [3.3, { x: -260, o: .35 }, 'liquid']]);
    review.style.left = '0';
    tr(review, [[2.75, { x: 860 }], [3.45, { x: 0 }, 'liquid'], [3.8, { y: 0 }], [5.0, { y: -150 }, 'io']]);

    // the click lands on Select seat
    pointer([[1.2, { x: 980, y: 860, o: 0 }], [1.5, { o: 1 }], [2.5, { x: 392, y: 400 }, 'io'], [3.0, {}], [3.7, { x: 560, y: 900, o: 0 }, 'in']], [2.62], '#2276e3');

    const a = stat('left:790px;top:110px;--c:#2276e3');
    a.sub.textContent = 'faster checkout';
    tr(a.el, [[3.3, { x: 70, o: 0, s: .9 }], [4.0, { x: 0, o: 1, s: 1 }, 'back'], [5.5, {}], [6.1, { y: -40, o: 0 }, 'in']]);
    count(a.b, 3.35, 4.7, 72, v => Math.round(v) + '%');

    const b = stat('left:820px;top:330px;--c:#e0533f');
    b.sub.textContent = 'lower drop-off';
    tr(b.el, [[3.9, { x: 70, o: 0, s: .9 }], [4.6, { x: 0, o: 1, s: 1 }, 'back'], [5.6, {}], [6.2, { y: -40, o: 0 }, 'in']]);
    count(b.b, 3.95, 5.3, 34, v => '↓' + Math.round(v) + '%');

    // mobile: airport pick-up flow, the frame sized to the screenshot so nothing is cropped
    const m = phone(['src/mmt-m1.webp', 'src/mmt-m2.webp', 'src/mmt-m3.webp'], 850, 230, 1.776);
    tr(m.p, [[5.2, { y: 700, o: 0 }], [5.3, { o: 1 }, 'lin'], [6.0, { y: 0 }, 'liquid'], ...out(7.0)]);
    m.imgs.forEach((im, i) => { if (i) slideIn(im, 5.75 + i * .5, m.sw); });
  },

  /* ---------- Paytm Insider: Insider Vibes ---------- */
  'insider-vibes'() {
    bg('background:#8b7cf6');
    drift(blob(200, 150, 260, '#4b3cc9'), 60, 1, 1.2);
    drift(blob(1040, 820, 280, '#ff9ec7'), -60, 1.1, .9);

    const L = phone('src/insider-1.webp', 190, 190, 2.17);
    const R = phone('src/insider-5.webp', 730, 190, 2.17);
    const C = phone(['src/insider-2.webp', 'src/insider-3.webp'], 460, 140, 2.17);
    tr(L.p, [[.5, { x: 280, r: 0, s: .9, o: 0 }], [1.4, { x: 0, r: -7, s: .92, o: 1 }], [6.95, {}], [7.6, { x: 120, o: 0, r: -3 }, 'in']]);
    tr(R.p, [[.6, { x: -280, r: 0, s: .9, o: 0 }], [1.5, { x: 0, r: 7, s: .92, o: 1 }], [6.95, {}], [7.6, { x: -120, o: 0, r: 3 }, 'in']]);
    tr(C.p, [[0, { y: 160, o: 0, s: .9 }], [.9, { y: 0, o: 1, s: 1 }], ...out(7.0)]);
    tr(L.imgs[0], [[1.6, { y: 0 }], [3.2, { y: -60 }, 'io'], [4.6, { y: 0 }, 'io']]);
    // the poll arrives as a bottom sheet
    tr(C.imgs[1], [[2.2, { y: 600 }], [2.95, { y: 0 }, 'liquid']]);

    pointer([[1.3, { x: 700, y: 900, o: 0 }], [1.6, { o: 1 }], [2.1, C.at(.66, .84), 'io'], [2.6, {}], [3.4, C.at(.38, .69), 'io'], [3.9, {}], [4.4, { x: 700, y: 920, o: 0 }, 'in']], [2.15, 3.45], '#fff');

    const a = stat('left:60px;top:600px;--c:#5b45e0');
    a.sub.textContent = 'paying users in month one';
    tr(a.el, [[3.8, { y: 60, o: 0, s: .9 }], [4.5, { y: 0, o: 1, s: 1 }, 'back'], ...out(6.9)]);
    count(a.b, 3.85, 5.3, 50000, v => Math.round(v / 100) * 100 >= 50000 ? '50,000+' : Math.round(v).toLocaleString('en-US'));

    const b = stat('left:880px;top:90px;--c:#e0457b');
    b.sub.textContent = 'came back';
    tr(b.el, [[4.4, { y: -50, o: 0, s: .9 }], [5.1, { y: 0, o: 1, s: 1 }, 'back'], ...out(7.0)]);
    count(b.b, 4.45, 5.8, 62, v => Math.round(v) + '%');

    // reactions float up off the poll
    ['👏', '🔥', '😍', '👍', '🎉'].forEach((e, i) => {
      const r = mk(null, 'pill', e, `left:${640 + (i % 2) * 70 - i * 18}px;top:640px;font-size:30px;padding:8px 12px`);
      const t0 = 3.6 + i * .32;
      tr(r, [[t0, { y: 0, o: 0, s: .5 }], [t0 + .3, { y: -40, o: 1, s: 1 }, 'back'], [t0 + 1.6, { y: -260 - i * 20, x: (i % 2 ? 40 : -30), o: 0 }, 'lin']]);
    });
  },

  /* ---------- Voyage: AI-native design system ---------- */
  'ai-native-design-system'() {
    bg('background:radial-gradient(120% 90% at 20% 0%,#24497a 0%,#16335a 45%,#0e2240 100%)');
    drift(blob(1030, 760, 260, 'rgba(31,158,138,.55)'), -60, .9, 1.15);
    drift(blob(140, 160, 220, 'rgba(198,154,217,.45)'), 60, 1.1, .9);

    // prompt
    const pr = mk(null, '', '<span style="position:absolute;left:24px;top:21px;color:#1f9e8a;font:700 22px Manrope">✦</span><b style="position:absolute;left:58px;top:20px;font:600 22px/26px Manrope;color:#141414;letter-spacing:-.01em"></b><i style="position:absolute;right:10px;top:10px;width:48px;height:48px;border-radius:50%;background:#16335a"><svg style="position:absolute;left:13px;top:13px" width="22" height="22" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></i>', 'left:230px;top:70px;width:740px;height:68px;border-radius:34px;background:#fff');
    tr(pr, [[0, { y: -30, o: 0, s: .95 }], [.7, { y: 0, o: 1, s: 1 }], ...out(7.0)]);
    typed(pr.querySelector('b'), .8, 2.2, 'Build a loan review screen with Voyage');
    const caret = mk(pr, '', '', 'left:58px;top:20px;width:2px;height:26px;background:#1f9e8a');
    hooks.push(t => { const b = pr.querySelector('b'); caret.style.left = 60 + b.offsetWidth + 'px'; caret.style.opacity = t < 2.6 && (t * 2.2 | 0) % 2 === 0 ? 1 : 0; });

    // frame that assembles from system parts
    const f = mk(null, '', '', 'left:250px;top:186px;width:700px;height:546px;border-radius:20px;background:#f6f6f4;overflow:hidden');
    tr(f, [[2.3, { y: 40, o: 0, s: .96 }], [2.9, { y: 0, o: 1, s: 1 }], ...out(7.05)]);
    const part = (html, css, at, from) => tr(mk(f, '', html, css), [[at, { ...from, o: 0 }], [at + .55, { x: 0, y: 0, r: 0, s: 1, o: 1 }, 'back']]);
    part('<b style="position:absolute;left:28px;top:20px;font:700 20px Manrope;color:#fff;letter-spacing:-.02em">Loan review</b><i style="position:absolute;right:26px;top:18px;width:30px;height:30px;border-radius:50%;background:#c69ad9"></i>', 'left:0;top:0;width:700px;height:66px;background:#16335a', 2.6, { y: -66 });
    part('<span style="position:absolute;left:24px;top:20px;font:600 14px Manrope;color:rgba(20,20,20,.55)">Requested</span><b style="position:absolute;left:24px;top:42px;font:700 40px Manrope;letter-spacing:-.04em;color:#141414">$240,000</b><span style="position:absolute;left:24px;top:98px;padding:5px 12px;border-radius:99px;background:#d8f2ec;color:#137a6a;font:700 13px Manrope">Low risk</span>', 'left:28px;top:90px;width:300px;height:140px;border-radius:16px;background:#fff', 3.0, { x: -160, r: -6 });
    part('<span style="position:absolute;left:24px;top:20px;font:600 14px Manrope;color:rgba(20,20,20,.55)">AI summary</span><i style="position:absolute;left:24px;top:52px;width:230px;height:10px;border-radius:5px;background:#e7e7e3"></i><i style="position:absolute;left:24px;top:74px;width:260px;height:10px;border-radius:5px;background:#e7e7e3"></i><i style="position:absolute;left:24px;top:96px;width:180px;height:10px;border-radius:5px;background:#e7e7e3"></i>', 'left:344px;top:90px;width:328px;height:140px;border-radius:16px;background:#fff', 3.2, { x: 180, r: 6 });
    for (let i = 0; i < 3; i++) part(`<i style="position:absolute;left:20px;top:21px;width:22px;height:22px;border-radius:6px;background:${['#1f9e8a', '#c69ad9', '#f0b44c'][i]}"></i><i style="position:absolute;left:58px;top:26px;width:${[220, 170, 250][i]}px;height:12px;border-radius:6px;background:#e7e7e3"></i><i style="position:absolute;right:20px;top:26px;width:70px;height:12px;border-radius:6px;background:#d9dde6"></i>`, `left:28px;top:${248 + i * 72}px;width:644px;height:62px;border-radius:14px;background:#fff`, 3.45 + i * .14, { y: 80 });
    part('<b style="position:absolute;inset:0;text-align:center;font:700 17px/52px Manrope;color:#fff">Approve</b>', 'left:494px;top:470px;width:178px;height:52px;border-radius:26px;background:#1f9e8a', 3.95, { y: 90, s: .6 });
    part('<b style="position:absolute;inset:0;text-align:center;font:700 17px/52px Manrope;color:#16335a">Request info</b>', 'left:296px;top:470px;width:186px;height:52px;border-radius:26px;background:#fff;box-shadow:inset 0 0 0 2px #16335a', 4.05, { y: 90, s: .6 });

    // component annotations, like a spec layer
    [['Header / brand', 112, 204, 4.3], ['Card / metric', 124, 300, 4.45], ['Button / primary', 966, 668, 4.6]].forEach(([s, x, y, at]) =>
      tr(mk(null, 'pill', s, `left:${x}px;top:${y}px;background:#c69ad9;color:#16335a;font-size:15px;padding:7px 13px`), [[at, { s: .6, o: 0 }], [at + .4, { s: 1, o: 1 }, 'back'], [6.1, {}], [6.5, { o: 0, s: .9 }, 'in']]));

    const a = stat('left:56px;top:640px;--c:#16335a');
    a.sub.textContent = 'in enterprise deals won';
    tr(a.el, [[5.0, { y: 60, o: 0, s: .9 }], [5.7, { y: 0, o: 1, s: 1 }, 'back'], ...out(7.0)]);
    count(a.b, 5.05, 6.3, 500, v => '$' + Math.round(v) + 'M+');
    const b = mk(null, 'pill', '50+ designers · 5 teams', 'left:880px;top:160px;background:#1f9e8a;color:#fff');
    tr(b, [[5.4, { x: 60, o: 0 }], [6.0, { x: 0, o: 1 }, 'back'], ...out(7.05)]);
  },

  /* ---------- Paytm Chat: pay-first onboarding ---------- */
  'paytm-chat'() {
    bg('background:#eef5ff');
    drift(blob(1060, 160, 240, 'rgba(0,185,241,.28)'), -50, 1, 1.15);
    drift(blob(160, 820, 240, 'rgba(0,46,110,.14)'), 60, 1.1, .9);
    const L = phone('src/chat-2.webp', 110, 210, 2.133, '', 260);
    const R = phone('src/chat-1.webp', 830, 210, 2.133, '', 260);
    tr(L.p, [[.3, { x: -160, o: 0, r: -5, s: .92 }], [1.1, { x: 0, o: 1 }], [7.0, {}], [7.6, { x: -120, o: 0 }, 'in']]);
    tr(R.p, [[.4, { x: 160, o: 0, r: 5, s: .92 }], [1.2, { x: 0, o: 1 }], [7.0, {}], [7.6, { x: 120, o: 0 }, 'in']]);
    tr(L.imgs[0], [[1.4, { y: 0 }], [3.4, { y: -40 }, 'io'], [5.4, { y: 0 }, 'io']]);
    const C = phone(['src/onb-1.webp', 'src/split-1.webp', 'src/split-3.webp'], 460, 150, 2.05);
    tr(C.p, [[0, { y: 140, o: 0, s: .94 }], [.85, { y: 0, o: 1, s: 1 }], ...out(7.05)]);
    slideIn(C.imgs[1], 1.95, C.sw); slideIn(C.imgs[2], 3.45, C.sw);
    pointer([[1.0, { x: 640, y: 920, o: 0 }], [1.25, { o: 1 }], [1.7, C.at(.5, .955), 'io'], [1.9, {}], [2.6, C.at(.25, .6), 'io'], [2.8, {}], [3.2, C.at(.5, .885), 'io'], [3.5, {}], [4.1, { x: 700, y: 940, o: 0 }, 'in']], [1.75, 2.7, 3.3], '#00b9f1');
    const a = stat('left:60px;top:650px;--c:#002e6e');
    a.sub.textContent = 'drop-off after pay-first onboarding';
    pop(a.el, 3.8);
    hooks.push(t => { const k = E.liquid(clamp((t - 4.0) / 1.3)); a.b.textContent = '34% → ' + Math.round(34 - 22 * k) + '%'; });
    pop(mk(null, 'pill', '100M+ monthly users', 'left:800px;top:110px;background:#002e6e;color:#fff'), 4.4, { x: 60 });
  },

  /* ---------- Airtel: pinnable categories ---------- */
  airtel() {
    bg('background:#f3f3f3');
    drift(blob(1050, 820, 260, 'rgba(230,0,126,.12)'), -60, 1, 1.15);
    const f = mk(null, '', '<i style="left:28px;top:34px;width:180px;height:18px;border-radius:9px;background:#e6e6e6"></i><i style="left:28px;top:66px;width:280px;height:44px;border-radius:22px;background:#f1f1f1"></i><b style="left:28px;top:132px;font:700 15px ui-monospace,Menlo,monospace;color:#9a9a9a;letter-spacing:.06em">PINNED</b><b style="left:28px;top:322px;font:700 15px ui-monospace,Menlo,monospace;color:#9a9a9a;letter-spacing:.06em">ALL FEATURES</b>', 'left:120px;top:100px;width:400px;height:720px;border-radius:44px;background:#fff;box-shadow:inset 0 0 0 3px #141414;overflow:hidden');
    tr(f, [[0, { y: 80, o: 0, s: .95 }], [.8, { y: 0, o: 1, s: 1 }], ...out(7.05)]);
    const glyph = ['border-radius:50%', 'border-radius:8px', 'border-radius:50% 50% 8px 8px', 'border-radius:8px 50%', 'border-radius:50% 8px', 'border-radius:4px;transform:rotate(45deg) scale(.8)'];
    const tile = (x, y, g, c = '#ececec', ic = '#e40000') => mk(f, '', `<i style="left:34px;top:34px;width:36px;height:36px;background:${ic};${glyph[g % glyph.length]}"></i>`, `left:${x}px;top:${y}px;width:104px;height:104px;border-radius:24px;background:${c}`);
    [148, 268].forEach((x, i) => pop(tile(x, 166, i + 3, '#f4f4f4', '#d0d0d0'), .9 + i * .1, { s: .7 }));
    const slot = mk(f, '', '', 'left:28px;top:166px;width:104px;height:104px;border-radius:24px;box-shadow:inset 0 0 0 2px #d9d9d9');
    pop(slot, .9, { s: .7 });
    let g = 0;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      if (r === 1 && c === 1) continue;
      pop(tile(28 + c * 120, 356 + r * 120, g++), 1.1 + (r * 3 + c) * .07, { s: .6, y: 20 });
    }
    // the user's favourite category lifts out of the grid and pins to the first slot
    const m = tile(148, 476, 1);
    tr(m, [[1.4, { s: .6, o: 0 }], [2.0, { s: 1, o: 1 }, 'back'], [2.6, { s: 1.08 }], [3.4, { x: -120, y: -310, s: 1 }, 'io'], ...out(7.05).map(k => [k[0], { ...k[1], x: -120, y: -310 }, k[2]])]);
    const purple = mk(m, '', '', 'inset:0;border-radius:24px;background:#c9a6f0');
    tr(purple, [[3.3, { o: 0 }], [3.6, { o: 1 }, 'io']]);
    const badge = mk(m, '', '1', 'left:36px;top:36px;width:32px;height:32px;border-radius:50%;background:#e6007e;color:#fff;font:700 16px/32px Manrope;text-align:center');
    tr(badge, [[3.5, { s: 0 }], [3.85, { s: 1 }, 'back']]);
    pointer([[1.9, { x: 420, y: 900, o: 0 }], [2.2, { o: 1 }], [2.55, { x: 314, y: 624 }, 'io'], [3.4, { x: 194, y: 314 }, 'io'], [3.7, {}], [4.2, { x: 360, y: 940, o: 0 }, 'in']], [2.6], '#e6007e');
    // annotation, in the case study's pink spec style
    const line = mk(null, '', '', 'left:254px;top:315px;height:2px;width:0;background:#e6007e');
    hooks.push(t => { line.style.width = 356 * E.io(clamp((t - 3.9) / .6)) + 'px'; line.style.opacity = t < 7.1 ? 1 : Math.max(0, 1 - (t - 7.1) / .5); });
    const dot = mk(null, '', '', 'left:603px;top:309px;width:14px;height:14px;border-radius:50%;background:#e6007e');
    tr(dot, [[4.4, { s: 0 }], [4.6, { s: 1 }, 'back'], ...out(7.05)]);
    const note = mk(null, '', '<b style="position:static;font:500 26px/1.45 ui-monospace,Menlo,monospace;color:#141414"></b>', 'left:640px;top:290px;width:500px');
    typed(note.firstChild, 4.5, 5.6, 'The first category is a place that can be customized by the user.');
    tr(note, [[0, {}], ...out(7.05)]);
    const a = stat('left:640px;top:520px;--c:#e40000;box-shadow:inset 0 0 0 2px #e6e6e6');
    a.sub.textContent = 'faster feature discovery';
    pop(a.el, 4.8);
    count(a.b, 4.85, 6.0, 14, v => Math.round(v) + '%');
    ['1M+ merchants', '60+ features', '100+ icons'].forEach((s, i) => pop(mk(null, 'pill', s, `left:${640 + [0, 196, 366][i]}px;top:730px;background:#e6007e;color:#fff;font-size:18px`), 5.2 + i * .15, { y: 30 }));
  },

  /* ---------- Winuall: design system to product ---------- */
  winuall() {
    bg('background:#f4f8ff');
    drift(blob(1040, 140, 260, 'rgba(0,136,255,.16)'), -60, 1, 1.15);
    drift(blob(140, 840, 220, 'rgba(68,240,160,.18)'), 60, 1.1, .9);
    const { w } = win(null, ['src/win-dash.webp'], 'left:60px;top:200px;width:760px;height:500px', 'winuall.com/dashboard');
    tr(w, [[1.2, { y: 80, o: 0, s: .94 }], [2.0, { y: 0, o: 1, s: 1 }], ...out(7.0)]);
    // tokens come first, then they land in the product
    [['#0088FF', 'Main'], ['#051839', 'Secondary'], ['#44F0A0', 'Positive'], ['#FF7E62', 'Negative']].forEach(([c, n], i) => {
      const el = mk(null, 'pill', `<i style="position:absolute;left:12px;top:10px;width:28px;height:28px;border-radius:50%;background:${c}"></i><span style="position:static;padding-left:30px">${n}<em style="position:static;font-style:normal;font-weight:600;color:#8a93a6;margin-left:8px">${c}</em></span>`, `left:${60 + [0, 204, 450, 680][i]}px;top:90px;font-size:17px;padding:13px 18px;box-shadow:inset 0 0 0 2px #e3eaf6`);
      tr(el, [[.2 + i * .15, { y: -40, o: 0, s: .8 }], [.8 + i * .15, { y: 0, o: 1, s: 1 }, 'back'], ...out(7.0)]);
    });
    const P = phone(['src/win-m2.webp', 'src/win-m4.webp'], 860, 210, 2.14);
    tr(P.p, [[1.6, { y: 120, o: 0 }], [2.4, { y: 0, o: 1 }], ...out(7.05)]);
    slideIn(P.imgs[1], 3.1, P.sw);
    pointer([[2.4, { x: 1000, y: 920, o: 0 }], [2.6, { o: 1 }], [2.95, P.at(.85, .32), 'io'], [3.2, {}], [3.75, P.at(.49, .40), 'io'], [4.0, {}], [4.6, { x: 1100, y: 940, o: 0 }, 'in']], [3.0, 3.8], '#0088FF');
    const a = stat('left:70px;top:620px;--c:#0088FF;box-shadow:inset 0 0 0 2px #e3eaf6');
    a.sub.textContent = 'learners served';
    pop(a.el, 4.2);
    count(a.b, 4.25, 5.6, 500000, v => v > 499000 ? '500,000+' : (Math.round(v / 1000) * 1000).toLocaleString('en-US'));
    pop(mk(null, 'pill', '4 products shipped', 'left:500px;top:760px;background:#051839;color:#fff'), 4.7, { x: -40 });
  },

  /* ---------- Hope House: anonymous Q&A for teens ---------- */
  'hope-house'() {
    bg('background:#fff');
    drift(blob(260, 200, 240, 'rgba(240,107,139,.16)'), 60, 1, 1.15);
    drift(blob(980, 800, 260, 'rgba(249,200,64,.22)'), -60, 1.1, .9);
    // the logo: an H and a house roof draw in, then the roof settles on the H
    const svg = (d, c) => mk(null, '', `<svg width="360" height="360" viewBox="0 0 300 300" style="position:static;display:block"><path d="${d}" pathLength="1" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1" stroke-dashoffset="1"/></svg>`, 'left:90px;top:210px');
    const H = svg('M90 130V270M210 130V270M90 200H210', '#f06b8b'), roof = svg('M50 140 150 60 250 140', '#f9c840');
    const draw = (el, t0) => hooks.push(t => { el.querySelector('path').style.strokeDashoffset = 1 - E.io(clamp((t - t0) / 1)); });
    draw(H, .3); draw(roof, .7);
    tr(H, [[1.6, { x: 0 }], [2.3, { x: 0 }], ...out(7.0)]);
    tr(roof, [[.7, { x: -80, y: -60, r: -12 }], [1.8, {}], [2.6, { x: 0, y: 0, r: 0 }, 'back'], ...out(7.0)]);
    pop(mk(null, 'title', 'Hope House', 'left:120px;top:590px;font-size:64px;color:#141414'), 2.7, { y: 30 });
    pop(mk(null, 'pill', 'Anonymous by design', 'left:120px;top:700px;background:#f06b8b;color:#fff'), 3.0, { y: 30 });
    pop(mk(null, 'pill', 'Built for teens', 'left:120px;top:770px;background:#f9c840;color:#141414'), 3.15, { y: 30 });
    const stack = (srcs, l, t, w) => { const el = mk(null, 'stk', '', `left:${l}px;top:${t}px;width:${w}px;height:${Math.round(w * 2.12)}px`); return { el, imgs: srcs.map(s => { const i = document.createElement('img'); i.src = s; el.appendChild(i); return i; }) }; };
    const A = stack(['src/hope-1.webp', 'src/hope-2.webp'], 560, 120, 260), B = stack(['src/hope-3.webp', 'src/hope-4.webp'], 860, 200, 260);
    pop(A.el, .9, { y: 120 }, 7.05); pop(B.el, 1.1, { y: 120 }, 7.1);
    fade(A.imgs[1], 2.55); fade(B.imgs[1], 3.95);
    pointer([[1.9, { x: 700, y: 920, o: 0 }], [2.1, { o: 1 }], [2.4, { x: 630, y: 318 }, 'io'], [2.6, {}], [3.6, { x: 930, y: 300 }, 'io'], [4.0, {}], [4.6, { x: 1000, y: 940, o: 0 }, 'in']], [2.45, 3.85], '#f06b8b');
  },

  /* ---------- Poll Police: election app for Tamil Nadu Police ---------- */
  'poll-police'() {
    bg('background:#fff');
    mk(null, '', '', 'inset:0;background:#ff3e78;clip-path:polygon(0 0,100% 0,100% 22%,0 46%)');
    pop(mk(null, 'title', 'Election<br>App', 'left:70px;top:80px;font-size:120px;color:#fff;white-space:normal;width:500px'), .1, { y: 40 });
    pop(mk(null, '', 'For Tamil Nadu Police', 'left:74px;top:322px;font:600 24px Manrope;color:rgba(255,255,255,.85)'), .4, { y: 20 });
    const slide = (src, l, t, r, at) => {
      const el = mk(null, '', `<img src="${src}" style="width:100%">`, `left:${l}px;top:${t}px;width:330px;height:330px;border-radius:26px;overflow:hidden;background:#fff;box-shadow:inset 0 0 0 2px #f6d2de`);
      el.firstChild.style.position = 'static';
      tr(el, [[at, { y: 260, r: 0, o: 0, s: .9 }], [at + .7, { y: 0, r, o: 1, s: 1 }, 'back'], ...out(7.0).map(k => [k[0], { ...k[1], r }, k[2]])]);
      return el;
    };
    slide('src/pp-133m.webp', 520, 340, -6, .9); slide('src/pp-B7WB.webp', 690, 300, 2, 1.25); slide('src/pp-XXA9.webp', 850, 370, 7, 1.6);
    const a = stat('left:70px;top:560px;--c:#ff3e78;box-shadow:inset 0 0 0 2px #f6d2de');
    a.sub.textContent = 'people served in Tamil Nadu';
    pop(a.el, 2.3);
    count(a.b, 2.35, 3.6, 70, v => Math.round(v) + 'M+');
    pop(mk(null, 'pill', '3 districts on launch', 'left:70px;top:780px;background:#141414;color:#fff'), 2.7, { y: 30 });
  },

  /* ---------- Snapshot: camera with templates ---------- */
  snapshot() {
    bg('background:#121212');
    drift(blob(980, 180, 260, 'rgba(245,183,46,.2)'), -60, 1, 1.15);
    drift(blob(180, 800, 240, 'rgba(245,183,46,.1)'), 60, 1.1, .9);
    const L = phone('src/snap2-1.webp', 110, 230, 2.15, 'background:#2a2a2a', 250);
    const R = phone('src/snap2-6.webp', 840, 230, 2.16, 'background:#2a2a2a', 250);
    tr(L.p, [[.3, { x: -160, o: 0, r: -6, s: .92 }], [1.1, { x: 0, o: 1 }], [7.0, {}], [7.6, { x: -120, o: 0 }, 'in']]);
    tr(R.p, [[.4, { x: 160, o: 0, r: 6, s: .92 }], [1.2, { x: 0, o: 1 }], [7.0, {}], [7.6, { x: 120, o: 0 }, 'in']]);
    const C = phone(['src/snap2-3.webp', 'src/snap2-2.webp', 'src/snap2-4.webp'], 460, 140, 2.13, 'background:#2a2a2a');
    tr(C.p, [[0, { y: 140, o: 0, s: .94 }], [.85, { y: 0, o: 1, s: 1 }], ...out(7.05)]);
    // shutter: press, flash, then the edit and the gallery
    const flash = mk(null, '', '', `left:467px;top:147px;width:266px;height:${Math.round(266 * 2.13)}px;border-radius:31px;background:#fff`);
    tr(flash, [[0, { o: 0 }], [2.0, { o: 0 }], [2.08, { o: .95 }, 'lin'], [2.6, { o: 0 }, 'in']]);
    fade(C.imgs[1], 2.25); slideIn(C.imgs[2], 3.55, C.sw);
    pointer([[1.1, { x: 640, y: 920, o: 0 }], [1.35, { o: 1 }], [1.85, C.at(.5, .9), 'io'], [2.1, {}], [3.3, C.at(.88, .09), 'io'], [3.6, {}], [4.2, { x: 700, y: 940, o: 0 }, 'in']], [1.95, 3.4], '#f5b72e');
    const a = stat('left:60px;top:660px;--c:#f5b72e', 'dark');
    a.sub.textContent = 'SUS score after redesign';
    pop(a.el, 4.0);
    count(a.b, 4.05, 5.4, 6.02, v => (76.25 + v).toFixed(2));
    pop(mk(null, 'pill', '10 interviews', 'left:820px;top:90px;background:#f5b72e;color:#141414'), 4.4, { x: 60 });
    pop(mk(null, 'pill', '80+ survey responses', 'left:820px;top:156px;background:#2a2a2a;color:#fff'), 4.55, { x: 60 });
  },

  /* ---------- MoneyLingo: quiz-first finance lessons ---------- */
  moneylingo() {
    bg('background:#f4f7fd');
    drift(blob(1040, 180, 260, 'rgba(59,130,246,.18)'), -60, 1, 1.15);
    drift(blob(160, 820, 240, 'rgba(247,165,49,.22)'), 60, 1.1, .9);
    const L = phone('src/ml-1.webp', 120, 200, 2.29, '', 250), R = phone('src/ml-2.webp', 830, 200, 2.43, '', 250);
    tr(L.p, [[.3, { x: -160, o: 0, r: -6, s: .92 }], [1.1, { x: 0, o: 1 }], [7.0, {}], [7.6, { x: -120, o: 0 }, 'in']]);
    tr(R.p, [[.4, { x: 160, o: 0, r: 6, s: .92 }], [1.2, { x: 0, o: 1 }], [7.0, {}], [7.6, { x: 120, o: 0 }, 'in']]);
    const C = phone(['src/ml2-2.webp', 'src/ml2-3.webp'], 460, 110, 2.41);
    tr(C.p, [[0, { y: 140, o: 0, s: .94 }], [.85, { y: 0, o: 1, s: 1 }], ...out(7.05)]);
    // picking an answer highlights it, Next scores the quiz
    const pick = mk(null, '', '', `left:${467 + 266 * .03}px;top:${117 + 641 * .475}px;width:${266 * .94}px;height:${641 * .055}px;border-radius:8px;box-shadow:inset 0 0 0 3px #3b82f6;background:rgba(59,130,246,.08)`);
    tr(pick, [[0, { o: 0 }], [1.95, { o: 0 }], [2.15, { o: 1 }, 'io'], [2.95, {}], [3.1, { o: 0 }]]);
    slideIn(C.imgs[1], 2.95, C.sw);
    pointer([[1.1, { x: 640, y: 920, o: 0 }], [1.35, { o: 1 }], [1.85, C.at(.4, .5), 'io'], [2.1, {}], [2.6, C.at(.5, .925), 'io'], [2.9, {}], [3.5, { x: 700, y: 940, o: 0 }, 'in']], [1.95, 2.75], '#3b82f6');
    const a = stat('left:60px;top:650px;--c:#0b1f4b');
    a.sub.textContent = 'interviews';
    pop(a.el, 3.6);
    count(a.b, 3.65, 4.8, 12, v => Math.round(v));
    const b = stat('left:900px;top:650px;--c:#f7a531');
    b.sub.textContent = 'custom icons';
    pop(b.el, 3.9);
    count(b.b, 3.95, 5.1, 50, v => Math.round(v) + '+');
    pop(mk(null, 'pill', '3 rounds of testing', 'left:490px;top:790px;background:#0b1f4b;color:#fff'), 4.3, { y: 30 });
  },

  /* ---------- Planteria: finding the right plant ---------- */
  planteria() {
    bg('background:#f1f0ea');
    drift(blob(1050, 820, 260, 'rgba(33,98,73,.14)'), -60, 1, 1.15);
    const card = mk(null, '', '<img src="src/pa-5.webp" style="position:static;width:100%">', 'left:80px;top:130px;width:400px;height:612px;border-radius:28px;overflow:hidden;background:#ecdbad');
    tr(card, [[0, { y: 100, o: 0, s: .95 }], [.85, { y: 0, o: 1, s: 1 }], ...out(7.0)]);
    tr(card.firstChild, [[0, { s: 1.12 }], [4, { s: 1 }, 'io'], [8, { s: 1.12 }, 'io']]);
    pop(mk(null, 'title', 'Find your plant', 'left:540px;top:140px;font-size:60px;color:#48402a'), .5, { y: 30 });
    const chips = ['Low light', 'Pet friendly', 'Easy care', 'Air purifying', 'Small space'], pos = [[540, 250], [700, 250], [886, 250], [540, 322], [740, 322]];
    const els = chips.map((c, i) => { const el = mk(null, 'pill chip', c, `left:${pos[i][0]}px;top:${pos[i][1]}px`); pop(el, 1.0 + i * .12, { y: 24, s: .8 }); return el; });
    [[1, 2.15], [2, 2.75]].forEach(([i, at]) => hooks.push(t => els[i].classList.toggle('on', t >= at && t < 7.6)));
    pointer([[1.5, { x: 800, y: 920, o: 0 }], [1.75, { o: 1 }], [2.05, { x: 770, y: 268 }, 'io'], [2.3, {}], [2.65, { x: 960, y: 268 }, 'io'], [2.9, {}], [3.4, { x: 1000, y: 940, o: 0 }, 'in']], [2.15, 2.75], '#216249');
    // the motion curve behind the micro-animations
    const crv = mk(null, '', '<svg width="300" height="220" viewBox="0 0 300 220" style="position:static;display:block"><path d="M20 200H290M20 200V10" stroke="#cfc8b4" stroke-width="2" fill="none"/><path class="c" d="M20 200C86 0 128 10 290 10" pathLength="1" stroke="#216249" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="1" stroke-dashoffset="1"/><circle r="10" fill="#48402a"/></svg>', 'left:540px;top:440px');
    pop(crv, 3.0, { y: 30 });
    pop(mk(null, '', 'ease-out · .22, 1, .36, 1', 'left:560px;top:670px;font:600 18px ui-monospace,Menlo,monospace;color:#48402a'), 3.1, { y: 20 });
    hooks.push(t => {
      const k = E.io(clamp((t - 3.4) / 1.2)); crv.querySelector('.c').style.strokeDashoffset = 1 - k;
      const u = clamp((t - 3.4) / 1.2), x = 3 * (1 - u) ** 2 * u * 86 + 3 * (1 - u) * u * u * 128 + u ** 3 * 270 + 20, y = 200 - (3 * (1 - u) ** 2 * u * 200 + 3 * (1 - u) * u * u * 190 + u ** 3 * 190);
      const c = crv.querySelector('circle'); c.setAttribute('cx', x); c.setAttribute('cy', y);
    });
    const a = stat('left:900px;top:440px;--c:#216249');
    a.sub.textContent = 'users tested';
    pop(a.el, 4.2);
    count(a.b, 4.25, 5.3, 8, v => Math.round(v) + '+');
    pop(mk(null, 'pill', 'SUS validated', 'left:900px;top:640px;background:#48402a;color:#ecdbad'), 4.5, { y: 30 });
  },

  /* ---------- Storewell: stock that doesn't go to waste ---------- */
  storewell() {
    bg('background:#fbe9e6');
    mk(null, '', '', 'left:1040px;top:0;width:160px;height:900px;background:#c8423e');
    tr(mk(null, '', '', 'left:960px;top:60px;width:150px;height:180px;border-radius:22px;background:#2a9d7f'), [[0, { y: -40, o: 0 }], [.8, { y: 0, o: 1 }], ...out(7.1)]);
    const items = ['Apple', 'Orange', 'Banana', 'Milk', 'Eggs', 'Spinach'];
    const list = mk(null, '', `<b style="left:32px;top:32px;font:800 26px Manrope;letter-spacing:.04em;color:#141414">YOUR SHOPPING LIST</b>` + items.map((n, i) => `<div class="row" style="left:32px;top:${96 + i * 76}px;width:356px;height:60px"><i class="box" style="left:0;top:16px"></i><b style="left:50px;top:14px;font:600 24px Manrope;color:#141414">${n}</b><i class="strike" style="left:48px;top:30px;height:3px;width:0;background:#c8423e"></i></div>`).join(''), 'left:70px;top:150px;width:420px;height:580px;border-radius:28px;background:#fff');
    tr(list, [[0, { y: 100, o: 0, s: .95 }], [.85, { y: 0, o: 1, s: 1 }], ...out(7.0)]);
    const rows = [...list.querySelectorAll('.row')];
    [1.3, 1.75, 2.2, 2.65].forEach((at, i) => hooks.push(t => {
      const k = E.liquid(clamp((t - at) / .4)); rows[i].querySelector('.box').classList.toggle('on', t >= at);
      rows[i].querySelector('.strike').style.width = 120 * k + 'px'; rows[i].querySelector('b').style.opacity = 1 - .55 * k;
    }));
    const P = phone(['src/sb-8.webp', 'src/sb-7.webp'], 560, 150, 2.1);
    tr(P.p, [[.6, { y: 140, o: 0 }], [1.4, { y: 0, o: 1 }], ...out(7.05)]);
    const scan = mk(null, '', '', 'left:567px;top:240px;width:266px;height:4px;background:#2a9d7f');
    tr(scan, [[0, { o: 0 }], [1.5, { o: 0, y: 0 }], [1.6, { o: 1 }], [2.9, { y: 330 }, 'io'], [3.0, { o: 0 }]]);
    slideIn(P.imgs[1], 3.5, P.sw);
    pointer([[2.6, { x: 700, y: 920, o: 0 }], [2.8, { o: 1 }], [3.2, P.at(.5, .9), 'io'], [3.45, {}], [4.0, P.at(.77, .965), 'io'], [4.25, {}], [4.8, { x: 760, y: 940, o: 0 }, 'in']], [3.3, 4.1], '#2a9d7f');
    const a = stat('left:870px;top:330px;--c:#c8423e');
    a.sub.textContent = 'interviews + shadowing';
    pop(a.el, 4.3);
    count(a.b, 4.35, 5.4, 10, v => Math.round(v) + '+');
    const b = stat('left:870px;top:540px;--c:#2a9d7f');
    b.sub.textContent = 'flows tested';
    pop(b.el, 4.55);
    count(b.b, 4.6, 5.6, 5, v => Math.round(v));
  },

  /* ---------- Group Alarm: one switch, many alarms ---------- */
  'group-alarm'() {
    bg('background:#fff');
    mk(null, '', '', 'left:0;top:0;width:1200px;height:900px;background:#2155ff;clip-path:polygon(0 0,100% 0,100% 30%,0 46%)');
    const times = ['6:45', '6:55', '7:05', '7:15', '7:30'];
    const tg = (x, y) => `<i class="tg" style="left:${x}px;top:${y}px"><i></i></i>`;
    const card = mk(null, '', `<b style="left:36px;top:34px;font:700 30px Manrope;letter-spacing:-.02em;color:#141414">Morning group</b><span style="left:36px;top:76px;font:600 17px Manrope;color:rgba(20,20,20,.5)">5 alarms · weekdays</span>${tg(410, 40)}<i style="left:36px;top:122px;width:448px;height:2px;background:#eef0f7"></i>` + times.map((t, i) => `<div class="row" style="left:36px;top:${146 + i * 88}px;width:448px;height:76px"><b style="left:0;top:12px;font:700 40px Manrope;letter-spacing:-.03em;color:#141414">${t}<small style="position:static;font-size:20px;margin-left:6px;color:rgba(20,20,20,.5)">AM</small></b>${tg(374, 20)}</div>`).join(''), 'left:80px;top:140px;width:520px;height:620px;border-radius:32px;background:#fff;box-shadow:inset 0 0 0 2px #e6e9f5');
    tr(card, [[0, { y: 100, o: 0, s: .95 }], [.85, { y: 0, o: 1, s: 1 }], ...out(7.0)]);
    const [master, ...rest] = card.querySelectorAll('.tg');
    hooks.push(t => { master.classList.toggle('on', t >= 1.75); rest.forEach((r, i) => r.classList.toggle('on', t >= 1.95 + i * .14)); });
    pointer([[1.0, { x: 520, y: 920, o: 0 }], [1.25, { o: 1 }], [1.65, { x: 518, y: 196 }, 'io'], [1.9, {}], [2.5, { x: 620, y: 940, o: 0 }, 'in']], [1.75], '#2155ff');
    const st = mk(null, 'stk', '<img src="src/ga-2.webp"><img src="src/ga-3.webp">', 'left:660px;top:70px;width:290px;height:601px');
    pop(st, .5, { y: 120 }, 7.05);
    fade(st.children[1], 3.0);
    const a = stat('left:650px;top:700px;--c:#2155ff;box-shadow:inset 0 0 0 2px #e6e9f5');
    a.sub.textContent = 'downloads';
    pop(a.el, 3.6);
    count(a.b, 3.65, 4.9, 1000, v => (v > 999 ? '1,000' : Math.round(v)) + '+');
    const b = stat('left:960px;top:700px;--c:#141414;box-shadow:inset 0 0 0 2px #e6e9f5');
    b.sub.textContent = 'reviews';
    pop(b.el, 3.85);
    count(b.b, 3.9, 5.0, 20, v => Math.round(v) + '+');
  },

  /* ---------- Divergent Minds, Convergent Design: research study ---------- */
  'divergent-minds-convergent-design'() {
    bg('background:#e9f1fb');
    drift(blob(1040, 160, 240, 'rgba(75,123,216,.2)'), -60, 1, 1.15);
    drift(blob(160, 820, 240, 'rgba(242,182,50,.2)'), 60, 1.1, .9);
    const t1 = mk(null, 'title', '', 'left:70px;top:80px;font-size:84px;color:#13294b'), t2 = mk(null, 'title', '', 'left:70px;top:168px;font-size:84px;color:#4b7bd8');
    typed(t1, .2, 1.2, 'Divergent Minds,'); typed(t2, 1.2, 2.2, 'Convergent Design');
    tr(t1, [[0, {}], ...out(7.0)]); tr(t2, [[0, {}], ...out(7.05)]);
    // 8 participants start scattered, then settle into 4 background groups
    const C = ['#f2b632', '#e26d5c', '#4b7bd8', '#7bc4a4'];
    const scatter = [[150, 420], [420, 360], [700, 450], [980, 380], [260, 650], [560, 700], [840, 640], [1060, 600]];
    const group = [[160, 470], [250, 470], [440, 470], [530, 470], [720, 470], [810, 470], [1000, 470], [1090, 470]];
    const order = [0, 4, 1, 5, 2, 6, 3, 7];
    scatter.forEach(([x, y], i) => {
      const g = order.indexOf(i) >> 1, [gx, gy] = group[order.indexOf(i)];
      const av = mk(null, '', `<svg width="96" height="96" viewBox="0 0 96 96" style="position:static;display:block"><circle cx="48" cy="48" r="48" fill="${C[g]}"/><circle cx="48" cy="38" r="15" fill="#13294b"/><path d="M20 80c4-16 16-22 28-22s24 6 28 22" fill="#13294b"/></svg>`, `left:${gx - 48}px;top:${gy - 48}px`);
      const dx = x - gx, dy = y - gy;
      tr(av, [[2.0 + i * .08, { x: dx, y: dy + 40, s: .4, o: 0 }], [2.6 + i * .08, { x: dx, y: dy, s: 1, o: 1 }, 'back'], [3.4, {}], [4.4, { x: 0, y: 0 }, 'io'], ...out(7.05)]);
    });
    [0, 1, 2, 3].forEach(g => {
      const ring = mk(null, '', '', `left:${group[g * 2][0] - 64}px;top:${470 - 64}px;width:218px;height:128px;border-radius:64px;box-shadow:inset 0 0 0 3px ${C[g]}`);
      tr(ring, [[4.3 + g * .1, { s: .8, o: 0 }], [4.8 + g * .1, { s: 1, o: 1 }, 'back'], ...out(7.0)]);
    });
    const a = stat('left:70px;top:640px;--c:#13294b');
    a.sub.textContent = 'interviews';
    pop(a.el, 4.8);
    count(a.b, 4.85, 5.8, 8, v => Math.round(v));
    const b = stat('left:330px;top:640px;--c:#4b7bd8');
    b.sub.textContent = 'background groups';
    pop(b.el, 5.0);
    count(b.b, 5.05, 6.0, 4, v => Math.round(v));
    pop(mk(null, 'pill', 'UX research · 2024', 'left:860px;top:690px;background:#13294b;color:#fff'), 5.2, { x: 60 });
  },
};

/* the frame each video starts on (and its poster): the full composition, so hover-play starts seamlessly */
const HERO = { makemytrip: 5.35, 'insider-vibes': 5.5, 'ai-native-design-system': 6.35, 'paytm-chat': 5.4, airtel: 6.05, winuall: 5.7, 'hope-house': 5, 'poll-police': 4.6, snapshot: 5.6, moneylingo: 5.4, planteria: 5.5, storewell: 5.7, 'group-alarm': 5.1, 'divergent-minds-convergent-design': 6.1 };
const id = new URLSearchParams(location.search).get('id') || 'makemytrip';
(COVERS[id] || COVERS.makemytrip)();
window.__hero = HERO[id] ?? 5;

function render(t) {
  t = ((t % LOOP) + LOOP) % LOOP;
  for (const [el, keys] of tracks) {
    const p = sample(keys, t);
    el.style.transform = `translate(${p.x}px,${p.y}px) rotate(${p.r}deg) scale(${p.s})`;
    el.style.opacity = p.o;
    el.style.filter = p.b ? `blur(${p.b}px)` : '';
  }
  for (const h of hooks) h(t);
}
window.__render = render;
window.__loop = LOOP;

const q = new URLSearchParams(location.search);
if (q.has('cap')) { document.body.classList.add('cap'); render(0); return; }
const fit = () => { const k = Math.min(innerWidth / W, innerHeight / H); cv.style.transform = `scale(${k})`; cv.style.marginRight = W * (k - 1) + 'px'; cv.style.marginBottom = H * (k - 1) + 'px'; };
fit(); addEventListener('resize', fit);
if (q.has('t')) render(+q.get('t'));
else { const t0 = performance.now(); const loop = n => { render((n - t0) / 1000); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
})();
