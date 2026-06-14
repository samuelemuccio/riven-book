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
      // il pugnale piantato ha la precedenza sul "riprendi" automatico
      var pug = JSON.parse(localStorage.getItem('riven-pugnale') || 'null');
      var sb2 = pug || JSON.parse(localStorage.getItem('riven-segnalibro') || 'null');
      if (sb2 && sb2.file) {
        var a = chip.querySelector('a.link-leggi');
        if (a) {
          a.href = 'capitoli/' + sb2.file + '#segnalibro';
          a.textContent = (pug ? '🗡 ' : '') + 'Capitolo ' + sb2.cap + ' — ' + sb2.titolo;
          chip.classList.add('visibile');
        }
        var dove = chip.querySelector('.dove-eri');
        if (dove && pug) dove.textContent = 'il segnalibro è piantato qui';
        var btnChiudi = chip.querySelector('button.chiudi-segnalibro');
        if (btnChiudi) {
          btnChiudi.addEventListener('click', function(e){
            e.preventDefault(); e.stopPropagation();
            chip.classList.remove('visibile');
            localStorage.removeItem('riven-segnalibro');
            localStorage.removeItem('riven-pugnale');
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
      // >>> FORZA DELLO SFOCATO (Cap. XI): alza/abbassa il moltiplicatore qui sotto.
      //     1.3 = sfocatura attuale al culmine. Es. 2.0 = più cieco, 0.7 = più lieve.
      //     (onda va 0->1->0 con lo scroll; blur in px). Salva e ricostruisci, o
      //     fai un hard-refresh, per superare la cache ?v=.
      var blur = (onda * 1.3).toFixed(2);
      var fade = (1 - onda * 0.55).toFixed(3);   // 0.35 = quanto sbiadisce il testo (più alto = più scuro)
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

  // "Decifra" (riutilizzabile, marcatore %%…%% nei .md) — la mano morta resta
  // illeggibile: glifi di altre lingue che si rimescolano piano. SOLO quando ci
  // passi sopra (o la tocchi/metti a fuoco) si ricompone in parole; appena la
  // lasci, torna a mescolarsi. È il lettore a decifrarla. Vedi cap. IV.
  var daDecifrare = document.querySelectorAll('.decifra');
  if (daDecifrare.length) {
    // glifi di "altre lingue": greco, cirillico, latino antico, simboli.
    var GLIFI = 'ΩΨΦΞΛΣΔΘΠæøþðƒ§‡†∂∆◊¥ßЖфДѮѫ';
    function unGlifo(){ return GLIFI.charAt((Math.random() * GLIFI.length) | 0); }
    daDecifrare.forEach(function(el){
      var finale = el.textContent;
      el.setAttribute('aria-label', finale);   // lo screen reader legge il testo vero
      if (!animOk){ el.classList.add('risolto'); return; }   // niente moto: resta leggibile

      // VELOCITÀ: DUR = ms per ricomporsi/rimescolarsi del tutto (più alto = più lento).
      //           RESPIRO = ogni quanti ms cambiano i glifi quando è illeggibile.
      var DUR = 2400, RESPIRO = 400;
      var prog = 0, attivo = false, visibile = false, raf = null;
      var ultimo = 0, ultimoResp = 0, cache = '', ultimaStr = null;
      function rigeneraGlifi(){
        var s = '';
        for (var i = 0; i < finale.length; i++){ var c = finale.charAt(i); s += (c === ' ' || c === '\n') ? c : unGlifo(); }
        cache = s;
      }
      rigeneraGlifi();
      function frame(ts){
        if (!ultimo) ultimo = ts;
        var dt = ts - ultimo; ultimo = ts;
        prog += (attivo ? 1 : -1) * (dt / DUR);
        if (prog < 0) prog = 0; if (prog > 1) prog = 1;
        if (ts - ultimoResp > RESPIRO){ rigeneraGlifi(); ultimoResp = ts; }
        var taglio = Math.round(prog * finale.length);   // lettere vere mostrate da sinistra
        var s = '';
        for (var i = 0; i < finale.length; i++){
          var c = finale.charAt(i);
          s += (c === ' ' || c === '\n' || i < taglio) ? c : cache.charAt(i);
        }
        if (s !== ultimaStr){ el.textContent = s; ultimaStr = s; }
        el.classList.toggle('risolto', prog >= 1);
        if (visibile) raf = requestAnimationFrame(frame); else raf = null;
      }
      function avvia(){ if (!raf){ ultimo = 0; raf = requestAnimationFrame(frame); } }
      var trigger = el.closest('.enigma-box') || el;
      trigger.addEventListener('mouseenter', function(){ attivo = true; });
      trigger.addEventListener('mouseleave', function(){ attivo = false; });
      trigger.addEventListener('focus', function(){ attivo = true; });
      trigger.addEventListener('blur', function(){ attivo = false; });
      trigger.addEventListener('click', function(){ attivo = !attivo; });   // tocco (mobile)
      if ('IntersectionObserver' in window){
        var io = new IntersectionObserver(function(v){
          v.forEach(function(e){ visibile = e.isIntersecting; if (visibile) avvia(); });
        }, { threshold: 0 });
        io.observe(el);
      } else { visibile = true; avvia(); }
    });
  }

  /* ---------- NOTE A MARGINE — marcatore [[testo||nota]], pannello a destra ---------- */
  var noteTutte = document.querySelectorAll('.nota');
  var note = Array.prototype.slice.call(noteTutte).filter(function(n) { return n.querySelector('.nota-seg'); });
  if (note.length){
    var pop = document.createElement('aside');
    pop.className = 'nota-pop'; pop.setAttribute('role', 'note'); pop.hidden = true;
    pop.innerHTML = '<span class="nota-pop-num"></span><div class="nota-pop-testo"></div>';
    document.body.appendChild(pop);
    var popNum = pop.querySelector('.nota-pop-num');
    var popTxt = pop.querySelector('.nota-pop-testo');
    var attiva = null, viaTimer = null, nascondiTimer = null;

    function posiziona(n){
      var r = n.getBoundingClientRect();
      var ph = pop.offsetHeight;
      var pw = pop.offsetWidth;
      var top = r.top - ph - 12;
      var bottomPointer = true;
      if (top < 10) {
        top = r.bottom + 12;
        bottomPointer = false;
      }
      var left = r.left + r.width / 2 - pw / 2;
      left = Math.max(10, Math.min(left, window.innerWidth - pw - 10));
      pop.style.top = top + 'px';
      pop.style.left = left + 'px';
      pop.style.right = 'auto';
      if (bottomPointer) {
        pop.classList.remove('sotto');
        pop.classList.add('sopra');
      } else {
        pop.classList.remove('sopra');
        pop.classList.add('sotto');
      }
    }
    function mostra(n){
      clearTimeout(viaTimer); clearTimeout(nascondiTimer);
      if (attiva && attiva !== n) attiva.classList.remove('nota-attiva');
      attiva = n;
      popNum.textContent = n.querySelector('.nota-seg').textContent;
      popTxt.innerHTML = n.querySelector('.nota-corpo').innerHTML;
      pop.hidden = false; pop.style.visibility = 'hidden';
      requestAnimationFrame(function(){
        posiziona(n); pop.style.visibility = '';
        pop.classList.add('aperta'); n.classList.add('nota-attiva');
      });
    }
    function nascondi(){
      viaTimer = setTimeout(function(){
        pop.classList.remove('aperta');
        if (attiva){ attiva.classList.remove('nota-attiva'); attiva = null; }
        nascondiTimer = setTimeout(function(){ if (!pop.classList.contains('aperta')) pop.hidden = true; }, 240);
      }, 90);
    }
    note.forEach(function(n, i){
      n.querySelector('.nota-seg').textContent = (i + 1);
      n.addEventListener('mouseenter', function(){ mostra(n); });
      n.addEventListener('mouseleave', nascondi);
      n.addEventListener('focus', function(){ mostra(n); });
      n.addEventListener('blur', nascondi);
      n.addEventListener('click', function(e){ e.preventDefault(); if (attiva === n) nascondi(); else mostra(n); });
    });
    pop.addEventListener('mouseenter', function(){ clearTimeout(viaTimer); clearTimeout(nascondiTimer); });
    pop.addEventListener('mouseleave', nascondi);
    document.addEventListener('click', function(e){
      if (attiva && !attiva.contains(e.target) && !pop.contains(e.target)) nascondi();
    });
    window.addEventListener('scroll', function(){ if (attiva && !pop.hidden) posiziona(attiva); }, {passive:true});
    window.addEventListener('resize', function(){ if (attiva && !pop.hidden) posiziona(attiva); }, {passive:true});
  }

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

  /* ---------- IL SEGNALIBRO-PUGNALE — si pianta nel punto della lettura ---------- */
  if (corpo.classList.contains('capitolo')) {
    var SVG_PUGNALE =
      '<svg viewBox="0 0 150 34" aria-hidden="true">' +
        '<defs><linearGradient id="acciaioLama" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#eef2f7"/><stop offset=".5" stop-color="#aab2c0"/><stop offset="1" stop-color="#6f7886"/>' +
        '</linearGradient></defs>' +
        '<rect class="impugnatura" x="20" y="13" width="26" height="8" rx="3"/>' +
        '<circle class="ferro" cx="14" cy="17" r="7"/>' +
        '<circle class="pomo-occhio" cx="14" cy="17" r="2.3"/>' +
        '<path class="guardia" d="M44 5 L50 5 L50 29 L44 29 Z"/>' +
        '<path class="lama" d="M50 12 L146 17 L50 22 Z"/>' +
        '<path class="solco" d="M57 17 L128 17"/>' +
        '<path class="filo" d="M50 12 L146 17"/>' +
        '<rect class="glint" x="54" y="13" width="11" height="8" rx="2"/>' +
      '</svg>';

    var paragrafi = Array.prototype.slice.call(document.querySelectorAll('.testo p'));
    var btn = null;

    function salvato(){ try { return JSON.parse(localStorage.getItem('riven-pugnale') || 'null'); } catch(e){ return null; } }

    // il paragrafo che attraversa il CENTRO dello schermo (sempre visibile, mai sopra la vista)
    function idxCentro(){
      var c = window.innerHeight / 2, best = -1, bestDist = Infinity;
      for (var i = 0; i < paragrafi.length; i++){
        var r = paragrafi[i].getBoundingClientRect();
        if (r.bottom < 70 || r.top > window.innerHeight - 40) continue;   // fuori schermo: salta
        if (r.top <= c && r.bottom >= c) return i;                        // contiene il centro
        var d = Math.min(Math.abs(r.top - c), Math.abs(r.bottom - c));
        if (d < bestDist){ bestDist = d; best = i; }
      }
      return best >= 0 ? best : 0;
    }

    function togliPugnale(animato){
      var vecchio = document.querySelector('.pugnale');
      if (!vecchio) return;
      var p = vecchio.parentElement;
      function via(){ if (vecchio.parentElement) vecchio.parentElement.removeChild(vecchio); if (p) p.classList.remove('segnato'); }
      if (animato && animOk){ vecchio.classList.add('esci'); setTimeout(via, 480); }
      else via();
    }

    function pianta(idx, animato){
      if (idx < 0 || idx >= paragrafi.length) return;
      togliPugnale(false);
      var p = paragrafi[idx];
      p.classList.add('segnato');
      var el = document.createElement('span');
      el.className = 'pugnale' + (animato && animOk ? ' entra' : '');
      el.title = 'Togli il segnalibro';
      el.setAttribute('role', 'button');
      el.innerHTML = SVG_PUGNALE;
      el.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        togliPugnale(true);
        try { localStorage.removeItem('riven-pugnale'); } catch(e2){}
        aggiornaBtn();
      });
      p.insertBefore(el, p.firstChild);
      try {
        localStorage.setItem('riven-pugnale', JSON.stringify({
          file: fileCorrente, cap: capCorrente, titolo: titoloCorrente, idx: idx
        }));
      } catch(e){}
      aggiornaBtn();
    }

    function aggiornaBtn(){
      if (!btn) return;
      var c = !!salvato();   // basato sul salvataggio, non sul DOM: evita il bug durante l'animazione di uscita
      btn.classList.toggle('attivo', c);
      btn.querySelector('.etichetta-btn').textContent = c ? 'togli il segnalibro' : 'pianta il segnalibro';
    }

    // bottone fisso (funziona su desktop e touch)
    btn = document.createElement('button');
    btn.className = 'pianta-pugnale';
    btn.type = 'button';
    btn.innerHTML = '<span class="icona">' + SVG_PUGNALE + '</span><span class="etichetta-btn">pianta il segnalibro</span>';
    btn.addEventListener('click', function(){
      if (salvato()) {
        togliPugnale(true);
        try { localStorage.removeItem('riven-pugnale'); } catch(e){}
        aggiornaBtn();
      } else {
        pianta(idxCentro(), true);
        // garanzia: se per qualche motivo finisce fuori vista, lo porto al centro
        var d = document.querySelector('.pugnale');
        if (d){
          var t = d.getBoundingClientRect().top;
          if (t < 90 || t > window.innerHeight - 40){
            var seg = document.querySelector('.testo p.segnato');
            if (seg) seg.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }
      }
    });
    document.body.appendChild(btn);

    // ripristino: se il pugnale è in questo capitolo, rimettilo dov'era
    var pg = salvato();
    if (pg && pg.file === fileCorrente && typeof pg.idx === 'number') {
      var arrivo = (location.hash === '#segnalibro');
      pianta(pg.idx, arrivo);              // se arrivi dal segnalibro, si ri-pianta con l'animazione
      if (arrivo) {
        var seg = document.querySelector('.testo p.segnato');
        if (seg) setTimeout(function(){ seg.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 80);
      }
    }
    aggiornaBtn();
  }
})();
