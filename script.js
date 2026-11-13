/* ===== Shared behaviour: reveal, spotlight, nav, ripple, counters, progress ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const toast = (msg) => { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); } t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2800); };
(function base() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // reveal on scroll
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  window.observeReveal = (root = document) => $$('[data-r]:not(.in)', root).forEach((el) => io.observe(el));
  observeReveal();
  // counters
  const co = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; co.unobserve(e.target); const el = e.target, to = +el.dataset.count, suf = el.dataset.suf || ''; if (reduce) { el.textContent = to + suf; return; } const t0 = performance.now(); (function f(t) { const k = Math.min(1, (t - t0) / 1600), v = 1 - Math.pow(1 - k, 4); el.textContent = Math.round(to * v).toLocaleString() + suf; if (k < 1) requestAnimationFrame(f); })(t0); }), { threshold: .6 });
  $$('[data-count]').forEach((el) => co.observe(el));
  // spotlight + progress + nav state
  const spot = $('.spot'), bar = $('.bar'), nav = $('.nav');
  let mx = innerWidth / 2, my = innerHeight / 3, sx = mx, sy = my;
  addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  (function loop() { sx += (mx - sx) * .12; sy += (my - sy) * .12; if (spot) spot.style.transform = `translate(${sx}px,${sy}px)`; requestAnimationFrame(loop); })();
  const onScroll = () => { const h = document.documentElement.scrollHeight - innerHeight; if (bar) bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`; if (nav) nav.classList.toggle('sm', scrollY > 30); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  // nav links highlight + burger
  const links = $$('.links a[href^="#"]');
  const so = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { threshold: .5 });
  links.forEach((a) => { const s = $(a.getAttribute('href')); if (s) so.observe(s); a.addEventListener('click', () => $('.links')?.classList.remove('open')); });
  $('.burger')?.addEventListener('click', (e) => { const o = $('.links').classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); });
  // ripple
  document.addEventListener('pointerdown', (e) => { const b = e.target.closest('.btn'); if (!b) return; const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), d = document.createElement('span'); d.className = 'rp'; d.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`; b.append(d); setTimeout(() => d.remove(), 750); });
  // tilt
  if (!reduce && matchMedia('(hover:hover)').matches) document.addEventListener('pointermove', (e) => { const t = e.target.closest?.('[data-tilt]'); $$('[data-tilt].tilting').forEach((x) => { if (x !== t) { x.classList.remove('tilting'); x.style.transform = ''; } }); if (!t) return; const r = t.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5; t.classList.add('tilting'); t.style.transform = `perspective(900px) rotateX(${-py * 7}deg) rotateY(${px * 9}deg) translateY(-6px)`; });
  $$('[data-year]').forEach((y) => (y.textContent = new Date().getFullYear()));
})();
/* ===== Demo 2: menu filter, gallery lightbox, reservation ===== */
const DISHES = [
  ['🥗', 'Charred Caesar', 'Smoked romaine, parmesan, sourdough crumb.', 9, 'starter', 130, 1],
  ['🍤', 'Garlic Prawns', 'Butter, chilli, lemon and warm flatbread.', 13, 'starter', 20, 0],
  ['🍲', 'Roasted Tomato Soup', 'Basil oil and a grilled cheese soldier.', 8, 'starter', 10, 1],
  ['🥩', 'Oak-fired Ribeye', '300g, bone marrow butter, hand-cut fries.', 34, 'main', 5, 0],
  ['🍝', 'Wild Mushroom Pasta', 'Fresh tagliatelle, truffle cream, thyme.', 19, 'main', 35, 1],
  ['🍕', 'Ember Margherita', 'San Marzano tomato, buffalo mozzarella.', 16, 'main', 8, 1],
  ['🐟', 'Cedar Salmon', 'Honey glaze, charred greens, lemon.', 26, 'main', 195, 0],
  ['🍰', 'Burnt Basque Cheesecake', 'Caramelised top, berry compote.', 9, 'dessert', 330, 1],
  ['🍫', 'Molten Chocolate', 'Dark chocolate, sea salt, vanilla ice cream.', 10, 'dessert', 25, 1],
  ['🍋', 'Lemon Tart', 'Crisp pastry, torched meringue.', 8, 'dessert', 52, 1],
  ['🍹', 'Smoked Citrus Fizz', 'Orange, rosemary smoke, sparkling water.', 7, 'drink', 28, 1],
  ['☕', 'Oak Cold Brew', '18-hour brew, vanilla bean, oat cream.', 6, 'drink', 30, 1],
];
const GAL = [['🔥', 'The open fire', 18], ['🍷', 'Cellar wines', 345], ['🥖', 'Baked at dawn', 40], ['🌿', 'Herb garden', 130], ['🍷', 'Evening lights', 270], ['🍽️', 'Chef’s table', 25]];
(function () {
  const grid = $('#menuGrid');
  grid.innerHTML = DISHES.map(([e, n, d, p, c, h, v], i) => `<article class="card dish" data-c="${c}" style="--h:${h};animation-delay:${i * 40}ms"><div class="im">${e}</div><div><h3>${n}${v ? '<span class="vg">Veg</span>' : ''}</h3><p>${d}</p><span class="pr">$${p}</span></div></article>`).join('');
  $$('.tab').forEach((t) => t.addEventListener('click', () => { $$('.tab').forEach((x) => x.classList.toggle('on', x === t)); $$('.dish').forEach((d, i) => { const show = t.dataset.f === 'all' || d.dataset.c === t.dataset.f; d.classList.toggle('hide', !show); if (show) { d.style.animation = 'none'; d.offsetHeight; d.style.animation = `pop .5s cubic-bezier(.2,.9,.3,1.2) ${i * 30}ms backwards`; } }); }));
  grid.addEventListener('click', (e) => { const d = e.target.closest('.dish'); if (d) { $$('.dish.sel').forEach((x) => x !== d && x.classList.remove('sel')); d.classList.toggle('sel'); } });
  // gallery + lightbox
  $('#gal').innerHTML = GAL.map(([e, t, h]) => `<button class="gi" data-t="${t}" data-e="${e}" data-h="${h}" style="--h:${h}" aria-label="${t}">${e}</button>`).join('');
  const lb = $('#lb');
  $('#gal').addEventListener('click', (e) => { const g = e.target.closest('.gi'); if (!g) return; const i = $('.lbi', lb); i.textContent = g.dataset.e; i.style.background = `linear-gradient(135deg, hsl(${g.dataset.h} 75% 42%), hsl(${+g.dataset.h + 40} 70% 18%))`; $('p', lb).textContent = g.dataset.t; lb.hidden = false; });
  const close = () => (lb.hidden = true); lb.addEventListener('click', (e) => e.target !== $('.lbi', lb) && close()); addEventListener('keydown', (e) => e.key === 'Escape' && close());
  observeReveal();
  // reservation
  const f = $('#form'), times = $('#times'), hid = f.elements.time, d = f.elements.date;
  d.min = new Date().toISOString().slice(0, 10);
  ['12:00', '13:30', '15:00', '18:00', '19:30', '21:00'].forEach((t) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = () => { $$('button', times).forEach((x) => x.classList.toggle('on', x === b)); hid.value = t; setErr(hid, ''); }; times.append(b); });
  const setErr = (el, m) => { const box = el.closest('.field'); box.classList.toggle('bad', !!m); box.querySelector('.err').textContent = m; return !m; };
  const rules = { name: (v) => (v.trim().length < 2 ? 'Enter your name.' : ''), phone: (v) => (/^(\+?88)?01[3-9]\d{8}$/.test(v.replace(/[\s-]/g, '')) ? '' : 'Enter a valid mobile number.'), date: (v) => (!v ? 'Choose a date.' : v < d.min ? 'Date cannot be in the past.' : ''), guests: (v) => (v ? '' : 'Select party size.'), time: (v) => (v ? '' : 'Pick a time slot.') };
  f.addEventListener('submit', (e) => { e.preventDefault(); const ok = Object.keys(rules).map((k) => setErr(f.elements[k], rules[k](f.elements[k].value))).every(Boolean); if (!ok) return toast('Please complete the highlighted fields.'); toast(`Table for ${f.elements.guests.value} booked on ${f.elements.date.value} at ${hid.value}. See you soon!`); f.reset(); $$('button', times).forEach((x) => x.classList.remove('on')); });
})();
