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

  /* FLOW-IN-PHONE: each step = a screen; data-tap "x,y;x,y" = where the cursor taps (screen fractions) before the next screen. Loops while in view. */
  qa('[data-flow]').forEach(f => {
    const scr = q('.mflow__scr', f), hit = q('.mflow__hit', f), cur = q('.mflow__cur', f), lis = qa('.mflow__steps li', f), n = lis.length, fade = f.dataset.flow === 'fade';
    const imgs = lis.map((li, i) => { const im = new Image(); im.src = li.dataset.src; im.alt = i ? '' : li.textContent.trim(); im.decoding = 'async'; im.loading = 'lazy'; scr.appendChild(im); return im; });
    const setOn = i => lis.forEach((l, k) => l.classList.toggle('on', k === i));
    setOn(0);
    if (RM) { lis.forEach((l, i) => q('button', l).addEventListener('click', () => { imgs.forEach((im, k) => im.style.opacity = k === i || k === 0 ? 1 : 0); imgs.slice(1).forEach(im => im.style.transform = 'none'); setOn(i); })); imgs.slice(1).forEach(im => im.style.opacity = 0); return; }
    const tl = gsap.timeline({repeat: -1, paused: true}), starts = [];
    gsap.set(imgs.slice(1), fade ? {opacity: 0} : {xPercent: 100});
    lis.forEach((li, i) => {
      tl.addLabel('s' + i); starts.push(tl.duration());
      tl.to({}, {duration: fade ? 2.2 : 1.1});
      (li.dataset.tap || '').split(';').filter(Boolean).forEach(pt => {
        const [x, y] = pt.split(',').map(Number);
        tl.to(cur, {left: x * 100 + '%', top: y * 100 + '%', opacity: 1, duration: .75, ease: 'power2.inOut'})
          .to(cur, {scale: .7, duration: .12, ease: 'power1.in'}).to(cur, {scale: 1, duration: .25, ease: 'back.out(3)'}).to({}, {duration: .2});
      });
      if (i < n - 1) tl.to(imgs[i + 1], fade ? {opacity: 1, duration: .6, ease: 'power2.inOut'} : {xPercent: 0, duration: .65, ease: 'expo.inOut'}, '>');
      else tl.to(cur, {opacity: 0, duration: .3}).to(imgs.slice(1), {opacity: 0, duration: .55, ease: 'power2.inOut'}, '<').set(imgs.slice(1), fade ? {opacity: 0} : {xPercent: 100, opacity: 1});
    });
    let last = 0;
    tl.eventCallback('onUpdate', () => { const t = tl.time(); let k = 0; starts.forEach((s, j) => { if (t >= s - .01) k = j; }); if (k !== last) { last = k; setOn(k); } });
    lis.forEach((l, i) => q('button', l).addEventListener('click', () => { tl.seek('s' + i); last = i; setOn(i); }));
    ScrollTrigger.create({trigger: f, start: 'top 85%', end: 'bottom 15%', onToggle: s => s.isActive ? tl.play() : tl.pause()});
  });

  /* SPEC BOARD: notes come from <ol class="mspec__src"><li data-x data-y data-side="l|r">; dots sit on the screen, lines draw to the notes */
  qa('[data-spec]').forEach(f => {
    const src = qa('.mspec__src li', f), hit = q('.mflow__hit', f), cols = {l: q('.mspec__l', f), r: q('.mspec__r', f)}, list = q('.mspec__list', f),
      svg = q('.mspec__svg', f), img = q('.mspec__ph img', f), NS = 'http://www.w3.org/2000/svg';
    const items = src.map((li, i) => {
      const x = +li.dataset.x, y = +li.dataset.y, side = li.dataset.side || 'r', t = li.innerHTML;
      const dot = document.createElement('span'); dot.className = 'mspec__dot'; dot.textContent = i + 1; dot.style.left = x * 100 + '%'; dot.style.top = y * 100 + '%'; hit.appendChild(dot);
      const n = document.createElement('p'); n.className = 'mspec__n'; n.innerHTML = `<b>${i + 1}</b><span>${t}</span>`; n.style.margin = 0; cols[side].appendChild(n);
      list.insertAdjacentHTML('beforeend', `<p class="mspec__n" style="margin:0"><b>${i + 1}</b><span>${t}</span></p>`);
      const path = document.createElementNS(NS, 'path'); svg.appendChild(path); return {dot, n, path, side};
    });
    q('.mspec__src', f).remove();
    const lay = () => {
      const fr = f.getBoundingClientRect(); let lastB = {l: -1e9, r: -1e9};
      [...items].sort((a, b) => a.dot.getBoundingClientRect().top - b.dot.getBoundingClientRect().top).forEach(it => {
        const col = cols[it.side], cr = col.getBoundingClientRect(), d = it.dot.getBoundingClientRect(), dy = d.top + d.height / 2 - cr.top;
        const top = Math.max(dy - 10, lastB[it.side] + 14); it.n.style.top = top + 'px'; lastB[it.side] = top + it.n.offsetHeight;
        const ny = cr.top + top + 10 - fr.top, nx = (it.side === 'r' ? cr.left - 8 : cr.right + 8) - fr.left,
          dx = (it.side === 'r' ? d.right + 2 : d.left - 2) - fr.left, dyy = d.top + d.height / 2 - fr.top, mx = (nx + dx) / 2 + (it.side === 'r' ? 1 : -1) * Math.abs(nx - dx) * .2;
        it.path.setAttribute('d', `M${dx},${dyy} H${mx} L${mx + (it.side === 'r' ? 1 : -1) * Math.min(14, Math.abs(ny - dyy))},${ny} H${nx}`);
      });
    };
    const ready = () => { lay(); if (RM) return;
      items.forEach(it => { const L = it.path.getTotalLength(); gsap.set(it.path, {strokeDasharray: L, strokeDashoffset: L}); });
      gsap.set(items.map(i => i.dot), {scale: 0}); gsap.set(items.map(i => i.n), {opacity: 0, y: 8});
      const tl = gsap.timeline({scrollTrigger: {trigger: f, start: 'top 65%', once: true}});
      items.forEach((it, i) => tl.to(it.dot, {scale: 1, duration: .45, ease: 'back.out(2.4)'}, i * .38)
        .to(it.path, {strokeDashoffset: 0, duration: .7, ease: 'power2.inOut'}, i * .38 + .2).to(it.n, {opacity: 1, y: 0, duration: .5, ease: 'power2.out'}, i * .38 + .6));
    };
    img.complete ? ready() : img.addEventListener('load', ready, {once: true});
    addEventListener('resize', lay);
  });

  /* DESIGN SYSTEM ASSEMBLY: tokens pop, components build from them, the screen reveals with the matching parts outlined */
  qa('[data-ds]').forEach(f => {
    if (RM) return;
    const sw = qa('.mds__s', f), ty = qa('.mds__ty span', f), cs = qa('.mds__cmp > *', f), scr = q('.mds__scr', f), hl = qa('.mds__hl', f), em = qa('.mds__c em', f);
    gsap.set(sw, {opacity: 0, scale: .6}); gsap.set(ty, {opacity: 0, x: -10}); gsap.set(cs, {opacity: 0, y: 14}); gsap.set(em, {scaleX: 0, transformOrigin: 'right'}); gsap.set(scr, {clipPath: 'inset(0 0 100% 0)'});
    gsap.timeline({scrollTrigger: {trigger: f, start: 'top 65%', once: true}})
      .to(sw, {opacity: 1, scale: 1, duration: .45, ease: 'back.out(2)', stagger: .07})
      .to(ty, {opacity: 1, x: 0, duration: .4, stagger: .12}, '-=.2')
      .to(cs, {opacity: 1, y: 0, duration: .55, ease: 'power3.out', stagger: .18}, '+=.1')
      .to(em, {scaleX: 1, duration: .5, ease: 'expo.out', stagger: .18}, '<+.25')
      .to(scr, {clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'expo.inOut'}, '+=.15')
      .to(hl, {opacity: 1, duration: .3, stagger: .15}).to(hl, {opacity: 0, duration: .6, delay: 1.2});
  });
  if (RM) return;
  SN.fontsReady.then(() => {

    /* COUNT-UP: stats tick from 0 (or from the "before" value in "a → b"); years, ranges and words stay put */
    qa('.statrow__v, .mtable.stats .td').forEach(el => {
      const txt = el.textContent.trim(), nums = txt.match(/\d[\d,]*(?:\.\d+)?/g);
      if (!nums || /\b(19|20)\d\d\b/.test(txt) || el.children.length) return;
      const arrow = txt.includes('→'), val = s => parseFloat(s.replace(/,/g, '')),
        dec = s => (s.split('.')[1] || '').length, to = nums.map(val), from = arrow ? to.map((v, i) => i === to.length - 1 ? to[0] : v) : to.map(() => 0);
      const draw = p => { let i = 0; return txt.replace(/\d[\d,]*(?:\.\d+)?/g, m => { const k = i++, v = from[k] + (to[k] - from[k]) * p;
        return m.includes(',') ? Math.round(v).toLocaleString('en-US') : v.toFixed(dec(m)); }); };
      el.setAttribute('aria-label', txt);
      const sp = document.createElement('span'); sp.className = 'cnt'; sp.setAttribute('aria-hidden', 'true'); sp.textContent = txt; el.textContent = ''; el.appendChild(sp);
      sp.style.minWidth = sp.getBoundingClientRect().width + 'px'; sp.textContent = draw(0);
      const o = {p: 0};
      gsap.to(o, {p: 1, duration: arrow ? 2 : 1.6, ease: 'power3.out', onUpdate: () => sp.textContent = draw(o.p), onComplete: () => sp.textContent = txt,
        scrollTrigger: {trigger: el, start: 'top 92%', once: true}});
    });
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
