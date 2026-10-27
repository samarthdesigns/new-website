/* CASE PAGE — mecha's dynamic section index (active item + scrubbed progress); everything else is the shared landing motion. */
(function(){
  const {RM, q, qa} = SN;

  /* locked carousel: images are AES-GCM encrypted; the password derives the key in the browser */
  SN.qa('[data-lock]').forEach(c => {
    const ov = c.querySelector('.mlock'), cta = ov.querySelector('.mlock__cta'), f = ov.querySelector('form'),
      inp = f.querySelector('input'), err = f.querySelector('.mlock__e'), imgs = [...c.querySelectorAll('img[data-enc]')];
    cta.addEventListener('click', () => { cta.hidden = true; f.hidden = false; inp.focus(); });
    f.addEventListener('submit', async e => {
      e.preventDefault(); err.textContent = 'Unlocking…';
      try {
        const bufs = await Promise.all(imgs.map(i => fetch(i.dataset.enc).then(r => r.arrayBuffer())));
        const b0 = new Uint8Array(bufs[0]), base = await crypto.subtle.importKey('raw', new TextEncoder().encode(inp.value), 'PBKDF2', false, ['deriveKey']);
        const key = await crypto.subtle.deriveKey({name: 'PBKDF2', salt: b0.slice(0, 16), iterations: 250000, hash: 'SHA-256'}, base, {name: 'AES-GCM', length: 256}, false, ['decrypt']);
        const out = await Promise.all(bufs.map(b => { b = new Uint8Array(b); return crypto.subtle.decrypt({name: 'AES-GCM', iv: b.slice(16, 28)}, key, b.slice(28)); }));
        imgs.forEach((i, k) => { i.src = URL.createObjectURL(new Blob([out[k]], {type: 'image/webp'})); });
        c.classList.remove('is-locked'); ov.classList.add('is-gone'); setTimeout(() => ov.remove(), 600);
      } catch (_) {
        err.textContent = 'Wrong password'; f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); inp.select();
      }
    });
  });

  /* image carousels: native scroll-snap (swipe on touch), buttons + counter */
  SN.qa('[data-car]').forEach(c => {
    const tr = c.querySelector('.mcar__track'), sl = [...tr.children], n = sl.length,
      num = c.querySelector('.mcar__n b'), pv = c.querySelector('[data-prev]'), nx = c.querySelector('[data-next]');
    const idx = () => Math.round(tr.scrollLeft / (sl[1].offsetLeft - sl[0].offsetLeft));
    const go = i => tr.scrollTo({left: sl[Math.max(0, Math.min(n - 1, i))].offsetLeft - sl[0].offsetLeft, behavior: 'smooth'});
    const upd = () => { const i = Math.min(n - 1, idx()); num.textContent = String(i + 1).padStart(2, '0');
      pv.disabled = tr.scrollLeft < 4; nx.disabled = tr.scrollLeft > tr.scrollWidth - tr.clientWidth - 4; };
    pv.addEventListener('click', () => go(idx() - 1));
    nx.addEventListener('click', () => go(idx() + 1));
    tr.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx() - 1); } if (e.key === 'ArrowRight') { e.preventDefault(); go(idx() + 1); } });
    tr.addEventListener('scroll', upd, {passive: true}); addEventListener('resize', upd); upd();
  });
  /* comic strip drawer: slides in from the right; Esc / scrim / × close; page scroll pauses meanwhile */
  const dr = q('.comic-drawer');
  if (dr) {
    const panel = q('.comic-drawer__panel', dr); let opener = null;
    const open = e => { opener = e.currentTarget; dr.classList.add('is-open'); dr.setAttribute('aria-hidden', 'false');
      SN.lenis && SN.lenis.stop(); document.documentElement.style.overflow = 'hidden'; setTimeout(() => panel.focus({preventScroll: true}), 50); };
    const close = () => { if (!dr.classList.contains('is-open')) return; dr.classList.remove('is-open'); dr.setAttribute('aria-hidden', 'true');
      SN.lenis && SN.lenis.start(); document.documentElement.style.overflow = ''; opener && opener.focus({preventScroll: true}); };
    qa('[data-comic-open]').forEach(b => b.addEventListener('click', open));
    qa('[data-comic-close]', dr).forEach(b => b.addEventListener('click', close));
    addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }
  if (RM) return;
  SN.fontsReady.then(() => {
    const items = qa('.ni[data-sec]');
    const setActive = it => { items.forEach(i => i.classList.remove('item-active')); it.classList.add('item-active'); };
    items.forEach(it => {
      const sec = document.getElementById(it.dataset.sec), bar = q('.prog', it); if (!sec) return;
      const st = {trigger: sec, start: 'top 50%', end: 'bottom 50%', invalidateOnRefresh: true};
      gsap.fromTo(bar, {scaleX: 0}, {scaleX: 1, ease: 'none', scrollTrigger: {...st, scrub: true, onLeave: () => gsap.set(bar, {scaleX: 0})}});
      ScrollTrigger.create({...st, onEnter: () => setActive(it), onEnterBack: () => setActive(it)});
    });
    const main = q('.ni.main .prog');
    if (main) gsap.fromTo(main, {scaleX: 0}, {scaleX: 1, ease: 'none', scrollTrigger: {trigger: '.mmain', start: 'top top', end: 'bottom bottom', scrub: true}});
    const as = q('.maside');
    /* sticky aside: if it's taller than the viewport, pin it higher so the whole list stays reachable */
    const st = q('.aside-stick');
    if (st) { const fit = () => st.style.setProperty('--stick', Math.min(99, innerHeight - st.offsetHeight) + 'px'); fit(); addEventListener('resize', fit); }
    if (as) gsap.fromTo(as, {'--draw': 0}, {'--draw': 1, duration: 1.4, ease: 'expo.inOut', scrollTrigger: {trigger: as, start: 'top 90%', once: true}});
    ScrollTrigger.refresh();
  });
})();
