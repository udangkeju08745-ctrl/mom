/* Keranjang hanya menyimpan pilihan produk selama halaman terbuka. */
(() => {
  const M=window.MOM, cart={}, form=document.querySelector('#orderForm');
  let toastTimer, orderVisible=false;
  const $=s=>document.querySelector(s);
  M.toast=message=>{ const el=$('#toast'); clearTimeout(toastTimer); el.textContent=message; el.hidden=false; toastTimer=setTimeout(()=>el.hidden=true,3600); };
  const packs=()=>Object.values(cart).reduce((a,b)=>a+b,0);
  const updateFloating=()=>$('#floatingCart').hidden=!packs()||orderVisible;
  function render(){
    const count=packs();
    $('#cartCount').textContent=count; $('#cartPacks').textContent=`${count} kemasan`;
    $('#cartWeight').textContent=count>=4?`${(count*.25).toLocaleString('id-ID')} kg`:`${count*250} g`;
    $('#cartTotal').textContent=M.money(M.total(cart)); $('#floatingTotal').textContent=M.money(M.total(cart));
    $('#checkout').disabled=!count; $('#clearOrder').disabled=!count;
    $('#orderStatus').textContent=count?'Lengkapi data untuk melanjutkan ke WhatsApp.':'Pilih minimal satu cemilan untuk melanjutkan.';
    $('#cartItems').innerHTML=count?M.products.filter(p=>cart[p.id]).map(p=>`<article class="cart-item"><img src="${p.image}" alt="" width="58" height="85"><div><h4>${p.name}</h4><p>${cart[p.id]*250} g · ${cart[p.id]} kemasan × 250 g</p><div class="cart-item-controls"><div class="quantity-stepper"><button type="button" data-minus="${p.id}" aria-label="Kurangi ${p.name}" ${cart[p.id]===1?'disabled':''}>−</button><span>${cart[p.id]}</span><button type="button" data-plus="${p.id}" aria-label="Tambah ${p.name}" ${cart[p.id]===4?'disabled':''}>+</button></div><strong>${M.money(cart[p.id]*p.price)}</strong></div><button type="button" class="cart-remove" data-remove="${p.id}" aria-label="Hapus ${p.name}">Hapus</button></div></article>`).join(''):'<div class="cart-empty"><div class="empty-symbol">✳</div><h3>Masih ada tempat<br>buat yang gurih.</h3><p>Pilih rasa dan geser jumlah kemasan. Cemilan pilihanmu muncul di sini.</p><a href="#kemasan">Pilih cemilan dulu ↗</a></div>';
    updateFloating();
    document.dispatchEvent(new CustomEvent('mom:cart',{detail:{count,total:M.total(cart)}}));
  }
  M.cart=cart;
  M.cartAdjust=(id,d)=>{if(!cart[id])return;cart[id]=Math.min(4,Math.max(1,cart[id]+d));render();};
  M.cartRemove=id=>{if(!cart[id])return;delete cart[id];render();};
  M.cartClear=()=>{Object.keys(cart).forEach(k=>delete cart[k]);render();};
  M.addOrder=(id,count)=>{
    if(!M.products.some(p=>p.id===id)||!Number.isInteger(count)||count<1||count>4)return;
    // Memilih ulang mengganti jumlah rasa yang sama; pilihan rasa lain dipertahankan.
    const existed=Boolean(cart[id]);cart[id]=count;render();
    const product=M.products.find(p=>p.id===id);
    M.toast(`${product.short}: ${count} kemasan ${existed?'diperbarui':'ditambahkan'} · ${M.money(count*product.price)}`);
  };
  $('#cartItems').addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button)return;
    let attr=button.hasAttribute('data-plus')?'plus':button.hasAttribute('data-minus')?'minus':'remove';
    const id=button.dataset[attr]; if(!cart[id])return;
    if(attr==='remove')delete cart[id];else cart[id]=Math.min(4,Math.max(1,cart[id]+(attr==='plus'?1:-1)));
    render();
    const next=$(`[data-${attr}="${id}"]`); if(next&&!next.disabled)next.focus();else $('#clearOrder').focus();
  });
  $('#clearOrder').addEventListener('click',()=>{$('#clearConfirm').hidden=false;$('#cancelClear').focus();});
  $('#cancelClear').addEventListener('click',()=>{$('#clearConfirm').hidden=true;$('#clearOrder').focus();});
  $('#confirmClear').addEventListener('click',()=>{Object.keys(cart).forEach(k=>delete cart[k]);$('#clearConfirm').hidden=true;render();$('#cartItems a').focus();M.toast('Pesanan dikosongkan. Data pemesan tetap ada.');});
  $('#fDate').min=M.today(); $('#fDate').addEventListener('focus',()=>$('#fDate').min=M.today());
  form.addEventListener('input',e=>{const input=e.target;if(!input.name)return;input.removeAttribute('aria-invalid');const error=$('#error-'+input.name);if(error)error.textContent='';});
  form.addEventListener('submit',e=>{
    e.preventDefault();const customer=Object.fromEntries(new FormData(form));const errors=M.validate(customer);
    for(const key of ['name','phone','address','date','notes']){const field=form.elements.namedItem(key);field.setAttribute('aria-invalid',Boolean(errors[key]));$('#error-'+key).textContent=errors[key]||'';}
    if(Object.keys(errors).length){form.elements.namedItem(Object.keys(errors)[0]).focus();$('#orderStatus').textContent='Periksa bagian yang ditandai, ya.';return;}
    try{const url=M.orderUrl(cart,customer);window.open(url,'_blank','noopener,noreferrer');$('#orderStatus').textContent='Draft WhatsApp dibuka. Periksa lalu kirim pesan untuk melanjutkan pesanan.';}catch(err){$('#orderStatus').textContent=err.message;}
  });
  new IntersectionObserver(entries=>{orderVisible=entries[0].isIntersecting;updateFloating();},{threshold:.05}).observe($('#pesan'));
  render();
})();
