/* Lengkung pembatas atas & bawah section Menu.
   Tiga lapis gelombang bertingkat yang warnanya berpindah halus dari section sebelah ke warna peach Menu,
   digambar ulang tiap frame: bergeser pelan, membengkak saat scroll kencang, dan menggembung ke arah kursor. */
(() => {
  const M = window.MOM, els = [...document.querySelectorAll('.mn-edge')];
  if (!M || !els.length) return;
  const NS = 'http://www.w3.org/2000/svg', VW = 1440, VH = 220, N = 96, TAU = Math.PI * 2;
  const mk = (n, a = {}, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); p && p.appendChild(e); return e; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const CFG = {
    /* atas: cream (about) → peach terang → peach Menu */
    top:    { colors: ['#fff6df', '#ffb6a2', '#f93517'], base: [.30, .52, .70], amp: [.075, .065, .055], dir: 1,  dot: 'rgba(248,49,7,.42)', bubbles: ['#ffd94a', '#fff6df', '#ffffff'] },
    /* bawah: peach Menu → krem emas → emas terang → emas (warna section Kemasan) */
    bottom: { colors: ['#ff7a5a', '#e0300f', '#d11e06'], base: [.24, .45, .68], amp: [.07, .06, .055], dir: -1, dot: 'rgba(254,50,8,.5)', bubbles: ['#ffd94a', '#ffffff', '#ff8a5c'] }
  };
  const K1 = [1, 2, 1], K2 = [3, 4, 3], PH1 = [0, 1.7, 3.1], PH2 = [2.2, .6, 4.4], S1 = [.35, -.5, .7], S2 = [.6, .8, -.9];

  const edges = els.map(el => {
    const cfg = CFG[el.dataset.edge] || CFG.top;
    const svg = mk('svg', { viewBox: `0 0 ${VW} ${VH}`, preserveAspectRatio: 'none', focusable: 'false' }, el);
    const lay = cfg.colors.map((c, i) => {
      const g = mk('g', { class: 'mn-lay', style: `transition-delay:${i * 140}ms` }, svg);
      return { g, path: mk('path', { fill: c }, g) };
    });
    const dot = mk('path', { fill: 'none', stroke: cfg.dot, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-dasharray': '2 11', 'vector-effect': 'non-scaling-stroke' }, lay[1].g);
    /* gelembung melayang */
    const holder = document.createElement('div'); holder.className = 'mn-bubs'; el.appendChild(holder);
    const defs = [[8, 22, 0], [16, 60, 1], [10, 78, 2], [24, 38, 1], [7, 92, 0], [13, 14, 2]];
    defs.forEach(([s, x, k], i) => {
      const b = document.createElement('i'); b.className = 'mn-bub mn-bub--' + k;
      b.style.cssText = `--s:${s}px;left:${x}%;--c:${cfg.bubbles[k]};animation-duration:${6 + i * 1.3}s;animation-delay:${-i * 1.7}s`;
      holder.appendChild(b);
    });
    return { el, cfg, lay, dot, svg, vis: false, bump: 0, px: VW / 2 };
  });

  const st = { vel: 0, swell: 0, sV: 0 };
  let t = 0, last = 0, raf = 0, lastY = scrollY, mx = -1e4, my = -1e4;

  const wy = (e, i, x, T, swell, bump, px) => {
    const c = e.cfg, a = x / VW * TAU;
    const w = Math.sin(a * K1[i] + PH1[i] + T * S1[i] * c.dir) + .5 * Math.sin(a * K2[i] + PH2[i] + T * S2[i] * c.dir);
    const gx = (x - px) / 130, g = bump * Math.exp(-gx * gx) * (1 - i * .28);
    return (c.base[i] + c.amp[i] * w * (1 + swell * (.6 + i * .25))) * VH - g * 34;
  };

  function paint(e, T) {
    e.lay.forEach((l, i) => {
      let d = '';
      for (let j = 0; j <= N; j++) { const x = j * VW / N; d += (j ? 'L' : 'M') + x.toFixed(1) + ' ' + wy(e, i, x, T, st.swell, e.bump, e.px).toFixed(1); }
      l.path.setAttribute('d', d + `L${VW} ${VH + 8}L0 ${VH + 8}Z`);
      if (i === 1) {
        let dd = '';
        for (let j = 0; j <= N; j++) { const x = j * VW / N; dd += (j ? 'L' : 'M') + x.toFixed(1) + ' ' + (wy(e, i, x, T, st.swell, e.bump, e.px) - 16).toFixed(1); }
        e.dot.setAttribute('d', dd);
      }
    });
    e.dot.setAttribute('stroke-dashoffset', (-T * 14 * e.cfg.dir).toFixed(1));
  }

  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000 || .016); last = now; t += dt;
    st.vel *= Math.pow(.9, dt * 60);
    const target = clamp(Math.abs(st.vel) / 45, 0, 1.1);
    st.sV += (target - st.swell) * .08; st.sV *= .85; st.swell += st.sV;
    let any = false;
    edges.forEach(e => {
      if (!e.vis) return; any = true;
      const r = e.el.getBoundingClientRect();
      const near = my > r.top - 60 && my < r.bottom + 60 && matchMedia('(pointer: fine)').matches;
      e.bump += ((near ? 1 : 0) - e.bump) * .08;
      if (near) e.px = clamp((mx - r.left) / r.width * VW, 0, VW);
      paint(e, t);
    });
    raf = any && M.motionOn() ? requestAnimationFrame(frame) : 0;
  }
  const LITE = matchMedia('(pointer: coarse)').matches || innerWidth < 900;
  const run = () => { if (!raf && !LITE && M.motionOn()) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  const io = new IntersectionObserver(list => {
    list.forEach(en => { const e = edges.find(x => x.el === en.target); e.vis = en.isIntersecting; if (en.isIntersecting) e.el.classList.add('is-in'); });
    run();
  }, { rootMargin: '160px' });
  edges.forEach(e => { paint(e, 1.4); io.observe(e.el); });

  addEventListener('scroll', () => { const y = scrollY; st.vel = clamp(st.vel + (y - lastY) * .3, -90, 90); lastY = y; }, { passive: true });
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
  document.addEventListener('motionchange', () => { if (M.motionOn()) run(); else edges.forEach(e => { e.bump = 0; st.swell = 0; paint(e, 1.4); }); });
  if (!M.motionOn()) edges.forEach(e => e.el.classList.add('is-in'));
})();
