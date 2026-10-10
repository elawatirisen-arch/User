// ===================================================================
// ALIPSTORE USER — app logic (no login/register, hash-based routing)
// ===================================================================
import { firebaseConfig, STORE_INFO } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, doc, addDoc, onSnapshot, query,
  orderBy, serverTimestamp, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const fmtPrice = n => 'Rp' + Number(n || 0).toLocaleString('id-ID');
const escapeHtml = (str = '') => String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

let PRODUCTS = [];
let SETTINGS = { whatsapp: STORE_INFO.whatsapp, telegram: STORE_INFO.telegram };
let checkoutTarget = null;
let loaded = false;

function toast(msg, type = '') {
  const wrap = $('#toastWrap');
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function placeholderImg() {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#141C2C"/><text x="50%" y="52%" font-size="14" fill="#59667C" text-anchor="middle" font-family="sans-serif">ALIPSTORE</text></svg>`
  );
}

const catLabel = { uid: 'UID Free Fire', script: 'Script', tools: 'Tools Digital', other: 'Produk Lainnya' };

// ---------------- Firestore live data ----------------
onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), (snap) => {
  PRODUCTS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  loaded = true;
  route();
}, () => { loaded = true; route(); });

getDoc(doc(db, 'settings', 'store')).then(snap => {
  if (snap.exists()) {
    const s = snap.data();
    SETTINGS.whatsapp = s.whatsapp || SETTINGS.whatsapp;
    SETTINGS.telegram = s.telegram || SETTINGS.telegram;
    if (s.bannerTitle) $('#heroTitle').innerHTML = escapeHtml(s.bannerTitle);
    if (s.bannerSubtitle) $('#heroSub').textContent = s.bannerSubtitle;
    if (s.bannerImage) {
      $('#heroVisual').innerHTML = `<img src="${s.bannerImage}" alt="ALIPSTORE">`;
    }
  }
}).catch(() => {});

// ---------------- product card ----------------
function productCard(p) {
  const img = p.image || placeholderImg();
  const price = p.discountPrice
    ? `<span class="pc-price">${fmtPrice(p.discountPrice)}</span><span class="pc-price-old">${fmtPrice(p.price)}</span>`
    : `<span class="pc-price">${fmtPrice(p.price)}</span>`;
  const badges = [];
  if (p.label === 'Terbaru') badges.push('<span class="pc-badge new">Terbaru</span>');
  if (p.label === 'Populer') badges.push('<span class="pc-badge hot">Populer</span>');
  if (p.discountPrice || p.label === 'Diskon') badges.push('<span class="pc-badge disc">Diskon</span>');
  return `
    <div class="product-card" data-open-product="${p.id}">
      <div class="pc-img">
        <img src="${img}" alt="${escapeHtml(p.name)}" loading="lazy">
        <div class="pc-badges">${badges.join('')}</div>
        ${p.status === 'sold' ? '<div class="pc-sold"><span>TERJUAL</span></div>' : ''}
      </div>
      <div class="pc-body">
        <div class="pc-cat">${catLabel[p.category] || p.category}</div>
        <div class="pc-name">${escapeHtml(p.name)}</div>
        <div class="pc-price-row">${price}</div>
      </div>
    </div>`;
}

function bindProductCards(root = document) {
  $$('[data-open-product]', root).forEach(el => {
    el.addEventListener('click', () => { location.hash = '#/produk/' + el.dataset.openProduct; });
  });
}

function emptyBlock(msg) {
  return `<div class="empty-state">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 7 12 3 4 7v10l8 4 8-4V7Z"/><path d="M4 7l8 4 8-4"/></svg>
    <div>${msg}</div>
  </div>`;
}

// ---------------- views ----------------
function renderHome() {
  const container = $('#view-home');
  const available = PRODUCTS.filter(p => p.status !== 'archived');
  const newest = [...available].slice(0, 8);
  const featured = available.filter(p => p.featured).slice(0, 8);
  const discounted = available.filter(p => p.discountPrice).slice(0, 8);
  const uidCount = PRODUCTS.filter(p => p.category === 'uid').length;
  const scriptCount = PRODUCTS.filter(p => p.category === 'script').length;
  const toolsCount = PRODUCTS.filter(p => p.category === 'tools').length;

  container.innerHTML = `
    <section class="section">
      <div class="wrap">
        <div class="section-head"><h2>Kategori</h2></div>
        <div class="cat-grid">
          <div class="cat-card" data-goto="#/kategori/uid">
            <div class="cat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg></div>
            <div class="cat-name">UID Free Fire</div>
            <div class="cat-count">${uidCount} produk</div>
          </div>
          <div class="cat-card" data-goto="#/kategori/script">
            <div class="cat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></div>
            <div class="cat-name">Script Store</div>
            <div class="cat-count">${scriptCount} produk</div>
          </div>
          <div class="cat-card" data-goto="#/kategori/tools">
            <div class="cat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14.7 6.3a4 4 0 0 1-5.4 5.4l-5.8 5.8a1.5 1.5 0 0 0 2.1 2.1l5.8-5.8a4 4 0 0 1 5.4-5.4L14 5l2 2 2.7-2.7a1 1 0 0 0 0-1.4L17.4.6a1 1 0 0 0-1.4 0Z"/></svg></div>
            <div class="cat-name">Tools Digital</div>
            <div class="cat-count">${toolsCount} produk</div>
          </div>
          <div class="cat-card" data-goto="#/kategori/other">
            <div class="cat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg></div>
            <div class="cat-name">Produk Lainnya</div>
            <div class="cat-count">semua produk digital</div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head">
          <h2>Produk Terbaru</h2>
          <span class="see-all" data-goto="#/kategori/">Lihat semua →</span>
        </div>
        <div class="product-grid">${newest.length ? newest.map(productCard).join('') : emptyBlock('Produk belum tersedia. Admin belum menambahkan produk.')}</div>
      </div>
    </section>

    ${featured.length ? `
    <section class="section">
      <div class="wrap">
        <div class="section-head"><h2>Produk Unggulan</h2></div>
        <div class="product-grid">${featured.map(productCard).join('')}</div>
      </div>
    </section>` : ''}

    ${discounted.length ? `
    <section class="section">
      <div class="wrap">
        <div class="section-head"><h2>Sedang Diskon</h2></div>
        <div class="product-grid">${discounted.map(productCard).join('')}</div>
      </div>
    </section>` : ''}
  `;
  bindProductCards(container);
  $$('[data-goto]', container).forEach(el => el.addEventListener('click', () => location.hash = el.dataset.goto));
}

function renderCategory(cat) {
  const container = $('#view-category');
  const titleMap = { uid: 'UID Free Fire', script: 'Script Store', tools: 'Tools Digital', other: 'Produk Lainnya', '': 'Semua Produk' };
  let list = cat ? PRODUCTS.filter(p => p.category === cat) : PRODUCTS;

  container.innerHTML = `
    <div class="wrap section">
      <div class="section-head">
        <h2>${titleMap[cat] ?? 'Katalog'}</h2>
        <div class="sub-line">${list.length} produk ditemukan</div>
      </div>
      <div class="filter-bar">
        <input type="text" id="catSearch" placeholder="Cari produk...">
        <select id="catStatus">
          <option value="">Semua Status</option>
          <option value="available">Tersedia</option>
          <option value="sold">Terjual</option>
        </select>
      </div>
      <div class="product-grid" id="catGrid"></div>
    </div>
  `;

  function renderGrid() {
    const term = ($('#catSearch').value || '').toLowerCase();
    const status = $('#catStatus').value;
    const filtered = list.filter(p =>
      (!term || (p.name || '').toLowerCase().includes(term)) &&
      (!status || p.status === status)
    );
    $('#catGrid').innerHTML = filtered.length ? filtered.map(productCard).join('') : emptyBlock('Tidak ada produk yang cocok.');
    bindProductCards($('#catGrid'));
  }
  $('#catSearch').addEventListener('input', renderGrid);
  $('#catStatus').addEventListener('change', renderGrid);
  renderGrid();
}

function renderDetail(id) {
  const container = $('#view-detail');
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) {
    container.innerHTML = `<div class="wrap section">${emptyBlock('Produk tidak ditemukan atau sudah dihapus.')}</div>`;
    return;
  }
  const img = p.image || placeholderImg();
  const isScript = p.category === 'script';
  container.innerHTML = `
    <div class="wrap section">
      <div class="detail-grid">
        <div class="detail-img"><img src="${img}" alt="${escapeHtml(p.name)}"></div>
        <div>
          <div class="detail-cat">${catLabel[p.category] || p.category}</div>
          <h1>${escapeHtml(p.name)}</h1>
          <div class="detail-price-row">
            <div class="detail-price">${fmtPrice(p.discountPrice || p.price)}</div>
            ${p.discountPrice ? `<div class="detail-price-old">${fmtPrice(p.price)}</div>` : ''}
            <span class="badge" style="font-size:11px;padding:4px 10px;border-radius:999px;background:${p.status === 'available' ? 'rgba(61,220,151,.12);color:#3DDC97' : 'rgba(255,59,92,.12);color:#FF3B5C'}">${p.status === 'available' ? 'Tersedia' : 'Terjual'}</span>
          </div>
          <p class="detail-desc">${escapeHtml(p.description || 'Belum ada deskripsi untuk produk ini.')}</p>

          ${isScript ? `
          <div class="spec-table">
            ${p.lang ? `<div class="spec-row"><span>Bahasa Pemrograman</span><span>${escapeHtml(p.lang)}</span></div>` : ''}
            ${p.version ? `<div class="spec-row"><span>Versi</span><span>${escapeHtml(p.version)}</span></div>` : ''}
            ${p.compat ? `<div class="spec-row"><span>Kompatibilitas</span><span>${escapeHtml(p.compat)}</span></div>` : ''}
          </div>
          ${p.installGuide ? `<div class="install-box"><h4>Panduan Instalasi</h4><pre>${escapeHtml(p.installGuide)}</pre></div>` : ''}
          ` : ''}

          <div class="detail-actions">
            <button class="btn btn-primary" id="buyWaBtn" ${p.status !== 'available' ? 'disabled' : ''}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.1-.4-2.1-1.3-.8-.7-1.3-1.6-1.4-1.8-.2-.3 0-.4.1-.6l.4-.5c.1-.1.2-.3.2-.4.1-.2 0-.3 0-.4l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.1 1.6 2.5 3.9 3.4 2.3.9 2.3.6 2.7.5.4 0 1.4-.6 1.5-1.1.2-.5.2-1 .1-1.1 0-.1-.2-.2-.4-.3Z"/><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 20.2 12 8.2 8.2 0 0 1 12 20.2Z"/></svg>
              ${p.status === 'available' ? 'Beli via WhatsApp' : 'Stok Habis'}
            </button>
            <button class="btn" id="buyTgBtn" ${p.status !== 'available' ? 'disabled' : ''}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 2 2 10.3l6 2.1L10.7 20 14 15l5.5 4L22 2Zm-3 3.4L10.9 13 10 17l-1.3-4.3L17.6 6l1.4-.6Z"/></svg>
              Via Telegram
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  $('#buyWaBtn')?.addEventListener('click', () => openCheckout(p, 'whatsapp'));
  $('#buyTgBtn')?.addEventListener('click', () => openCheckout(p, 'telegram'));
}

function renderFaq() {
  const items = [
    ['Apakah saya perlu membuat akun untuk belanja?', 'Tidak. ALIPSTORE bisa langsung digunakan tanpa login atau registrasi. Pilih produk, lalu checkout via WhatsApp atau Telegram.'],
    ['Bagaimana cara pembayarannya?', 'Setelah menekan tombol beli, kamu akan diarahkan ke chat admin untuk konfirmasi ketersediaan dan metode pembayaran.'],
    ['Apakah produk yang berstatus terjual bisa dipesan lagi?', 'Tidak, produk berstatus terjual otomatis tidak bisa dipesan sampai admin menambahkan stok baru.'],
    ['Berapa lama proses pengiriman produk digital?', 'Untuk UID Free Fire dan script, produk biasanya dikirim setelah pembayaran dikonfirmasi oleh admin melalui WhatsApp/Telegram.'],
    ['Apakah ada garansi jika produk bermasalah?', 'Hubungi admin melalui WhatsApp atau Telegram untuk bantuan lebih lanjut terkait produk yang kamu beli.'],
  ];
  $('#view-faq').innerHTML = `
    <div class="wrap section" style="max-width:760px;">
      <div class="section-head"><h2>Pertanyaan Umum</h2></div>
      ${items.map(([q, a], i) => `
        <div class="faq-item" data-faq="${i}">
          <div class="faq-q">${q}<span class="faq-arrow">⌄</span></div>
          <div class="faq-a">${a}</div>
        </div>`).join('')}
    </div>
  `;
  $$('[data-faq]').forEach(el => el.addEventListener('click', () => el.classList.toggle('open')));
}

function renderCara() {
  $('#view-cara').innerHTML = `
    <div class="wrap section">
      <div class="section-head"><h2>Cara Pembelian</h2></div>
      <div class="steps">
        <div class="step-card"><div class="step-num">1</div><h4>Pilih Produk</h4><p>Jelajahi katalog UID Free Fire, Script Store, atau Tools Digital sesuai kebutuhanmu.</p></div>
        <div class="step-card"><div class="step-num">2</div><h4>Buka Detail Produk</h4><p>Lihat deskripsi, harga, dan status ketersediaan sebelum membeli.</p></div>
        <div class="step-card"><div class="step-num">3</div><h4>Tekan Beli Sekarang</h4><p>Isi nama panggilan, lalu kamu akan diarahkan ke WhatsApp atau Telegram admin.</p></div>
        <div class="step-card"><div class="step-num">4</div><h4>Konfirmasi & Bayar</h4><p>Admin akan mengonfirmasi ketersediaan produk dan memberikan cara pembayaran.</p></div>
        <div class="step-card"><div class="step-num">5</div><h4>Terima Produk</h4><p>Setelah pembayaran dikonfirmasi, produk digital akan dikirimkan oleh admin.</p></div>
      </div>
    </div>
  `;
}

function renderKontak() {
  $('#view-kontak').innerHTML = `
    <div class="wrap section" style="max-width:560px;">
      <div class="section-head"><h2>Hubungi Admin</h2></div>
      <div class="panel" style="background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:22px;display:flex;flex-direction:column;gap:12px;">
        <a class="btn btn-primary" style="justify-content:center" target="_blank" rel="noopener" href="https://wa.me/${SETTINGS.whatsapp}?text=${encodeURIComponent('Halo Admin ALIPSTORE, saya ingin bertanya tentang produk.')}">Chat via WhatsApp</a>
        <a class="btn" style="justify-content:center" target="_blank" rel="noopener" href="https://t.me/${SETTINGS.telegram}">Chat via Telegram</a>
      </div>
    </div>
  `;
}

// ---------------- checkout modal ----------------
function openCheckout(product, channel) {
  checkoutTarget = { product, channel };
  $('#checkoutImg').src = product.image || placeholderImg();
  $('#checkoutName').textContent = product.name;
  $('#checkoutPrice').textContent = fmtPrice(product.discountPrice || product.price);
  $('#checkoutModalTitle').textContent = channel === 'telegram' ? 'Lanjut via Telegram' : 'Lanjut via WhatsApp';
  $('#buyerName').value = '';
  $('#buyerNote').value = '';
  $('#checkoutOverlay').classList.add('show');
}
function closeCheckout() { $('#checkoutOverlay').classList.remove('show'); checkoutTarget = null; }
$('#checkoutClose').addEventListener('click', closeCheckout);
$('#checkoutCancel').addEventListener('click', closeCheckout);

$('#checkoutForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!checkoutTarget) return;
  const { product, channel } = checkoutTarget;
  const buyerName = $('#buyerName').value.trim() || 'Anonim';
  const note = $('#buyerNote').value.trim();
  const price = product.discountPrice || product.price;

  const btn = $('#checkoutSubmitBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;display:inline-block;animation:spin .6s linear infinite;"></span> Memproses...';

  try {
    await addDoc(collection(db, 'orders'), {
      productId: product.id,
      productName: product.name,
      price,
      buyerName,
      note,
      channel,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // tetap lanjutkan ke WA/Telegram meski pencatatan pesanan gagal
    console.warn('Gagal mencatat pesanan:', err);
  }

  const msgLines = [
    `Halo Admin ${STORE_INFO.name}, saya ingin membeli produk berikut.`,
    ``,
    `Nama produk: ${product.name}`,
    `Kategori: ${catLabel[product.category] || product.category}`,
    `Harga: ${fmtPrice(price)}`,
    `ID produk: ${product.id}`,
    `Nama pemesan: ${buyerName}`,
  ];
  if (note) msgLines.push(`Catatan: ${note}`);
  msgLines.push('', 'Mohon konfirmasi ketersediaan dan cara pembayarannya.');
  const message = encodeURIComponent(msgLines.join('\n'));

  const url = channel === 'telegram'
    ? `https://t.me/${SETTINGS.telegram}`
    : `https://wa.me/${SETTINGS.whatsapp}?text=${message}`;
  window.open(url, '_blank');

  btn.disabled = false;
  btn.textContent = 'Lanjutkan ke Chat';
  closeCheckout();
  toast('Pesanan dicatat, melanjutkan ke chat admin.', 'ok');
});

// ---------------- routing ----------------
function route() {
  const hash = location.hash || '#/';
  const views = ['home', 'category', 'detail', 'faq', 'cara', 'kontak'];
  const parts = hash.replace('#/', '').split('/').filter(Boolean);

  let active = 'home';
  if (parts[0] === 'kategori') { active = 'category'; renderCategory(parts[1] || ''); }
  else if (parts[0] === 'produk') { active = 'detail'; renderDetail(parts[1]); }
  else if (parts[0] === 'faq') { active = 'faq'; renderFaq(); }
  else if (parts[0] === 'cara-pembelian') { active = 'cara'; renderCara(); }
  else if (parts[0] === 'kontak') { active = 'kontak'; renderKontak(); }
  else { active = 'home'; renderHome(); }

  views.forEach(v => $('#view-' + v).classList.toggle('active', v === active));
  $$('.nav-link').forEach(n => n.classList.toggle('active', n.dataset.route === active || (active === 'category' && n.dataset.route === parts[1])));
  window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
  $('#mobileNav').classList.remove('open');
}
window.addEventListener('hashchange', route);
route();

// ---------------- header interactions ----------------
$('#mobileNavBtn').addEventListener('click', () => $('#mobileNav').classList.toggle('open'));
$$('.nav-link').forEach(n => n.addEventListener('click', () => $('#mobileNav').classList.remove('open')));
$('#logoBtn').addEventListener('click', () => location.hash = '#/');

const heroSearch = $('#heroSearchInput');
if (heroSearch) {
  heroSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && heroSearch.value.trim()) {
      location.hash = '#/kategori/';
      setTimeout(() => {
        const el = $('#catSearch');
        if (el) { el.value = heroSearch.value.trim(); el.dispatchEvent(new Event('input')); }
      }, 30);
    }
  });
}
