/* Hero: tiga produk, ganti rasa mengubah kata besar, warna gradasi, dan teks. */
(() => {
  const M=window.MOM,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const hero=$('.hero'),word=$('.hw-text');let active=0,introDone=false;
  const split=t=>{if(!word)return;t=t.charAt(0)+t.slice(1).toLowerCase();word.innerHTML='<span class="hw-stretch">'+[...t].map((c,i)=>`<span class="ch" style="--i:${i}">${c}</span>`).join('')+'</span>';fit();};
  /* Kata besar dipas selebar hero supaya selalu terbaca, seperti referensi. */
  function fit(){
    if(!word)return;
    word.style.fontSize='100px';const w=word.offsetWidth||1;
    const size=Math.min(100*hero.clientWidth*.97/w,hero.clientHeight*(innerWidth>800?.45:.43),600);
    word.style.fontSize=size+'px';
  }
  if(word)split(M.products[0].word);
  /* Hentikan animasi latar saat hero tidak terlihat (mobile), supaya scroll tetap ringan. */
  if('IntersectionObserver' in window)new IntersectionObserver(([e])=>hero.classList.toggle('bg-off',!e.isIntersecting),{rootMargin:'80px'}).observe(hero);
  let fitT;addEventListener('resize',()=>{clearTimeout(fitT);fitT=setTimeout(fit,120);});
  document.fonts?.ready.then(fit);addEventListener('load',fit);
  $('#heroChoices').innerHTML=M.products.map((p,i)=>`<button class="hero-choice ${i===0?'active':''}" data-hero="${i}" aria-pressed="${i===0}" aria-label="Lihat ${p.name}"><img src="${p.image}" alt="" width="48" height="61"><span>${p.short}</span><span class="lbl-full">${p.name}</span></button>`).join('');
  /* ── Tiga slot kemasan: tengah = varian terpilih. Klik varian → kemasan terpilih "geser masuk" ke tengah,
        kemasan sebelumnya keluar halus ke sisi tempat varian baru berasal (hanya transform + opacity). ── */
  const trav=$('#traveler'),byId=id=>M.products.find(p=>p.id===id);
  const slotEl={left:$('.pack-left'),center:$('#heroSlot'),right:$('.pack-right')};
  const slots={left:slotEl.left.dataset.flavor,center:slotEl.center.dataset.flavor,right:slotEl.right.dataset.flavor};
  const slotOf=id=>Object.keys(slots).find(k=>slots[k]===id);
  const peOf=k=>slotEl[k].querySelector('.pack-e'),imgOf=k=>slotEl[k].querySelector('img');
  const setImg=(img,p)=>{if(!img)return;if(img.getAttribute('src')!==p.image)img.setAttribute('src',p.image);if(img.hasAttribute('alt')&&img.getAttribute('alt')!=='')img.setAttribute('alt',p.name);};
  function applySlots(){
    Object.keys(slots).forEach(k=>{const p=byId(slots[k]);slotEl[k].dataset.flavor=p.id;setImg(imgOf(k),p);slotEl[k].classList.toggle('is-active',k==='center');});
    const c=byId(slots.center);
    if(trav){trav.dataset.flavor=c.id;setImg(trav.querySelector('img'),c);if(trav.querySelector('img'))trav.querySelector('img').alt='';}
    /* kartu IG di Tentang ikut urutan yang sama, supaya kemasan yang "mendarat" cocok dengan yang dipilih */
    setImg($('#aboutSlot img'),c);setImg($('.ig-side-l img'),byId(slots.left));setImg($('.ig-side-r img'),byId(slots.right));
  }
  const measure=()=>{const o={};Object.keys(slots).forEach(k=>{const r=peOf(k).getBoundingClientRect(),cs=parseFloat(getComputedStyle(imgOf(k)).rotate);o[k]={x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,rot:Number.isFinite(cs)?cs:0};});return o;};
  /* terbang dari pose lama ke pose slot baru; pose akhir = transform CSS slot itu (dibaca GSAP), jadi tidak ada lompatan */
  function glide(pe,from,to,opts){
    const ex=+gsap.getProperty(pe,'x')||0,ey=+gsap.getProperty(pe,'y')||0,es=+gsap.getProperty(pe,'scale')||1;
    let dx=from.x-to.x,dy=from.y-to.y;
    if(opts.local){const th=(+gsap.getProperty(opts.local,'rotation')||0)*Math.PI/180,sc=+gsap.getProperty(opts.local,'scale')||1,c=Math.cos(-th),n=Math.sin(-th);[dx,dy]=[(dx*c-dy*n)/sc,(dx*n+dy*c)/sc];}
    pe.style.transition='none';
    const img=pe.querySelector('img');
    gsap.killTweensOf([pe,img]);
    gsap.fromTo(pe,{x:ex+dx,y:ey+dy,scale:es*from.w/to.w,rotation:from.rot-to.rot},{x:ex,y:ey,scale:es,rotation:0,duration:opts.dur,ease:opts.ease,onComplete(){gsap.set(pe,{clearProps:'transform'});pe.style.transition='';}});
    gsap.fromTo(img,{opacity:opts.o0},{opacity:1,duration:opts.od,ease:'power1.out',clearProps:'opacity'});
  }
  function swapSlots(id,animate){
    if(id===slots.center)return;
    const from=slotOf(id),old=slots.center,rects=animate?measure():null;
    slots[from]=old;slots.center=id;applySlots();
    if(!animate)return;
    /* masuk: dari sisi asal ke tengah (geser + muncul) · keluar: dari tengah ke sisi asal (geser halus) */
    glide(peOf('center'),rects[from],rects.center,{dur:.95,ease:'back.out(1.08)',o0:.2,od:.5});
    if(trav&&!trav.hidden)glide(trav.querySelector('.pack-e'),rects[from],rects.center,{dur:.95,ease:'back.out(1.08)',o0:.2,od:.5,local:trav});
    glide(peOf(from),rects.center,rects[from],{dur:.85,ease:'power3.inOut',o0:.55,od:.5});
  }
  const paint=(index,animate=true)=>{
    active=(index+M.products.length)%M.products.length;const p=M.products[active];
    hero.dataset.flavor=p.id;split(p.word);
    $('#heroName').textContent=p.name;$('.hero-copy h1').innerHTML=p.headline;$('#heroDesc').textContent=p.description;$('#heroPrice').textContent=M.money(p.price);$('#slideNumber').textContent=String(active+1).padStart(2,'0');
    swapSlots(p.id,M.motionOn()&&animate&&introDone&&!!window.gsap);
    $$('[data-hero]').forEach((b,i)=>{b.classList.toggle('active',i===active);b.setAttribute('aria-pressed',i===active);});
    if(M.motionOn()&&animate&&introDone){
      gsap.fromTo('#heroName,.hero-copy h1,#heroDesc,#heroBuy',{y:22,opacity:0},{y:0,opacity:1,duration:.6,stagger:.07,ease:'power3.out',overwrite:true});
      gsap.fromTo('.debris img',{scale:.55},{scale:1,duration:.9,stagger:{each:.035,from:'random'},ease:'back.out(2.4)',overwrite:true,clearProps:'scale'});
    }
  };
  $('#heroChoices').addEventListener('click',e=>{const b=e.target.closest('[data-hero]');if(b&&Number(b.dataset.hero)!==active)paint(Number(b.dataset.hero));});
  $('#prevHero').addEventListener('click',()=>paint(active-1));$('#nextHero').addEventListener('click',()=>paint(active+1));
  $('#heroBuy').addEventListener('click',()=>M.selectProduct?.(M.products[active].id));
  $$('.hero-stage .pack-w').forEach(el=>el.addEventListener('click',()=>{const i=M.products.findIndex(p=>p.id===el.dataset.flavor);if(i>=0&&i!==active)paint(i);}));
  // Animasi masuk: produk jatuh dari atas, remah menyusul, teks naik.
  function intro(){
    introDone=true;document.documentElement.classList.remove('pre-intro');hero.classList.add('intro');document.documentElement.classList.add('intro-run');
    const H=innerHeight,tl=gsap.timeline({defaults:{ease:'power3.out'},onComplete(){document.documentElement.classList.remove('intro-run');hero.classList.remove('intro');hero.classList.add('idle');gsap.set('.pack-e,.debris img,.hero-choice',{clearProps:'transform,opacity'});$$('.pack-e').forEach(e=>e.style.transition='');}});
    tl.from('.pack-left .pack-e',{y:-H*1.1,rotation:-42,opacity:0,duration:1.5,ease:'back.out(.9)'},.25)
      .from('#traveler .pack-e',{y:-H*1.2,rotation:18,opacity:0,duration:1.6,ease:'back.out(.8)'},.4)
      .from('.pack-right .pack-e',{y:-H*1.1,rotation:44,opacity:0,duration:1.5,ease:'back.out(.9)'},.55)
      .from('.debris img',{y:()=>-H*(.7+Math.random()*.6),rotation:()=>gsap.utils.random(-200,200),opacity:0,duration:1.7,stagger:{each:.07,from:'random'},ease:'power2.out'},.6)
      .from('.hero-tag',{y:-14,opacity:0,duration:.7},.9)
      .from('.hero-copy>*',{y:34,opacity:0,duration:.8,stagger:.1},1)
      .from('.hero-picker>p,.hero-nav',{y:24,opacity:0,duration:.8,stagger:.15},1.2)
      .from('.hero-choice',{x:90,opacity:0,duration:.9,stagger:.12,ease:'back.out(1.7)'},1.25)
      .from('.hero-seal',{scale:0,opacity:0,duration:1,ease:'back.out(2.2)'},1.4)
      .from('.hero-bottom',{opacity:0,y:20,duration:.7},1.5);
  }
  /* Paralaks pointer: kata, remah, dan kemasan samping bergeser beda kedalaman. Kemasan tengah diam supaya jalur scroll tetap pas. */
  if(matchMedia('(pointer: fine)').matches&&window.gsap){
    const mk=(sel,amt)=>{const el=$(sel);return el&&{x:gsap.quickTo(el,'x',{duration:1.1,ease:'power3.out'}),y:gsap.quickTo(el,'y',{duration:1.1,ease:'power3.out'}),amt};};
    const layers=[mk('.hero-word',-14),mk('.hero-debris',22),mk('.pack-left',30),mk('.pack-right',30)].filter(Boolean);
    const reset=()=>layers.forEach(l=>{l.x(0);l.y(0);});
    hero.addEventListener('pointermove',e=>{if(!introDone||!M.motionOn())return;const r=hero.getBoundingClientRect(),nx=(e.clientX-r.left)/r.width-.5,ny=(e.clientY-r.top)/r.height-.5;layers.forEach(l=>{l.x(nx*l.amt);l.y(ny*l.amt*.7);});},{passive:true});
    hero.addEventListener('pointerleave',reset);
  }
  document.addEventListener('motionchange',()=>{
    if(!M.motionOn()){document.documentElement.classList.remove('pre-intro');hero.classList.remove('intro');hero.classList.add('idle');if(window.gsap){gsap.killTweensOf('.pack-e,.debris img,.hw-text .ch');gsap.set('.pack-e,.debris img,.hw-text .ch,.hero-copy>*,.hero-picker>*,.hero-choice,.hero-nav,.hero-seal,.hero-bottom,.hero-tag',{clearProps:'all'});}return;}
    if(!introDone)intro();
  });
})();
