// ===========================
// SUPABASE
// ===========================
const { createClient } = supabase;
const sb = createClient(
  'https://mbiqqfinheponamecovs.supabase.co',
  'sb_publishable_z1AM8yoagsTudefecB9raA_bCYzHUqa'
);

let guestData   = [];
let weddingDate = new Date('2026-10-08T15:00:00');

async function initGuestData() {
  try {
    const [{ data: families }, { data: guests }] = await Promise.all([
      sb.from('families').select('id, name').order('name'),
      sb.from('guests').select('id, family_id, name, status')
    ]);
    if (!families || !guests) return;
    guestData = families.map(f => ({
      family: f.name,
      familyId: f.id,
      members: guests
        .filter(g => g.family_id === f.id)
        .map(g => ({ id: g.id, name: g.name, status: g.status }))
    }));
  } catch (e) {
    console.error('Erro ao carregar convidados:', e);
  }
}

initGuestData();

// ===========================
// SLIDESHOW HERO
// ===========================
let slideshowTimer = null;
function startSlideshow() {
  if (slideshowTimer) clearInterval(slideshowTimer);
  const allSlides = Array.from(document.querySelectorAll('.hero-slideshow .slide'));
  if (!allSlides.length) return;
  let current = 0;
  const isDesktop = () => window.innerWidth > 768;
  const getSlides = () => {
    const device = isDesktop() ? 'desktop' : 'mobile';
    return allSlides.filter(s => s.dataset.device === 'all' || s.dataset.device === device);
  };
  allSlides.forEach(s => s.classList.remove('active'));
  const slides = getSlides();
  if (!slides.length) return;
  slides[0].classList.add('active');
  slideshowTimer = setInterval(() => {
    const slides = getSlides();
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 5000);
}
startSlideshow();
window.addEventListener('resize', startSlideshow);

// ===========================
// CONTAGEM REGRESSIVA
// ===========================
function updateCountdown() {
  const wedding = weddingDate || new Date('2026-10-08T15:00:00');
  const now     = new Date();
  const diff    = wedding - now;
  if (diff <= 0) {
    ['days','hours','minutes','seconds'].forEach(id => {
      document.getElementById(id).textContent = '00';
    });
    return;
  }
  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  document.getElementById('days').textContent    = String(days).padStart(2, '0');
  document.getElementById('hours').textContent   = String(hours).padStart(2, '0');
  document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
  document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ===========================
// NAVBAR
// ===========================
window.addEventListener('scroll', () => {
  document.getElementById('navbar').style.boxShadow =
    window.scrollY > 40 ? '0 2px 24px rgba(0,0,0,0.07)' : 'none';
});
function toggleMenu() {
  document.querySelector('.nav-links').classList.toggle('open');
}
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.remove('open');
  });
});

// ===========================
// RSVP OVERLAY
// ===========================
function openRsvpOverlay() {
  const overlay = document.getElementById('rsvp-overlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    const input = document.getElementById('guest-search-input');
    if (input) input.focus();
  }, 350);
}
function closeRsvpOverlay() {
  document.getElementById('rsvp-overlay').classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('guest-search-input').value = '';
  document.getElementById('family-result').style.display = 'none';
}

// ===========================
// GALERIA — overlay
// ===========================
function openGallery() {
  document.getElementById('gallery-overlay').style.display = 'block';
  document.body.style.overflow = 'hidden';
}
function closeGallery() {
  document.getElementById('gallery-overlay').style.display = 'none';
  document.body.style.overflow = '';
}
function switchTab(tab, btn) {
  document.querySelectorAll('.gallery-tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.gallery-tab').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  btn.classList.add('active');
}

// ===========================
// LISTA DE CONVIDADOS
// ===========================
function normalize(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function searchGuest() {
  const input = document.getElementById('guest-search-input').value.trim();
  const box   = document.getElementById('family-result');
  const words = input.split(/\s+/).filter(w => w.length > 0);
  if (input.length < 2 || words.length === 0) { box.style.display = 'none'; return; }
  const queryWords = words.map(normalize);
  const matchedGroups = [];
  for (const group of guestData) {
    for (const member of group.members) {
      const memberNorm = normalize(member.name);
      const allMatch   = queryWords.every(w => memberNorm.includes(w));
      if (allMatch) { matchedGroups.push(group); break; }
    }
  }
  box.style.display = 'block';
  if (matchedGroups.length === 0) {
    box.innerHTML = `<div class="family-not-found"><p>Nome não encontrado na lista.<br />Verifique a grafia ou entre em contato com os noivos.</p></div>`;
  } else {
    renderFamilyPicker(matchedGroups, box);
  }
}

function renderFamilyPicker(groups, box) {
  const buttons = groups.map(g => `
    <button class="family-pick-btn" onclick="pickFamily('${esc(g.family)}')">${esc(g.family)}</button>
  `).join('');
  box.innerHTML = `<div class="family-picker"><p class="family-picker-title">Encontramos mais de uma família com esse nome. Selecione a sua:</p><div class="family-picker-btns">${buttons}</div></div>`;
}

function pickFamily(familyName) {
  const group = guestData.find(g => g.family === familyName);
  if (group) renderFamily(group, document.getElementById('family-result'));
}

function renderFamily(group, box) {
  const labels = { pending: 'Pendente', confirmed: 'Confirmado ✓', declined: 'Não irá comparecer' };
  const rows = group.members.map(member => {
    const status = member.status || 'pending';
    return `
      <div class="family-member-row">
        <span class="member-name">${esc(member.name)}</span>
        <span class="member-status ${status}">${labels[status]}</span>
        <div class="member-actions">
          <button class="btn-confirm ${status === 'confirmed' ? 'active' : ''}"
            onclick="setStatus('${member.id}', 'confirmed', '${esc(group.family)}')">Vou comparecer</button>
          <button class="btn-decline ${status === 'declined' ? 'active' : ''}"
            onclick="setStatus('${member.id}', 'declined', '${esc(group.family)}')">Não poderei ir</button>
        </div>
      </div>`;
  }).join('');
  box.innerHTML = `<p class="family-result-title">${esc(group.family)}</p>${rows}`;
}

async function setStatus(memberId, status, familyName) {
  await sb.from('guests').update({ status, updated_at: new Date().toISOString() }).eq('id', memberId);
  for (const group of guestData) {
    const member = group.members.find(m => m.id === memberId);
    if (member) {
      member.status = status;
      if (group.family === familyName) renderFamily(group, document.getElementById('family-result'));
      break;
    }
  }
}

// ===========================
// PRESENTES
// ===========================
function openGiftsSection() {
  const el = document.getElementById('gifts-section');
  el.style.display = 'block';
  setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
}
function closeGiftsSection() {
  document.getElementById('gifts-section').style.display = 'none';
}

// ===========================
// PAGAMENTO
// ===========================
let PIX_KEY        = '000.000.000-00';
let CARD_BASE_LINK = 'https://mpago.la/SEU_LINK';

async function initConfig() {
  const { data } = await sb.from('site_config').select('key, value');
  if (!data) return;
  const cfg = Object.fromEntries(data.map(r => [r.key, r.value]));

  const set   = (id, v) => { const e = document.getElementById(id); if (e && v) e.textContent = v; };
  const setHr = (id, v) => { const e = document.getElementById(id); if (e && v) e.href = v; };

  if (cfg.pix_key)           PIX_KEY = cfg.pix_key;
  if (cfg.card_link)         CARD_BASE_LINK = cfg.card_link;
  if (cfg.wedding_datetime)  weddingDate = new Date(cfg.wedding_datetime);

  set('hero-date-line',     cfg.hero_date);
  set('hero-location',      cfg.hero_location);
  set('intro-subtitle',     cfg.intro_subtitle);
  set('venue-datetime-text',cfg.venue_datetime_text);
  set('footer-date-text',   cfg.footer_date);
  setHr('venue-maps-link',  cfg.venue_maps_link);

  if (cfg.venue_name || cfg.venue_city) {
    const e = document.getElementById('venue-name-city');
    if (e) e.innerHTML = (cfg.venue_name || 'Jardim Riviera') + '<br />' + (cfg.venue_city || 'João Pessoa — PB');
  }
  if (cfg.rsvp_deadline) {
    const e = document.querySelector('.rsvp-overlay-deadline strong');
    if (e) e.textContent = cfg.rsvp_deadline;
  }
  if (cfg.footer_quote) {
    const e = document.querySelector('.footer-quote');
    if (e) e.textContent = '"' + cfg.footer_quote + '"';
  }

  // Nossa História
  [1, 2, 3].forEach(n => {
    set(`story-${n}-date`,  cfg[`story_${n}_date`]);
    set(`story-${n}-title`, cfg[`story_${n}_title`]);
    set(`story-${n}-text`,  cfg[`story_${n}_text`]);
  });

  // Ocultar fotos padrão removidas pelo admin
  if (cfg.hidden_defaults) {
    try {
      const hidden = JSON.parse(cfg.hidden_defaults);
      hidden.forEach(src => {
        const slide = document.querySelector(`.hero-slideshow .slide[src="${src}"]`);
        if (slide) slide.remove();
      });
      startSlideshow();
    } catch(e) {}
  }
}
initConfig();

// Presentes
let currentGiftPix  = null;
let currentGiftCard = null;

async function initGifts() {
  const { data } = await sb.from('gifts').select('*').order('order').order('created_at');
  const grid = document.getElementById('gifts-grid');
  if (!grid) return;
  if (!data || data.length === 0) {
    grid.innerHTML = `
      <div class="gift-item">
        <div class="gift-item-no-img">
          <h4>Surpresa</h4>
          <p>Escolha o valor que quiser</p>
          <span class="gift-price">Valor livre</span>
          <button onclick="openPaymentModal('Surpresa', 0, null, null)">Presentear</button>
        </div>
      </div>`;
    return;
  }
  grid.innerHTML = data.map(g => {
    const priceStr = g.value > 0
      ? 'R$\u00a0' + parseFloat(g.value).toFixed(2).replace('.', ',')
      : 'Valor livre';
    const imgHtml = g.image_url
      ? `<img class="gift-item-img" src="${g.image_url}" alt="${escHtml(g.name)}" loading="lazy"/>`
      : '';
    const bodyClass = g.image_url ? 'gift-item-body' : 'gift-item-no-img';
    const pixArg  = g.pix_key  ? `'${escJs(g.pix_key)}'`  : 'null';
    const cardArg = g.card_link ? `'${escJs(g.card_link)}'` : 'null';
    return `
      <div class="gift-item">
        ${imgHtml}
        <div class="${bodyClass}">
          <h4>${escHtml(g.name)}</h4>
          ${g.description ? `<p>${escHtml(g.description)}</p>` : '<p></p>'}
          <span class="gift-price">${priceStr}</span>
          <button onclick="openPaymentModal('${escJs(g.name)}', ${g.value || 0}, ${pixArg}, ${cardArg})">Presentear</button>
        </div>
      </div>`;
  }).join('');
}
initGifts();

function escHtml(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escJs(s) {
  if (!s) return '';
  return s.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
}

function openPaymentModal(giftName, price, pixKey, cardLink) {
  currentGiftPix  = pixKey  || PIX_KEY;
  currentGiftCard = cardLink || CARD_BASE_LINK;
  document.getElementById('modal-gift-name').textContent  = giftName;
  document.getElementById('modal-gift-price').textContent =
    price > 0 ? 'R$ ' + price.toFixed(2).replace('.', ',') : 'Valor livre';
  document.getElementById('pix-key-value').textContent    = currentGiftPix;
  document.getElementById('pix-amount').textContent       =
    price > 0 ? 'R$ ' + price.toFixed(2).replace('.', ',') : 'À sua escolha';
  document.getElementById('card-payment-link').href       = currentGiftCard;
  showStep('method');
  document.getElementById('paymentModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closePaymentModal() {
  document.getElementById('paymentModal').classList.remove('open');
  document.body.style.overflow = '';
}
function closeModalOutside(e) {
  if (e.target === document.getElementById('paymentModal')) closePaymentModal();
}
function selectMethod(method) { showStep(method); }
function goBack()              { showStep('method'); }
function showStep(name) {
  document.querySelectorAll('.modal-step').forEach(s => s.classList.remove('active'));
  document.getElementById('step-' + name).classList.add('active');
  document.getElementById('pix-copied').style.display = 'none';
}
function copyPix() {
  navigator.clipboard.writeText(currentGiftPix || PIX_KEY).then(() => {
    const el = document.getElementById('pix-copied');
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
  });
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closePaymentModal(); closeRsvpOverlay(); }
});

// ===========================
// FOTOS DINÂMICAS
// ===========================
async function initPhotos() {
  const { data } = await sb.from('site_photos').select('slot, url, label, "order"').order('order');
  if (!data || !data.length) return;

  const bySlot = {};
  data.forEach(p => { (bySlot[p.slot] = bySlot[p.slot] || []).push(p); });

  // Hero slideshow
  const heroMobile  = bySlot.hero_mobile  || [];
  const heroDesktop = bySlot.hero_desktop || [];
  if (heroMobile.length || heroDesktop.length) {
    const container = document.getElementById('hero-slideshow');
    if (container) {
      container.querySelectorAll('.slide').forEach(s => s.remove());
      heroDesktop.forEach(p => {
        const img = document.createElement('img');
        img.src = p.url; img.alt = p.label || 'Foto';
        img.className = 'slide'; img.dataset.device = 'desktop';
        container.appendChild(img);
      });
      heroMobile.forEach(p => {
        const img = document.createElement('img');
        img.src = p.url; img.alt = p.label || 'Foto';
        img.className = 'slide'; img.dataset.device = 'mobile';
        container.appendChild(img);
      });
      startSlideshow();
    }
  }

  // Galeria pré-wedding
  const preGrid = document.getElementById('gallery-prewedding-grid');
  if (preGrid) {
    const photos = bySlot.gallery_prewedding || [];
    preGrid.innerHTML = photos.map(p =>
      `<div class="gallery-item"><img src="${p.url}" alt="${esc(p.label || 'Pré-wedding')}" loading="lazy" /></div>`
    ).join('');
  }

  // Galeria casamento
  const casGrid   = document.getElementById('gallery-casamento-grid');
  const casSoon   = document.getElementById('gallery-casamento-soon');
  if (casGrid && casSoon) {
    const photos = bySlot.gallery_casamento || [];
    if (photos.length) {
      casSoon.style.display = 'none';
      casGrid.innerHTML = photos.map(p =>
        `<div class="gallery-item"><img src="${p.url}" alt="${esc(p.label || 'Casamento')}" loading="lazy" /></div>`
      ).join('');
    }
  }

  // Timeline fotos
  [1, 2, 3].forEach(n => {
    const wrap = document.getElementById(`story-${n}-photo-wrap`);
    if (!wrap) return;
    const photos = bySlot[`timeline_${n}`];
    if (photos && photos.length) {
      wrap.innerHTML = `<img src="${photos[0].url}" alt="${esc(photos[0].label || 'Nossa história')}" />`;
      wrap.classList.remove('placeholder-photo');
    }
  });
}
initPhotos();

// ===========================
// RECADOS
// ===========================
async function submitMessage(e) {
  e.preventDefault();
  const name = document.getElementById('msg-name').value.trim();
  const text = document.getElementById('msg-text').value.trim();
  if (!name || !text) return;
  const { error } = await sb.from('messages').insert({ author: name, content: text });
  if (error) { console.error(error); return; }
  document.getElementById('messageForm').reset();
  document.getElementById('msg-success').style.display = 'block';
  setTimeout(() => { document.getElementById('msg-success').style.display = 'none'; }, 4000);
  loadMessages();
}

async function loadMessages() {
  const { data } = await sb.from('messages').select('author, content')
    .order('created_at', { ascending: false }).limit(50);
  if (!data) return;
  document.getElementById('messagesList').innerHTML = data.map(m => `
    <div class="message-card">
      <p class="msg-author">${esc(m.author)}</p>
      <p class="msg-text">${esc(m.content)}</p>
    </div>`).join('') || '';
}
loadMessages();

// ===========================
// UTILITÁRIOS
// ===========================
function esc(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===========================
// ANIMAÇÕES DE SCROLL
// ===========================
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });

document.querySelectorAll('.timeline-card, .info-card, .story-inner, .count-item').forEach(el => {
  el.classList.add('fade-up');
  observer.observe(el);
});
