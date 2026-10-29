/* Selotip melengkung di atas section Menu.
   Gulungan di tengah menarik pita keluar (unroll) saat masuk layar; pita menggantung seperti pegas:
   melorot saat scroll kencang, melengkung mengikuti pointer, dan gulungan berputar sesuai laju pita. */
(() => {
  const M = window.MOM, host = document.getElementById('mnTape');
  if (!M || !host) return;
  const NS = 'http://www.w3.org/2000/svg', section = host.closest('.menu-section');
  const mk = (n, a = {}, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); p && p.appendChild(e); return e; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const UNIT = 'GURIH KEJU ★ RENYAH BAWANG ★ KRIUK UDANG ★ DAPUR MOM’S 4G ★ ';
  const C = { green: '#173f32', yellow: '#ffcc42', cream: '#fff6df', peach: '#f2bb92' };

  /* ── SVG ── */
  const svg = mk('svg', { 'aria-hidden': 'true', focusable: 'false' }, host);
  const defs = mk('defs', {}, svg);
  const clip = mk('clipPath', { id: 'mnTapeClip', clipPathUnits: 'userSpaceOnUse' }, defs);
  const clipRect = mk('rect', {}, clip);
  const tape = mk('g', { 'clip-path': 'url(#mnTapeClip)' }, svg);
  const pShadow = mk('path', { fill: 'none', stroke: 'rgba(23,63,50,.22)', 'stroke-linecap': 'butt' }, tape);
  const pEdge = mk('path', { fill: 'none', stroke: C.green, 'stroke-linecap': 'butt' }, tape);
  const pMain = mk('path', { id: 'mnTapePath', fill: 'none', stroke: C.yellow, 'stroke-linecap': 'butt' }, tape);
  const pSheen = mk('path', { fill: 'none', stroke: '#fff', 'stroke-opacity': '.28', 'stroke-linecap': 'butt', 'stroke-dasharray': '3 11' }, tape);
  const txt = mk('text', { class: 'mn-tape-text', 'xml:space': 'preserve' }, tape);
  const tp = mk('textPath', { href: '#mnTapePath' }, txt);
  const meas = mk('text', { class: 'mn-tape-text', visibility: 'hidden' }, svg); meas.textContent = UNIT;

  /* gulungan */
  const roll = mk('g', { class: 'mn-roll' }, svg);
  const back = mk('circle', { fill: '#e8d4ad', stroke: C.green, 'stroke-width': 3.5 }, roll);
  const face = mk('g', {}, roll);
  const disc = mk('circle', { fill: C.cream, stroke: C.green, 'stroke-width': 3.5 }, face);
  const ring1 = mk('circle', { fill: 'none', stroke: C.green, 'stroke-opacity': .28, 'stroke-width': 2 }, face);
  const ring2 = mk('circle', { fill: 'none', stroke: C.yellow, 'stroke-width': 5 }, face);
  const ticks = [0, 1, 2].map(() => mk('line', { stroke: C.green, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-opacity': .55 }, face));
  const core = mk('circle', { fill: C.peach, stroke: C.green, 'stroke-width': 3.5 }, face);
  const shine = mk('path', { fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-opacity': .7 }, roll);

  /* ── State ── */
  const S = { w: 0, h: 0, W: 50, r: 40, fs: 24, unitW: 400, len: 0, y0: 30, base: 80 };
  const st = { p: 0, off: 0, sag: 0, sagV: 0, sh: 0, shV: 0, swing: 0, swingV: 0, kick: 0, vel: 0 };
  let sagT = 0, shT = 0, raf = 0, live = false, last = 0, lastY = scrollY, reps = 0, hover = false;

  function layout() {
    S.w = host.clientWidth; S.h = host.clientHeight;
    S.W = clamp(S.w * .038, 36, 58); S.r = clamp(S.w * .03, 26, 44); S.fs = S.W * .5;
    S.y0 = S.h * .16; S.base = S.h * .40;
    svg.setAttribute('viewBox', `0 0 ${S.w} ${S.h}`);
    [pShadow, pEdge, pMain, pSheen].forEach((p, i) => p.setAttribute('stroke-width', [S.W + 4, S.W + 7, S.W, 4][i]));
    pSheen.setAttribute('transform', `translate(0 ${-S.W * .3})`);
    pShadow.setAttribute('transform', 'translate(0 8)');
    [txt, meas].forEach(t => { t.setAttribute('font-size', S.fs); t.setAttribute('letter-spacing', S.fs * .05); });
    txt.setAttribute('dy', S.fs * .36);
    const r = S.r; back.setAttribute('r', r); disc.setAttribute('r', r); ring1.setAttribute('r', r * .76); ring2.setAttribute('r', r * .58); core.setAttribute('r', r * .34);
    ticks.forEach((t, i) => { const a = i * 2.094; t.setAttribute('x1', Math.cos(a) * r * .38); t.setAttribute('y1', Math.sin(a) * r * .38); t.setAttribute('x2', Math.cos(a) * r * .5); t.setAttribute('y2', Math.sin(a) * r * .5); });
    back.setAttribute('transform', `translate(${r * .2} ${r * .14})`);
    shine.setAttribute('d', `M ${-r * .62} ${-r * .3} A ${r * .72} ${r * .72} 0 0 1 ${-r * .1} ${-r * .68}`);
    try { S.unitW = meas.getComputedTextLength() || 400; } catch { S.unitW = 400; }
    draw(); /* panjang path dihitung setelah path terisi */
    S.len = pMain.getTotalLength();
    reps = Math.ceil((S.len + S.unitW) / S.unitW) + 1;
    tp.textContent = UNIT.repeat(reps);
    draw();
  }

  /* ── Gambar satu frame ── */
  function draw() {
    const { w, y0 } = S, sag = S.base + st.sag, ctrl = (sag + 2) / .75, sh = st.sh;
    const d = `M ${-60} ${y0 - 8} C ${w * .26 + sh * .6} ${y0 + ctrl}, ${w * .74 + sh * .6} ${y0 + ctrl}, ${w + 60} ${y0 - 8}`;
    [pShadow, pEdge, pMain, pSheen].forEach(p => p.setAttribute('d', d));
    const mx = w * .5 + sh * .45, my = y0 - 2 + .75 * ctrl;
    const half = st.p * (w * .5 + 90);
    clipRect.setAttribute('x', mx - half); clipRect.setAttribute('y', -60); clipRect.setAttribute('width', half * 2); clipRect.setAttribute('height', S.h + 160);
    tp.setAttribute('startOffset', -((st.off % S.unitW + S.unitW) % S.unitW));
    const ang = -st.off / S.r * 57.2958;
    roll.setAttribute('transform', `translate(${mx} ${my}) rotate(${st.swing}) scale(${(hover ? 1.08 : 1) * (.55 + .45 * Math.min(1, st.p * 3))})`);
    face.setAttribute('transform', `rotate(${ang})`);
    roll.style.opacity = Math.min(1, st.p * 8);
  }

  /* ── Fisika sederhana (pegas teredam) ── */
  function step(t) {
    const dt = Math.min(2.5, (t - last) / 16.67 || 1); last = t;
    /* kecepatan scroll → pita melorot + mengalir lebih cepat */
    const sp = clamp(Math.abs(st.vel), 0, 60); st.vel *= Math.pow(.9, dt);
    sagT = clamp(sp * .7, 0, 34) + (hover ? 8 : 0);
    st.sagV += (sagT - st.sag) * .06 * dt; st.sagV *= Math.pow(.84, dt); st.sag += st.sagV * dt;
    const prevSh = st.sh;
    st.shV += (shT - st.sh) * .05 * dt; st.shV *= Math.pow(.85, dt); st.sh += st.shV * dt;
    st.swingV += (-st.swing * .08 - (st.sh - prevSh) * .35) * dt; st.swingV *= Math.pow(.9, dt); st.swing = clamp(st.swing + st.swingV * dt, -28, 28);
    st.kick *= Math.pow(.94, dt);
    const speed = 36 + sp * 9 + st.kick;              /* px per detik */
    st.off += speed * dt / 60;
    draw();
    raf = live ? requestAnimationFrame(step) : 0;
  }
  const start = () => { if (!raf && live) { last = performance.now(); raf = requestAnimationFrame(step); } };

  /* ── Masuk layar: tarik pita keluar ── */
  let played = false;
  function unroll() {
    if (played) return; played = true;
    if (!M.motionOn() || !window.gsap) { st.p = 1; draw(); return; }
    const o = { p: 0 }, off0 = st.off;
    gsap.to(o, { p: 1, duration: 2.1, ease: 'power3.out', onUpdate: () => { st.p = o.p; st.off = off0 + o.p * 760; if (!raf) draw(); } });
  }

  /* ── Input ── */
  addEventListener('scroll', () => { const y = scrollY; st.vel = clamp(st.vel + (y - lastY) * .35, -80, 80); lastY = y; }, { passive: true });
  if (matchMedia('(pointer: fine)').matches) {
    addEventListener('pointermove', e => {
      const r = host.getBoundingClientRect();
      if (e.clientY > r.top - 30 && e.clientY < r.bottom + 70) shT = clamp((e.clientX - S.w / 2) * .55, -S.w * .2, S.w * .2); else shT = 0;
    }, { passive: true });
  }
  roll.style.cursor = 'pointer'; roll.style.pointerEvents = 'auto';
  roll.addEventListener('pointerenter', () => hover = true);
  roll.addEventListener('pointerleave', () => hover = false);
  roll.addEventListener('click', () => { st.kick += 900; st.swingV += 5; });

  /* ── Siklus hidup ── */
  const apply = () => {
    live = M.motionOn() && inView;
    if (!M.motionOn()) { shT = 0; Object.assign(st, { sag: 0, sagV: 0, sh: 0, shV: 0, swing: 0, swingV: 0, kick: 0, p: played ? 1 : st.p }); draw(); }
    live ? start() : (cancelAnimationFrame(raf), raf = 0);
  };
  let inView = false;
  new IntersectionObserver(([en]) => {
    inView = en.isIntersecting; if (inView) unroll(); apply();
  }, { rootMargin: '120px', threshold: .01 }).observe(host);
  document.addEventListener('motionchange', () => { if (!M.motionOn() && !played) { played = true; st.p = 1; } apply(); });
  new ResizeObserver(layout).observe(host);
  (document.fonts?.ready || Promise.resolve()).then(layout);
  layout();
  if (!M.motionOn()) { played = true; st.p = 1; draw(); }
})();
