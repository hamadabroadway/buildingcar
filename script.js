/* ============================================================
   BUILDING CAR — script.js
   ============================================================ */

// ─── CONFIGURATION ────────────────────────────────────────────
// Changez ce numéro pour modifier la destination WhatsApp
const WHATSAPP_NUMBER = '212631137474';
// ──────────────────────────────────────────────────────────────


/* ── 1. HEADER STICKY ── */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });


/* ── 2. MENU BURGER (mobile) ── */
const burger = document.getElementById('burger');
const nav    = document.getElementById('nav');

burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  nav.classList.toggle('open');
  document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
});

// fermer le menu en cliquant sur un lien
nav.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('open');
    nav.classList.remove('open');
    document.body.style.overflow = '';
  });
});


/* ── 3. ANIMATIONS AU SCROLL (Intersection Observer) ── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target); // anime une seule fois
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// Le hero s'anime immédiatement (pas besoin de scroll)
setTimeout(() => {
  document.querySelector('.hero .fade-in')?.classList.add('visible');
}, 100);


/* ── 4. BOUTONS "RÉSERVER CETTE VOITURE" → pré-remplir le formulaire ── */
const carSelect = document.getElementById('res-car');

document.querySelectorAll('.book-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const card    = btn.closest('.car-card');
    const carName = card.dataset.car;

    // Pré-remplir le menu déroulant
    if (carSelect) {
      carSelect.value = carName;
      carSelect.classList.remove('error');
    }

    // Scroll fluide vers le formulaire
    document.getElementById('reservation')?.scrollIntoView({ behavior: 'smooth' });

    // Afficher le récap prix
    updatePriceRecap();
  });
});


/* ── 5. RÉCAP PRIX ESTIMÉ ── */
const resStart  = document.getElementById('res-start');
const resEnd    = document.getElementById('res-end');
const priceRecap = document.getElementById('priceRecap');
const recapText  = document.getElementById('recapText');

// Récupérer le prix/jour depuis la carte voiture correspondante
function getPricePerDay(carName) {
  const card = [...document.querySelectorAll('.car-card')]
    .find(c => c.dataset.car === carName);
  return card ? parseInt(card.dataset.price, 10) : null;
}

function updatePriceRecap() {
  const car   = carSelect?.value;
  const start = resStart?.value;
  const end   = resEnd?.value;

  if (!car || !start || !end) { priceRecap.style.display = 'none'; return; }

  const days  = Math.ceil((new Date(end) - new Date(start)) / 86400000);
  const price = getPricePerDay(car);

  if (days <= 0 || !price) { priceRecap.style.display = 'none'; return; }

  recapText.textContent =
    `🚗 ${car} · ${days} jour${days > 1 ? 's' : ''} · Estimation : ${(days * price).toLocaleString('fr-FR')} MAD`;
  priceRecap.style.display = 'block';
}

carSelect?.addEventListener('change', updatePriceRecap);
resStart?.addEventListener('change',  updatePriceRecap);
resEnd?.addEventListener('change',    updatePriceRecap);

// Bloquer les dates passées
const today = new Date().toISOString().split('T')[0];
if (resStart) resStart.min = today;
if (resEnd)   resEnd.min   = today;

// date fin ≥ date début
resStart?.addEventListener('change', () => {
  if (resEnd && resStart.value) resEnd.min = resStart.value;
});


/* ── 6. ENVOI DU FORMULAIRE VIA WHATSAPP ── */
const form = document.getElementById('reservationForm');

form?.addEventListener('submit', (e) => {
  e.preventDefault();

  // Récupérer les valeurs
  const name     = document.getElementById('res-name').value.trim();
  const phone    = document.getElementById('res-phone').value.trim();
  const car      = carSelect.value;
  const start    = resStart.value;
  const end      = resEnd.value;
  const location = document.getElementById('res-location').value.trim();
  const message  = document.getElementById('res-message').value.trim();

  // ── Validation basique ──
  let hasError = false;

  function setError(id, state) {
    const el = document.getElementById(id);
    el?.classList.toggle('error', state);
    if (state && !hasError) { el?.focus(); hasError = true; }
  }

  setError('res-name',     !name);
  setError('res-phone',    !phone);
  setError('res-car',      !car);
  setError('res-start',    !start);
  setError('res-end',      !end);
  setError('res-location', !location);

  if (hasError) return;

  // ── Construire le message WhatsApp ──
  const days     = Math.ceil((new Date(end) - new Date(start)) / 86400000);
  const price    = getPricePerDay(car);
  const estimate = price && days > 0
    ? `\n💰 Estimation : ${(days * price).toLocaleString('fr-FR')} MAD (${days} jour${days > 1 ? 's' : ''})`
    : '';

  const waMessage = [
    '🚗 *Nouvelle demande de réservation — Building Car*',
    '',
    `👤 *Nom :* ${name}`,
    `📞 *Téléphone :* ${phone}`,
    `🚘 *Voiture :* ${car}`,
    `📅 *Du :* ${formatDate(start)} *au :* ${formatDate(end)}${estimate}`,
    `📍 *Lieu de prise en charge :* ${location}`,
    message ? `💬 *Message :* ${message}` : '',
  ].filter(Boolean).join('\n');

  // ── Ouvrir WhatsApp ──
  const encoded = encodeURIComponent(waMessage);
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank', 'noopener');
});

// Supprimer la classe error quand l'utilisateur corrige un champ
form?.querySelectorAll('input, select, textarea').forEach(el => {
  el.addEventListener('input', () => el.classList.remove('error'));
});


/* ── UTILITAIRES ── */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
