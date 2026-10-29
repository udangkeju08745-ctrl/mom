/* Navigasi dan perilaku umum. */
(() => {
  const M=window.MOM,$=s=>document.querySelector(s),nav=$('#mobileNav'),menu=$('.menu-toggle'),header=$('.header');
  $('#year').textContent=new Intl.DateTimeFormat('en',{year:'numeric',timeZone:'Asia/Jakarta'}).format(new Date());
  function close(){nav.hidden=true;menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Buka menu');header.classList.remove('menu-open');}
  menu.addEventListener('click',()=>{const opened=nav.hidden;nav.hidden=!opened;menu.setAttribute('aria-expanded',opened);menu.setAttribute('aria-label',opened?'Tutup menu':'Buka menu');header.classList.toggle('menu-open',opened);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!nav.hidden){close();menu.focus();}});
  document.addEventListener('click',e=>{if(!e.target.closest('.header')&&!nav.hidden)close();});
  document.addEventListener('click',e=>{
    const link=e.target.closest('a[href^="#"]');if(!link)return;const hash=link.getAttribute('href'),target=document.getElementById(hash.slice(1));if(!target)return;
    e.preventDefault();close();
    const focus=()=>{target.setAttribute('tabindex','-1');target.focus({preventScroll:true});};
    if(M.lenis&&M.motionOn())M.lenis.scrollTo(target,{offset:-105,duration:1.1,onComplete:focus});else{target.scrollIntoView({behavior:M.motionOn()?'smooth':'instant',block:'start'});focus();}
    history.replaceState(null,'',hash);
  });
  new IntersectionObserver(entries=>header.classList.toggle('scrolled',!entries[0].isIntersecting),{rootMargin:'-100px 0px 0px 0px',threshold:0}).observe($('.hero-tag'));
  const links=[...document.querySelectorAll('.nav>a,.mobile-nav>a')];
  new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)links.forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));}),{rootMargin:'-20% 0px -65% 0px',threshold:0}).observe($('#beranda'));
  const sectionsObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)links.forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));}),{rootMargin:'-20% 0px -65% 0px',threshold:0});
  ['tentang','menu','kemasan','promosi','ulasan','pesan'].forEach(id=>sectionsObserver.observe(document.getElementById(id)));
})();
