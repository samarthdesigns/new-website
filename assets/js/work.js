/* WORK INDEX — extrafazant /werk: staggered columns drift at different speeds with scroll. */
(function(){
  if (SN.RM) return;
  SN.fontsReady.then(() => {
    gsap.matchMedia().add('(min-width: 1101px)', () => {
      SN.qa('.wgrid').forEach(g => SN.qa('.wcol', g).forEach(c => {
        const k = +c.dataset.col === 1 ? -60 : 40;
        gsap.fromTo(c, {y: -k / 2}, {y: k / 2, ease: 'none', scrollTrigger: {trigger: g, start: 'top bottom', end: 'bottom top', scrub: true}});
      }));
    });
  });
})();
