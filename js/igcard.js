/* Card IG: satu card, tiga produk berjajar (Bawang kiri, Kribo tengah, Udang kanan).
   Suka dan simpan bisa dipencet. Komentar dan kirim sengaja tidak bisa dipencet. */
(() => {
  const M=window.MOM||{},$=s=>document.querySelector(s);
  const card=$('#igCard');if(!card)return;
  const media=$('#igMedia'),like=$('#igLike'),save=$('#igSave'),heart=$('.ig-heart-big');
  let liked=false,saved=false;
  const motion=()=>window.gsap&&(M.motionOn?M.motionOn():true);
  function pop(){
    if(!motion())return;
    gsap.killTweensOf(heart);
    gsap.timeline().fromTo(heart,{scale:.2,opacity:1},{scale:1.05,opacity:1,duration:.4,ease:'back.out(2.4)'}).to(heart,{scale:1.25,opacity:0,duration:.35,delay:.2,ease:'power1.in'});
  }
  function setLike(v){
    liked=v;like.classList.toggle('on',v);like.setAttribute('aria-pressed',v);
    if(v){pop();if(motion())gsap.fromTo(like,{scale:1},{keyframes:[{scale:1.4,duration:.15},{scale:1,duration:.4,ease:'elastic.out(1,.4)'}],overwrite:true});}
  }
  like.addEventListener('click',()=>setLike(!liked));
  save.addEventListener('click',()=>{
    saved=!saved;save.classList.toggle('on',saved);save.setAttribute('aria-pressed',saved);save.setAttribute('aria-label',saved?'Hapus dari simpanan':'Simpan');
    if(motion())gsap.fromTo(save,{scale:1},{keyframes:[{scale:1.3,duration:.12},{scale:1,duration:.35,ease:'elastic.out(1,.4)'}],overwrite:true});
  });
  media.addEventListener('dblclick',()=>{if(!liked)setLike(true);else pop();});
  M.igReset=()=>{};
})();
