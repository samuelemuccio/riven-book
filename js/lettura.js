/* RIVEN · lettura.js — la forma, il fiume, il segnalibro, le tavole */
(function(){
  'use strict';
  var doc = document.documentElement;

  /* ---------- LA FORMA (tema) — normale / celestiale ---------- */
  function formaSalvata(){
    try { return localStorage.getItem('riven-forma'); } catch(e){ return null; }
  }
  function applicaForma(f, salva){
    doc.setAttribute('data-tema', f);
    if (salva) { try { localStorage.setItem('riven-forma', f); } catch(e){} }
    var b = document.querySelector('.forma .etichetta');
    if (b) b.textContent = (f === 'celestiale') ? 'forma normale' : 'forma celestiale';
  }
  var iniziale = formaSalvata();
  var daSistema = !iniziale;
  if (!iniziale) {
    iniziale = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'celestiale' : 'normale';
  }
  applicaForma(iniziale, false);   /* la scelta del sistema non si congela: si salva solo il toggle */

  document.addEventListener('click', function(e){
    var b = e.target.closest('.forma');
    if (!b) return;
    applicaForma(doc.getAttribute('data-tema') === 'celestiale' ? 'normale' : 'celestiale', true);
  });

  /* ---------- IL FIUME — progresso di lettura ---------- */
  var fiume = document.querySelector('.fiume i');
  function aggiornaFiume(){
    if (!fiume) return;
    var h = doc.scrollHeight - window.innerHeight;
    fiume.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', aggiornaFiume, {passive:true});
  aggiornaFiume();

  /* ---------- IL SEGNALIBRO — riprendi da dove eri ---------- */
  var corpo = document.body;
  var capCorrente = corpo.getAttribute('data-cap');      // es. "IX"
  var titoloCorrente = corpo.getAttribute('data-titolo');
  var fileCorrente = corpo.getAttribute('data-file');     // es. "capitolo-09.html"

  if (capCorrente) {
    var timer = null;
    window.addEventListener('scroll', function(){
      clearTimeout(timer);
      timer = setTimeout(function(){
        try {
          var y = Math.round(window.scrollY);
          if (y > window.innerHeight * 0.15) {
            localStorage.setItem('riven-segnalibro', JSON.stringify({
              file: fileCorrente, cap: capCorrente, titolo: titoloCorrente,
              y: y
            }));
          }
        } catch(e){}
      }, 300);
    }, {passive:true});

    if (location.hash === '#segnalibro') {
      try {
        var sb = JSON.parse(localStorage.getItem('riven-segnalibro') || 'null');
        if (sb && sb.file === fileCorrente && sb.y) {
          setTimeout(function(){ window.scrollTo(0, sb.y); }, 60);
        }
      } catch(e){}
    }
  }

  var chip = document.querySelector('.segnalibro');
  if (chip) {
    try {
      var sb2 = JSON.parse(localStorage.getItem('riven-segnalibro') || 'null');
      if (sb2 && sb2.file) {
        var a = chip.querySelector('a.link-leggi');
        if (a) {
          a.href = 'capitoli/' + sb2.file + '#segnalibro';
          a.textContent = 'Capitolo ' + sb2.cap + ' — ' + sb2.titolo;
          chip.classList.add('visibile');
        }
        var btnChiudi = chip.querySelector('button.chiudi-segnalibro');
        if (btnChiudi) {
          btnChiudi.addEventListener('click', function(e){
            e.preventDefault(); e.stopPropagation();
            chip.classList.remove('visibile');
            localStorage.removeItem('riven-segnalibro');
          });
        }
      }
    } catch(e){}
  }

  /* ---------- I PASSI — frecce della tastiera ---------- */
  document.addEventListener('keydown', function(e){
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var dove = null;
    if (e.key === 'ArrowLeft')  dove = corpo.getAttribute('data-prev');
    if (e.key === 'ArrowRight') dove = corpo.getAttribute('data-next');
    if (dove) location.href = dove;
  });

  /* ---------- LA PSICOSI (Cap. VI) — le voci si accendono entrando in vista ---------- */
  var psicosi = document.querySelector('.psicosi');
  if (psicosi) {
    if ('IntersectionObserver' in window) {
      var po = new IntersectionObserver(function(voci){
        voci.forEach(function(v){
          if (v.isIntersecting) { psicosi.classList.add('attiva'); po.disconnect(); }
        });
      }, { threshold: 0.06 });
      po.observe(psicosi);
    } else {
      psicosi.classList.add('attiva');
    }
  }

  
  /* ---------- IL LIBRO — trascinamento 3D e apertura controllata ---------- */
  var libro = document.getElementById('libro3d');
  if (libro) {
    var isDragging = false, startX, startY;
    var targetRotX = 0, targetRotY = 0;

    function apri(){
      libro.classList.add('aperto');
      document.body.classList.add('libro-aperto');
      libro.style.transition = 'transform 1.2s cubic-bezier(.4,0,.2,1)';
      libro.style.transform = 'rotateX(0deg) rotateY(0deg)';
      targetRotX = 0; targetRotY = 0;
      libro.style.cursor = 'default';
    }

    
    
    // Bypassa eventuali bug CSS 3D catturando i clic globalmente in fase di cattura (capture)
    document.addEventListener('click', function(e){
      var btn = e.target.closest('.vai-indice');
      if (btn) {
        e.preventDefault(); e.stopPropagation();
        window.location.href = 'indice.html';
      } else if (libro && libro.classList.contains('aperto')) {
        // Se il libro è aperto e l'utente clicca sulla pagina interna (che potrebbe avere z-index o 3D buggato)
        var dent = e.target.closest('.pagina-dentro');
        if (dent) {
          e.preventDefault(); e.stopPropagation();
          window.location.href = 'indice.html';
        }
      }
    }, true);

    // BULLETPROOF FIX: Il motore 3D in alcuni browser (es. Chrome) "inghiotte" i click 
    // se l'elemento è a Z=-40px. Quando il libro è aperto, trasformiamo l'intera metà destra 
    // dello schermo in un link invisibile per l'indice (escludendo la barra in alto).
    document.addEventListener('click', function(e) {
      if (libro.classList.contains('aperto')) {
        if (e.target.closest('header.barra') || e.target.closest('.segnalibro')) return;
        if (e.clientX > window.innerWidth * 0.4) {
          e.preventDefault(); e.stopPropagation();
          window.location.href = 'indice.html';
        }
      }
    }, true);

    var btnApri = document.querySelector('.invito');
    if (btnApri) {
      btnApri.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation(); apri();
      });
    }

    // Interazione col mouse
    libro.addEventListener('mousedown', function(e){
      if (libro.classList.contains('aperto')) return;
      isDragging = true;
      startX = e.clientX; startY = e.clientY;
      libro.style.transition = 'none';
      document.body.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', function(e){
      if (!isDragging) return;
      var dx = e.clientX - startX; var dy = e.clientY - startY;
      startX = e.clientX; startY = e.clientY;
      targetRotY += dx * 0.4; targetRotX -= dy * 0.4;
      if(targetRotX > 60) targetRotX = 60; if(targetRotX < -60) targetRotX = -60;
      libro.style.transform = 'rotateX(' + targetRotX + 'deg) rotateY(' + targetRotY + 'deg)';
    });
    window.addEventListener('mouseup', function(){
      if (isDragging) { isDragging = false; document.body.style.cursor = ''; }
    });

    // Interazione touch
    libro.addEventListener('touchstart', function(e){
      if (libro.classList.contains('aperto') || e.touches.length > 1) return;
      isDragging = true;
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
      libro.style.transition = 'none';
    }, {passive:true});
    window.addEventListener('touchmove', function(e){
      if (!isDragging) return;
      var dx = e.touches[0].clientX - startX; var dy = e.touches[0].clientY - startY;
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
      targetRotY += dx * 0.5; targetRotX -= dy * 0.5;
      if(targetRotX > 60) targetRotX = 60; if(targetRotX < -60) targetRotX = -60;
      libro.style.transform = 'rotateX(' + targetRotX + 'deg) rotateY(' + targetRotY + 'deg)';
    }, {passive:true});
    window.addEventListener('touchend', function(){ isDragging = false; });
  }

  /* ---------- LA MAREA (Cap. XI) — il panico fa stringere e annega la stanza ---------- */
  var panico = document.querySelector('.panico');
  var marea = document.querySelector('.marea');
  if (panico && marea) {
    var blocchi = Array.prototype.slice.call(panico.children).filter(function(el){
      return el !== marea;
    });
    function aggiornaMarea(){
      var r = panico.getBoundingClientRect();
      var vh = window.innerHeight;
      // progresso 0..1 di quanto il centro schermo ha attraversato la zona
      var p = (vh * 0.5 - r.top) / (r.height || 1);
      p = Math.max(0, Math.min(1, p));
      // campana: 0 ai bordi, 1 nel mezzo → emerge e poi defluisce
      var onda = Math.sin(Math.PI * p);
      onda = onda * onda;                 // più ripida: l'abisso dura meno
      marea.style.opacity = (onda * 0.96).toFixed(3);
      // il testo del panico si fa opaco e trema appena nel fondo dell'abisso
      var blur = (onda * 1.3).toFixed(2);
      var fade = (1 - onda * 0.35).toFixed(3);
      for (var i = 0; i < blocchi.length; i++){
        blocchi[i].style.filter = 'blur(' + blur + 'px)';
        blocchi[i].style.opacity = fade;
      }
    }
    window.addEventListener('scroll', aggiornaMarea, {passive:true});
    window.addEventListener('resize', aggiornaMarea, {passive:true});
    aggiornaMarea();
  }

  /* ---------- EFFETTI IMMERSIVI per-capitolo ---------- */
  var animOk = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Cap. III — il sigillo si incide a fuoco quando la scena entra in vista
  var sigScena = document.querySelector('.sigillo-scena');
  if (sigScena && 'IntersectionObserver' in window) {
    var os = new IntersectionObserver(function(v){
      v.forEach(function(e){ if (e.isIntersecting){ sigScena.classList.add('acceso'); os.disconnect(); } });
    }, { threshold: 0.55 });
    os.observe(sigScena);
  }

  // Cap. V — lo sciame di occhi: appare con la scena dei lupi, le pupille seguono il cursore
  var lupi = document.querySelector('.lupi');
  if (lupi) {
    if ('IntersectionObserver' in window) {
      var ol = new IntersectionObserver(function(v){
        v.forEach(function(e){ lupi.classList.toggle('visti', e.isIntersecting); });
      }, { threshold: 0.12 });
      ol.observe(lupi);
    } else { lupi.classList.add('visti'); }

    if (animOk) {
      var bulbi = Array.prototype.slice.call(lupi.querySelectorAll('.occhio-spia'));
      var mx = -1, my = -1, ticking = false;
      function muoviPupille(){
        ticking = false;
        if (!lupi.classList.contains('visti')) return;
        for (var i = 0; i < bulbi.length; i++){
          var sp = bulbi[i], r = sp.getBoundingClientRect();
          var cx = r.left + r.width/2, cy = r.top + r.height/2;
          var dx = mx - cx, dy = my - cy, d = Math.hypot(dx, dy) || 1;
          var amt = Math.min(r.width * 0.12, 7);
          var g = sp.querySelector('.bulbo');
          if (g) g.style.transform = 'translate(' + (dx/d*amt).toFixed(1) + 'px,' + (dy/d*amt).toFixed(1) + 'px)';
        }
      }
      window.addEventListener('mousemove', function(e){
        mx = e.clientX; my = e.clientY;
        if (!ticking){ ticking = true; requestAnimationFrame(muoviPupille); }
      }, {passive:true});
    }
  }

  // Cap. IV — inchiostro sanguinante: cola di più man mano che si scende nel capitolo
  var inchiostro = document.querySelector('.inchiostro');
  var articolo = document.querySelector('.testo');
  if (inchiostro && articolo) {
    function aggiornaInchiostro(){
      var r = articolo.getBoundingClientRect();
      var tot = r.height - window.innerHeight;
      var p = tot > 0 ? (-r.top) / tot : 0;
      p = Math.max(0, Math.min(1, p));
      inchiostro.style.setProperty('--cola', p.toFixed(3));
    }
    window.addEventListener('scroll', aggiornaInchiostro, {passive:true});
    window.addEventListener('resize', aggiornaInchiostro, {passive:true});
    aggiornaInchiostro();
  }

  // Cap. IX — lo strappo: la carta si apre quando arriva in vista
  var strappo = document.querySelector('.strappo');
  if (strappo && 'IntersectionObserver' in window) {
    var ot = new IntersectionObserver(function(v){
      v.forEach(function(e){ if (e.isIntersecting){ strappo.classList.add('aperto'); ot.disconnect(); } });
    }, { threshold: 0.6 });
    ot.observe(strappo);
  } else if (strappo) { strappo.classList.add('aperto'); }

  /* ---------- LE TAVOLE — se l'immagine esiste, prende il posto ---------- */
  document.querySelectorAll('.tavola[data-base]').forEach(function(tav){
    var base = tav.getAttribute('data-base');
    var estensioni = ['jpg','jpeg','png','webp'];
    var cornice = tav.querySelector('.cornice');
    var didascalia = tav.querySelector('figcaption');
    (function prova(i){
      if (i >= estensioni.length) return;            // resta il segnaposto
      var img = new Image();
      img.onload = function(){
        img.alt = didascalia ? didascalia.textContent : '';
        cornice.innerHTML = '';
        cornice.appendChild(img);
      };
      img.onerror = function(){ prova(i + 1); };
      img.src = base + '.' + estensioni[i];
    })(0);
  });
})();
