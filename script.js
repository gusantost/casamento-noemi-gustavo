// ===========================
// HORIZONTAL SCROLL
// ===========================
(function () {
  const wrapper = document.querySelector('.hscroll-wrapper');
  const track   = document.getElementById('hscroll-track');
  if (!wrapper || !track) return;

  let current = 0;
  let target  = 0;

  function isMobile() { return window.innerWidth <= 768; }

  function update() {
    const wrapperTop = wrapper.offsetTop;
    const wrapperH   = wrapper.offsetHeight;
    const scrollY    = window.scrollY;
    const viewH      = window.innerHeight;
    const maxScroll  = wrapperH - viewH;
    const scrolled   = Math.max(0, Math.min(scrollY - wrapperTop, maxScroll));
    const progress   = maxScroll > 0 ? scrolled / maxScroll : 0;

    if (isMobile()) {
      // Snap ao card mais próximo
      const cards     = Array.from(track.children);
      const numCards  = cards.length;
      const rawIndex  = progress * (numCards - 1);
      const snapIndex = Math.round(rawIndex);
      const cardW     = cards[0] ? cards[0].offsetWidth : window.innerWidth;
      target = -snapIndex * cardW;
    } else {
      const maxTranslate = track.scrollWidth - track.parentElement.clientWidth + 128;
      target = -progress * maxTranslate;
    }
  }

  function animate() {
    const ease = isMobile() ? 0.1 : 0.07;
    current += (target - current) * ease;
    track.style.transform = `translateX(${current}px)`;
    requestAnimationFrame(animate);
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', () => { current = 0; target = 0; update(); });
  update();
  animate();
})();

// ===========================
// SLIDESHOW HERO
// ===========================
(function () {
  const allSlides = Array.from(document.querySelectorAll('.hero-slideshow .slide'));
  if (!allSlides.length) return;

  let timer = null;
  let current = 0;

  function isDesktop() { return window.innerWidth > 768; }

  function getSlides() {
    const device = isDesktop() ? 'desktop' : 'mobile';
    return allSlides.filter(s => s.dataset.device === 'all' || s.dataset.device === device);
  }

  function startSlideshow() {
    if (timer) clearInterval(timer);
    allSlides.forEach(s => s.classList.remove('active'));
    const slides = getSlides();
    current = 0;
    slides[0].classList.add('active');
    timer = setInterval(() => {
      const slides = getSlides();
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 5000);
  }

  startSlideshow();
  window.addEventListener('resize', startSlideshow);
})();

// ===========================
// CONTAGEM REGRESSIVA
// ===========================
function updateCountdown() {
  const wedding = new Date('2026-10-08T15:00:00');
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
// Edite as famílias e membros aqui
// ===========================
const guestFamilies = [
  {
    family: 'Família Teixeira',
    members: ['Gustavo Teixeira', 'Noemi Medeiros']
  },
  {
    family: 'Família Judas',
    members: ['Judas Tadeu', 'Bruna Santos', 'Jolie Teixeira', 'Gustavo Santos']
  }
];

const guestStatus = {};
guestFamilies.forEach(g => g.members.forEach(m => { guestStatus[m] = 'pending'; }));

function normalize(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function searchGuest() {
  const input = document.getElementById('guest-search-input').value.trim();
  const box   = document.getElementById('family-result');

  const words = input.split(/\s+/).filter(w => w.length > 0);
  if (input.length < 2 || words.length === 0) { box.style.display = 'none'; return; }

  const queryWords = words.map(normalize);

  // Coleta TODAS as famílias que têm ao menos um membro que bate com as palavras digitadas
  const matchedGroups = [];
  for (const group of guestFamilies) {
    for (const member of group.members) {
      const memberNorm = normalize(member);
      const allMatch   = queryWords.every(w => memberNorm.includes(w));
      if (allMatch) { matchedGroups.push(group); break; }
    }
  }

  box.style.display = 'block';

  if (matchedGroups.length === 0) {
    box.innerHTML = `
      <div class="family-not-found">
        <p>Nome não encontrado na lista.<br />Verifique a grafia ou entre em contato com os noivos.</p>
      </div>`;
  } else {
    renderFamilyPicker(matchedGroups, box);
  }
}

function renderFamilyPicker(groups, box) {
  const buttons = groups.map(g => `
    <button class="family-pick-btn" onclick="pickFamily('${esc(g.family)}')">
      ${esc(g.family)}
    </button>
  `).join('');

  box.innerHTML = `
    <div class="family-picker">
      <p class="family-picker-title">Encontramos mais de uma família com esse nome. Selecione a sua:</p>
      <div class="family-picker-btns">${buttons}</div>
    </div>`;
}

function pickFamily(familyName) {
  const group = guestFamilies.find(g => g.family === familyName);
  if (group) renderFamily(group, document.getElementById('family-result'));
}

function renderFamily(group, box) {
  const labels = { pending: 'Pendente', confirmed: 'Confirmado ✓', declined: 'Não irá comparecer' };

  const rows = group.members.map(name => {
    const status = guestStatus[name] || 'pending';
    return `
      <div class="family-member-row">
        <span class="member-name">${esc(name)}</span>
        <span class="member-status ${status}">${labels[status]}</span>
        <div class="member-actions">
          <button class="btn-confirm ${status === 'confirmed' ? 'active' : ''}"
            onclick="setStatus('${esc(name)}', 'confirmed', '${esc(group.family)}')">
            Vou comparecer
          </button>
          <button class="btn-decline ${status === 'declined' ? 'active' : ''}"
            onclick="setStatus('${esc(name)}', 'declined', '${esc(group.family)}')">
            Não poderei ir
          </button>
        </div>
      </div>`;
  }).join('');

  box.innerHTML = `<p class="family-result-title">${esc(group.family)}</p>${rows}`;
}

function setStatus(name, status, familyName) {
  guestStatus[name] = status;
  const group = guestFamilies.find(g => g.family === familyName);
  if (group) renderFamily(group, document.getElementById('family-result'));
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
// PAGAMENTO — configuração
// ===========================
const PIX_KEY        = '000.000.000-00';
const CARD_BASE_LINK = 'https://mpago.la/SEU_LINK';

function openPaymentModal(giftName, price) {
  document.getElementById('modal-gift-name').textContent  = giftName;
  document.getElementById('modal-gift-price').textContent =
    price > 0 ? `R$ ${price.toFixed(2).replace('.', ',')}` : 'Valor livre';
  document.getElementById('pix-key-value').textContent    = PIX_KEY;
  document.getElementById('pix-amount').textContent       =
    price > 0 ? `R$ ${price.toFixed(2).replace('.', ',')}` : 'À sua escolha';
  document.getElementById('card-payment-link').href       = CARD_BASE_LINK;

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
  navigator.clipboard.writeText(PIX_KEY).then(() => {
    const el = document.getElementById('pix-copied');
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
  });
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closePaymentModal();
    closeRsvpOverlay();
  }
});

// RSVP removido — confirmação agora é feita via lista de convidados (setStatus)

// ===========================
// RECADOS
// ===========================
const messages = [];

function submitMessage(e) {
  e.preventDefault();
  const name = document.getElementById('msg-name').value.trim();
  const text = document.getElementById('msg-text').value.trim();
  if (!name || !text) return;

  messages.unshift({ name, text });
  renderMessages();
  document.getElementById('messageForm').reset();
  document.getElementById('msg-success').style.display = 'block';
  setTimeout(() => { document.getElementById('msg-success').style.display = 'none'; }, 4000);
}

function renderMessages() {
  document.getElementById('messagesList').innerHTML = messages.map(m => `
    <div class="message-card">
      <p class="msg-author">${esc(m.name)}</p>
      <p class="msg-text">${esc(m.text)}</p>
    </div>
  `).join('');
}

function esc(str) {
  return str
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===========================
// ANIMAÇÕES DE SCROLL
// ===========================
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });

document.querySelectorAll(
  '.timeline-card, .info-card, .story-inner, .count-item'
).forEach(el => {
  el.classList.add('fade-up');
  observer.observe(el);
});
