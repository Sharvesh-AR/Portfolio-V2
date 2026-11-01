(function () {
  var sh = document.getElementById('projSheet'), btn = document.getElementById('vmBtn');
  if (!sh || !btn || typeof sh.showModal !== 'function') return;
  function close() {
    if (!sh.open || sh.classList.contains('out')) return;
    sh.classList.add('out');
    setTimeout(function () { sh.classList.remove('out'); sh.close(); btn.focus(); }, 300);
  }
  btn.addEventListener('click', function (e) { e.stopPropagation(); sh.showModal(); });
  document.getElementById('shX').addEventListener('click', close);
  sh.addEventListener('click', function (e) { if (e.target === sh) close(); });
  sh.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
})();

(function () {
  var R = document.documentElement, cd = document.getElementById('cardD');
  var toast = document.getElementById('toast'), hint = document.getElementById('hint'), btns = document.querySelectorAll('.tg button'), tt, ft;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gyroOn = false, gyroT = null, gBase = null, gAsked = false;
  var cur = { x: 0, y: 0 }, tgt = null, drag = null, moved = false, t0 = performance.now(), pokes = 0, lastMouse = null;

  /* haptics: Android/Chrome/Firefox use vibrate(); iPhone Safari has no vibrate(), so a hidden iOS "switch" toggle gives the system tick (iOS 17.4+) */
  var hasVib = typeof navigator.vibrate === 'function';
  var tick = (function () {
    if (hasVib) return null;
    try {
      var l = document.createElement('label'); l.setAttribute('aria-hidden', 'true');
      l.style.cssText = 'position:fixed;left:8px;bottom:8px;width:1px;height:1px;opacity:.01;pointer-events:none;overflow:hidden;z-index:-1';
      var i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', ''); i.tabIndex = -1;
      l.appendChild(i); document.body.appendChild(l); return l;
    } catch (x) { return null; }
  })();
  function buzz(n) {
    try {
      if (hasVib) navigator.vibrate(n);
      else if (tick) tick.click();
    } catch (x) {}
  }
  /* a light tick on every touch (touchend counts as a real user gesture on iOS and Android) */
  document.addEventListener('touchend', function () { buzz(8); }, { passive: true });
  function say(m) { toast.textContent = m; toast.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove('on'); }, 2000); }
  function restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  var turns = 0; /* half-turns of the card; the sign is the direction it spins */
  function set(s, dir) {
    if (s === R.getAttribute('data-side')) return;
    turns += dir || (s === 'per' ? -1 : 1);
    cd.classList.add('flipping'); cd.style.setProperty('--f', turns); cur.x = cur.y = 0; tgt = null;
    cd.style.setProperty('--rx', '0deg'); cd.style.setProperty('--ry', '0deg');
    clearTimeout(ft); ft = setTimeout(function () { cd.classList.remove('flipping'); }, 1100);
    R.setAttribute('data-side', s);
    Array.prototype.forEach.call(document.querySelectorAll('.face'), function (f) {
      var hide = f.classList.contains('front') ? s === 'per' : s === 'pro';
      f.inert = hide; f.setAttribute('aria-hidden', hide ? 'true' : 'false');
    });
    Array.prototype.forEach.call(btns, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-s') === s ? 'true' : 'false'); });
    hint.lastChild.textContent = s === 'pro' ? 'Tap or swipe to flip' : 'Tap or swipe to go back';
    document.title = s === 'pro' ? 'AR Sharvesh' : 'Sharvesh';
    buzz(14);
  }
  function other() { return R.getAttribute('data-side') === 'pro' ? 'per' : 'pro'; }
  Array.prototype.forEach.call(btns, function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); set(b.getAttribute('data-s')); }); });

  /* tap: flip. avatar and tech badges react instead */
  var lines = { pro: ['Builder says hi', 'Zero errors. Promise.', 'Still building...', 'Okay okay, stop poking'], per: ['Long live the Barbarian King', 'Smash!', 'Clash tags are below', 'Okay okay, stop poking'] };
  /* only the character's body reacts; the rest of the picture area flips the card */
  function hitChar(e) {
    var img = e.target.closest && e.target.closest('.av img');
    if (!img || !img.naturalHeight) return null;
    var r = img.getBoundingClientRect(), dw = Math.min(r.width, r.height * img.naturalWidth / img.naturalHeight);
    var ry = (e.clientY - r.top) / r.height;
    if (Math.abs(e.clientX - (r.left + r.width / 2)) > dw * 0.24 || ry < 0.2 || ry > 0.92) return null;
    return img;
  }
  cd.addEventListener('click', function (e) {
    if (moved) { moved = false; return; }
    var img = hitChar(e);
    if (img) { restart(img, 'jump'); var l = lines[R.getAttribute('data-side')]; say(l[pokes++ % l.length]); buzz(10); return; }
    var bd = e.target.closest('span.bd');
    if (bd) { restart(bd, 'pop'); say(bd.getAttribute('title') || ''); buzz(8); return; }
    if (e.target.closest('a, button')) return;
    set(other());
  });
  Array.prototype.forEach.call(document.querySelectorAll('span.bd'), function (b) {
    b.setAttribute('role', 'button'); b.setAttribute('tabindex', '0');
    b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); } });
  });

  /* drag to tilt, swipe to flip (touch + mouse) */
  cd.addEventListener('pointerdown', function (e) {
    if (e.target.closest('a, button, span.bd') || hitChar(e)) return;
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY };
    try { cd.setPointerCapture(e.pointerId); } catch (x) {}
  });
  function dragTilt(e) {
    var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy, r = cd.getBoundingClientRect();
    if (Math.abs(dx) + Math.abs(dy) > 8) moved = true;
    tgt = { y: Math.max(-28, Math.min(28, dx / (r.width / 2) * 24)), x: Math.max(-18, Math.min(18, -dy / (r.height / 2) * 18)) };
  }
  cd.addEventListener('pointermove', function (e) { if (drag && e.pointerId === drag.id) dragTilt(e); });
  function end(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    drag = null; tgt = gyroOn ? gyroT : ((lastMouse && !reduce) ? lastMouse : null);
    if (e.type === 'pointerup' && moved && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy)) { set(other(), dx < 0 ? -1 : 1); }
    setTimeout(function () { moved = false; }, 0);
  }
  cd.addEventListener('pointerup', end); cd.addEventListener('pointercancel', end);

  /* desktop mouse: card follows the pointer */
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || reduce) return;
    lastMouse = { y: (e.clientX / innerWidth - .5) * 28, x: (.5 - e.clientY / innerHeight) * 22 };
    if (!drag && !gyroOn) tgt = lastMouse;
  });
  document.documentElement.addEventListener('mouseleave', function () { lastMouse = null; if (!drag) tgt = null; });

  /* gyro: the card follows the phone's movement */
  function onOrient(e) {
    if (e.beta == null || e.gamma == null || reduce) return;
    var ang = (screen.orientation && typeof screen.orientation.angle === 'number') ? screen.orientation.angle : (window.orientation || 0);
    ang = ((ang % 360) + 360) % 360;
    var B = e.beta, G = e.gamma;                      /* map sensor axes to the screen when the phone is rotated */
    if (ang === 90) { B = -e.gamma; G = e.beta; } else if (ang === 270) { B = e.gamma; G = -e.beta; } else if (ang === 180) { B = -e.beta; G = -e.gamma; }
    if (!gBase) gBase = { b: B, g: G };
    gBase.b += (B - gBase.b) * 0.004; gBase.g += (G - gBase.g) * 0.004; /* slowly re-centres to how you hold the phone */
    var cl = function (v, m) { return Math.max(-m, Math.min(m, v)); };
    gyroOn = true;
    gyroT = { x: cl((B - gBase.b) * 0.6, 18), y: cl((G - gBase.g) * 0.85, 26) };
    if (!drag) tgt = gyroT;
  }
  window.addEventListener('orientationchange', function () { gBase = null; });
  function startGyro() {
    if (gAsked || reduce || !window.DeviceOrientationEvent) return;
    gAsked = true;
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(function (r) { if (r === 'granted') window.addEventListener('deviceorientation', onOrient); }, function () { gAsked = false; });
      } else { window.addEventListener('deviceorientation', onOrient); }
    } catch (e) { gAsked = false; }
  }
  if (!(typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function')) startGyro();
  ['touchend', 'click'].forEach(function (n) { document.addEventListener(n, startGyro, { passive: true }); });

  /* smooth springy tilt + idle sway so it always feels 3D */
  function frame(t) {
    requestAnimationFrame(frame);
    if (cd.classList.contains('flipping')) return;
    var tx = 0, ty = 0;
    if (tgt) { tx = tgt.x; ty = tgt.y; }
    else if (!reduce) { var s = (t - t0) / 1000; ty = Math.sin(s * .9) * 7; tx = Math.cos(s * .7) * 3.5; }
    var k = drag ? .22 : .09;
    cur.x += (tx - cur.x) * k; cur.y += (ty - cur.y) * k;
    cd.style.setProperty('--rx', cur.x.toFixed(2) + 'deg');
    cd.style.setProperty('--ry', cur.y.toFixed(2) + 'deg');
    cd.style.setProperty('--px', (cur.y / 14).toFixed(3));
    cd.style.setProperty('--py', (-cur.x / 11).toFixed(3));
  }
  requestAnimationFrame(frame);

  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-copy');
      buzz(10);
      (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () { say('Copied ' + v); }, function () { say(v); });
    });
  });
})();

(function () {
  var R = document.documentElement, cd = document.getElementById('cardD'), st = document.getElementById('stage');
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    R.style.setProperty('--mx', e.clientX + 'px'); R.style.setProperty('--my', e.clientY + 'px');
  });
  /* build the card's edge: 9 thin slices between front and back */
  (function () {
    var n = 9, th = 12, cols = ['#17150e', '#17150e', '#3a2c06', '#a87a05', '#e0aa12', '#a87a05', '#3a2c06', '#cfc9b2', '#ece8d4'];
    for (var i = 0; i < n; i++) {
      var e = document.createElement('i'); e.className = 'edge'; e.setAttribute('aria-hidden', 'true');
      e.style.setProperty('--z', (th / 2 - .6 - i * (th - 1.2) / (n - 1)).toFixed(2) + 'px');
      e.style.setProperty('--ec', cols[i]);
      cd.insertBefore(e, cd.firstChild);
    }
  })();
  /* floor shadow drifts opposite to the card's tilt */
  (function loop() { requestAnimationFrame(loop); var ry = parseFloat(cd.style.getPropertyValue('--ry')) || 0; st.style.setProperty('--sx', (-ry * 2.2).toFixed(1)); })();
})();
