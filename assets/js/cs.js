/* CASE PAGE — mecha's dynamic section index (active item + scrubbed progress); everything else is the shared landing motion. */
(function(){
  const {RM, q, qa} = SN;

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
  if (RM) return;
  SN.fontsReady.then(() => {
    const items = qa('.ni[data-sec]');
    const setActive = it => { items.forEach(i => i.classList.remove('item-active')); it.classList.add('item-active'); };
    items.forEach(it => {
      const sec = document.getElementById(it.dataset.sec), bar = q('.prog', it); if (!sec) return;
      const st = {trigger: sec, start: 'top 50%', end: 'bottom 50%', invalidateOnRefresh: true};
      gsap.fromTo(bar, {width: '0%'}, {width: '100%', ease: 'none', scrollTrigger: {...st, scrub: true, onLeave: () => gsap.set(bar, {width: '0%'})}});
      ScrollTrigger.create({...st, onEnter: () => setActive(it), onEnterBack: () => setActive(it)});
    });
    const main = q('.ni.main .prog');
    if (main) gsap.fromTo(main, {width: '0%'}, {width: '100%', ease: 'none', scrollTrigger: {trigger: '.mmain', start: 'top top', end: 'bottom bottom', scrub: true}});
    const as = q('.maside');
    if (as) gsap.fromTo(as, {'--draw': 0}, {'--draw': 1, duration: 1.4, ease: 'expo.inOut', scrollTrigger: {trigger: as, start: 'top 90%', once: true}});
    ScrollTrigger.refresh();
  });
})();
