/* Satu ticker GSAP untuk Lenis; seluruh gerak menghormati preferensi pengguna. */
(() => {
  const M=window.MOM,reduce=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(pointer: fine)'),toggle=document.querySelector('#motionToggle');
  let context=null,ticker=null,listeners=[],ambient=[];
  if(window.gsap&&window.ScrollTrigger)gsap.registerPlugin(ScrollTrigger);
  const listen=(el,type,fn,options)=>{el.addEventListener(type,fn,options);listeners.push(()=>el.removeEventListener(type,fn,options));};
  function cleanup(){listeners.forEach(fn=>fn());listeners=[];ambient=[];context?.revert();context=null;if(ticker&&window.gsap)gsap.ticker.remove(ticker);ticker=null;M.lenis?.destroy();M.lenis=null;}
  /* Judul Tentang dipecah per baris (sekali saja) supaya bisa muncul naik dari balik garis. */
  function splitAboutTitle(){
    const h=document.querySelector('.about-copy h2');if(!h||h.dataset.split)return;
    h.dataset.split='1';
    h.innerHTML=h.innerHTML.split(/<br\s*\/?>/i).map(l=>`<span class="ln"><span class="ln-i">${l}</span></span>`).join('');
  }
  function setup(){
    cleanup();const enabled=M.motionOn();
    document.body.classList.toggle('motion-paused',!enabled);toggle.setAttribute('aria-pressed',!enabled);toggle.innerHTML=enabled?'Ⅱ <span>Jeda gerak</span>':'▷ <span>Aktifkan gerak</span>';
    toggle.setAttribute('aria-label',enabled?'Jeda animasi':'Aktifkan animasi');toggle.disabled=reduce.matches;toggle.title=reduce.matches?'Animasi mengikuti pengaturan kurangi gerak perangkat':enabled?'Jeda animasi':'Aktifkan animasi';
    if(!enabled){document.dispatchEvent(new Event('motionchange'));return;}
    if(window.ScrollTrigger)ScrollTrigger.config({ignoreMobileResize:true});
    if(window.Lenis&&fine.matches&&innerWidth>=900){
      /* Lenis aktif di semua perangkat. Di layar sentuh, syncTouch menghaluskan scroll jari supaya tidak kaku. */
      const touch=!fine.matches;
      M.lenis=new Lenis({duration:1.05,smoothWheel:true,syncTouch:false,anchors:false});
      if(window.ScrollTrigger)M.lenis.on('scroll',ScrollTrigger.update);
      ticker=time=>M.lenis?.raf(time*1000);gsap.ticker.add(ticker);gsap.ticker.lagSmoothing(0);
    }
    context=gsap.context(()=>{
      // Reveal hanya dijalankan pada elemen di bawah viewport; konten tetap terbaca jika JS gagal.
      if(window.ScrollTrigger){
        /* Section Tentang: satu timeline berurutan (eyebrow, judul per baris, paragraf, chip, tombol, fakta). */
        const aboutCopy=document.querySelector('.about-copy');
        if(aboutCopy){
          splitAboutTitle();
          const q=s=>aboutCopy.querySelectorAll(s);
          gsap.timeline({defaults:{ease:'power3.out'},scrollTrigger:{trigger:aboutCopy,start:'top 85%',once:true}})
            .from(q('.eyebrow'),{y:16,opacity:0,duration:.8},0)
            .from(q('h2 .ln-i'),{yPercent:118,rotate:2.5,transformOrigin:'0% 100%',duration:1.15,stagger:.12,ease:'power4.out'},.1)
            .from(q('h2 ~ p'),{y:28,opacity:0,duration:1,stagger:.14,ease:'power2.out'},.45)
            .from(q('.chip'),{y:16,opacity:0,scale:.88,duration:.8,stagger:.07,ease:'back.out(1.6)'},.75)
            .from(q('.about-cta'),{y:26,opacity:0,scale:.97,duration:.95,ease:'power3.out'},.95)
            .from(q('.about-facts'),{opacity:0,duration:.9,ease:'power1.out'},1.1);
        }
        document.querySelectorAll('[data-reveal]').forEach(el=>{
          if(el.closest('.about-copy'))return;
          if(getComputedStyle(el).display==='contents'||el.getBoundingClientRect().top<innerHeight*.95)return;
          gsap.from(el,{y:35,opacity:0,duration:.8,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 94%',once:true}});
        });
                        if(!M.lite)gsap.to('.footer-word',{xPercent:-5,ease:'none',scrollTrigger:{trigger:'.footer',start:'top bottom',end:'bottom bottom',scrub:1}});
      }
      const floatTargets=M.lite?[]:document.querySelectorAll('.scene-orb,.float-piece,.hero-halo,.hero-seal');
      floatTargets.forEach((el,i)=>{
        const tween=gsap.to(el,{y:i%2?18:-18,rotation:`+=${i%2?4:-4}`,duration:4+i*.3,ease:'sine.inOut',yoyo:true,repeat:-1});ambient.push(tween);
        if(window.ScrollTrigger)ScrollTrigger.create({trigger:el.closest('.scene'),start:'top bottom',end:'bottom top',onToggle:self=>self.isActive&&!document.hidden?tween.play():tween.pause()});
      });
      if(fine.matches){
        document.querySelectorAll('.scene').forEach(scene=>{
          const targets=[...scene.querySelectorAll('.hero-piece,.scene-orb,.section-piece')];if(!targets.length)return;
          const movers=targets.map((el,i)=>({x:gsap.quickTo(el,'x',{duration:1,ease:'power3.out'}),y:gsap.quickTo(el,'y',{duration:1,ease:'power3.out'}),amount:(i+1)*7}));
          listen(scene,'pointermove',e=>{const r=scene.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;movers.forEach(m=>{m.x(x*m.amount*2);m.y(y*m.amount*2);});},{passive:true});
          listen(scene,'pointerleave',()=>movers.forEach(m=>{m.x(0);m.y(0);}));
        });
      }
    });
    if(window.ScrollTrigger)ScrollTrigger.refresh();
    document.dispatchEvent(new Event('motionchange'));
  }
  toggle.addEventListener('click',()=>{M.paused=!M.paused;setup();});reduce.addEventListener('change',setup);fine.addEventListener('change',setup);
  document.addEventListener('visibilitychange',()=>{ambient.forEach(t=>document.hidden?t.pause():t.play());document.body.classList.toggle('motion-paused',document.hidden||!M.motionOn());});
  window.addEventListener('pagehide',cleanup);
  window.addEventListener('pageshow',e=>{if(e.persisted)setup();});
  setup();
})();
