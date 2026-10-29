/* Galeri: dinding poster polaroid, lightbox, playlist video, dan animasi GSAP.
   Memakai window.MOM.motionOn() agar ikut tombol "Jeda gerak" dan preferensi kurangi gerak. */
(() => {
  const M=window.MOM,$=s=>document.querySelector(s),folder='assets/promotion/';
  const wall=$('#posterGallery'),dialog=$('#posterDialog');
  if(!wall||!dialog)return;
  const video=$('#promoVideo');

  /* ---------- Data poster (urutan di dinding) ---------- */
  const posters=[
    {src:'WhatsApp Image 2026-10-25 at 02.31.46.webp',alt:'Poster Cemilan Dapur Mom’s 4G: keripik udang, kribo keju, dan keripik bawang',tag:'Tiga rasa',title:'Teman ngemil paling pas',w:720,h:992,r:-4.5,mt:6,tape:-6},
    {src:'WhatsApp Image 2026-10-25 at 02.31.47.webp',alt:'Poster Keripik Udang',tag:'Keripik Udang',title:'Sekali kriuk, lanjut lagi',w:899,h:1599,r:3,mt:-18,tape:5},
    {src:'WhatsApp Image 2026-10-25 at 02.31.46 (1).webp',alt:'Poster Keju Goreng Kribo',tag:'Keju Goreng Kribo',title:'Keriting, gurih, keju banget',w:1024,h:1280,r:-2,mt:54,tape:-3,grow:1.12},
    {src:'WhatsApp Image 2026-10-25 at 02.37.55 (1).webp',alt:'Poster Keripik Bawang',tag:'Keripik Bawang',title:'Gurih bawang, bikin nagih',w:1122,h:1402,r:4,mt:8,tape:6},
    {src:'WhatsApp Image 2026-10-25 at 02.37.55.webp',alt:'Poster Kribo gurih penuh keju',tag:'Kribo Keju',title:'Penuh rasa keju',w:1122,h:1402,r:-3.5,mt:46,tape:-5}
  ];
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  /* ---------- Bangun dinding ---------- */
  wall.innerHTML=`<svg class="gl-path" viewBox="0 0 1200 520" preserveAspectRatio="none" aria-hidden="true"><defs><mask id="glMask" maskUnits="userSpaceOnUse" x="-60" y="-60" width="1320" height="640"><path class="reveal" pathLength="1" d="M-30 120 C 110 20, 200 330, 330 250 S 470 40, 600 190 S 770 420, 900 250 S 1070 70, 1240 190"/></mask></defs><path class="dash" mask="url(#glMask)" d="M-30 120 C 110 20, 200 330, 330 250 S 470 40, 600 190 S 770 420, 900 250 S 1070 70, 1240 190"/></svg>`+
    posters.map((p,i)=>`<div class="gl-card" data-i="${i}" style="--r:${p.r}deg;--mt:${p.mt}px;--tape:${p.tape}deg;--grow:${p.grow||1}"><span class="gl-par"><button type="button" class="gl-btn" data-poster="${i}" aria-label="Perbesar ${esc(p.alt)}"><span class="gl-paper"><span class="gl-tape" aria-hidden="true"></span><span class="gl-frame"><img src="${folder+p.src}" alt="${esc(p.alt)}" width="${p.w}" height="${p.h}" loading="lazy" decoding="async"><span class="gl-shine" aria-hidden="true"></span></span><span class="gl-cap"><span><small>${String(i+1).padStart(2,'0')} · ${esc(p.tag.toUpperCase())}</small><b>${esc(p.title)}</b></span><i aria-hidden="true">↗</i></span></span></button></span></div>`).join('')+
    `<span class="gl-sticker" style="left:1%;top:6px;--s:40px;--c:var(--yellow)" aria-hidden="true">✳</span><span class="gl-sticker" style="right:2%;bottom:34px;--s:46px;--c:var(--red)" aria-hidden="true">♡</span><span class="gl-sticker" style="left:47%;bottom:6px;--s:30px;--c:var(--cream)" aria-hidden="true">✳</span>`;

  /* Pita nama rasa */
  const track=$('.gl-ribbon-track');
  if(track)track.innerHTML=Array.from({length:10},()=>'<span>KRIBO <em>✳</em> BAWANG <em>✳</em> UDANG <em>✳</em> KRIUK TERUS <em>♡</em></span>').join('');

  /* ---------- Lightbox ---------- */
  dialog.className='poster-dialog gl-lb';
  dialog.innerHTML=`<button type="button" class="dialog-close" aria-label="Tutup poster">×</button><div class="gl-lb-body"><button type="button" class="gl-nav prev" aria-label="Poster sebelumnya">←</button><figure><div class="gl-lb-paper"><img id="largePoster" alt=""><b id="lbTitle"></b></div><figcaption><span id="lbCount"></span><a class="gl-lb-cta" href="#kemasan">Pilih kemasannya ↗</a></figcaption></figure><button type="button" class="gl-nav next" aria-label="Poster berikutnya">→</button></div>`;
  const img=$('#largePoster'),lbTitle=$('#lbTitle'),lbCount=$('#lbCount'),paper=dialog.querySelector('.gl-lb-paper');
  let cur=0,openerCard=null;
  const animated=()=>Boolean(window.gsap)&&M.motionOn();
  function fill(i){
    const p=posters[i];img.src=folder+p.src;img.alt=p.alt;lbTitle.textContent=p.title;lbCount.textContent=`${String(i+1).padStart(2,'0')} / ${String(posters.length).padStart(2,'0')} · ${p.tag.toUpperCase()}`;
    [i-1,i+1].map(n=>(n+posters.length)%posters.length).forEach(n=>{const pre=new Image();pre.src=folder+posters[n].src;});
  }
  function go(dir){
    cur=(cur+dir+posters.length)%posters.length;
    if(!animated()){fill(cur);return;}
    gsap.timeline().to(paper,{x:-dir*70,opacity:0,rotate:-dir*4,duration:.22,ease:'power2.in',onComplete:()=>fill(cur)})
      .fromTo(paper,{x:dir*70,rotate:dir*4},{x:0,opacity:1,rotate:-1.2,duration:.5,ease:'back.out(1.6)'});
  }
  function openAt(i,card){
    cur=i;openerCard=card;fill(i);video?.pause();
    dialog.showModal();M.lenis?.stop();
    if(animated()){
      const r=card?.getBoundingClientRect(),pr=paper.getBoundingClientRect();
      const dx=r?(r.left+r.width/2)-(pr.left+pr.width/2):0,dy=r?(r.top+r.height/2)-(pr.top+pr.height/2):40;
      gsap.fromTo(paper,{x:dx,y:dy,scale:.35,rotate:posters[i].r*2,opacity:0},{x:0,y:0,scale:1,rotate:-1.2,opacity:1,duration:.7,ease:'power4.out'});
      gsap.from(dialog.querySelectorAll('figcaption,.gl-nav,.dialog-close'),{opacity:0,y:16,duration:.5,delay:.25,stagger:.05,ease:'power2.out',clearProps:'all'});
    }
  }
  function closeBox(){
    if(!dialog.open)return;
    if(!animated()){dialog.close();return;}
    gsap.to(paper,{y:50,scale:.85,opacity:0,rotate:3,duration:.28,ease:'power2.in',onComplete:()=>{dialog.close();gsap.set(paper,{clearProps:'all'});}});
  }
  wall.addEventListener('click',e=>{const b=e.target.closest('[data-poster]');if(b)openAt(Number(b.dataset.poster),b.closest('.gl-card'));});
  dialog.querySelector('.dialog-close').addEventListener('click',closeBox);
  dialog.querySelector('.prev').addEventListener('click',()=>go(-1));
  dialog.querySelector('.next').addEventListener('click',()=>go(1));
  dialog.addEventListener('click',e=>{if(e.target===dialog||e.target.classList.contains('gl-lb-body'))closeBox();});
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')go(-1);if(e.key==='ArrowRight')go(1);});
  dialog.addEventListener('close',()=>{M.lenis?.start();openerCard?.querySelector('.gl-btn')?.focus({preventScroll:true});});
  dialog.querySelector('.gl-lb-cta').addEventListener('click',()=>dialog.close());
  let sx=null;
  dialog.querySelector('figure').addEventListener('pointerdown',e=>{sx=e.clientX;});
  dialog.querySelector('figure').addEventListener('pointerup',e=>{if(sx===null)return;const dx=e.clientX-sx;sx=null;if(Math.abs(dx)>55)go(dx<0?1:-1);});

  /* ---------- Iklan video: autoplay saat terlihat, playlist, suara ---------- */
  const ad=$('#glAd'),frame=$('#glFrame'),bar=frame?.querySelector('.gl-ad-bar');
  /* Gelombang pembatas: 4 lapis di luar panel, warna bertahap dari peach (section) ke gelap (panel).
     Sinus periodik supaya putarannya mulus; lapisan terjauh digambar dulu. */
  (function waves(){
    const W=2880,H=160;
    const build=dark=>{
      const layers=[
        {b:32,a:14,k:1,p:.4,fill:dark},
        {b:58,a:18,k:1,p:2.1,fill:'#8f553a'},
        {b:86,a:20,k:2,p:1.0,fill:'#d68a5d'},
        {b:114,a:15,k:1,p:3.9,fill:'#ecab84'}
      ];
      const curve=l=>{let d='';for(let x=0;x<=W;x+=24){const y=l.b+l.a*Math.sin(2*Math.PI*l.k*x/(W/2)+l.p);d+=(x?'L':'M')+x+' '+y.toFixed(1);}return d;};
      return layers.map((l,i)=>{const c=curve(l);return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" focusable="false"><path d="${c}L${W} 0L0 0Z" fill="${l.fill}"/>${i===3?`<path d="${c}" fill="none" stroke="#fff6df" stroke-opacity=".7" stroke-width="2.5" vector-effect="non-scaling-stroke"/>`:''}</svg>`;}).reverse().join('');
    };
    const top=document.querySelector('.gl-wave-top'),bot=document.querySelector('.gl-wave-bot');
    if(top)top.innerHTML=build('#3a2a1f');
    if(bot)bot.innerHTML=build('#24170f');
  })();
  const vids=[
    {src:'WhatsApp Video 2026-10-25 at 02.31.47.mp4',poster:'WhatsApp Image 2026-10-25 at 02.31.46.webp',title:'Tiga rasa, satu cerita'},
    {src:'WhatsApp Video 2026-10-25 at 02.31.46.mp4',poster:'WhatsApp Image 2026-10-25 at 02.37.55.webp',title:'Lebih dekat dengan Kribo'},
    {src:'WhatsApp Video 2026-10-25 at 02.31.47 (1).mp4',poster:'WhatsApp Image 2026-10-25 at 02.37.55 (1).webp',title:'Renyahnya untuk bersama'}
  ];
  const choices=[...document.querySelectorAll('.gl-chip[data-video]')];
  const title=$('#cineTitle'),badge=$('#glBadge'),hint=$('#glSoundHint'),sndBtn=$('#glSound'),plTrack=$('#glTrack');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let idx=0,userPaused=false,visible=false;
  /* penyorot kuning meluncur ke kartu aktif (posisi dihitung ulang saat ukuran berubah) */
  let hi=null;
  if(plTrack&&choices.length){hi=document.createElement('i');hi.className='gl-chip-hi';hi.setAttribute('aria-hidden','true');plTrack.prepend(hi);plTrack.classList.add('has-hi');}
  function placeHi(animate){
    if(!hi)return;const c=choices[idx];if(!c||!c.offsetWidth)return;
    if(!animate)hi.style.transition='none';
    hi.style.width=c.offsetWidth+'px';hi.style.height=c.offsetHeight+'px';hi.style.transform=`translate(${c.offsetLeft}px,${c.offsetTop}px)`;
    if(!animate){void hi.offsetWidth;hi.style.transition='';}
  }
  if(plTrack&&window.ResizeObserver)new ResizeObserver(()=>placeHi(false)).observe(plTrack);
  addEventListener('load',()=>placeHi(false));document.fonts?.ready.then(()=>placeHi(false));
  if(video){video.controls=false;video.muted=true;}
  const setSoundUI=()=>{const on=!video.muted;ad.classList.toggle('is-sound',on);sndBtn.setAttribute('aria-pressed',on);sndBtn.setAttribute('aria-label',on?'Matikan suara':'Nyalakan suara');hint.textContent=on?'Suara nyala':'Suara mati · ketuk 🔊';};
  const tryPlay=()=>{const r=video.play();if(r&&r.catch)r.catch(()=>{ad.classList.remove('is-playing');});};
  function load(i,{auto=true}={}){
    idx=(i+vids.length)%vids.length;const v=vids[idx];
    choices.forEach((c,n)=>{c.classList.toggle('active',n===idx);c.setAttribute('aria-pressed',n===idx);c.style.setProperty('--p',0);});
    title.textContent=v.title;badge.textContent=`${idx+1}/${vids.length}`;frame.style.setProperty('--bar',0);
    video.pause();video.poster=folder+v.poster;video.src=folder+v.src;video.load();
    if(animated()){
      gsap.fromTo(frame,{clipPath:'inset(0 100% 0 0 round 24px)'},{clipPath:'inset(0 0% 0 0 round 24px)',duration:.7,ease:'power3.out',clearProps:'clipPath'});
      gsap.fromTo(title,{y:16,opacity:0},{y:0,opacity:1,duration:.5,ease:'power3.out'});
      gsap.fromTo(badge,{scale:.5,rotate:-40},{scale:1,rotate:0,duration:.6,ease:'back.out(2.4)'});
    }
    placeHi(true);
    if(auto&&visible)tryPlay();
  }
  choices.forEach((c,n)=>c.addEventListener('click',()=>{userPaused=false;visible=true;load(n);}));
  const step=d=>{userPaused=false;load(idx+d);};
  $('#glTap').addEventListener('click',()=>{if(video.paused){userPaused=false;tryPlay();}else{userPaused=true;video.pause();}});
  sndBtn.addEventListener('click',()=>{video.muted=!video.muted;if(!video.muted&&video.volume===0)video.volume=1;setSoundUI();if(video.paused&&!userPaused)tryPlay();});
  $('#glFs')?.addEventListener('click',()=>{
    if(document.fullscreenElement){document.exitFullscreen();return;}
    if(frame.requestFullscreen)frame.requestFullscreen().catch(()=>{});else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();
  });
  video.addEventListener('play',()=>ad.classList.add('is-playing'));
  video.addEventListener('playing',()=>ad.classList.add('is-playing'));
  video.addEventListener('pause',()=>ad.classList.remove('is-playing'));
  video.addEventListener('ended',()=>{ad.classList.remove('is-playing');setTimeout(()=>{if(visible&&!userPaused)step(1);},400);});
  video.addEventListener('timeupdate',()=>{if(!video.duration)return;const p=(video.currentTime/video.duration*100).toFixed(1);choices[idx].style.setProperty('--p',p);frame.style.setProperty('--bar',p);});
  frame.addEventListener('click',e=>{if(e.target===video)$('#glTap').click();});
  /* putar otomatis ketika iklan terlihat, jeda ketika keluar layar atau tab disembunyikan */
  new IntersectionObserver(([en])=>{
    visible=en.isIntersecting;
    if(visible){if(!userPaused&&!reduce.matches)tryPlay();}else video.pause();
  },{threshold:.4}).observe(ad);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(visible&&!userPaused&&!reduce.matches)tryPlay();});
  setSoundUI();placeHi(false);
  /* judul selalu muat di lebar layar, walau font cadangan lebih lebar */
  const ttl=$('.gl-ad-title');
  function fitTitle(){
    if(!ttl)return;ttl.style.fontSize='';
    const box=ttl.parentElement.clientWidth-(innerWidth<=900?36:0),w=Math.max(...[...ttl.querySelectorAll('.ln>span')].map(s=>{const r=document.createRange();r.selectNodeContents(s);return r.getBoundingClientRect().width;}));
    if(w>box&&w>0)ttl.style.fontSize=(parseFloat(getComputedStyle(ttl).fontSize)*box/w*.98).toFixed(1)+'px';
  }
  fitTitle();addEventListener('resize',fitTitle);document.fonts?.ready.then(fitTitle);

  /* ---------- Animasi GSAP (ikut tombol Jeda gerak) ---------- */
  let ctx=null,off=[];
  const fine=matchMedia('(pointer: fine)');
  function teardown(){off.forEach(f=>f());off=[];ctx?.revert();ctx=null;ad?.classList.remove('is-intro');}
  function setup(){
    teardown();
    if(!window.gsap||!M.motionOn())return;
    const hasST=Boolean(window.ScrollTrigger);
    const on=(el,t,fn,o)=>{el.addEventListener(t,fn,o);off.push(()=>el.removeEventListener(t,fn,o));};
    ctx=gsap.context(()=>{
      const cards=gsap.utils.toArray('.gl-card',wall);
      const base=cards.map(c=>posters[+c.dataset.i].r*(innerWidth<=800?.6:1));

      /* 1. Poster jatuh seperti ditempel, satu per satu */
      const intro=gsap.timeline({paused:!hasST,scrollTrigger:hasST?{trigger:wall,start:'top 80%',once:true}:undefined});
      intro.from(cards,{y:-170,opacity:0,scale:.8,rotation:i=>base[i]+(i%2?20:-20),duration:1.15,ease:'back.out(1.4)',stagger:.15})
           .from(wall.querySelectorAll('.gl-tape'),{scaleX:0,duration:.35,ease:'power2.out',stagger:.12},.55)
           .from(wall.querySelectorAll('.gl-sticker'),{scale:0,rotation:-90,duration:.7,ease:'back.out(2.4)',stagger:.12},.9);
      if(!hasST)intro.play();

      if(hasST){
        /* 2. Garis putus-putus tergambar mengikuti scroll */
        gsap.fromTo(wall.querySelector('.gl-path .reveal'),{strokeDashoffset:1},{strokeDashoffset:0,ease:'none',scrollTrigger:{trigger:wall,start:'top 70%',end:'bottom 60%',scrub:.7}});
        /* 3. Parallax: tiap poster bergeser dengan kecepatan berbeda */
        if(innerWidth>800)cards.forEach((c,i)=>gsap.fromTo(c.querySelector('.gl-par'),{y:[-34,26,-48,30,-26][i%5]},{y:[34,-26,48,-30,26][i%5],ease:'none',scrollTrigger:{trigger:wall,start:'top bottom',end:'bottom top',scrub:.9}}));
        /* 4. Pita bergeser saat scroll */
        gsap.fromTo('.gl-ribbon-track',{xPercent:0},{xPercent:-42,ease:'none',scrollTrigger:{trigger:'.gl-ribbon',start:'top bottom',end:'bottom top',scrub:.8}});
        gsap.from('.gl-head',{y:30,opacity:0,duration:.8,ease:'power3.out',stagger:0,scrollTrigger:{trigger:'.gl-head',start:'top 92%',once:true}});
      }

      /* 6. Stiker melayang pelan */
      wall.querySelectorAll('.gl-sticker').forEach((s,i)=>gsap.to(s,{y:i%2?10:-10,rotation:i%2?12:-12,duration:2.4+i*.4,ease:'sine.inOut',yoyo:true,repeat:-1}));

      /* 6b. Iklan video: masuk bertahap + parallax + kemiringan 3D mengikuti kursor */
      if(ad){
        const lines=ad.querySelectorAll('.gl-ad-title .ln>span'),stk=ad.querySelector('.gl-ad-sticker'),dock=ad.querySelector('.gl-ad-dock'),pieces=ad.querySelectorAll('.gl-ad-piece');
        ad.classList.add('is-intro');
        const tl=gsap.timeline({paused:!hasST,scrollTrigger:hasST?{trigger:ad,start:'top 72%',once:true}:undefined,onComplete:()=>ad.classList.remove('is-intro')});
        tl.from('.gl-ad-bg',{scale:1.3,opacity:.2,duration:1.8,ease:'power3.out'})
          .from('.gl-ad-player',{y:90,rotation:-4,opacity:0,scale:.9,duration:1.1,ease:'power3.out'},.15)
          .from(frame,{clipPath:'inset(100% 0 0 0 round 30px)',duration:1,ease:'power4.out',clearProps:'clipPath'},.2)
          .from(lines,{yPercent:115,duration:.95,ease:'power4.out',stagger:.14},.45)
          .from(stk,{scale:0,rotation:-32,duration:.9,ease:'elastic.out(1,.55)'},.8)
          .from(pieces,{scale:0,opacity:0,duration:1,ease:'back.out(2)',stagger:.12},.7)
          .from([...dock.querySelectorAll('.gl-chip'),dock.querySelector('.gl-ad-pill')],{y:50,opacity:0,duration:.7,ease:'power3.out',stagger:.09,clearProps:'transform,opacity'},1)
          .add(()=>{if(visible&&!userPaused&&!reduce.matches)tryPlay();},.3)
          .add(()=>gsap.to(stk,{rotation:-2,duration:1.8,ease:'sine.inOut',yoyo:true,repeat:-1}));
        if(!hasST)tl.play();
        if(hasST&&innerWidth>800){
          gsap.fromTo('.gl-ad-bg',{yPercent:-7},{yPercent:7,ease:'none',scrollTrigger:{trigger:ad,start:'top bottom',end:'bottom top',scrub:true}});
          pieces.forEach((p,i)=>gsap.fromTo(p,{y:[-40,70,-60][i]},{y:[90,-80,70][i],rotation:'+='+[40,-50,35][i],ease:'none',scrollTrigger:{trigger:ad,start:'top bottom',end:'bottom top',scrub:1.1}}));
        }
        pieces.forEach((p,i)=>gsap.to(p,{xPercent:i%2?-8:8,duration:3+i*.5,ease:'sine.inOut',yoyo:true,repeat:-1}));
        if(fine.matches){
          const pl=$('#glPlayer');
          gsap.set(frame,{transformPerspective:1200});
          const rx=gsap.quickTo(frame,'rotationX',{duration:.7,ease:'power3.out'}),ry=gsap.quickTo(frame,'rotationY',{duration:.7,ease:'power3.out'});
          on(ad,'pointermove',e=>{const r=ad.getBoundingClientRect();ry(((e.clientX-r.left)/r.width-.5)*-9);rx(((e.clientY-r.top)/r.height-.5)*7);});
          on(ad,'pointerleave',()=>{rx(0);ry(0);});
        }
      }

      /* 7. Hover meluruskan poster + tilt 3D mengikuti kursor (perangkat dengan mouse) */
      if(fine.matches){
        cards.forEach((card,i)=>{
          const btn=card.querySelector('.gl-btn');
          gsap.set(btn,{transformPerspective:900});
          const rx=gsap.quickTo(btn,'rotationX',{duration:.5,ease:'power3.out'}),ry=gsap.quickTo(btn,'rotationY',{duration:.5,ease:'power3.out'});
          on(card,'pointerenter',()=>gsap.to(card,{rotation:0,scale:1.07,zIndex:6,duration:.5,ease:'back.out(2)',overwrite:'auto'}));
          on(card,'pointermove',e=>{const r=btn.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;ry((x-.5)*16);rx(-(y-.5)*16);btn.style.setProperty('--mx',x*100+'%');btn.style.setProperty('--my',y*100+'%');btn.querySelector('.gl-shine').style.setProperty('--mx',x*100+'%');btn.querySelector('.gl-shine').style.setProperty('--my',y*100+'%');});
          on(card,'pointerleave',()=>{rx(0);ry(0);gsap.to(card,{rotation:base[i],scale:1,zIndex:1,duration:.6,ease:'elastic.out(1,.6)',overwrite:'auto'});});
        });
      }
    },wall.closest('.gl')||wall);
  }
  document.addEventListener('motionchange',setup);
  setup();
})();
