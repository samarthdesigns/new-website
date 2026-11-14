/* Case-study visuals: animate bars when seen, replay the pay-button jump. */
(function(){
  var els=document.querySelectorAll('.vz-anim');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target)}})},{threshold:.3});
    els.forEach(function(el){io.observe(el)});
  }else els.forEach(function(el){el.classList.add('is-in')});
  document.querySelectorAll('[data-vz-replay]').forEach(function(b){
    b.addEventListener('click',function(){
      var ph=b.closest('.vz-ph');if(!ph)return;
      ph.querySelectorAll('.run').forEach(function(x){x.classList.remove('run');void x.offsetWidth;x.classList.add('run')});
    });
  });
})();
