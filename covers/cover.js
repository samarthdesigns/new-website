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
const phone = (parent, src, style, h) => {
  const p = mk(parent, 'phone', '<i class="isl"></i>', style);
  const s = mk(p, 'scr');
  const imgs = [].concat(src).map(u => { const i = document.createElement('img'); i.src = u; s.appendChild(i); return i; });
  return { p, s, imgs };
};
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
    bg('background:linear-gradient(160deg,#e6eeff 0%,#f4f1ea 100%)');
    tr(blob(1050, 120, 260, '#bcd3ff'), [[0, { s: .9 }], [8, { s: 1.15, x: -60 }, 'lin']]);
    tr(blob(160, 860, 240, '#ffd9c2'), [[0, { s: 1.1 }], [8, { s: .9, x: 80 }, 'lin']]);

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

    // mobile: airport pick-up flow
    const m = phone(null, ['src/mmt-m1.webp', 'src/mmt-m2.webp', 'src/mmt-m3.webp'], 'left:800px;top:150px;height:520px;background:#0d0d0f');
    m.s.style.background = '#fff';
    tr(m.p, [[5.2, { y: 900, r: 8, o: 0 }], [5.3, { o: 1 }, 'lin'], [6.0, { y: 0, r: -3 }, 'liquid'], ...out(7.0).map(k => [k[0], { ...k[1], r: -3 }, k[2]])]);
    m.imgs.forEach((im, i) => { im.style.top = '30px'; if (i) tr(im, [[5.9 + i * .45, { x: 282 }], [6.35 + i * .45, { x: 0 }, 'liquid']]); });
  },

  /* ---------- Paytm Insider: Insider Vibes ---------- */
  'insider-vibes'() {
    bg('background:linear-gradient(150deg,#6c5ce7 0%,#9b8cff 55%,#c9bfff 100%)');
    tr(blob(200, 150, 260, '#4b3cc9'), [[0, { s: 1 }], [8, { s: 1.2, x: 60 }, 'lin']]);
    tr(blob(1040, 820, 280, '#ff9ec7'), [[0, { s: 1.1 }], [8, { s: .9, x: -60 }, 'lin']]);

    const L = phone(null, 'src/insider-1.webp', 'left:170px;top:170px');
    const R = phone(null, 'src/insider-5.webp', 'left:730px;top:170px');
    const C = phone(null, ['src/insider-2.webp', 'src/insider-3.webp'], 'left:450px;top:120px');
    tr(L.p, [[.5, { x: 280, r: 0, s: .9, o: 0 }], [1.4, { x: 0, r: -7, s: .92, o: 1 }], [6.95, {}], [7.6, { x: 120, o: 0, r: -3 }, 'in']]);
    tr(R.p, [[.6, { x: -280, r: 0, s: .9, o: 0 }], [1.5, { x: 0, r: 7, s: .92, o: 1 }], [6.95, {}], [7.6, { x: -120, o: 0, r: 3 }, 'in']]);
    tr(C.p, [[0, { y: 160, o: 0, s: .9 }], [.9, { y: 0, o: 1, s: 1 }], ...out(7.0)]);
    tr(L.imgs[0], [[1.6, { y: 0 }], [3.2, { y: -60 }, 'io'], [4.6, { y: 0 }, 'io']]);
    // the poll arrives as a bottom sheet
    tr(C.imgs[1], [[2.2, { y: 640 }], [2.95, { y: 0 }, 'liquid']]);

    pointer([[1.3, { x: 700, y: 900, o: 0 }], [1.6, { o: 1 }], [2.1, { x: 640, y: 640 }, 'io'], [2.6, {}], [3.4, { x: 560, y: 547 }, 'io'], [3.9, {}], [4.4, { x: 700, y: 920, o: 0 }, 'in']], [2.15, 3.45], '#fff');

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
    tr(blob(1030, 760, 260, 'rgba(31,158,138,.55)'), [[0, { s: .9 }], [8, { s: 1.15, x: -60 }, 'lin']]);
    tr(blob(140, 160, 220, 'rgba(198,154,217,.45)'), [[0, { s: 1.1 }], [8, { s: .9, x: 60 }, 'lin']]);

    // prompt
    const pr = mk(null, '', '<span style="position:absolute;left:24px;top:21px;color:#1f9e8a;font:700 22px Manrope">✦</span><b style="position:absolute;left:58px;top:20px;font:600 22px/26px Manrope;color:#141414;letter-spacing:-.01em"></b><i style="position:absolute;right:10px;top:10px;width:48px;height:48px;border-radius:50%;background:#16335a"><svg style="position:absolute;left:13px;top:13px" width="22" height="22" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></i>', 'left:230px;top:70px;width:740px;height:68px;border-radius:34px;background:#fff;box-shadow:0 30px 60px -30px rgba(0,0,0,.6)');
    tr(pr, [[0, { y: -30, o: 0, s: .95 }], [.7, { y: 0, o: 1, s: 1 }], ...out(7.0)]);
    typed(pr.querySelector('b'), .8, 2.2, 'Build a loan review screen with Voyage');
    const caret = mk(pr, '', '', 'left:58px;top:20px;width:2px;height:26px;background:#1f9e8a');
    hooks.push(t => { const b = pr.querySelector('b'); caret.style.left = 60 + b.offsetWidth + 'px'; caret.style.opacity = t < 2.6 && (t * 2.2 | 0) % 2 === 0 ? 1 : 0; });

    // frame that assembles from system parts
    const f = mk(null, '', '', 'left:250px;top:186px;width:700px;height:546px;border-radius:20px;background:#f6f6f4;overflow:hidden;box-shadow:0 50px 90px -40px rgba(0,0,0,.7)');
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
};

const id = new URLSearchParams(location.search).get('id') || 'makemytrip';
(COVERS[id] || COVERS.makemytrip)();

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
