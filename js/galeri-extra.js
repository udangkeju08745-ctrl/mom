/* Galeri extra: pita teks bergelombang + latar buram video + penghemat performa.
   Versi ringan: tampilan sama, kerja browser jauh lebih sedikit. */
(function(){
  'use strict';
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* HP / layar sentuh: gerak pita dibatasi 30 fps supaya scroll tetap mulus */
  var lite=(window.matchMedia&&matchMedia('(pointer: coarse)').matches)||window.innerWidth<900;
  var STEP=lite?1000/30:0;

  /* ---------- 1. Pita gelombang ---------- */
  var tp=document.getElementById('glWaveTP'),path=document.getElementById('glWavePath');
  if(tp&&path){
    var NS='http://www.w3.org/2000/svg';
    var items=['KRIUK TERUS','KRIBO','BAWANG','UDANG','KEJU'],nb='\u00A0';
    function build(n){
      var frag=document.createDocumentFragment();
      for(var k=0;k<n;k++){
        items.forEach(function(w){
          var a=document.createElementNS(NS,'tspan');a.textContent=w;frag.appendChild(a);
          var s=document.createElementNS(NS,'tspan');s.setAttribute('class','sep');s.textContent=nb+nb+'\u2726'+nb+nb;frag.appendChild(s);
        });
      }
      tp.textContent='';tp.appendChild(frag);
    }
    var unit=0,running=false,vis=true,t0=performance.now(),last=0,SPEED=70; /* px per detik */
    function setup(){
      build(1);unit=tp.getComputedTextLength()||600;
      var need=Math.ceil((path.getTotalLength()+unit*2)/unit)+1;
      build(need);
      tp.setAttribute('startOffset',0);
    }
    function tick(now){
      if(!running)return;
      if(!STEP||now-last>=STEP){
        last=now;
        tp.setAttribute('startOffset',(-(((now-t0)/1000*SPEED)%unit)).toFixed(1));
      }
      requestAnimationFrame(tick);
    }
    function start(){if(reduce||running||!vis||document.hidden)return;running=true;requestAnimationFrame(tick)}
    function stop(){running=false}
    function init(){
      setup();
      if('IntersectionObserver' in window){
        new IntersectionObserver(function(e){vis=e[0].isIntersecting;vis?start():stop()},{rootMargin:'120px'}).observe(tp.ownerSVGElement);
      }
      document.addEventListener('visibilitychange',function(){document.hidden?stop():start()});
      start();
    }
    (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(init);
  }

  /* ---------- 2. Latar buram dari poster video aktif ---------- */
  var frame=document.getElementById('glFrame'),track=document.getElementById('glTrack'),vid=document.getElementById('promoVideo');
  var lastBg='';
  function syncBg(){
    if(!frame)return;
    var img=track&&track.querySelector('.gl-chip.active img');
    var src=(vid&&vid.getAttribute('poster'))||(img&&(img.currentSrc||img.src));
    if(src&&src!==lastBg){lastBg=src;var abs=new URL(src,document.baseURI).href;frame.style.setProperty('--gl-bg','url("'+abs.replace(/"/g,'%22')+'")');}
  }
  syncBg();
  if(track&&'MutationObserver' in window){
    new MutationObserver(syncBg).observe(track,{attributes:true,attributeFilter:['class'],subtree:true});
  }
  if(vid){['loadedmetadata','emptied'].forEach(function(ev){vid.addEventListener(ev,syncBg)})}

  /* ---------- 3. Pengaman: bingkai video tidak boleh setinggi 0 ---------- */
  if(frame){
    var pl=document.getElementById('glPlayer')||frame.parentElement;
    var fitQueued=false;
    function fit(){
      fitQueued=false;
      if(document.fullscreenElement===frame||document.webkitFullscreenElement===frame)return;
      var w=(pl&&pl.clientWidth)||frame.clientWidth;
      if(!w)return;
      if(frame.clientHeight<w*0.4){
        frame.style.setProperty('height',Math.round(w*9/16)+'px','important');
        frame.style.setProperty('padding','0','important');
      }else if(frame.style.height&&frame.style.padding==='0px'&&frame.clientHeight>w*0.7){
        frame.style.removeProperty('height');frame.style.removeProperty('padding');
      }
      if(vid){vid.style.setProperty('display','block','important');vid.style.setProperty('opacity','1','important');vid.style.setProperty('visibility','visible','important')}
    }
    /* digabung per frame: resize/scroll bar HP tidak memicu hitung ulang berulang */
    function queueFit(){if(fitQueued)return;fitQueued=true;requestAnimationFrame(fit)}
    fit();setTimeout(fit,300);setTimeout(fit,1200);
    window.addEventListener('resize',queueFit);window.addEventListener('load',queueFit);
    if('ResizeObserver' in window&&pl)new ResizeObserver(queueFit).observe(pl);
  }

  /* ---------- 4. Hemat tenaga: jeda animasi CSS di bagian yang tidak terlihat ----------
     Animasi tak berujung (gelombang, serpihan, putaran segel, dsb.) tetap jalan walau
     di luar layar dan membebani HP. Di sini semuanya dijeda sampai bagiannya mendekati
     layar. Yang terlihat tidak berubah sama sekali. */
  if('IntersectionObserver' in window){
    var po=new IntersectionObserver(function(es){
      es.forEach(function(e){e.target.classList.toggle('gl-off',!e.isIntersecting)});
    },{rootMargin:'250px 0px'});
    var els=document.querySelectorAll('section.scene, .wave, footer.ft');
    for(var i=0;i<els.length;i++)po.observe(els[i]);
  }
})();
