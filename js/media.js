/* Media lokal, modal poster, dan ulasan asli melalui WhatsApp. */
(() => {
  const M=window.MOM,$=s=>document.querySelector(s),folder='assets/promotion/';
  /* Video promosi kini dikelola js/galeri.js (iklan video autoplay) */
  /* Galeri poster + lightbox sekarang ada di js/galeri.js */
  const form=$('#ratingForm'),radios=[...form.querySelectorAll('[name=rating]')];
  const labels=['Perlu ditingkatkan','Kurang sesuai selera','Cukup suka','Enak!','Suka banget!'];
  radios.forEach(r=>r.addEventListener('change',()=>{const score=Number(r.value);radios.forEach((el,i)=>el.parentElement.classList.toggle('lit',i<score));$('#ratingLabel').textContent=`${score}/5 · ${labels[score-1]}`;}));
  form.addEventListener('submit',e=>{e.preventDefault();const score=Number(new FormData(form).get('rating')),review=$('#reviewText').value.trim();if(score<1||score>5||!review){$('#reviewStatus').textContent='Pilih bintang dan tulis ulasan dulu, ya.';$('#reviewText').focus();return;}const message=`Halo ${M.site.name}, saya mau berbagi ulasan.\n\nProduk: ${$('#reviewProduct').value}\nRating: ${score}/5\nUlasan: ${review}\n\nSilakan hubungi saya sebelum ulasan ini dipublikasikan.`;window.open(`https://wa.me/${M.site.wa}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');$('#reviewStatus').textContent='Draft ulasan dibuka di WhatsApp. Terima kasih sudah berbagi!';});
})();
