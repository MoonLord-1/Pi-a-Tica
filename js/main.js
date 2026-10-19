/* Piña Tica · interacciones y animaciones (sin dependencias) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Partir títulos en palabras para animarlos ---------- */
  function split(el) {
    let i = 0;
    const out = document.createElement('div');
    const walk = (node, parent) => node.childNodes.forEach(n => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (/^\s+$/.test(t)) return parent.appendChild(document.createTextNode(' '));
          const w = document.createElement('span'); w.className = 'w';
          const s = document.createElement('span'); s.textContent = t; s.style.setProperty('--i', i++);
          w.appendChild(s); parent.appendChild(w);
        });
      } else { const c = n.cloneNode(false); parent.appendChild(c); walk(n, c); }
    });
    walk(el, out);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = ''; el.append(...out.childNodes);
    el.classList.add('is-split');
  }
  $$('[data-split]').forEach(split);

  /* ---------- Intro ---------- */
  const intro = $('.intro');
  let ready = false;
  const start = () => {
    if (ready) return; ready = true;
    if (intro) { intro.classList.add('done'); setTimeout(() => intro.remove(), 1200); }
    document.body.classList.add('ready');
    revealObserver && $$('.is-split, [data-reveal]:not([data-reveal="clip"])').forEach(el => revealObserver.observe(el));
    onScroll();
  };

  /* ---------- Revelado al hacer scroll ---------- */
  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      revealObserver.unobserve(e.target);
    });
  }, { threshold: .15, rootMargin: '0px 0px -6% 0px' }) : null;
  if (!revealObserver) $$('.is-split, [data-reveal]').forEach(el => el.classList.add('in'));
  // Los elementos con clip-path no son detectados por IntersectionObserver: se revelan por posición.
  let clipEls = $$('[data-reveal="clip"]');

  const startDelay = reduce ? 0 : 1100;
  window.addEventListener('load', () => setTimeout(start, startDelay));
  setTimeout(start, 3000); // por si la carga se demora

  /* ---------- Contadores ---------- */
  const counters = $$('[data-count]');
  const countObs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, to = +el.dataset.count, from = to > 100 ? to - 40 : 0;
    countObs.unobserve(el);
    if (reduce) return;
    const t0 = performance.now(), dur = 1600;
    const tick = t => {
      const p = Math.min((t - t0) / dur, 1), k = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(from + (to - from) * k);
      if (p < 1) requestAnimationFrame(tick);
    };
    el.textContent = from; requestAnimationFrame(tick);
  }), { threshold: .6 });
  counters.forEach(c => countObs.observe(c));

  /* ---------- Barras animadas del CTA ---------- */
  const bars = $('#bars');
  if (bars) new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { bars.classList.add('on'); o.disconnect(); } }), { threshold: .4 }).observe(bars);

  /* ---------- Scroll: progreso, navegación, parallax, línea de tiempo ---------- */
  const nav = $('#nav'), prog = $('#progress'), tl = $('#tl');
  const par = $$('[data-parallax]');
  const steps = $$('.step');
  let lastY = 0, ticking = false;

  function onScroll() {
    const y = scrollY, vh = innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    prog.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('solid', y > 40);
    if (!$('#drawer').classList.contains('open')) nav.classList.toggle('hide', y > lastY && y > 240);
    lastY = y;

    if (!reduce) par.forEach(img => {
      const box = img.parentElement.getBoundingClientRect();
      if (box.bottom < -100 || box.top > vh + 100) return;
      const lim = box.height * .055;
      const off = (box.top + box.height / 2 - vh / 2) * +img.dataset.parallax;
      img.style.transform = `translate3d(0,${Math.max(-lim, Math.min(lim, -off)).toFixed(1)}px,0)`;
    });

    if (ready && clipEls.length) {
      clipEls = clipEls.filter(el => {
        if (el.getBoundingClientRect().top < vh * .88) { el.classList.add('in'); return false; }
        return true;
      });
    }

    if (tl) {
      const r = tl.getBoundingClientRect();
      const p = Math.min(Math.max((vh * .6 - r.top) / r.height, 0), 1);
      tl.style.setProperty('--p', p.toFixed(3));
      steps.forEach(s => s.classList.toggle('on', s.getBoundingClientRect().top < vh * .62));
    }
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Enlace activo ---------- */
  const links = $$('.nav__links a');
  const secObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => secObs.observe(s));

  /* ---------- Menú móvil ---------- */
  const burger = $('#burger'), drawer = $('#drawer');
  const toggle = (open) => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    drawer.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    nav.classList.remove('hide');
  };
  burger.addEventListener('click', () => toggle(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', drawer).forEach(a => a.addEventListener('click', () => toggle(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });

  /* ---------- Slider (flechas + arrastre) ---------- */
  const track = $('#track');
  if (track) {
    const step = () => (track.firstElementChild?.getBoundingClientRect().width || 300);
    $('#prev').addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    $('#next').addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    let down = false, sx = 0, sl = 0, moved = false;
    track.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 4) { moved = true; track.classList.add('drag'); }
      track.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', () => { if (!down) return; down = false; track.classList.remove('drag'); });
  }

  /* ---------- FAQ ---------- */
  $$('.q').forEach(q => {
    const b = $('button', q);
    b.addEventListener('click', () => {
      const open = q.hasAttribute('open');
      $$('.q[open]').forEach(o => { o.removeAttribute('open'); $('button', o).setAttribute('aria-expanded', 'false'); });
      if (!open) { q.setAttribute('open', ''); b.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ---------- Lightbox ---------- */
  const lb = $('#lb'), lbImg = $('img', lb);
  $$('[data-full]').forEach(b => b.addEventListener('click', () => {
    lbImg.src = b.dataset.full;
    lbImg.alt = b.getAttribute('aria-label') || '';
    lb.showModal();
  }));
  lb.addEventListener('click', e => { if (e.target !== lbImg) lb.close(); });

  /* ---------- Formulario ---------- */
  const form = $('#form'), status = $('#status');
  if (form) form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('button[type=submit]', form);
    const demo = /XXXXXXXX/.test(form.action);
    btn.disabled = true; status.textContent = 'Enviando…';
    let ok = false;
    if (demo) { await new Promise(r => setTimeout(r, 700)); ok = true; }
    else {
      try {
        const r = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        ok = r.ok;
      } catch (_) { ok = false; }
    }
    if (ok) {
      status.textContent = demo
        ? 'Demostración: el formulario aún no está conectado a un correo.'
        : '¡Gracias! Recibimos su solicitud y le contactaremos pronto.';
      form.reset();
    } else status.textContent = 'No se pudo enviar. Inténtelo de nuevo o escríbanos por correo.';
    btn.disabled = false;
  });

  /* ---------- Año ---------- */
  $('#y').textContent = new Date().getFullYear();
})();
