/* PureHealthGuide — shared interactions. Purely visual: no payment or data logic lives here. */
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  // ---- Reveal on scroll ----
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // ---- Count-up numbers: <span data-count="18" data-suffix="K"> ----
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion || !target) { el.textContent = target + suffix; return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  // ---- Spotlight that follows the pointer ----
  document.querySelectorAll('.spot').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // ---- 3D tilt ----
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.tilt').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(1000px) rotateX(' + (-y * 6) + 'deg) rotateY(' + (x * 8) + 'deg) translateY(-4px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  // ---- Nav border, progress bar, sticky buy bar ----
  var nav = document.querySelector('.nav');
  var bar = document.querySelector('.progress');
  var sticky = document.querySelector('.sticky-buy');
  var buyAnchor = document.getElementById('buy');
  var finalCta = document.querySelector('.final');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 10);
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    }
    if (sticky && buyAnchor) {
      var past = buyAnchor.getBoundingClientRect().bottom < 0;
      var atEnd = finalCta && finalCta.getBoundingClientRect().top < window.innerHeight;
      sticky.classList.toggle('show', past && !atEnd);
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  // ---- Footer year ----
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // ---- Confetti (used on thank-you pages) ----
  window.celebrate = function () {
    if (reduceMotion) return;
    var canvas = document.createElement('canvas');
    canvas.id = 'confetti';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    function size() { canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size();
    window.addEventListener('resize', size);
    var colors = ['#ff3b30', '#ff8a3d', '#ffb800', '#4ade80', '#f5f5f3', '#3d8bff', '#ff4f9a'];
    var parts = [];
    for (var i = 0; i < 180; i++) {
      var fromLeft = i % 2 === 0;
      parts.push({
        x: fromLeft ? -10 : innerWidth + 10,
        y: innerHeight * (0.55 + Math.random() * 0.3),
        vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 9),
        vy: -(10 + Math.random() * 12),
        w: 6 + Math.random() * 6, h: 8 + Math.random() * 10,
        r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        c: colors[(Math.random() * colors.length) | 0]
      });
    }
    var start = performance.now();
    (function frame(now) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach(function (p) {
        p.vy += 0.32; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)));
        ctx.restore();
      });
      if (now - start < 4500) requestAnimationFrame(frame);
      else { canvas.remove(); window.removeEventListener('resize', size); }
    })(start);
  };
})();
