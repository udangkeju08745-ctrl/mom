/* Sumber data bisnis. Harga dalam rupiah per kemasan 250 gram. */
window.MOM = {
  site: { name: "Dapur Mom’s 4G", address: 'JL Tuba 1 No. 31A Medan Denai', wa: '6281295554083', instagram: 'dapurmom4g', tiktok: 'dapurmom4g' },
  products: [
    { id:'keju', name:'Keju Goreng Kribo', short:'Kribo', headline:'Gurihnya keju.<br>Serunya <em>nggak habis.</em>', description:'Keriting bentuknya, bikin kangen rasanya. Teman ngobrol sampai lupa waktu.', price:37500, color:'#ffcc42', word:'KRIBO', image:'assets/products/keju-goreng-kribo.webp', note:'Gurih keju · tekstur keriting', pieces:'keju' },
    { id:'bawang', name:'Keripik Bawang', short:'Bawang', headline:'Gurih bawangnya.<br>Pas buat <em>bersama.</em>', description:'Buka kemasannya, mulai ceritanya. Rasa gurih yang selalu pas di tengah obrolan.', price:36250, color:'#e9d2a5', word:'BAWANG', image:'assets/products/keripik-bawang.webp', note:'Gurih bawang · renyah ringan', pieces:'bawang' },
    { id:'udang', name:'Keripik Udang', short:'Udang', headline:'Sekali kriuk.<br>Maunya <em>lanjut lagi.</em>', description:'Renyah di setiap gigitan. Satu lagi, satu lagi, tahu-tahu tinggal ceritanya.', price:33750, color:'#f4ad78', word:'UDANG', image:'assets/products/keripik-udang.webp', note:'Gurih udang · teman santai', pieces:'udang' }
  ],
  packs: [ {count:1,weight:'250 g',mood:'Buat aku dulu'}, {count:2,weight:'500 g',mood:'Berdua lebih seru'}, {count:3,weight:'750 g',mood:'Buat teman-teman'}, {count:4,weight:'1 kg',mood:'Rame-rame, yuk!'} ],
  reviews: [], // Tambahkan hanya ulasan pelanggan asli yang diizinkan untuk dipublikasikan.
  paused: false,
  lite: Boolean(window.__LITE),
  motionOn() { return !this.paused && !matchMedia('(prefers-reduced-motion: reduce)').matches && Boolean(window.gsap); },
  money(n) { return 'Rp' + Number(n).toLocaleString('id-ID'); },
  today(now = new Date()) { const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now); const p=t=>parts.find(x=>x.type===t).value; return `${p('year')}-${p('month')}-${p('day')}`; },
  phone(value) { const n=value.replace(/[\s()-]/g,''); return /^(?:\+62|62|0)8\d{8,11}$/.test(n) ? (n.startsWith('0')?'62'+n.slice(1):n.replace(/^\+/,'')) : ''; },
  total(cart) { return this.products.reduce((sum,p)=>sum + (cart[p.id]||0)*p.price,0); },
  validate(customer) {
    const errors={};
    if(!customer.name.trim() || customer.name.length>100) errors.name='Isi nama lengkap, maksimal 100 karakter.';
    if(!this.phone(customer.phone)) errors.phone='Gunakan nomor WhatsApp Indonesia yang valid.';
    if(!customer.address.trim() || customer.address.length>500) errors.address='Isi alamat lengkap, maksimal 500 karakter.';
    const d=new Date(customer.date+'T00:00:00Z');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(customer.date)||!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==customer.date||customer.date<this.today()) errors.date='Pilih tanggal hari ini atau setelahnya.';
    if(customer.notes.length>500) errors.notes='Catatan maksimal 500 karakter.';
    return errors;
  },
  orderUrl(cart,customer) {
    if(Object.keys(this.validate(customer)).length) throw new Error('Data pemesanan belum valid.');
    const chosen=this.products.filter(p=>cart[p.id]>0);
    if(!chosen.length) throw new Error('Pilih minimal satu produk.');
    if(chosen.some(p=>!Number.isInteger(cart[p.id])||cart[p.id]<1||cart[p.id]>4)) throw new Error('Jumlah kemasan tidak valid.');
    const count=chosen.reduce((sum,p)=>sum+cart[p.id],0);
    const message=[`Halo ${this.site.name}, saya ingin pesan:`, '', ...chosen.map(p=>`- ${p.name}: ${cart[p.id]*250} g (${cart[p.id]} kemasan × 250 g) = ${this.money(cart[p.id]*p.price)}`),'',`Jumlah: ${count} kemasan / ${count*250} g`,`Subtotal produk: ${this.money(this.total(cart))}`,'Ongkir dan total pembayaran dikonfirmasi admin.','',`Nama: ${customer.name.trim()}`,`WhatsApp: ${this.phone(customer.phone)}`,`Alamat: ${customer.address.trim()}`,`Tanggal pengiriman yang diinginkan: ${customer.date}`,`Catatan: ${customer.notes.trim()||'-'}`,'','Mohon konfirmasi stok dan jadwal pengiriman. Terima kasih.'].join('\n');
    return `https://wa.me/${this.site.wa}?text=${encodeURIComponent(message)}`;
  }
};
