/* Plays the UI artifacts in [data-seq] roots as a loop while they're on screen.
   data-loop="ms" on the root; on children: data-at="ms" adds a class (data-cls, default "on"), data-off="ms" removes it,
   data-tap="ms:selector;..." flashes a tap at a target, data-path="ms:selector;..." moves a cursor to targets. */
(function () {
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = new WeakSet();
  function parse(str) {
    return (str || '').split(';').filter(Boolean).map(function (p) { var i = p.indexOf(':'); return [+p.slice(0, i), p.slice(i + 1)]; });
  }
  function center(root, sel, ref) {
    var t = root.querySelector(sel); if (!t) return null;
    var a = t.getBoundingClientRect(), b = ref.getBoundingClientRect();
    var k = ref.offsetWidth ? b.width / ref.offsetWidth : 1; // undo any scale on the slide
    return [(a.left + a.width / 2 - b.left) / k, (a.top + a.height / 2 - b.top) / k];
  }
  function setup(root) {
    if (seen.has(root)) return; seen.add(root);
    var loop = +root.dataset.loop || 8000, timers = [], running = false;
    var steps = [].slice.call(root.querySelectorAll('[data-at]'));
    var T = function (el) { return el.dataset.target ? (root.querySelector(el.dataset.target) || el) : el; };
    function reset() {
      steps.forEach(function (el) { T(el).classList.remove(el.dataset.cls || 'on'); });
      root.querySelectorAll('.ua-tap,.ua-cur').forEach(function (el) { el.classList.remove('on'); });
    }
    function finalState() {
      steps.forEach(function (el) { if (!el.dataset.off) T(el).classList.add(el.dataset.cls || 'on'); });
    }
    if (RM || root.closest('.th')) { finalState(); return; }
    function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
    function run() {
      reset(); root.style.opacity = '';
      steps.forEach(function (el) {
        var c = el.dataset.cls || 'on';
        at(+el.dataset.at, function () { T(el).classList.add(c); });
        if (el.dataset.off) at(+el.dataset.off, function () { T(el).classList.remove(c); });
      });
      root.querySelectorAll('[data-tap]').forEach(function (tap) {
        parse(tap.dataset.tap).forEach(function (s) {
          at(s[0], function () {
            var ref = tap.offsetParent || root, c = center(root, s[1], ref); if (!c) return;
            tap.style.left = c[0] + 'px'; tap.style.top = c[1] + 'px';
            tap.classList.remove('on'); void tap.offsetWidth; tap.classList.add('on');
          });
        });
      });
      root.querySelectorAll('[data-path]').forEach(function (cur) {
        parse(cur.dataset.path).forEach(function (s, i) {
          at(s[0], function () {
            var ref = cur.offsetParent || root, c = center(root, s[1], ref); if (!c) return;
            if (!i) { cur.style.transition = 'none'; }
            cur.style.transform = 'translate(' + (c[0] - 4) + 'px,' + (c[1] - 2) + 'px)';
            cur.classList.add('on');
            if (!i) { void cur.offsetWidth; cur.style.transition = ''; }
          });
        });
      });
      at(loop - 450, function () { root.style.transition = 'opacity .4s'; root.style.opacity = '0'; });
      at(loop, run);
    }
    function stop() { timers.forEach(clearTimeout); timers = []; running = false; }
    var slide = root.closest('.slide');
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          var vis = e.isIntersecting && (!slide || slide.classList.contains('is-on'));
          if (vis && !running) { running = true; run(); }
          else if (!vis && running) { stop(); reset(); root.style.opacity = ''; }
        });
      }, { threshold: 0.25 }).observe(root);
    } else { running = true; run(); }
    // slides in the interview player switch visibility without moving; recheck when that happens
    if (slide) new MutationObserver(function () {
      var vis = slide.classList.contains('is-on');
      if (vis && !running) { running = true; run(); }
      else if (!vis && running) { stop(); reset(); root.style.opacity = ''; }
    }).observe(slide, { attributes: true, attributeFilter: ['class'] });
  }
  function scan(n) { (n || document).querySelectorAll && (n || document).querySelectorAll('[data-seq]').forEach(setup); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { scan(); }); else scan();
  new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { if (n.matches('[data-seq]')) setup(n); scan(n); } }); }); })
    .observe(document.documentElement, { childList: true, subtree: true });
})();
