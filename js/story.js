/* Alur scroll hero → tentang: kemasan tengah turun dan mendarat di section Tentang.
   Remah melayang di tiap section. Dijalankan ulang saat mode gerak diubah. */
(() => {
  const M=window.MOM,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const main=$('#main'),trav=$('#traveler'),slotH=$('#heroSlot'),slotA=$('#aboutSlot');
  if(!main||!trav||!slotH||!slotA)return;
  /* Remah di latar section (tidak butuh JS gerak; hanya CSS). */
  const kinds=['keju/keju','bawang/bawang','udang/udang'];
  const layout=[{l:-1.5,t:7,s:92,r0:-18,r1:12},{r:-1,t:46,s:116,r0:20,r1:-10},{l:2,t:84,s:76,r0:-8,r1:24}];
  ['menu','kemasan','promosi','momen','ulasan','pesan','faq'].forEach((id,k)=>{
    const sec=document.getElementById(id)||document.querySelector('.'+id+'-section');if(!sec)return;
    layout.forEach((c,i)=>{
      const im=document.createElement('img');im.className='crumb';im.alt='';im.setAttribute('aria-hidden','true');im.loading='lazy';
      im.src=`assets/pieces/${kinds[(k+i)%3]}${((k*2+i)%6)+1}.webp`;
      im.style.cssText=`${c.l!==undefined?`left:${c.l}%`:`right:${c.r}%`};top:${c.t}%;--s:${c.s}px;--r0:${c.r0}deg;--r1:${c.r1}deg;--t:${8+((k+i)%4)*1.5}s;--d:${-(k+i)*1.3}s`;
      sec.appendChild(im);
    });
  });
  let ctx=null,onInit=null,onRef=null,cardTl=null,cardShown=false;
  const rel=el=>{const r=el.getBoundingClientRect(),m=main.getBoundingClientRect();return{cx:r.left-m.left+r.width/2,cy:r.top-m.top+r.height/2,w:r.width}};
  /* Titik mendarat dihitung dari tata letak (offset), bukan dari getBoundingClientRect,
     supaya card yang sedang miring/membesar saat animasi tidak menggeser tujuan kemasan. */
  const pg=el=>{let x=0,y=0;for(let n=el;n;n=n.offsetParent){x+=n.offsetLeft;y+=n.offsetTop;}return{x,y};};
  const relRest=el=>{const s=pg(el),m=pg(main);return{cx:s.x-m.x,cy:s.y-m.y,w:el.offsetWidth};};
  const size=()=>{trav.style.width=slotH.offsetWidth+'px';trav.style.height=slotH.offsetHeight+'px';};
  /* Sudut akhir kemasan di card (CSS .ig-slot img + putaran card). Harus sama supaya tidak ada lompatan saat 'masuk' ke card. */
  const END_ROT=13.5;
  const lerp=(a,b,t)=>a+(b-a)*t,sm=t=>t*t*(3-2*t);
  function teardown(){
    ctx?.revert();ctx=null;cardTl?.kill();cardTl=null;cardShown=false;
    if(window.ScrollTrigger){if(onInit){ScrollTrigger.removeEventListener('refreshInit',onInit);onInit=null;}if(onRef){ScrollTrigger.removeEventListener('refresh',onRef);onRef=null;}}
    const all=[...pieces,...parts,...sides,card,media,slotImg,'.ig-heart-big','.ig-shock'];gsap.killTweensOf(all);gsap.set(all,{clearProps:'transform,translate,scale,rotation,opacity,visibility,filter'});/* bukan 'all': 'all' ikut menghapus left/top/--s remah */landed=false;
    gsap.set(trav,{clearProps:'all'});trav.hidden=true;trav.classList.remove('settled','docked');document.body.classList.remove('travel-on','about-docked');
  }
  function build(){
    teardown();
    if(!M.motionOn()||!window.ScrollTrigger)return;
    trav.hidden=false;document.body.classList.add('travel-on');
    let A,B;const calc=()=>{A=rel(slotH);B=relRest(slotA);};
    onInit=()=>{size();calc();};ScrollTrigger.addEventListener('refreshInit',onInit);size();calc();
    ctx=gsap.context(()=>{
      /* Titik mendarat: begitu pusat card IG naik ke ±58% tinggi layar, kemasan sudah pas di card. */
      const E=()=>Math.max(300,pg(main).y+B.cy-innerHeight*.58);
      gsap.set(trav,{xPercent:-50,yPercent:-50});
      /* Card IG: keluar seperti kaca yang mengambang, miring lalu menegak dengan pegas (bukan sekadar memudar). */
      cardTl=gsap.timeline({paused:true});
      cardTl.fromTo(card,{opacity:0,y:90,scale:.82,rotation:-9},{opacity:1,y:0,scale:1,rotation:0,duration:1.15,ease:'back.out(1.5)'},0)
            .fromTo(card,{opacity:0},{opacity:1,duration:.45,ease:'power1.out'},0)
            .fromTo(parts,{y:30,opacity:0,scale:.9},{y:0,opacity:1,scale:1,duration:.75,stagger:.08,ease:'back.out(1.9)'},.3);
      /* Kemasan tengah terbang: jalur melengkung, goyang dan berputar bebas, sedikit membesar di tengah jalan. */
      const P={p:0};
      const apply=()=>{
        const p=P.p,s=sm(p),yE=p*.5+s*.5;
        const sway=Math.sin(p*Math.PI*2)*innerWidth*.03;
        const x=lerp(A.cx,B.cx,lerp(p,s,.7))-sway;
        const y=lerp(A.cy,B.cy,yE);
        const scale=lerp(1,B.w/A.w,s)+Math.sin(p*Math.PI)*.09;
        const rotation=lerp(-6,END_ROT,s)-Math.sin(p*Math.PI*2)*13;
        gsap.set(trav,{x,y,scale,rotation});
        trav.classList.toggle('settled',p>.55);
        if(!cardShown&&p>=.6){cardShown=true;cardTl.timeScale(1).play();}
        else if(cardShown&&p<.5){cardShown=false;cardTl.timeScale(1.8).reverse();}
        if(!landed&&p>=.99){landed=true;land();}else if(landed&&p<.93){landed=false;unland();}
      };
      onRef=()=>{calc();apply();};ScrollTrigger.addEventListener('refresh',onRef);
      gsap.timeline({defaults:{ease:'none'},scrollTrigger:{start:0,end:()=>E(),scrub:.7,invalidateOnRefresh:true}}).to(P,{p:1,onUpdate:apply,duration:1},0);
      /* Hero: kemasan samping, kata besar, remah, dan teks menjauh. */
      const out=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom 30%',scrub:.6}});
      out.to('.pack-left',{xPercent:-85,yPercent:28,rotation:-42,opacity:0,ease:'power1.in'},0)
         .to('.pack-right',{xPercent:85,yPercent:28,rotation:42,opacity:0,ease:'power1.in'},0)
         .to('.hero-copy,.hero-picker,.hero-tag',{y:-70,opacity:0},0)
         .to('.hero-seal',{scale:.3,opacity:0},0)
         .to('.hero-spot',{scale:1.5,opacity:0},0)
         .to('.debris',{x:i=>(i%2?1:-1)*(160+i*45),y:i=>-120+i*55,rotation:i=>(i%2?1:-1)*(120+i*30),opacity:0,ease:'power1.in'},0);
      gsap.from('.about-facts span',{y:26,opacity:0,duration:.7,stagger:.12,ease:'power3.out',scrollTrigger:{trigger:'.about-facts',start:'top 92%',once:true}});
      /* Efek mendarat: kemasan mentok di card, komponen pecah ke segala arah. */
      gsap.set('.ig-heart-big',{scale:0,opacity:0});gsap.set(pieces,{opacity:0,scale:.15});gsap.set(sides,{opacity:0});
      landed=false;apply();
    });
    ScrollTrigger.refresh();
  }
  const sides=$$('.ig-side'),pieces=$$('.about-burst .bp'),parts=$$('.ig-head,.ig-actions,.ig-likes,.ig-cap,.ig-view'),card=$('.ig-main'),media=$('.ig-main .ig-media'),slotImg=slotA.querySelector('img');
  let landed=false;
  const mid=el=>{const r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}};
  function land(){
    const c=mid(media);
    /* kemasan 'masuk' ke card: pindah dari lapisan terbang ke dalam card supaya hati putih tampil di atasnya */
    trav.classList.add('docked');document.body.classList.add('about-docked');
    /* kemasan menghentak pelan lalu bergoyang kembali ke sudutnya */
    gsap.fromTo(slotImg,{scale:1.1,rotation:8},{scale:1,rotation:0,duration:1.5,ease:'elastic.out(1,.3)'});
    gsap.fromTo(media,{y:8},{y:0,duration:1.2,ease:'elastic.out(1,.28)'});
    pieces.forEach((p,i)=>{
      const r=p.getBoundingClientRect(),x=+gsap.getProperty(p,'x'),y=+gsap.getProperty(p,'y');
      gsap.killTweensOf(p);
      gsap.fromTo(p,{x:c.x-(r.left+r.width/2-x),y:c.y-(r.top+r.height/2-y),scale:.15,rotation:gsap.utils.random(-220,220),opacity:0},{x:0,y:0,scale:1,rotation:0,opacity:1,duration:gsap.utils.random(1,1.6),ease:'expo.out',delay:i*.012});
    });
    /* Bawang (kiri) dan Udang (kanan) keluar dari balik kemasan tengah, lalu berhenti miring seperti foto produk */
    sides.forEach((el,i)=>{const d=i?-1:1;gsap.killTweensOf(el);gsap.fromTo(el,{xPercent:d*58,yPercent:10,scale:.55,rotation:d*-14,opacity:0},{xPercent:0,yPercent:0,scale:1,rotation:0,opacity:1,duration:1.3,ease:'back.out(1.6)',delay:.25+i*.14});});
    gsap.fromTo('.ig-shock',{scale:.3,opacity:.95},{scale:2.3,opacity:0,duration:1.1,ease:'power2.out',stagger:.16});
    /* hati putih muncul sebentar di atas kemasan, lalu hilang */
    gsap.timeline({delay:.45}).fromTo('.ig-heart-big',{scale:0,opacity:1},{scale:1,duration:.9,ease:'elastic.out(1.1,.45)'}).to('.ig-heart-big',{opacity:0,scale:1.2,duration:.4,delay:.5});
  }
  function unland(){
    const c=mid(media);
    trav.classList.remove('docked');document.body.classList.remove('about-docked');
    gsap.killTweensOf(slotImg);gsap.set(slotImg,{clearProps:'transform,scale,rotation'});
    pieces.forEach(p=>{const r=p.getBoundingClientRect(),x=+gsap.getProperty(p,'x'),y=+gsap.getProperty(p,'y');gsap.killTweensOf(p);gsap.to(p,{x:c.x-(r.left+r.width/2-x),y:c.y-(r.top+r.height/2-y),scale:.15,opacity:0,duration:.4,ease:'power2.in'});});
    sides.forEach((el,i)=>{gsap.killTweensOf(el);gsap.to(el,{xPercent:(i?-1:1)*58,scale:.55,opacity:0,duration:.35,ease:'power2.in'});});
    gsap.killTweensOf('.ig-heart-big');gsap.to('.ig-heart-big',{scale:0,opacity:0,duration:.3});M.igReset?.();
  }
  document.addEventListener('motionchange',build);
  const refresh=()=>{if(window.ScrollTrigger&&ctx)ScrollTrigger.refresh();};
  window.addEventListener('load',refresh);document.fonts?.ready.then(refresh);
  window.addEventListener('pagehide',()=>{if(window.gsap)teardown();});
})();
