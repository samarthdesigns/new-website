/* CASE PAGE — mecha's dynamic section index (active item + scrubbed progress); everything else is the shared landing motion. */
(function(){
  const {RM, q, qa} = SN;
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
