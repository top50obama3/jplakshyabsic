(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- Hero animation ---------- */
  function hero() {
    var cv = $('heroCanvas');
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, dpr = 1, col = {}, lay = {};
    var parts = [], drops = [], ripples = [], pores = [];
    var last = 0, dropTimer = 0, visible = true, raf = 0, ready = false;

    function readColors() {
      var cs = getComputedStyle(document.documentElement);
      var g = function (n) { return cs.getPropertyValue(n).trim(); };
      col = { slurry: g('--slurry'), ashdark: g('--ash-dark'), clay: g('--clay'), water: g('--water'), pore: g('--pore'), line: g('--line') };
    }
    function seedPores() {
      var s = 11;
      var r = function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
      pores = [];
      for (var i = 0; i < 70; i++) pores.push({ u: r(), v: r(), r: 0.6 + r() * 0.9 });
    }
    function layout() {
      lay = {
        x0: W * 0.08, x1: W * 0.92, yT: H * 0.36, yB: H * 0.52,
        bx0: W * 0.27, bx1: W * 0.73, by0: H * 0.70, by1: H * 0.96, surf: H * 0.80
      };
    }
    function resize() {
      var r = cv.getBoundingClientRect();
      if (!r.width || !r.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layout();
      if (!ready) {
        ready = true;
        for (var i = 0; i < 700; i++) step(1);
      }
      draw();
    }
    function spawn() {
      parts.push({
        x: lay.x0 + Math.random() * (lay.x1 - lay.x0),
        y: H * 0.02 + Math.random() * H * 0.05,
        r: 1.2 + Math.pow(Math.random(), 1.6) * 4.2,
        vy: 0.35 + Math.random() * 0.35, ph: Math.random() * 6.28, st: 0, age: 0, a: 1
      });
    }
    function step(dt) {
      var i, p, d;
      if (parts.length < 85 && Math.random() < 0.28 * dt) spawn();
      for (i = 0; i < parts.length; i++) {
        p = parts[i];
        if (p.st === 0) {
          p.y += p.vy * dt;
          p.x += Math.sin(p.ph + p.y * 0.05) * 0.15 * dt;
          if (p.y + p.r >= lay.yT) {
            p.st = p.r > 2.6 ? 1 : 2;
            p.y = lay.yT - p.r - (p.r > 2.6 ? Math.random() * 7 : 0);
            p.age = 0;
          }
        } else if (p.st === 1) {
          p.age += dt;
          if (p.age > 240) p.a -= 0.02 * dt;
        } else {
          p.age += dt; p.y += 0.25 * dt; p.a -= 0.03 * dt;
        }
      }
      parts = parts.filter(function (q) { return q.a > 0.03; });
      dropTimer -= dt;
      if (dropTimer <= 0) {
        var bw = lay.bx1 - lay.bx0;
        drops.push({ x: lay.bx0 + bw * 0.1 + Math.random() * bw * 0.8, y: lay.yB + 2, vy: 0.8 });
        dropTimer = 18 + Math.random() * 30;
      }
      for (i = 0; i < drops.length; i++) {
        d = drops[i]; d.vy += 0.06 * dt; d.y += d.vy * dt;
        if (d.y >= lay.surf) { ripples.push({ x: d.x, r: 1, a: 0.8 }); d.dead = true; }
      }
      drops = drops.filter(function (q) { return !q.dead; });
      for (i = 0; i < ripples.length; i++) { ripples[i].r += 0.5 * dt; ripples[i].a -= 0.02 * dt; }
      ripples = ripples.filter(function (q) { return q.a > 0; });
    }
    function draw() {
      if (!W) return;
      var i, p, o, x, y, rx;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = 0.22; ctx.fillStyle = col.slurry; ctx.fillRect(0, 0, W, lay.yT); ctx.globalAlpha = 1;
      ctx.fillStyle = col.clay; ctx.fillRect(lay.x0, lay.yT, lay.x1 - lay.x0, lay.yB - lay.yT);
      ctx.fillStyle = col.pore;
      for (i = 0; i < pores.length; i++) {
        o = pores[i]; x = lay.x0 + o.u * (lay.x1 - lay.x0); y = lay.yT + 6 + o.v * (lay.yB - lay.yT - 12); rx = 2.5 + o.r * 3.5;
        ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.6, 0, 0, 6.2832); ctx.fill();
      }
      ctx.strokeStyle = col.ashdark; ctx.lineWidth = 2;
      ctx.strokeRect(lay.x0, lay.yT, lay.x1 - lay.x0, lay.yB - lay.yT);
      ctx.fillStyle = col.ashdark;
      for (i = 0; i < parts.length; i++) {
        p = parts[i]; ctx.globalAlpha = clamp(p.a, 0, 1);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // beaker water
      ctx.globalAlpha = 0.5; ctx.fillStyle = col.water;
      ctx.beginPath();
      ctx.moveTo(lay.bx0 + 1, lay.surf); ctx.lineTo(lay.bx1 - 1, lay.surf); ctx.lineTo(lay.bx1 - 1, lay.by1 - 10);
      ctx.quadraticCurveTo(lay.bx1 - 1, lay.by1 - 1, lay.bx1 - 11, lay.by1 - 1); ctx.lineTo(lay.bx0 + 11, lay.by1 - 1);
      ctx.quadraticCurveTo(lay.bx0 + 1, lay.by1 - 1, lay.bx0 + 1, lay.by1 - 10); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      // beaker glass
      ctx.strokeStyle = col.ashdark; ctx.lineWidth = 2.5; ctx.beginPath();
      ctx.moveTo(lay.bx0, lay.by0); ctx.lineTo(lay.bx0, lay.by1 - 10);
      ctx.quadraticCurveTo(lay.bx0, lay.by1, lay.bx0 + 10, lay.by1); ctx.lineTo(lay.bx1 - 10, lay.by1);
      ctx.quadraticCurveTo(lay.bx1, lay.by1, lay.bx1, lay.by1 - 10); ctx.lineTo(lay.bx1, lay.by0); ctx.stroke();
      // ripples and drops
      ctx.strokeStyle = col.water; ctx.lineWidth = 1.5;
      for (i = 0; i < ripples.length; i++) {
        o = ripples[i]; ctx.globalAlpha = clamp(o.a, 0, 1);
        ctx.beginPath(); ctx.ellipse(o.x, lay.surf, o.r, o.r * 0.25, 0, 0, 6.2832); ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.fillStyle = col.water;
      for (i = 0; i < drops.length; i++) {
        o = drops[i]; ctx.beginPath(); ctx.ellipse(o.x, o.y, 2, 3.2, 0, 0, 6.2832); ctx.fill();
      }
    }
    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      var dt = clamp((now - last) / 16.667, 0, 3);
      last = now; step(dt); draw();
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (reduce || raf || !visible || document.hidden) return;
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
    readColors(); seedPores(); resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', start);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }).observe(cv);
    }
    var recolor = function () { readColors(); draw(); };
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', recolor);
    }
    new MutationObserver(recolor).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    start();
  }

  /* ---------- Simulator ---------- */
  var SIZES = [0.1, 0.3, 1, 3, 10, 30, 100];
  var MIX = [0.03, 0.07, 0.15, 0.25, 0.28, 0.15, 0.07];
  var COATS = {
    carbon: { name: 'activated carbon', r0: 0.55, q: 2500, flux: 0.85, d: 0.95 },
    zeolite: { name: 'zeolite', r0: 0.85, q: 4000, flux: 0.80, d: 0.92 }
  };
  var ASH = { low: 1, mid: 2, high: 3 };
  var HOURS = 8;

  function removalAt(dp, d) { var x = dp / d, x3 = x * x * x; return x3 / (x3 + 0.35); }
  function overall(d) { var s = 0; for (var i = 0; i < SIZES.length; i++) s += MIX[i] * removalAt(SIZES[i], d); return s; }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }

  function model() {
    var T = +$('cTemp').value, pf = +$('cPF').value, th = +$('cThick').value;
    var ntu = +$('cNTU').value, pb = +$('cPb').value;
    var coat = COATS[$('cCoat').value], ashK = ASH[$('cAsh').value];
    var phi = clamp(0.45 - (T - 800) / 350 * 0.20 + 0.008 * pf, 0.15, 0.65);
    var d0 = 0.25 + 1.6 * (phi - 0.15);
    var dEff = d0 * (1 - 0.015 * (th - 5));
    var strength = 90 * Math.exp(-5.5 * phi);
    var j0 = 31250 * (Math.pow(phi, 3) / Math.pow(1 - phi, 2)) * d0 * d0 / th;
    var leach = ashK * Math.exp(-(T - 800) / 170);
    var filters = [
      { cls: 'sand', name: 'Sand and gravel', d: 8, j0: 3000, r0: 0.02, q: Infinity, k: 0.0003 },
      { cls: 'ash', name: 'AshPure ceramic', d: dEff, j0: j0, r0: 0.08, q: Infinity, k: 0.0025 },
      { cls: 'coat', name: 'AshPure + ' + coat.name, d: dEff * coat.d, j0: j0 * coat.flux, r0: coat.r0, q: coat.q, k: 0.0025 }
    ];
    filters.forEach(function (f) {
      f.rem = overall(f.d);
      f.res = ntu * (1 - f.rem);
      f.a = f.k * ntu * f.rem;
      f.J = function (t) { return f.j0 / (1 + f.a * t); };
      f.V = function (t) { return f.a > 1e-9 ? f.j0 * Math.log(1 + f.a * t) / f.a : f.j0 * t; };
      f.metal = function (t) { return isFinite(f.q) ? f.r0 * Math.exp(-f.V(t) * pb / f.q) : f.r0; };
      f.bySize = function (dp) { return removalAt(dp, f.d); };
    });
    return { T: T, pf: pf, th: th, ntu: ntu, pb: pb, phi: phi, d0: d0, strength: strength, leach: leach, filters: filters, coat: coat };
  }

  function drawChart(el, o) {
    var W = 520, H = 300, L = 46, R = 14, Tm = 14, B = 42, pw = W - L - R, ph = H - Tm - B;
    var lx = function (v) { return Math.log(v) / Math.LN10; };
    var sx = function (x) {
      var f = o.xlog ? (lx(x) - lx(o.xmin)) / (lx(o.xmax) - lx(o.xmin)) : (x - o.xmin) / (o.xmax - o.xmin);
      return L + f * pw;
    };
    var sy = function (y) { return Tm + ph - (y - o.ymin) / (o.ymax - o.ymin) * ph; };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + o.label + '">';
    o.yticks.forEach(function (v) {
      s += '<line class="gridline" x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(v).toFixed(1) + '" y2="' + sy(v).toFixed(1) + '"/>' +
        '<text class="axis-text" x="' + (L - 8) + '" y="' + (sy(v) + 4).toFixed(1) + '" text-anchor="end">' + v + '%</text>';
    });
    o.xticks.forEach(function (v) {
      s += '<line class="tick" x1="' + sx(v).toFixed(1) + '" x2="' + sx(v).toFixed(1) + '" y1="' + (Tm + ph) + '" y2="' + (Tm + ph + 5) + '"/>' +
        '<text class="axis-text" x="' + sx(v).toFixed(1) + '" y="' + (Tm + ph + 20) + '" text-anchor="middle">' + v + '</text>';
    });
    s += '<text class="axis-text" x="' + (L + pw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + o.xlabel + '</text>';
    o.series.forEach(function (se) {
      var pts = o.xs.map(function (x) { return [sx(x), sy(clamp(se.fn(x), o.ymin, o.ymax))]; });
      s += '<path class="ln ' + se.cls + '" d="' + pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ') + '"/>';
      if (se.marks) pts.forEach(function (p, i) { if (i % 5 === 0) s += '<circle class="pt-coat" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.5"/>'; });
    });
    s += '<line class="playhead" y1="' + Tm + '" y2="' + (Tm + ph) + '" x1="0" x2="0" style="display:none"/></svg>';
    el.innerHTML = s;
    return { sx: sx, head: el.querySelector('.playhead') };
  }

  function simulator() {
    if (!$('cTemp')) return;
    var state, heads = [], running = false, tNow = HOURS;
    var wr = $('waterRect');
    var logXs = [], timeXs = [], i;
    for (i = 0; i <= 40; i++) logXs.push(Math.pow(10, -1 + 3 * i / 40));
    for (i = 0; i <= 40; i++) timeXs.push(HOURS * i / 40);

    function setTime(t, showHead) {
      tNow = t;
      var f = state.filters[2], v8 = f.V(HOURS), frac = v8 > 0 ? f.V(t) / v8 : 0;
      $('liters').textContent = fmt(f.V(t));
      var h = 106 * clamp(frac, 0, 1);
      wr.setAttribute('y', 117 - h); wr.setAttribute('height', h);
      $('litersLabel').textContent = showHead
        ? 'clean water collected so far by the coated AshPure filter, hour ' + t.toFixed(1) + ' of 8'
        : 'clean water collected by the coated AshPure filter in 8 hours';
      heads.forEach(function (hd) {
        if (!hd.head) return;
        if (showHead) { var x = hd.sx(t).toFixed(1); hd.head.setAttribute('x1', x); hd.head.setAttribute('x2', x); hd.head.style.display = ''; }
        else hd.head.style.display = 'none';
      });
    }

    function update() {
      state = model();
      var f = state.filters, sand = f[0], ash = f[1];
      $('oTemp').textContent = state.T + ' °C';
      $('oPF').textContent = state.pf + '%';
      $('oThick').textContent = state.th + ' mm';
      $('oNTU').textContent = state.ntu + ' NTU';
      $('oPb').textContent = state.pb.toFixed(1) + ' mg/L';
      $('coatName').textContent = state.coat.name;
      $('heroStat').textContent = Math.round(ash.rem * 100) + '%';

      $('sPor').textContent = Math.round(state.phi * 100) + '%';
      $('sPore').textContent = state.d0.toFixed(2) + ' µm';
      $('sStr').innerHTML = (state.strength >= 5 ? '<span class="ok">Strong enough</span>' : '<span class="bad">Too fragile</span>') +
        '<small>' + state.strength.toFixed(1) + ' MPa (needs 5 or more)</small>';
      var lv = state.leach, lab = lv < 0.6 ? ['ok', 'Likely locked in'] : lv < 1.5 ? ['warn', 'Borderline'] : ['bad', 'High risk'];
      $('sLeach').innerHTML = '<span class="' + lab[0] + '">' + lab[1] + '</span><small>Illustrative. Needs a lab test.</small>';

      heads = [];
      drawChart($('ch1'), {
        label: 'Line chart of the percent of particles removed at each particle size, for sand and gravel, the AshPure ceramic, and the coated AshPure filter.',
        xlog: true, xmin: 0.1, xmax: 100, xticks: [0.1, 1, 10, 100], xlabel: 'Particle size (micrometres)',
        ymin: 0, ymax: 100, yticks: [0, 25, 50, 75, 100], xs: logXs,
        series: [
          { cls: 'ln-sand', fn: function (x) { return 100 * sand.bySize(x); } },
          { cls: 'ln-ash', fn: function (x) { return 100 * ash.bySize(x); } },
          { cls: 'ln-coat', marks: true, fn: function (x) { return 100 * f[2].bySize(x); } }
        ]
      });
      var timeOpts = { xlog: false, xmin: 0, xmax: HOURS, xticks: [0, 2, 4, 6, 8], xlabel: 'Hours of running', ymin: 0, ymax: 100, yticks: [0, 25, 50, 75, 100], xs: timeXs };
      heads.push(drawChart($('ch2'), Object.assign({
        label: 'Line chart of flow rate, as a percent of the clean-filter rate, over 8 hours for each filter.',
        series: [
          { cls: 'ln-sand', fn: function (t) { return 100 * sand.J(t) / sand.j0; } },
          { cls: 'ln-ash', fn: function (t) { return 100 * ash.J(t) / ash.j0; } },
          { cls: 'ln-coat', marks: true, fn: function (t) { return 100 * f[2].J(t) / f[2].j0; } }
        ]
      }, timeOpts)));
      heads.push(drawChart($('ch3'), Object.assign({
        label: 'Line chart of the percent of dissolved lead removed over 8 hours for each filter. The coated filter starts high and fades as the coating fills.',
        series: [
          { cls: 'ln-sand', fn: function (t) { return 100 * sand.metal(t); } },
          { cls: 'ln-ash', fn: function (t) { return 100 * ash.metal(t); } },
          { cls: 'ln-coat', marks: true, fn: function (t) { return 100 * f[2].metal(t); } }
        ]
      }, timeOpts)));

      $('resBody').innerHTML = f.map(function (x) {
        var lead = state.pb === 0 ? 'No lead set' : Math.round(x.metal(0) * 100) + '% → ' + Math.round(x.metal(HOURS) * 100) + '%';
        return '<tr><th scope="row"><span class="sw sw-' + x.cls + '"></span>' + x.name + '</th>' +
          '<td>' + Math.round(x.rem * 100) + '%</td><td>' + Math.round(x.res) + '</td>' +
          '<td>' + fmt(x.j0) + '</td><td>' + fmt(x.J(HOURS)) + '</td><td>' + fmt(x.V(HOURS)) + '</td><td>' + lead + '</td></tr>';
      }).join('');
      setTime(tNow, running);
    }

    ['cTemp', 'cPF', 'cThick', 'cNTU', 'cPb', 'cCoat', 'cAsh'].forEach(function (id) {
      $(id).addEventListener('input', update);
      $(id).addEventListener('change', update);
    });
    $('btnRun').addEventListener('click', function () {
      if (running) return;
      if (reduce) { setTime(HOURS, false); return; }
      running = true; $('btnRun').disabled = true;
      var t0 = performance.now(), dur = 6500;
      (function tick(now) {
        var p = Math.min(1, (now - t0) / dur);
        if (p < 1) { setTime(p * HOURS, true); requestAnimationFrame(tick); }
        else { running = false; $('btnRun').disabled = false; setTime(HOURS, false); }
      })(t0);
    });
    update();
  }

  /* ---------- Kiln pore demo ---------- */
  function poreDemo() {
    var svg = $('poreSvg'), layer = $('poreLayer');
    if (!svg || !layer) return;
    var s = 7;
    var r = function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    var html = '', i, cav = [], tries = 0;
    var kinds = ['grain-a', 'grain-b', 'grain-c'];
    for (i = 0; i < 190; i++) {
      html += '<circle class="' + kinds[Math.floor(r() * 3)] + '" cx="' + (r() * 420).toFixed(1) + '" cy="' + (r() * 260).toFixed(1) + '" r="' + (2.6 + r() * 3.6).toFixed(1) + '"/>';
    }
    while (cav.length < 26 && tries < 800) {
      tries++;
      var c = { x: 24 + r() * 372, y: 20 + r() * 220, rx: 8 + r() * 8, ry: 4 + r() * 4, rot: Math.round(-40 + r() * 80) };
      if (cav.every(function (o) { return Math.hypot(o.x - c.x, o.y - c.y) > 34; })) cav.push(c);
    }
    var seen = {};
    cav.forEach(function (c, i) {
      cav.map(function (o, j) { return { j: j, d: Math.hypot(o.x - c.x, o.y - c.y) }; })
        .filter(function (o) { return o.j !== i; })
        .sort(function (a, b) { return a.d - b.d; }).slice(0, 2)
        .forEach(function (n) {
          var key = Math.min(i, n.j) + '-' + Math.max(i, n.j);
          if (seen[key]) return; seen[key] = 1;
          var o = cav[n.j];
          html += '<path class="chan" d="M' + c.x.toFixed(1) + ' ' + c.y.toFixed(1) + ' L' + o.x.toFixed(1) + ' ' + o.y.toFixed(1) + '"/>';
        });
    });
    cav.forEach(function (c) {
      html += '<g transform="rotate(' + c.rot + ' ' + c.x.toFixed(1) + ' ' + c.y.toFixed(1) + ')">' +
        '<ellipse class="cav" cx="' + c.x.toFixed(1) + '" cy="' + c.y.toFixed(1) + '" rx="' + c.rx.toFixed(1) + '" ry="' + c.ry.toFixed(1) + '"/>' +
        '<ellipse class="blob" cx="' + c.x.toFixed(1) + '" cy="' + c.y.toFixed(1) + '" rx="' + (c.rx - 1).toFixed(1) + '" ry="' + (c.ry - 1).toFixed(1) + '"/></g>';
    });
    layer.innerHTML = html;

    var token = 0;
    function setTemp(v) { $('kilnTemp').textContent = Math.round(v) + ' °C'; }
    function caption(fired) {
      $('poreCaption').textContent = fired
        ? 'After firing: the sawdust has burned away and the grains have fused, leaving connected pores that water can pass through.'
        : 'Before firing: ash and clay grains are packed around bits of sawdust and binder.';
    }
    $('btnFire').addEventListener('click', function () {
      if (svg.classList.contains('firing') || svg.classList.contains('fired')) return;
      if (reduce) { svg.classList.add('fired'); setTemp(1000); caption(true); return; }
      var my = ++token, t0 = performance.now(), dur = 2400;
      svg.classList.add('firing'); $('btnFire').disabled = true;
      (function tick(now) {
        if (my !== token) return;
        var p = Math.min(1, (now - t0) / dur);
        setTemp(25 + 975 * p);
        if (p < 1) requestAnimationFrame(tick);
        else { svg.classList.remove('firing'); svg.classList.add('fired'); caption(true); }
      })(t0);
    });
    $('btnReset').addEventListener('click', function () {
      token++;
      svg.classList.remove('firing', 'fired');
      setTemp(25); caption(false); $('btnFire').disabled = false;
    });
  }

  hero();
  simulator();
  poreDemo();
})();
