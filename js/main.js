/* ETERNA · Comportamiento (vanilla JS) */
(function () {
  'use strict';
  var CFG = window.ETERNA || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ── WhatsApp: arma los enlaces con el mensaje precargado ── */
  function waLink(key) {
    var parts = key.split(':'), tipo = parts[0], nombre = parts[1];
    var msg = (CFG.mensajes && CFG.mensajes[tipo]) || CFG.mensajes.general;
    if (nombre) msg = msg.replace('[NOMBRE]', nombre.toUpperCase());
    return 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(msg);
  }
  $$('[data-wa]').forEach(function (a) { a.href = waLink(a.getAttribute('data-wa')); });

  /* ── Instagram: enlaces a cada publicación ── */
  $$('[data-ig]').forEach(function (a) {
    var u = (CFG.instagramPosts || [])[parseInt(a.getAttribute('data-ig'), 10)];
    if (u) a.href = u;
  });

  /* ── Imágenes: placeholder elegante si falta el archivo ── */
  function markMissing(img) {
    var box = img.closest('.ph');
    if (box) box.classList.add('is-missing');
  }
  function markLoaded(img) {
    img.classList.add('is-loaded');
    var box = img.closest('.ph'); if (box) box.classList.remove('is-missing');
  }
  $$('img').forEach(function (img) {
    // En Safari/iOS una imagen "lazy" aún sin pedir figura como complete con ancho 0:
    // solo se la da por faltante si NO es lazy; las lazy se resuelven por sus eventos.
    if (img.complete && img.naturalWidth) markLoaded(img);
    else if (img.complete && img.loading !== 'lazy') markMissing(img);
    img.addEventListener('load', function () { markLoaded(img); });
    img.addEventListener('error', function () { markMissing(img); });
  });
  // Red de seguridad: si algún navegador no dispara 'load', se muestran las ya descargadas
  var sweeps = 0, sweep = setInterval(function () {
    $$('img:not(.is-loaded)').forEach(function (i) { if (i.complete && i.naturalWidth) markLoaded(i); });
    if (++sweeps > 40) clearInterval(sweep);
  }, 1500);
  $$('video[poster]').forEach(function (v) {
    var p = new Image();
    p.onerror = function () {
      var ph = v.closest('.phone');
      if (ph) { ph.remove(); return; } // reel sin material: se quita del carrusel
      var b = v.closest('.ph'); if (b) b.classList.add('is-missing');
    };
    p.src = v.getAttribute('poster');
  });

  /* ── Lo que todavía no tiene material no se muestra al público ── */
  if (/[?&]dev\b/.test(location.search)) document.documentElement.classList.add('dev'); // ?dev muestra los espacios vacíos
  function probe(url, bad) { var p = new Image(); p.onerror = bad; p.src = url; }
  (function () {
    var ig = $$('.ig-tile'), fails = 0;
    ig.forEach(function (t) {
      probe($('img', t).getAttribute('src'), function () {
        t.hidden = true; fails++;
        if (fails === ig.length) { // ninguna miniatura: se oculta toda la sección
          var s = $('#instagram'), sep = s.nextElementSibling;
          s.hidden = true; if (sep && sep.classList.contains('sep')) sep.hidden = true;
        }
      });
    });
    var film = $('#film'); if (film && !CFG.vimeoId && !film.getAttribute('data-local')) { film.hidden = true; var cap = $('.film-cap'); if (cap) cap.hidden = true; }
    var bi = $('.bata-img img');
    if (bi) probe(bi.getAttribute('src'), function () {
      $('.bata-img').hidden = true; $('.bata').style.gridTemplateColumns = '1fr';
    });
  })();

  /* ── Pantalla de carga ── */
  var loader = $('#loader'), hero = $('.hero');
  var loaded = false;
  function startSite() {
    if (loaded) return; loaded = true;
    loader.classList.add('is-done');
    document.body.classList.remove('loading');
    setTimeout(function () { hero.classList.add('is-ready'); }, 350);
  }
  var minTime = reduced ? 300 : 2900;
  var t0 = Date.now();
  window.addEventListener('load', function () {
    setTimeout(startSite, Math.max(0, minTime - (Date.now() - t0)));
  });
  setTimeout(startSite, 5000); // por si algo tarda de más

  /* ── Video del hero ── */
  var hv = $('#heroVideo');
  if (hv) {
    hv.addEventListener('error', function () { hv.style.display = 'none'; }, true);
    if (reduced) { hv.removeAttribute('autoplay'); hv.pause(); }
  }

  /* ── Revelado por scroll ── */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal, .process').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal, .process').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ── Parallax sutil ── */
  var px = $$('[data-parallax]');
  var ticking = false;
  function parallax() {
    var vh = window.innerHeight;
    px.forEach(function (el) {
      var box = el.parentElement.getBoundingClientRect();
      if (box.bottom < -100 || box.top > vh + 100) return;
      var k = parseFloat(el.getAttribute('data-parallax')) || 0.05;
      var off = (box.top + box.height / 2 - vh / 2) * -k;
      el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0) scale(1.1)';
    });
    ticking = false;
  }

  /* ── Scroll: nav sólida + botón flotante ── */
  var nav = $('#nav'), flt = $('#float');
  function onScroll() {
    var y = window.scrollY, h = hero ? hero.offsetHeight : 600;
    nav.classList.toggle('is-solid', y > 60);
    flt.classList.toggle('is-on', y > h * 0.85);
    if (!reduced && px.length && !ticking) { ticking = true; requestAnimationFrame(parallax); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ── Menú móvil ── */
  var tg = $('#navToggle'), menu = $('#menu');
  function setMenu(open) {
    tg.setAttribute('aria-expanded', open);
    tg.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  }
  tg.addEventListener('click', function () { setMenu(menu.hidden); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* ── Portfolio: filtro + lightbox ── */
  var tiles = $$('.tile'), filters = $$('.filter');
  filters.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-filter');
      filters.forEach(function (x) { var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
      tiles.forEach(function (t) { t.hidden = !(f === 'all' || t.getAttribute('data-cat') === f); });
    });
  });

  var lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  var current = 0, list = [], lastFocus = null;
  function show(i) {
    current = (i + list.length) % list.length;
    var t = list[current], im = $('img', t);
    lbImg.src = t.getAttribute('data-full');
    lbImg.onerror = function () { lbImg.onerror = null; lbImg.src = im.currentSrc || im.src; };
    lbImg.alt = im.alt;
    lbCap.textContent = (current + 1) + ' / ' + list.length;
  }
  function openLb(t) {
    list = tiles.filter(function (x) { return !x.hidden; });
    lastFocus = document.activeElement;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    show(list.indexOf(t));
    $('#lbClose').focus();
  }
  function closeLb() {
    lb.hidden = true;
    document.body.style.overflow = '';
    lbImg.src = '';
    if (lastFocus) lastFocus.focus();
  }
  tiles.forEach(function (t) { t.addEventListener('click', function () { openLb(t); }); });
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', function () { show(current - 1); });
  $('#lbNext').addEventListener('click', function () { show(current + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); return; }
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') show(current - 1);
    else if (e.key === 'ArrowRight') show(current + 1);
    else if (e.key === 'Tab') { // trampa de foco simple
      var f = $$('button', lb), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  var sx = 0;
  lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  });

  /* ── Film: Vimeo si hay enlace; si no, el video de muestra propio (se carga solo al tocar play) ── */
  var filmPlay = $('#filmPlay');
  filmPlay.addEventListener('click', function () {
    var frame = filmPlay.parentElement;
    var local = $('#film').getAttribute('data-local');
    if (CFG.vimeoId) {
      var id = String(CFG.vimeoId), sep = id.indexOf('?') > -1 ? '&' : '?';
      var ifr = document.createElement('iframe');
      ifr.src = 'https://player.vimeo.com/video/' + id + sep +
        'autoplay=1&title=0&byline=0&portrait=0&badge=0&dnt=1&color=D9282A';
      ifr.allow = 'autoplay; fullscreen; picture-in-picture';
      ifr.allowFullscreen = true;
      ifr.title = 'Film de evento Eterna';
      frame.appendChild(ifr);
      filmPlay.remove();
    } else if (local) {
      var vid = document.createElement('video');
      vid.src = local; vid.controls = true; vid.autoplay = true; vid.playsInline = true;
      vid.setAttribute('controlslist', 'nodownload'); vid.preload = 'auto';
      vid.setAttribute('aria-label', 'Muestra de film Eterna');
      vid.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;background:#000;object-fit:contain';
      frame.appendChild(vid);
      filmPlay.remove();
    }
  });

  /* ── Reels: reproducen al pasar el mouse o al tocar ── */
  var reels = $('#reels');
  var phones = $$('.phone');
  function prep(v) {
    if (!v.src && v.getAttribute('data-src')) {
      v.src = v.getAttribute('data-src');
      v.addEventListener('error', function () { var b = v.closest('.ph'); if (b) b.classList.add('is-missing'); });
    }
  }
  function play(v) { prep(v); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function stop(v) { v.pause(); }
  phones.forEach(function (ph) {
    var v = $('video', ph);
    ph.addEventListener('mouseenter', function () { if (finePointer && !reduced) play(v); });
    ph.addEventListener('mouseleave', function () { if (finePointer) stop(v); });
    ph.addEventListener('click', function () {
      if (v.paused) { phones.forEach(function (o) { stop($('video', o)); }); play(v); } else stop(v);
    });
  });
  function stepReel(dir) {
    var w = phones[0].getBoundingClientRect().width + 22;
    reels.scrollBy({ left: dir * w, behavior: reduced ? 'auto' : 'smooth' });
  }
  $('#reelPrev').addEventListener('click', function () { stepReel(-1); });
  $('#reelNext').addEventListener('click', function () { stepReel(1); });
  reels.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); stepReel(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); stepReel(-1); }
  });

  /* ── Cursor personalizado (solo escritorio) ── */
  var cur = $('#cursor');
  if (finePointer && !reduced) {
    document.body.classList.add('has-cursor');
    var cx = 0, cy = 0, tx = 0, ty = 0;
    window.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; cur.classList.add('on'); });
    document.addEventListener('mouseleave', function () { cur.classList.remove('on'); });
    (function loop() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cur.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', function (e) {
      cur.classList.toggle('big', !!e.target.closest('[data-cursor], .lb-fig img'));
    });
  }

  /* ── Selector de fecha (ruedas deslizables) → WhatsApp ── */
  (function () {
    var form = $('#fecha'); if (!form) return;
    form.hidden = false; $('#agendaBtn').hidden = true;
    var H = 44;
    var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var startYear = now.getFullYear();
    var years = [0, 1, 2, 3].map(function (i) { return startYear + i; });
    var def = new Date(now.getFullYear(), now.getMonth() + 6, 15); // por defecto: en ~6 meses
    var st = { d: def.getDate(), m: def.getMonth(), y: def.getFullYear(), tipo: 'xv' };
    var wD = $('#wDay'), wM = $('#wMonth'), wY = $('#wYear');
    var smooth = reduced ? 'auto' : 'smooth';

    function fill(w, labels) {
      w.innerHTML = '';
      labels.forEach(function (t, i) {
        var o = document.createElement('div');
        o.setAttribute('role', 'option'); o.textContent = t;
        o.addEventListener('click', function () { w.scrollTo({ top: i * H, behavior: smooth }); });
        w.appendChild(o);
      });
    }
    function mark(w, i) {
      var items = w.children;
      for (var k = 0; k < items.length; k++) {
        var on = k === i; items[k].classList.toggle('is-sel', on); items[k].setAttribute('aria-selected', on);
      }
    }
    function daysIn(m, y) { return new Date(y, m + 1, 0).getDate(); }
    function buildDays() {
      var n = daysIn(st.m, st.y);
      if (st.d > n) st.d = n;
      var arr = []; for (var i = 1; i <= n; i++) arr.push(i);
      fill(wD, arr);
      wD.scrollTop = (st.d - 1) * H; mark(wD, st.d - 1);
    }
    function summary() {
      var dt = new Date(st.y, st.m, st.d);
      var past = dt < now;
      var txt = DIAS[dt.getDay()] + ' ' + st.d + ' de ' + MESES[st.m] + ' de ' + st.y;
      $('#fechaSum').textContent = past ? 'Elegí una fecha futura' : txt;
      var go = $('#fechaGo');
      go.setAttribute('aria-disabled', past);
      go.style.opacity = past ? '.35' : '';
      go.style.pointerEvents = past ? 'none' : '';
      var city = $('#fechaCity').value.trim() || 'a confirmar';
      var msg = (CFG.mensajes[st.tipo] || CFG.mensajes.general)
        .replace('Fecha: __', 'Fecha: ' + txt + '.')
        .replace('Ciudad: __', 'Ciudad: ' + city);
      go.href = 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(msg);
    }
    // Lee la fila centrada al detenerse el scroll
    function watch(w, onPick) {
      var raf = 0;
      w.addEventListener('scroll', function () {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          var i = Math.max(0, Math.min(w.children.length - 1, Math.round(w.scrollTop / H)));
          mark(w, i); onPick(i);
        });
      }, { passive: true });
      w.addEventListener('keydown', function (e) {
        var cur = Math.round(w.scrollTop / H), d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
        if (d) { e.preventDefault(); w.scrollTo({ top: Math.max(0, Math.min(w.children.length - 1, cur + d)) * H, behavior: smooth }); }
      });
    }
    fill(wM, MESES.map(function (m) { return m.charAt(0).toUpperCase() + m.slice(1); }));
    fill(wY, years);
    wM.scrollTop = st.m * H; mark(wM, st.m);
    wY.scrollTop = years.indexOf(st.y) * H; mark(wY, years.indexOf(st.y));
    buildDays(); summary();

    watch(wD, function (i) { st.d = i + 1; summary(); });
    watch(wM, function (i) {
      if (i === st.m) return; st.m = i;
      var n = daysIn(st.m, st.y); if (st.d > n) st.d = n; buildDays(); summary();
    });
    watch(wY, function (i) {
      if (years[i] === st.y) return; st.y = years[i];
      var n = daysIn(st.m, st.y); if (st.d > n) st.d = n; buildDays(); summary();
    });
    $$('.seg button', form).forEach(function (b) {
      b.addEventListener('click', function () {
        st.tipo = b.getAttribute('data-tipo');
        $$('.seg button', form).forEach(function (x) { var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-checked', on); });
        summary();
      });
    });
    $('#fechaCity').addEventListener('input', summary);
  })();

  /* ── Año ── */
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
})();
