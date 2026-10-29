/* Section Menu — "Panggung rasa".
   Cakram warna yang menyapu saat ganti rasa, kemasan 3D yang bisa diseret, remah cemilan berfisika (canvas),
   baris tulisan raksasa yang ikut kecepatan scroll, dock pemilih rasa (efek magnify) dan harga bergulir.
   Mandiri: Web Animations API + satu loop rAF, tidak butuh GSAP.
   Tombol CTA tetap memakai [data-product] + href="#kemasan" (ditangani package.js lewat #menuGrid). */
(() => {
  const M = window.MOM, host = document.querySelector('#menuGrid');
  if (!M || !host) return;
  const P = M.products, N = P.length, section = host.closest('.menu-section');
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const LITE = matchMedia('(pointer: coarse)').matches || innerWidth < 900;
  const on = () => !LITE && !M.paused && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)'), wide = matchMedia('(min-width: 900px)');
  const OUT = 'cubic-bezier(.16,1,.3,1)', SPRING = 'cubic-bezier(.34,1.45,.64,1)';
  const easeBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

  /* warna cakram & bentuk tiap rasa */
  const THEME = {
    keju:   { disc: '#ffd23f', shape: 'Keriting' },
    bawang: { disc: '#f6dcae', shape: 'Keping tipis' },
    udang:  { disc: '#ffb48a', shape: 'Gulung mungil' }
  };
  const th = p => THEME[p.id] || { disc: p.color, shape: '' };
  const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
  const RING = 'GURIH ✦ RENYAH ✦ KRIUK ✦ '.repeat(3);

  /* ───────── Render ───────── */
  host.classList.add('rs'); section.classList.add('rs-js');
  host.innerHTML = `
    <div class="rs-stage" id="rsStage">
      <div class="rs-rows" aria-hidden="true">${[0, 1, 2].map(() => '<div class="rs-row"><div class="rs-track"></div></div>').join('')}</div>
      <div class="rs-core" aria-hidden="true"><div class="rs-disc-wrap">
        <div class="rs-ring"><svg viewBox="0 0 400 400"><defs><path id="rsRingP" d="M200 200m-182 0a182 182 0 1 1 364 0a182 182 0 1 1-364 0"/></defs><text><textPath href="#rsRingP" textLength="1143" lengthAdjust="spacing">${RING}</textPath></text></svg></div>
        <div class="rs-disc">${P.map(p => `<i class="rs-d" style="--dc:${th(p).disc}"></i>`).join('')}</div>
        <i class="rs-ground"></i>
      </div></div>
      <canvas class="rs-cv rs-cv-back" aria-hidden="true"></canvas>
      <div class="rs-packs">${P.map((p, i) => `
        <div class="rs-pack" data-i="${i}"><div class="rs-tilt" style="--img:url('${p.image}')"><img src="${p.image}" alt="Kemasan ${p.name}, 250 g" width="300" height="366" decoding="async"${i ? ' loading="lazy"' : ''}><i class="rs-glare"></i></div></div>`).join('')}</div>
      <canvas class="rs-cv rs-cv-front" aria-hidden="true"></canvas>
      <button class="rs-nav rs-nav--prev" type="button" aria-label="Rasa sebelumnya"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button>
      <button class="rs-nav rs-nav--next" type="button" aria-label="Rasa berikutnya"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>
      <p class="rs-hint" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/></svg>Seret kemasannya</p>
    </div>
    <div class="rs-dock" role="tablist" aria-label="Pilih rasa"><i class="rs-pill" aria-hidden="true"></i>${P.map((p, i) => `
      <button class="rs-tab" type="button" role="tab" id="rsT${i}" data-i="${i}" aria-controls="rsPanel" aria-selected="false" tabindex="-1"><img src="${p.image}" alt="" width="32" height="39" loading="lazy" decoding="async"><span><b>${p.short || p.name}</b><small>${M.money(p.price)}</small></span></button>`).join('')}
    </div>
    <div class="rs-tk"><article class="rs-ticket" id="rsPanel" role="tabpanel" aria-labelledby="rsT0">
      <div class="rs-c"><span class="rs-tag rs-rv"></span><h3 class="rs-name"></h3></div>
      <div class="rs-c"><p class="rs-desc rs-rv"></p><ul class="rs-spec rs-rv"><li class="rs-shape"></li><li>Zip pouch 250 g</li></ul></div>
      <div class="rs-c"><div class="rs-price rs-rv"><div class="rs-odo" aria-hidden="true"></div><small>per kemasan 250 g</small></div>
        <a class="rs-cta rs-rv" href="#kemasan" data-product="${P[0].id}"><span>Pilih kemasan</span><i>${ARROW}</i></a></div>
    </article></div>
    <p class="rs-sr" role="status" aria-live="polite"></p>`;

  const $ = s => host.querySelector(s), $$ = s => [...host.querySelectorAll(s)];
  const stage = $('#rsStage'), discWrap = $('.rs-disc-wrap'), ring = $('.rs-ring'), ground = $('.rs-ground');
  const rows = $$('.rs-row'), discs = $$('.rs-d'), packs = $$('.rs-pack'), tilts = $$('.rs-tilt');
  const dock = $('.rs-dock'), pill = $('.rs-pill'), tabs = $$('.rs-tab'), tk = $('.rs-tk'), panel = $('#rsPanel');
  const tag = $('.rs-tag'), nameEl = $('.rs-name'), desc = $('.rs-desc'), shapeEl = $('.rs-shape'), odo = $('.rs-odo');
  const priceBox = $('.rs-price'), cta = $('.rs-cta'), srEl = $('.rs-sr'), navs = $$('.rs-nav');
  const cvB = $('.rs-cv-back'), cvF = $('.rs-cv-front'), ctxB = cvB.getContext('2d'), ctxF = cvF.getContext('2d');
  let active = 0;

  /* ───────── Info tiket + harga bergulir ───────── */
  let odoKey = '', slots = [];
  function setOdo(str, anim) {
    const key = str.replace(/\d/g, '0');
    if (key !== odoKey) {
      odoKey = key;
      odo.innerHTML = [...str].map(ch => /\d/.test(ch)
        ? `<span class="rs-dg"><span class="rs-dr" style="--d:0;--k:0;transition:none">${'0123456789'.split('').map(d => `<b>${d}</b>`).join('')}</span></span>`
        : `<span class="rs-sy">${ch}</span>`).join('');
      slots = [...odo.querySelectorAll('.rs-dr')]; void odo.offsetWidth;
    }
    let k = 0;
    [...str].forEach(ch => { if (!/\d/.test(ch)) return; const s = slots[k]; s.style.setProperty('--k', k); s.style.setProperty('--d', ch); s.style.transition = anim ? '' : 'none'; k++; });
  }
  function fillInfo(i, anim) {
    const p = P[i], t = th(p), pf = p.name.replace(p.short, '').trim();
    host.style.setProperty('--dc', t.disc);
    tag.textContent = p.note;
    nameEl.setAttribute('aria-label', p.name);
    nameEl.innerHTML = `${pf ? `<span class="rs-pf" aria-hidden="true"><span>${pf}</span></span>` : ''}<strong class="rs-big" aria-hidden="true">${[...p.short].map(c => `<span class="rs-ch">${c}</span>`).join('')}</strong>`;
    desc.textContent = p.description; shapeEl.textContent = t.shape;
    shapeEl.hidden = !t.shape;
    cta.dataset.product = p.id; cta.setAttribute('aria-label', `Pilih kemasan ${p.name}`);
    priceBox.setAttribute('aria-label', `${M.money(p.price)} per kemasan 250 g`);
    panel.setAttribute('aria-labelledby', 'rsT' + i);
    srEl.textContent = `${p.name}, ${M.money(p.price)} per kemasan 250 g`;
    setOdo(M.money(p.price), anim);
  }
  function animInfo(delay = 0) {
    if (!on()) return;
    tk.querySelectorAll('.rs-rv').forEach((el, i) => el.animate([{ transform: 'translateY(18px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 700, delay: delay + i * 70, easing: OUT, fill: 'backwards' }));
    tk.querySelectorAll('.rs-pf>span').forEach(el => el.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], { duration: 650, delay: delay + 40, easing: OUT, fill: 'backwards' }));
    tk.querySelectorAll('.rs-ch').forEach((el, i) => el.animate([{ transform: 'translateY(118%) rotate(14deg)' }, { transform: 'translateY(-7%) rotate(-3deg)', offset: .7 }, { transform: 'none' }], { duration: 820, delay: delay + 80 + i * 55, easing: OUT, fill: 'backwards' }));
  }

  /* ───────── Baris tulisan raksasa ───────── */
  const rowX = [0, 0, 0], rowW = [600, 600, 600], rowV = [-34, 26, -42];
  function fillRows() {
    const word = P[active].word;
    rows.forEach((row, r) => {
      const tr = row.firstElementChild; tr.textContent = '';
      const u = document.createElement('span'); u.className = 'rs-u'; u.innerHTML = `<span>${word}</span><b>✦</b>`; tr.append(u);
      rowW[r] = u.getBoundingClientRect().width || 600;
      const need = Math.ceil(innerWidth * 1.3 / rowW[r]) + 2;
      for (let k = 1; k < need; k++) tr.append(u.cloneNode(true));
      rowX[r] = clamp(rowX[r], -rowW[r], 0);
    });
  }

  /* ───────── Dock: pil geser + magnify ───────── */
  function placePill(instant) {
    const t = tabs[active]; if (!t || !t.offsetWidth) return;
    if (instant) dock.classList.add('no-t');
    pill.style.width = t.offsetWidth + 'px'; pill.style.height = t.offsetHeight + 'px';
    pill.style.transform = `translate(${t.offsetLeft}px,${t.offsetTop}px)`;
    if (instant) { void pill.offsetWidth; dock.classList.remove('no-t'); }
  }

  /* ───────── Partikel remah (canvas) ───────── */
  const sprites = {}; let spritesLoaded = false;
  function loadSprites() {
    if (spritesLoaded) return; spritesLoaded = true;
    P.forEach(p => { sprites[p.id] = [1, 2, 3, 4, 5].map(n => { const im = new Image(); im.decoding = 'async'; im.src = `assets/pieces/${p.id}/${p.id}${n}.webp`; return im; }); });
  }
  let W = 0, H = 0, cx = 0, cy = 0, D = 0, dpr = 1;
  function resize() {
    const r = stage.getBoundingClientRect(); if (!r.width) return;
    dpr = Math.min(1.25, devicePixelRatio || 1); W = r.width; H = r.height;
    [cvB, cvF].forEach(c => { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
    const d = discWrap.getBoundingClientRect(); D = d.width; cx = d.left - r.left + d.width / 2; cy = d.top - r.top + d.height / 2;
  }
  let orbit = [], parts = [], T = 0;
  const chipImg = id => { const a = sprites[id]; return a ? a[Math.floor(Math.random() * a.length)] : null; };
  function newOrbit(id, delay) {
    const n = wide.matches ? 6 : 4;
    return Array.from({ length: n }, (_, k) => ({
      id, img: chipImg(id), ang: k / n * TAU + rnd(-.25, .25), om: rnd(.2, .42) * (Math.random() < .2 ? -1 : 1),
      rx: D * rnd(.52, .68), ry: D * rnd(.2, .34), tilt: rnd(-.32, -.1), s: D * rnd(.1, .17),
      x: cx, y: cy, rot: rnd(0, TAU), vr: rnd(-1.4, 1.4), t0: T + delay + k * .07, depth: 1
    }));
  }
  function burstAt(x, y, id, n = 9, power = 1) {
    if (!on()) return;
    for (let i = 0; i < n; i++) {
      const a = rnd(-Math.PI, 0) + rnd(-.5, .5) * .6 + (Math.random() < .35 ? Math.PI : 0) * 0, sp = rnd(320, 880) * power;
      parts.push({ id, img: chipImg(id), x, y, vx: Math.cos(a) * sp * rnd(.7, 1.3), vy: Math.sin(a) * sp - 120, rot: rnd(0, TAU), vr: rnd(-9, 9), s: Math.max(30, D * rnd(.07, .13)), life: rnd(1.1, 1.8), max: 1.6 });
    }
  }
  const FALL = { keju: '#ffc928', bawang: '#e9c68a', udang: '#f0824a' };
  function drawChip(ctx, c, s, alpha) {
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.globalAlpha = alpha;
    const im = c.img;
    if (im && im.complete && im.naturalWidth) {
      const r = im.naturalHeight / im.naturalWidth; ctx.drawImage(im, -s / 2, -s * r / 2, s, s * r);
    } else { /* cadangan kalau gambar potongan belum ada */
      ctx.fillStyle = FALL[c.id] || '#ffc928'; ctx.strokeStyle = 'rgba(94,8,0,.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-s * .45, s * .3); ctx.lineTo(0, -s * .42); ctx.lineTo(s * .45, s * .3); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
  function stepParticles(dt) {
    ctxB.setTransform(dpr, 0, 0, dpr, 0, 0); ctxF.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctxB.clearRect(0, 0, W, H); ctxF.clearRect(0, 0, W, H);
    const kf = 1 - Math.exp(-dt * 5);
    orbit.forEach(c => {
      const age = T - c.t0; if (age < 0) return;
      const g = easeBack(clamp(age / .9, 0, 1));
      c.ang += c.om * dt;
      const ca = Math.cos(c.ang), sa = Math.sin(c.ang), ct = Math.cos(c.tilt), st = Math.sin(c.tilt);
      let tx = cx + ca * c.rx * ct - sa * c.ry * st, ty = cy + ca * c.rx * st + sa * c.ry * ct;
      const dx = tx - S.px, dy = ty - S.py, d = Math.hypot(dx, dy) || 1, R = Math.max(110, D * .26);
      if (d < R) { const f = 1 - d / R; tx += dx / d * f * f * R * .9; ty += dy / d * f * f * R * .9; c.rot += f * dt * 14; }
      c.x += (tx - c.x) * kf; c.y += (ty - c.y) * kf; c.rot += c.vr * dt;
      const depth = (sa + 1) / 2;
      drawChip(sa > 0 ? ctxF : ctxB, c, c.s * g * (.76 + .36 * depth), sa > 0 ? 1 : .78);
    });
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.vy += 1500 * dt; const dr = Math.pow(.18, dt); p.vx *= dr; p.vy *= Math.pow(.5, dt);
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      drawChip(ctxF, p, p.s, clamp(p.life / .45, 0, 1));
    }
  }

  /* ───────── Gerak: kursor, drag, scroll, cincin ───────── */
  const S = { nx: 0, ny: 0, tx: 0, ty: 0, px: -999, py: -999, dragX: 0, dx: 0, dragging: false, vel: 0, lastY: scrollY, boost: 0, ang: 0, gx: 50, gy: 30, go: 0, tgo: 0, tgx: 50, tgy: 30 };
  const mt = tabs.map(() => 0), mtt = tabs.map(() => 0), mset = tabs.map(() => -1);
  let live = false, raf = 0, last = 0;
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000 || .016); last = now; T += dt;
    const k = 1 - Math.exp(-dt * 8);
    const v = scrollY - S.lastY; S.lastY = scrollY; S.vel += (clamp(v, -80, 80) - S.vel) * (1 - Math.exp(-dt * 6));
    S.tx += (S.nx - S.tx) * k; S.ty += (S.ny - S.ty) * k;
    S.dx += (S.dragX - S.dx) * (1 - Math.exp(-dt * (S.dragging ? 32 : 9)));
    S.gx += (S.tgx - S.gx) * k; S.gy += (S.tgy - S.gy) * k; S.go += (S.tgo - S.go) * k;
    const bob = Math.sin(T * 1.6) * 7;
    const tl = tilts[active];
    tl.style.transform = `translate3d(${(S.dx * .7).toFixed(1)}px,${bob.toFixed(1)}px,0) rotate(${(S.dx * .035 + Math.sin(T * 1.1) * 1.2).toFixed(2)}deg) perspective(900px) rotateY(${(S.tx * 14).toFixed(2)}deg) rotateX(${(-S.ty * 10).toFixed(2)}deg)`;
    tl.style.setProperty('--gx', S.gx.toFixed(1) + '%'); tl.style.setProperty('--gy', S.gy.toFixed(1) + '%'); tl.style.setProperty('--go', S.go.toFixed(2));
    ground.style.transform = `translateX(${(S.dx * .4).toFixed(1)}px) scale(${(1 - bob / 90).toFixed(3)})`;
    S.boost *= Math.exp(-dt * 1.7); S.ang += (8 + S.boost + Math.abs(S.vel) * .9) * dt;
    ring.style.transform = `rotate(${S.ang.toFixed(2)}deg)`;
    rows.forEach((row, r) => {
      const dir = Math.sign(rowV[r]);
      rowX[r] += (rowV[r] + dir * Math.abs(S.vel) * 22 + dir * S.boost * 6) * dt;
      if (rowX[r] <= -rowW[r]) rowX[r] += rowW[r]; if (rowX[r] > 0) rowX[r] -= rowW[r];
      row.firstElementChild.style.transform = `translate3d(${rowX[r].toFixed(1)}px,0,0) skewX(0deg)`;
    });
    marq.forEach(m => { /* pita berjalan: makin kencang & miring saat scroll kencang */
      const dir = Math.sign(m.v);
      m.x += (m.v + dir * Math.abs(S.vel) * 30) * dt;
      if (m.x <= -m.w) m.x += m.w; if (m.x > 0) m.x -= m.w;
      m.t.style.transform = `translate3d(${m.x.toFixed(1)}px,0,0) skewX(0deg)`;
    });
    tabs.forEach((t, i) => { mt[i] += (mtt[i] - mt[i]) * k; const q = Math.round(mt[i] * 200) / 200; if (q !== mset[i]) { mset[i] = q; t.style.setProperty('--m', q); } });
    stepParticles(dt);
    raf = live && on() ? requestAnimationFrame(frame) : 0;
  }
  const run = () => { if (!raf && live && on()) { last = performance.now(); S.lastY = scrollY; raf = requestAnimationFrame(frame); } };

  /* ───────── Ganti rasa ───────── */
  function animPack(prev, next, dir) {
    packs.forEach(p => { p.getAnimations().forEach(a => a.cancel()); p.classList.remove('is-out'); });
    const po = packs[prev], pn = packs[next];
    po.classList.add('is-out');
    const out = po.animate([{ transform: 'none', opacity: 1 }, { transform: `translateX(${-dir * 55}%) rotate(${-dir * 20}deg) scale(.6)`, opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' });
    out.onfinish = () => { out.cancel(); if (active !== prev) po.classList.remove('is-out'); };
    pn.animate([
      { transform: `translateX(${dir * 60}%) rotate(${dir * 22}deg) scale(.6)`, opacity: 0 },
      { transform: `translateX(${-dir * 3}%) rotate(${-dir * 4}deg) scale(1.04)`, opacity: 1, offset: .62 },
      { transform: 'none', opacity: 1 }], { duration: 1000, delay: 140, easing: OUT, fill: 'backwards' });
  }
  function animDisc(prev, next, dir) {
    discs.forEach(d => { d.getAnimations().forEach(a => a.cancel()); d.classList.remove('is-top'); });
    discs.forEach((d, k) => d.classList.toggle('is-on', k === next || k === prev));
    const dn = discs[next], ox = dir > 0 ? 92 : 8;
    dn.classList.add('is-top');
    const a = dn.animate([{ clipPath: `circle(0% at ${ox}% 50%)` }, { clipPath: `circle(150% at ${ox}% 50%)` }], { duration: 950, easing: 'cubic-bezier(.65,0,.25,1)' });
    a.onfinish = () => { if (active === next) { discs.forEach((d, k) => d.classList.toggle('is-on', k === next)); dn.classList.remove('is-top'); } };
  }
  function animRows(dir) {
    rows.forEach((r, i) => r.animate([{ transform: `translateX(${dir * 14}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 850, delay: i * 90, easing: OUT, fill: 'backwards' }));
  }
  function swapOrbit(next) {
    orbit.forEach(c => { /* remah lama terlempar keluar */
      const a = Math.atan2(c.y - cy, c.x - cx), sp = rnd(260, 560);
      parts.push({ id: c.id, img: c.img, x: c.x, y: c.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 180, rot: c.rot, vr: rnd(-7, 7), s: c.s, life: rnd(.9, 1.3), max: 1.3 });
    });
    orbit = newOrbit(P[next].id, .25);
  }

  function select(next, dir) {
    const prev = active; active = next;
    tabs.forEach((t, k) => { const a = k === next; t.setAttribute('aria-selected', String(a)); t.tabIndex = a ? 0 : -1; });
    packs.forEach((p, k) => p.classList.toggle('is-on', k === next));
    placePill(false);
    fillInfo(next, on()); fillRows();
    if (on()) {
      animPack(prev, next, dir); animDisc(prev, next, dir); animRows(dir); animInfo(120);
      swapOrbit(next); burstAt(cx, cy, P[next].id, 10, 1); S.boost = Math.max(S.boost, 70);
    } else discs.forEach((d, k) => d.classList.toggle('is-on', k === next));
  }
  function go(i, { dir, user = false } = {}) {
    const next = (i + N) % N; if (next === active) return;
    if (user) host.classList.add('is-used');
    select(next, dir || (((next - active + N) % N) <= N / 2 ? 1 : -1));
  }

  /* ───────── Interaksi ───────── */
  const POP = ['Kriuk!', 'Gurih!', 'Renyah!', 'Kress!'];
  function poke(e) {
    if (!on()) return;
    const r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    burstAt(x, y, P[active].id, 6, .8); S.boost = Math.max(S.boost, 40);
    packs[active].animate([{ transform: 'none' }, { transform: 'scale(1.07,.93)', offset: .25 }, { transform: 'scale(.97,1.03)', offset: .55 }, { transform: 'none' }], { duration: 520, easing: OUT });
    const pop = document.createElement('span'); pop.className = 'rs-pop'; pop.textContent = POP[Math.floor(Math.random() * POP.length)];
    pop.style.left = x + 'px'; pop.style.top = y + 'px'; stage.append(pop);
    const rot = rnd(-14, 14);
    pop.animate([{ transform: `translate(-50%,-30%) scale(.4) rotate(${rot}deg)`, opacity: 0 }, { transform: `translate(-50%,-90%) scale(1.1) rotate(${rot}deg)`, opacity: 1, offset: .3 }, { transform: `translate(-50%,-200%) scale(1) rotate(${rot}deg)`, opacity: 0 }], { duration: 900, easing: OUT }).onfinish = () => pop.remove();
  }
  let drag = null;
  stage.addEventListener('pointerdown', e => {
    if (e.button > 0 || e.target.closest('button')) return;
    drag = { x: e.clientX, t: performance.now(), moved: false, id: e.pointerId };
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
    S.dragging = true; stage.classList.add('is-drag');
  });
  stage.addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect(); S.px = e.clientX - r.left; S.py = e.clientY - r.top;
    if (drag && e.pointerId === drag.id) { const dx = e.clientX - drag.x; if (Math.abs(dx) > 6) drag.moved = true; S.dragX = clamp(dx, -260, 260); }
    if (!fine.matches || !on()) return;
    S.nx = clamp((S.px - W / 2) / (W / 2), -1, 1); S.ny = clamp((S.py - H / 2) / (H / 2), -1, 1);
    const pk = packs[active].getBoundingClientRect();
    const inside = e.clientX > pk.left && e.clientX < pk.right && e.clientY > pk.top && e.clientY < pk.bottom;
    S.tgx = clamp((e.clientX - pk.left) / pk.width * 100, 0, 100); S.tgy = clamp((e.clientY - pk.top) / pk.height * 100, 0, 100); S.tgo = inside ? .85 : 0;
  }, { passive: true });
  const endDrag = (e, cancel) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = S.dragX, ms = Math.max(1, performance.now() - drag.t), fast = Math.abs(dx) / ms > .5;
    const moved = drag.moved; drag = null; S.dragging = false; S.dragX = 0; stage.classList.remove('is-drag');
    if (cancel) return;
    if (moved && (Math.abs(dx) > 70 || (fast && Math.abs(dx) > 24))) go(active + (dx < 0 ? 1 : -1), { dir: dx < 0 ? 1 : -1, user: true });
    else if (!moved) poke(e);
  };
  stage.addEventListener('pointerup', e => endDrag(e, false));
  stage.addEventListener('pointercancel', e => endDrag(e, true));
  stage.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { S.nx = S.ny = 0; S.tgo = 0; S.px = S.py = -999; } });
  navs.forEach((b, i) => b.addEventListener('click', () => go(active + (i ? 1 : -1), { dir: i ? 1 : -1, user: true })));

  dock.addEventListener('click', e => { const t = e.target.closest('.rs-tab'); if (t) go(+t.dataset.i, { user: true }); });
  dock.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (d) { e.preventDefault(); go(active + d, { dir: d, user: true }); tabs[active].focus(); }
    else if (e.key === 'Home') { e.preventDefault(); go(0, { user: true }); tabs[active].focus(); }
    else if (e.key === 'End') { e.preventDefault(); go(N - 1, { user: true }); tabs[active].focus(); }
  });
  dock.addEventListener('pointermove', e => {
    if (!fine.matches || !on()) return;
    tabs.forEach((t, i) => { const r = t.getBoundingClientRect(); mtt[i] = clamp(1 - Math.abs(e.clientX - (r.left + r.width / 2)) / (r.width * .95), 0, 1); });
  }, { passive: true });
  dock.addEventListener('pointerleave', () => mtt.fill(0));
  tk.addEventListener('pointermove', e => { /* tombol magnetik */
    if (!fine.matches || !on()) return; const b = e.target.closest('.rs-cta'); if (!b) return;
    const r = b.getBoundingClientRect(); b.style.translate = `${((e.clientX - r.left) / r.width - .5) * 14}px ${((e.clientY - r.top) / r.height - .5) * 10}px`;
  });
  tk.addEventListener('pointerout', e => { const b = e.target.closest('.rs-cta'); if (b) b.style.translate = ''; });

  /* ───────── Pembuka (sekali) ───────── */
  let introDone = false;
  function intro() {
    if (introDone) return; introDone = true;
    host.classList.remove('rs-pre');
    if (!on()) return;
    discWrap.animate([{ transform: 'scale(.15) rotate(-60deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 1200, easing: SPRING, fill: 'backwards' });
    ring.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 500, fill: 'backwards' });
    rows.forEach((r, i) => r.animate([{ transform: `translateX(${i % 2 ? -18 : 18}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 1100, delay: 200 + i * 110, easing: OUT, fill: 'backwards' }));
    packs[active].animate([{ transform: 'translateY(-90%) rotate(-16deg) scale(.7)', opacity: 0 }, { transform: 'translateY(4%) rotate(3deg) scale(1.03)', opacity: 1, offset: .6 }, { transform: 'none', opacity: 1 }], { duration: 1300, delay: 420, easing: OUT, fill: 'backwards' });
    [dock, tk, ...navs].forEach((el, i) => el.animate([{ transform: 'translateY(36px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 900, delay: 800 + i * 110, easing: OUT, fill: 'backwards' }));
    animInfo(900); S.boost = 90;
    orbit = newOrbit(P[active].id, .9);
    setTimeout(() => burstAt(cx, cy, P[active].id, 10, 1.1), 1000);
  }

  /* ───────── Masuk layar & ukuran ───────── */
  new IntersectionObserver(([en]) => {
    live = en.isIntersecting;
    if (live) { loadSprites(); resize(); placePill(true); if (!introDone) { if (en.intersectionRatio > .12 || !on()) intro(); } }
    run();
  }, { threshold: [0, .12, .3] }).observe(section);
  const warm = new IntersectionObserver(([en]) => { if (en.isIntersecting) { loadSprites(); warm.disconnect(); } }, { rootMargin: '900px 0px' }); warm.observe(section);
  if (window.ResizeObserver) new ResizeObserver(() => { resize(); placePill(true); }).observe(stage);
  addEventListener('resize', () => { fillRows(); fillMarq(); });
  document.fonts && document.fonts.ready.then(() => { fillRows(); fillMarq(); placePill(true); resize(); });
  document.addEventListener('motionchange', () => {
    if (on()) run(); else { cancelAnimationFrame(raf); raf = 0; ctxB.clearRect(0, 0, W, H); ctxF.clearRect(0, 0, W, H); parts = []; orbit = []; tilts.forEach(t => { t.style.transform = ''; }); }
  });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', () => document.dispatchEvent(new Event('motionchange')));


  /* ───────── Kepala: judul pecah huruf, statistik, pita ───────── */
  const head = section.querySelector('.rs-head'), marqEl = section.querySelector('.rs-marq');
  const title = section.querySelector('#rsTitle');
  const marq = [];
  function splitText(root) {
    let i = 0;
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(tok => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { frag.append(' '); return; }
          const w = document.createElement('span'); w.className = 'rs-hw'; w.setAttribute('aria-hidden', 'true');
          [...tok].forEach(ch => { const c = document.createElement('span'); c.className = 'rs-hc'; c.style.setProperty('--i', i++); c.textContent = ch; w.append(c); });
          frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName.toLowerCase() !== 'svg') walk(n);
    });
    walk(root); return i;
  }
  if (title) { title.setAttribute('aria-label', title.textContent.trim().replace(/\s+/g, ' ')); splitText(title); }
  const chars = title ? [...title.querySelectorAll('.rs-hc')] : [];
  const fromEl = section.querySelector('#rsFrom'), minPrice = Math.min(...P.map(p => p.price));
  if (fromEl) fromEl.textContent = M.money(minPrice);
  const STATS = { n3: [N, v => String(Math.round(v))], g250: [250, v => Math.round(v / 10) * 10 + ' g'], from: [minPrice, v => M.money(Math.round(v / 50) * 50)] };

  function fillMarq() {
    section.querySelectorAll('.rs-mt').forEach((t, k) => {
      const unit = marq[k] ? marq[k].u : t.firstElementChild;
      t.querySelectorAll('.rs-mu').forEach((u, n) => n && u.remove());
      const w = unit.getBoundingClientRect().width || 800;
      const need = Math.ceil(innerWidth * 1.5 / w) + 1;
      for (let q = 1; q < need; q++) { const cl = unit.cloneNode(true); t.append(cl); }
      marq[k] = Object.assign(marq[k] || { x: 0, t, u: unit, v: +t.dataset.v }, { w });
      t.querySelectorAll('.rs-mu').forEach((u, n) => n && u.setAttribute('aria-hidden', 'true'));
    });
  }
  function countUp() {
    section.querySelectorAll('[data-stat]').forEach((el, i) => {
      const [to, fmt] = STATS[el.dataset.stat]; const t0 = performance.now() + 700 + i * 140, dur = 1300;
      el.textContent = fmt(0);
      const step = now => { const k = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 4); el.textContent = fmt(to * e); if (k < 1) requestAnimationFrame(step); else el.textContent = fmt(to); };
      requestAnimationFrame(step);
    });
  }
  let headDone = false;
  function headIntro() {
    if (headDone) return; headDone = true;
    head.classList.remove('rs-hpre'); marqEl.classList.remove('rs-hpre');
    if (!on()) return;
    const eb = head.querySelector('.rs-eyebrow');
    eb.animate([{ transform: 'rotate(-22deg) scale(.2)', opacity: 0 }, { transform: 'rotate(-4deg) scale(1.1)', opacity: 1, offset: .6 }, { transform: 'rotate(-4deg) scale(1)', opacity: 1 }], { duration: 900, easing: OUT, fill: 'backwards' });
    chars.forEach((c, i) => c.animate([{ transform: 'translateY(75%) rotate(10deg) scale(.7)', opacity: 0 }, { transform: 'translateY(-8%) rotate(-3deg) scale(1.04)', opacity: 1, offset: .7 }, { transform: 'none', opacity: 1 }], { duration: 760, delay: 250 + i * 32, easing: OUT, fill: 'backwards' }));
    const sq = head.querySelector('.rs-squig path');
    if (sq) sq.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 900, delay: 250 + chars.length * 32, easing: 'cubic-bezier(.65,0,.25,1)', fill: 'backwards' });
    const lead = head.querySelector('.rs-lead');
    lead.animate([{ transform: 'translateY(18px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 800, delay: 700, easing: OUT, fill: 'backwards' });
    head.querySelectorAll('.rs-stats span').forEach((s, i) => s.animate([{ transform: 'translateY(22px) scale(.85)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 800, delay: 800 + i * 140, easing: SPRING, fill: 'backwards' }));
    marqEl.querySelectorAll('.rs-mb').forEach((b, i) => {
      const rot = i ? 1.7 : -1.8;
      b.animate([{ transform: `translateX(${i ? 40 : -40}%) rotate(${rot}deg)`, opacity: 0 }, { transform: `rotate(${rot}deg)`, opacity: 1 }], { duration: 1200, delay: 900 + i * 160, easing: OUT, fill: 'backwards' });
    });
    countUp();
  }
  if (on()) { head.classList.add('rs-hpre'); marqEl.classList.add('rs-hpre'); }
  new IntersectionObserver(([en], io) => { if (en.isIntersecting) { headIntro(); io.disconnect(); } }, { threshold: .3 }).observe(head);

  /* huruf judul membesar & miring saat kursor mendekat */
  let hRaf = 0, hx = 0, hy = 0;
  const reactChars = () => {
    hRaf = 0;
    chars.forEach(c => { const r = c.getBoundingClientRect(), d = Math.hypot(hx - (r.left + r.width / 2), hy - (r.top + r.height / 2)); const f = Math.pow(clamp(1 - d / 150, 0, 1), 1.6); c.style.setProperty('--f', f.toFixed(3)); });
  };
  title && title.addEventListener('pointermove', e => { if (!fine.matches || !on()) return; hx = e.clientX; hy = e.clientY; if (!hRaf) hRaf = requestAnimationFrame(reactChars); }, { passive: true });
  title && title.addEventListener('pointerleave', () => chars.forEach(c => c.style.setProperty('--f', 0)));

  /* keadaan awal */
  if (on()) host.classList.add('rs-pre');
  discs[0].classList.add('is-on'); packs[0].classList.add('is-on');
  tabs[0].setAttribute('aria-selected', 'true'); tabs[0].tabIndex = 0;
  fillInfo(0, false); fillRows(); fillMarq(); resize(); placePill(true);
})();
