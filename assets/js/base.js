/* shared: Lenis + GSAP wiring */
(function(){
  document.documentElement.classList.add('js');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SN = window.SN = {RM, fine: matchMedia('(hover:hover) and (pointer:fine)').matches};
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  if (window.Draggable) gsap.registerPlugin(Draggable);
  if (window.DrawSVGPlugin) gsap.registerPlugin(DrawSVGPlugin);
  const opts = JSON.parse(document.body.dataset.lenis || '{}');
  if (!RM && window.Lenis) {
    const lenis = SN.lenis = new Lenis(Object.assign({lerp:.1, wheelMultiplier:1}, opts));
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  SN.vel = () => SN.lenis ? SN.lenis.velocity : 0;
  SN.to = (target) => SN.lenis ? SN.lenis.scrollTo(target, {offset:0, duration:1.4}) : (typeof target==='number'?scrollTo(0,target):document.querySelector(target)?.scrollIntoView({behavior:'smooth'}));
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const h = a.getAttribute('href'); e.preventDefault();
    SN.to(h === '#' ? 0 : h);
  });
  SN.fontsReady = (document.fonts ? document.fonts.ready : Promise.resolve());
})();
