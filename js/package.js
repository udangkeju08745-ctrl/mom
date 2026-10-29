/* KEMASAN — "Tarik, plastiknya terisi".
   Satu nilai kontinu v (0–4) = posisi tuas.
   - v = 0      → plastik pertama KOSONG.
   - 0 → 1      → keripik naik dari dasar sampai plastik pertama PENUH.
   - lewat 1    → plastik kedua muncul dari balik plastik pertama, lalu mulai terisi (dst. sampai 4 plastik = 1 kg).
   - lepas      → tuas menyentak ke hitungan terdekat (min. 1 plastik), keripik ikut naik sampai penuh.
   Plastik (lengkap dengan label) dan isian keripik memakai FOTO asli di assets/kemasan/, digabung di <canvas>:
   isian naik dari dasar di balik jendela plastik yang transparan, lalu plastik digambar di atasnya.
   Tetap kompatibel: M.selectProduct, M.addOrder, [data-count], [data-moment], [data-product]. */
(() => {
  const M = window.MOM, $ = s => document.querySelector(s);
  const kx = $('#kx'), stage = $('#kxStage'), rail = $('#kxRail'), knob = $('#kxKnob'), openBar = $('#kxOpen'), cvs = $('#kxCanvas');
  const word = $('#kxWord'), countEl = $('#visualCount'), weightEl = $('#weightOutput'), meter = [...document.querySelectorAll('#kxMeter i')];
  const moodEl = $('#packMood'), nameEl = $('#builderName'), priceEl = $('#builderPrice'), detailEl = $('#builderDetail');
  if (!kx || !stage || !rail || !cvs) return;
  const ctx = cvs.getContext('2d');

  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const on = () => M.motionOn();
  const buzz = p => { if (on() && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } };
  const TAU = Math.PI * 2, PX = 600, PY = 822, ASP = PX / PY;     // ukuran gambar plastik (px) & rasio lebar : tinggi
  const easeBack = k => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };

  let product = M.products[0], idx = 0;                           // idx = jumlah kemasan − 1
  let v = 0, vel = 0, target = 0;                                  // posisi tuas, kecepatan, tujuan pegas
  let ip = 0, ivel = 0;                                            // pegas masuk plastik pertama
  let impulse = 0, swap = 0, dragging = null, raf = 0, last = 0, touched = false, inView = false, shownPrice = product.price, lastFull = 0;

  /* ---------- Warna remah per rasa (hanya untuk percikan remah saat ditarik) ---------- */
  const PAL = {
    keju:   { base: '#efd58a', hi: '#fff1c2', lo: '#c99d45' },
    bawang: { base: '#f0e2b8', hi: '#fff8e0', lo: '#c9ae72' },
    udang:  { base: '#efc084', hi: '#ffe0b4', lo: '#c98a4a' }
  };
  const palOf = p => PAL[p.pieces] || PAL[p.id] || PAL.keju;

  /* ---------- Gambar plastik, isian & mask siluet ---------- */
  const BASE = 'assets/kemasan/', IMG = {};
  const loadImg = src => { const im = new Image(); im.decoding = 'async'; im.onload = () => { im.ok = true; if (!raf) render(performance.now() / 1000, 0); }; im.src = src; return im; };
  const maskImg = loadImg(BASE + 'pouch-mask.png');                 // siluet plastik: isian tidak boleh keluar dari plastik
  M.products.forEach(p => { IMG[p.id] = { pouch: loadImg(BASE + 'pouch-' + p.id + '.webp'), fill: loadImg(BASE + 'isi-' + p.id + '.webp') }; });
  // Area jendela plastik pada gambar 600 × 822 (isian sedikit lebih besar dari jendela; tepinya tertutup rangka plastik)
  const FX = 42, FY = 98, FW = 520, FH = 720;
  const layers = [];                                                // kanvas kerja per plastik
  const layer = i => layers[i] || (layers[i] = (() => { const cv = document.createElement('canvas'); cv.width = PX; cv.height = PY; return { cv, c: cv.getContext('2d') }; })());

  /* ---------- Ukuran kanvas ---------- */
  let W = 0, H = 0, PH0 = 300, TW = 0, KW = 0, DPR = 1;
  function measure() {
    W = stage.clientWidth; H = stage.clientHeight; DPR = Math.min(M.lite ? 1.25 : 2, window.devicePixelRatio || 1);
    if (cvs.width !== Math.round(W * DPR) || cvs.height !== Math.round(H * DPR)) { cvs.width = Math.round(W * DPR); cvs.height = Math.round(H * DPR); }
    PH0 = W < 560 ? Math.min(H * .80, W * .72 / ASP) : Math.min(H * .70, W * .62 / ASP);
    TW = rail.clientWidth; KW = knob.offsetWidth || 64;
  }

  /* ---------- Isian: tumpukan keripik yang naik, bergelombang, dan keripik yang jatuh ke dalam plastik ---------- */
  const fst = [], FB = FY + FH + 8, FT = FY + 16, CX = FX + FW / 2;
  let busy = false;
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  function fstate(i) {
    if (fst[i]) return fst[i];
    const r = rng(1234 + i * 77), n = 22;
    return fst[i] = { init: false, f: 0, rate: 0, s: 0, sv: 0, t: 0, acc: 0, chips: [], r,
      tufts: Array.from({ length: n }, (_, k) => ({ x: FX - 6 + (k + .5) / n * (FW + 12) + (r() - .5) * 12, rx: 26 + r() * 20, ry: 14 + r() * 9, rot: (r() - .5) * 1.1, u: .1 + r() * .8, w: .1 + r() * .8, dy: r() * 10 - 2 })) };
  }
  // tinggi permukaan tumpukan di posisi x: gundukan di tengah, miring & beriak saat bergerak
  function surf(st, x, ts) {
    const f = clamp(st.f, 0, 1), top = FB - (FB - FT) * f, u = (x - CX) / (FW / 2), a = Math.min(1, Math.abs(st.rate));
    return top + (6 + 46 * Math.pow(1 - f, .7)) * u * u + st.s * 26 * u + (Math.sin(x * .05 + ts * 4) * 3.5 + Math.sin(x * .13 - ts * 6.3) * 1.8) * a;
  }
  function stepFill(st, fill, ts) {
    const m = on(), dt = m ? clamp(ts - st.t, 0, .05) : 0; st.t = ts;
    if (!st.init || !m) { st.f = fill; st.rate = 0; st.s = st.sv = 0; st.chips.length = 0; st.init = true; return; }
    if (dt <= 0) return;
    const prev = st.f;
    st.f += (fill - st.f) * (1 - Math.exp(-dt * 11));                         // isian mengejar tuas dengan lembut, tidak kaku
    if (Math.abs(fill - st.f) < .0015) st.f = fill;
    st.rate += ((st.f - prev) / dt - st.rate) * Math.min(1, dt * 12);
    st.sv += (-150 * st.s - 6.5 * st.sv - st.rate * 22) * dt; st.s = clamp(st.s + st.sv * dt, -1.2, 1.2);   // tumpukan oleng lalu tenang
    const r = st.r;
    if (st.rate > .35 && st.f < .985 && st.chips.length < 26) {                // keripik jatuh dari atas selama plastik diisi
      st.acc += dt * st.rate * 38;
      while (st.acc >= 1 && st.chips.length < 26) { st.acc--; st.chips.push({ x: CX + (r() - .5) * FW * .62, y: FY + 4, vx: (r() - .5) * 70, vy: 50 + r() * 90, rot: r() * 6, vr: (r() - .5) * 9, a: 15 + r() * 10, b: 7 + r() * 5, u: .1 + r() * .8, w: .1 + r() * .8 }); }
    }
    for (let k = st.chips.length - 1; k >= 0; k--) {
      const c = st.chips[k]; c.vy += 1700 * dt; c.x = clamp(c.x + c.vx * dt, FX + 34, FX + FW - 34); c.y += c.vy * dt; c.rot += c.vr * dt;
      if (c.y > surf(st, c.x, ts) - c.b * .6) { st.chips.splice(k, 1); st.sv -= 5; }   // mendarat → tumpukan sedikit bergetar
    }
  }

  /* ---------- Gambar satu plastik ---------- */
  // Titik (0,0) = tengah dasar plastik; plastik berdiri ke atas (y negatif).
  function drawPouch(c, o) {
    const { pw, ph, fill, ts, amp, im, i, flip } = o, st = fstate(i);
    stepFill(st, fill, ts);
    const infl = .3 + .7 * clamp(st.f * 1.3, 0, 1);
    if (Math.abs(fill - st.f) > .0016 || Math.abs(st.s) > .004 || Math.abs(st.sv) > .02 || st.chips.length) busy = true;
    c.save(); c.scale(.965 + .035 * infl, 1);                       // plastik sedikit menggembung saat terisi
    c.translate(-pw / 2, -ph); c.scale(pw / PX, ph / PY);
    if (st.f > .004 && im.fill.ok && maskImg.ok) {
      const L = layer(i), g = L.c, P = palOf(product), jig = amp > .01 ? Math.sin(ts * 13 + i * 2) * amp * 3.2 : 0, drift = (1 - st.f) * 64;
      const body = () => { g.beginPath(); g.moveTo(FX - 14, FB + 24); for (let x = FX - 14; x <= FX + FW + 14; x += 8) g.lineTo(x, surf(st, x, ts)); g.lineTo(FX + FW + 14, FB + 24); g.closePath(); };
      g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, PX, PY);
      g.save(); g.beginPath(); g.rect(FX - 14, FY - 4, FW + 28, FB - FY + 30); g.clip();
      body(); g.fillStyle = P.lo; g.fill();                          // alas gelap: celah antar keripik tidak tembus pandang
      g.save(); body(); g.clip(); g.translate(CX, FY - 26 + drift + jig); g.scale(flip, 1);
      g.drawImage(im.fill, -(FW + 14) / 2, 0, FW + 14, FH + 60); g.restore();   // tekstur keripik terungkap dari bawah
      // gumpalan keripik di permukaan → tepi atas tidak rata & tidak terpotong lurus
      st.tufts.forEach((t, k) => {
        const act = Math.min(1, Math.abs(st.rate)), y = surf(st, t.x, ts) + t.dy + Math.sin(ts * 7 + k * 1.7) * act * 2.5;
        g.save(); g.translate(t.x, y); g.rotate(t.rot);
        g.beginPath(); g.ellipse(0, 3, t.rx, t.ry, 0, 0, TAU); g.fillStyle = 'rgba(70,40,10,.28)'; g.fill();
        g.beginPath(); g.ellipse(0, 0, t.rx, t.ry, 0, 0, TAU); g.fillStyle = P.lo; g.fill(); g.clip();
        g.drawImage(im.fill, -t.u * FW * .9, -t.w * FH * .9, FW * .9, FH * .9); g.restore();
      });
      // keripik yang sedang jatuh
      st.chips.forEach(ch => {
        g.save(); g.translate(ch.x, ch.y); g.rotate(ch.rot);
        g.beginPath(); g.ellipse(2, 3, ch.a, ch.b, 0, 0, TAU); g.fillStyle = 'rgba(60,30,5,.25)'; g.fill();
        g.beginPath(); g.ellipse(0, 0, ch.a, ch.b, 0, 0, TAU); g.fillStyle = P.base; g.fill(); g.clip();
        g.drawImage(im.fill, -ch.u * FW * .8, -ch.w * FH * .8, FW * .8, FH * .8);
        g.restore();
        g.save(); g.translate(ch.x, ch.y); g.rotate(ch.rot); g.beginPath(); g.ellipse(0, 0, ch.a, ch.b, 0, 0, TAU); g.strokeStyle = 'rgba(150,36,5,.4)'; g.lineWidth = 1.2; g.stroke(); g.restore();
      });
      // bayangan & cahaya: sisi dalam plastik gelap, dasar gelap, permukaan sedikit terang → isian terasa bulat dan menyatu
      g.globalCompositeOperation = 'source-atop';
      let gr = g.createLinearGradient(FX - 14, 0, FX + FW + 14, 0);
      [[0, .6], [.14, .14], [.5, 0], [.86, .14], [1, .6]].forEach(([p, a]) => gr.addColorStop(p, `rgba(45,15,0,${a})`));
      g.fillStyle = gr; g.fillRect(0, 0, PX, PY);
      gr = g.createLinearGradient(0, FB - 130, 0, FB + 6); gr.addColorStop(0, 'rgba(45,15,0,0)'); gr.addColorStop(1, 'rgba(45,15,0,.4)');
      g.fillStyle = gr; g.fillRect(0, 0, PX, PY);
      const sy = surf(st, CX, ts); gr = g.createLinearGradient(0, sy - 12, 0, sy + 70); gr.addColorStop(0, 'rgba(255,244,214,.26)'); gr.addColorStop(1, 'rgba(255,244,214,0)');
      g.fillStyle = gr; g.fillRect(0, 0, PX, PY);
      g.restore();
      g.globalCompositeOperation = 'destination-in'; g.drawImage(maskImg, 0, 0, PX, PY); g.globalCompositeOperation = 'source-over';
      c.drawImage(L.cv, 0, 0);                                       // isian (dipotong mengikuti siluet plastik)
    }
    if (im.pouch.ok) c.drawImage(im.pouch, 0, 0, PX, PY);           // plastik + label di atas isian
    c.restore();
  }

  /* ---------- Satu frame ---------- */
  const lay = [], meterShown = [-1, -1, -1, -1];
  function render(ts, amp) {
    busy = false; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
    const cvv = clamp(v, 0, 4); let c = 1; for (let i = 1; i < 4; i++) c += clamp((v - i) / .22, 0, 1);
    const narrow = W < 560, sc = 1 - (narrow ? .14 : .11) * (c - 1), PHs = PH0 * sc, pw = PHs * ASP;
    const step = Math.min(.62 * PHs, Math.max(0, (W * (narrow ? .78 : .82) - pw) / Math.max(1, c - 1))), baseY = H * .865, lean = clamp(vel * .012, -.12, .12);
    const im = IMG[product.id], list = [];
    for (let i = 0; i < 4; i++) {
      const ap = i === 0 ? clamp(ip, 0, 1.12) : clamp((v - i) / .22, 0, 1);
      const rawFill = i === 0 ? clamp(v, 0, 1) : clamp(v - i, 0, 1);
      if (meterShown[i] !== +rawFill.toFixed(3) && meter[i]) { meterShown[i] = +rawFill.toFixed(3); meter[i].style.setProperty('--f', rawFill.toFixed(3)); }
      if (ap <= .001) { lay[i] = null; if (fst[i]) fst[i].init = false; continue; }
      const ea = i === 0 ? ap : easeBack(ap), eb = Math.min(ea, 1), off = i - (c - 1) / 2;
      let x = W / 2 + off * step;
      if (i > 0) { const px = W / 2 + (i - 1 - (c - 1) / 2) * step; x = px + (x - px) * Math.min(1.08, ea); }
      const ph = i * 1.7, flo = on() ? Math.sin(ts * 1.1 + ph) * 3.5 : 0;
      const jx = (Math.sin(ts * 19 + ph) + Math.sin(ts * 11.3 + ph * 2)) * .5 * amp * 5, jy = Math.sin(ts * 17 + ph * 1.3) * amp * 3, jr = Math.sin(ts * 15 + ph * .7) * amp * .045;
      const y = baseY + Math.abs(off) * PHs * .012 + flo + jy - (i === 0 ? (1 - ip) * PHs * .95 : (1 - eb) * PHs * .1);
      const sp = i === 0 ? .55 + .45 * ip : .45 + .55 * ea;
      const rot = off * .115 + (i > 0 ? (1 - eb) * .22 : 0) + lean + jr;
      const fill = rawFill * (1 - .42 * swap);
      list.push({ i, off, x: x + jx, y, sp, rot, fill, al: i === 0 ? clamp(ip * 3, 0, 1) : clamp(ap * 3, 0, 1) });
      lay[i] = { x: x + jx, y: y - PHs * .5 * sp };
    }
    list.sort((p, q) => Math.abs(q.off) - Math.abs(p.off) || p.i - q.i);
    // pendar emas di lantai panggung (podium) di bawah semua plastik
    { const gr0 = W * (narrow ? .5 : .42); ctx.save(); ctx.translate(W / 2, baseY + PHs * .018); ctx.scale(1, .17);
      const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, gr0); gg.addColorStop(0, 'rgba(255,255,255,.85)'); gg.addColorStop(.55, 'rgba(255,214,120,.3)'); gg.addColorStop(1, 'rgba(255,200,90,0)');
      ctx.fillStyle = gg; ctx.fillRect(-gr0, -gr0, gr0 * 2, gr0 * 2); ctx.restore(); }
    // bayangan
    list.forEach(o => {
      ctx.save(); ctx.globalAlpha = o.al; ctx.translate(o.x, baseY + PHs * .014); ctx.scale(1, .2);
      const r = pw * o.sp * .66, g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, 'rgba(90,18,0,.5)'); g.addColorStop(1, 'rgba(90,18,0,0)');
      ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2); ctx.restore();
    });
    // plastik
    list.forEach(o => {
      ctx.save(); ctx.globalAlpha = o.al; ctx.translate(o.x, o.y); ctx.rotate(o.rot); ctx.scale(o.sp, o.sp);
      drawPouch(ctx, { pw, ph: PHs, fill: o.fill, ts, amp, im, i: o.i, flip: o.i % 2 ? -1 : 1 });
      ctx.restore();
    });
    // elemen DOM pendamping
    word.style.transform = `translate3d(${(-cvv * 26 + Math.sin(ts * 21) * amp * 3).toFixed(1)}px,${(Math.sin(ts * 17) * amp * 2).toFixed(1)}px,0) rotate(-7deg)`;
    stage.style.setProperty('--kx-g', (1 + cvv * .08 + impulse * .06).toFixed(3));
    const span = Math.max(1, TW - KW), kxp = clamp(v, -.15, 4.15) / 4 * span;
    knob.style.transform = `translate3d(${kxp.toFixed(1)}px,0,0) rotate(${clamp(vel * 5, -16, 16).toFixed(1)}deg) scaleX(${(1 + Math.min(.1, Math.abs(vel) * .012)).toFixed(3)})`;
    openBar.style.width = Math.max(KW / 2, kxp + KW / 2).toFixed(1) + 'px';
  }

  /* ---------- Loop fisika ---------- */
  const active = () => inView && !document.hidden && on();
  function loop(now) {
    const dt = Math.min(.033, (now - last) / 1000 || .016); last = now;
    if (!dragging) {
      vel += (170 * (target - v) - 12 * vel) * dt; v += vel * dt;
      if (Math.abs(target - v) < .0008 && Math.abs(vel) < .01) { v = target; vel = 0; }
    }
    ivel += (120 * (1 - ip) - 10 * ivel) * dt; ip += ivel * dt;
    if (Math.abs(1 - ip) < .001 && Math.abs(ivel) < .01) { ip = 1; ivel = 0; }
    impulse *= Math.exp(-dt * 5.5); swap *= Math.exp(-dt * 3.2); if (swap < .003) swap = 0;
    const over = v < 0 ? -v : v > 4 ? v - 4 : 0;
    const amp = on() ? Math.min(1.6, (dragging ? .12 : 0) + Math.min(Math.abs(vel), 6) * .05 + impulse + over * 2.2) : 0;
    render(now / 1000, amp);
    raf = active() || dragging || Math.abs(target - v) > .0008 || Math.abs(ip - 1) > .001 || impulse > .01 || swap > 0 || busy ? requestAnimationFrame(loop) : 0;
    if (!raf) render(now / 1000, 0);
  }
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }

  /* ---------- Efek: angka bergulir, harga naik, remah ---------- */
  function roll(el, text, dir) {
    if (el.textContent === text) return;
    el.textContent = text;
    if (on() && el.animate) el.animate([{ transform: `translateY(${dir >= 0 ? '' : '-'}.45em)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.9,.25,1.25)' });
  }
  function tweenPrice(to) {
    const from = shownPrice; shownPrice = to;
    if (!on() || from === to) { priceEl.textContent = M.money(to); return; }
    const t0 = performance.now(), d = 460;
    (function f(n) {
      const k = clamp((n - t0) / d, 0, 1), e = 1 - Math.pow(1 - k, 3);
      priceEl.textContent = M.money(Math.round(from + (to - from) * e));
      if (k < 1 && shownPrice === to) requestAnimationFrame(f); else priceEl.textContent = M.money(to);
    })(t0);
  }
  function crumbs(n, cx, cy, power = 1) {
    if (!on() || !stage.animate || stage.querySelectorAll('.kx-crumb').length > 60) return;
    const P = palOf(product), bits = [P.base, '#e6b04a', P.lo, P.hi];
    for (let i = 0; i < n; i++) {
      const el = document.createElement('span'), sz = 6 + Math.random() * 9;
      el.className = 'kx-crumb';
      el.style.cssText = `left:${cx}px;top:${cy}px;width:${sz}px;height:${sz * (.6 + Math.random() * .5)}px;background:${bits[i % 4]};border-radius:${40 + Math.random() * 20}% ${50 + Math.random() * 20}% ${40 + Math.random() * 25}% ${45 + Math.random() * 20}%`;
      stage.appendChild(el);
      const a = -Math.PI / 2 + (Math.random() - .5) * 2.7, d = (70 + Math.random() * 130) * power;
      const dx = Math.cos(a) * d, dy = Math.sin(a) * d, rot = (Math.random() - .5) * 560, g = 90 + Math.random() * 120, base = 'translate(-50%,-50%) ';
      el.animate([
        { transform: base + 'translate(0,0) rotate(0) scale(.3)', opacity: 1 },
        { transform: base + `translate(${dx}px,${dy}px) rotate(${rot * .6}deg) scale(1)`, opacity: 1, offset: .42 },
        { transform: base + `translate(${dx * 1.25}px,${dy + g}px) rotate(${rot}deg) scale(.7)`, opacity: 0 }
      ], { duration: 750 + Math.random() * 450, easing: 'cubic-bezier(.2,.7,.35,1)', fill: 'forwards' }).onfinish = () => el.remove();
    }
  }
  function popAt(i, n, power) {
    const l = lay[clamp(i, 0, 3)] || { x: W / 2, y: H * .5 };
    crumbs(n, l.x, l.y - PH0 * .28, power);
  }

  /* ---------- Teks & status berdasarkan idx ---------- */
  function paint(dir) {
    const n = idx + 1, pack = M.packs[idx];
    roll(weightEl, pack.weight, dir); roll(countEl, String(n), dir);
    if (moodEl.textContent !== pack.mood) { moodEl.textContent = pack.mood; if (on() && moodEl.animate) moodEl.animate([{ opacity: 0, transform: 'translateX(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' }); }
    nameEl.textContent = product.name; detailEl.textContent = `${n} kemasan × 250 g`;
    tweenPrice(n * product.price);
    rail.setAttribute('aria-valuenow', n); rail.setAttribute('aria-valuetext', `${n * 250} gram, ${n} kemasan`);
    stage.setAttribute('aria-label', `${n} kemasan ${product.name}, masing-masing 250 gram. Geser untuk mengubah jumlah.`);
    document.querySelectorAll('[data-count]').forEach(b => { const s = Number(b.dataset.count) === n; b.classList.toggle('selected', s); b.setAttribute('aria-pressed', s); });
  }
  function setIdx(n, quiet) {
    if (n === idx) return; const dir = n > idx ? 1 : -1; idx = n;
    paint(dir);
    if (!quiet) { impulse = 1; if (dir > 0) popAt(idx, 12, 1); else popAt(idx + 1, 6, .6); buzz(idx === 3 && dir > 0 ? [18, 30, 26] : 20); }
    kick();
  }
  function goTo(n) {
    n = clamp(n, 0, 3); touch();
    setIdx(n); target = n + 1; lastFull = Math.floor(v);
    if (!on()) { v = target; vel = 0; render(0, 0); return; }
    vel += (target > v ? 1 : -1) * 2.2; kick();
  }
  function touch() { if (!touched) { touched = true; kx.classList.add('is-touched'); } }

  /* ---------- Rasa ---------- */
  M.selectProduct = id => {
    const next = M.products.find(p => p.id === id); if (!next) return;
    const changed = next.id !== product.id; product = next;
    word.textContent = product.word; stage.style.setProperty('--kx-accent', product.color); kx.style.setProperty('--kx-accent', product.color);
    document.querySelectorAll('#flavorTabs [data-flavor]').forEach(b => b.setAttribute('aria-pressed', b.dataset.flavor === product.id));
    paint(0); if (!raf) render(performance.now() / 1000, 0);
    if (changed && on()) { impulse = Math.max(impulse, .9); swap = 1; popAt(0, 8, .6); buzz(12); }
    kick();
  };
  $('#flavorTabs').innerHTML = M.products.map(p => `<button type="button" data-flavor="${p.id}" aria-pressed="${p.id === product.id}"><i style="--c:${p.color}"></i>${p.short}</button>`).join('');
  $('#flavorTabs').addEventListener('click', e => { const b = e.target.closest('[data-flavor]'); if (b) M.selectProduct(b.dataset.flavor); });
  $('#menuGrid')?.addEventListener('click', e => { const a = e.target.closest('[data-product]'); if (a) M.selectProduct(a.dataset.product); });
  document.querySelectorAll('[data-count]').forEach(b => b.addEventListener('click', () => goTo(Number(b.dataset.count) - 1)));
  document.querySelectorAll('[data-moment]').forEach(a => a.addEventListener('click', () => goTo(Number(a.dataset.moment) - 1)));
  $('#addPackage').addEventListener('click', () => {
    M.addOrder(product.id, idx + 1);
    if (v < idx + .98) { target = idx + 1; if (!on()) v = target; }          // plastik yang belum penuh ikut diisi
    if (on()) { impulse = Math.max(impulse, .85); popAt(idx, 12, .9); buzz([10, 40, 16]); }
    kick();
  });

  /* ---------- Tarik: tuas & panggung ---------- */
  const rub = r => r < 0 ? r * .25 : r > 4 ? 4 + (r - 4) * .25 : r;
  function drag(el, perUnit, isRail) {
    let sx = 0, sy = 0, sv = 0, lt = 0, lv = 0, sm = 0, id = null, pending = false, lastTick = 0, wasOver = false;
    el.addEventListener('dragstart', e => e.preventDefault());
    el.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      id = e.pointerId; pending = true; sx = e.clientX; sy = e.clientY; sv = v; lt = e.timeStamp; lv = v; sm = 0;
      if (isRail && e.target.closest('#kxKnob')) engage(e);
    });
    function engage(e) {
      if (dragging) return; dragging = el; pending = false; sv = v; sx = e.clientX; lt = e.timeStamp; lv = v; sm = 0; lastFull = Math.floor(v + .001);
      try { el.setPointerCapture(id); } catch (x) {}
      el.classList.add('is-drag'); touch(); target = v; kick();
    }
    el.addEventListener('pointermove', e => {
      if (e.pointerId !== id) return;
      if (pending) {
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) engage(e);
        return;
      }
      if (dragging !== el) return;
      v = rub(sv + (e.clientX - sx) / perUnit());
      const dt = Math.max(.008, (e.timeStamp - lt) / 1000);
      sm += (((v - lv) / dt) - sm) * .35; vel = sm; lt = e.timeStamp; lv = v;
      const ni = clamp(Math.ceil(v - .03) - 1, 0, 3); if (ni !== idx) setIdx(ni);
      const nf = clamp(Math.floor(v + .001), 0, 4);                              // satu plastik baru saja penuh
      if (nf > lastFull) { lastFull = nf; impulse = Math.max(impulse, .7); popAt(nf - 1, 7, .55); buzz(14); } else if (nf < lastFull) lastFull = nf;
      const tk = Math.floor(v * 9); if (tk !== lastTick) { lastTick = tk; buzz(3); }
      const ov = v < -.02 || v > 4.02; if (ov && !wasOver) buzz(30); wasOver = ov;
      kick();
    });
    function release(e) {
      if (e.pointerId !== id) return;
      const wasPending = pending; pending = false; id = null;
      if (dragging !== el) {
        if (wasPending && isRail && e.type === 'pointerup') {                    // ketukan di rail: loncat ke jumlah terdekat
          const rc = rail.getBoundingClientRect();
          goTo(clamp(Math.round(clamp((e.clientX - rc.left - KW / 2) / Math.max(1, TW - KW), 0, 1) * 4), 1, 4) - 1);
        }
        return;
      }
      dragging = null; el.classList.remove('is-drag'); wasOver = false;
      const tgt = clamp(Math.round(v + vel * .1), 1, 4);
      target = tgt; setIdx(tgt - 1); lastFull = Math.floor(v);
      if (!on()) { v = tgt; vel = 0; render(0, 0); } else kick();
    }
    el.addEventListener('pointerup', release); el.addEventListener('pointercancel', release);
    el.addEventListener('lostpointercapture', e => { if (dragging === el && e.pointerId === id) release(e); });
  }
  drag(rail, () => Math.max(1, TW - KW) / 4, true);
  drag(stage, () => Math.max(70, Math.min(130, W * .2)), false);

  rail.addEventListener('keydown', e => {
    const k = e.key, map = { ArrowRight: idx + 1, ArrowUp: idx + 1, PageUp: idx + 1, ArrowLeft: idx - 1, ArrowDown: idx - 1, PageDown: idx - 1, Home: 0, End: 3 };
    if (!(k in map)) return; e.preventDefault(); goTo(map[k]);
  });

  /* ---------- Siklus ---------- */
  const ro = new ResizeObserver(() => { measure(); if (!raf) render(performance.now() / 1000, 0); });
  ro.observe(stage); ro.observe(rail);
  document.addEventListener('motionchange', () => {
    measure();
    if (!on()) { target = Math.max(1, target); v = target; vel = 0; ip = 1; ivel = 0; impulse = 0; swap = 0; render(0, 0); } else kick();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });

  measure(); word.textContent = product.word; paint(0);
  priceEl.textContent = M.money(product.price);
  if (on()) { ip = 0; v = 0; target = 0; } else { ip = 1; v = target = 1; }      // gerak nyala: mulai KOSONG; gerak mati: langsung 1 plastik penuh
  render(0, 0);

  /* Pembuka: plastik jatuh masuk (kosong), lalu tuas "menggoda" — keripik naik sedikit, turun lagi — sampai disentuh. */
  function tease() {
    if (touched || dragging || !on() || !inView) return;
    target = .42; kick();
    setTimeout(() => { if (!touched && !dragging) { target = 0; kick(); } }, 1000);
  }
  new IntersectionObserver(en => {
    inView = en[0].isIntersecting;
    if (inView) { kick(); if (!tease.started) { tease.started = true; setTimeout(tease, 1200); if (!M.lite) setInterval(tease, 6500); } }
  }, { threshold: .35 }).observe(stage);
})();
