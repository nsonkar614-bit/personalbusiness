const productCatalog = [
  ['Tomato', '🍅', 'fruiting'],
  ['Onion', '🧅', 'aromatics'],
  ['Potato', '🥔', 'roots'],
  ['Green Chilli', '🌶️', 'fruiting'],
  ['Coriander', '🌿', 'herbs'],
  ['Capsicum', '🫑', 'fruiting'],
  ['Cauliflower', '🥦', 'cruciferous'],
  ['Carrot', '🥕', 'roots'],
  ['Garlic', '🧄', 'aromatics'],
  ['Ginger', '🫚', 'roots'],
  ['Cucumber', '🥒', 'fruiting'],
  ['Cabbage', '🥬', 'cruciferous'],
  ['Spinach', '🥬', 'leafy greens'],
  ['Lady Finger', '🌱', 'fruiting'],
  ['Brinjal', '🍆', 'fruiting'],
  ['Green Peas', '🫛', 'legumes'],
  ['French Beans', '🫛', 'legumes'],
  ['Lemon', '🍋', 'fruiting'],
  ['Mint', '🌿', 'herbs'],
  ['Curry Leaves', '🍃', 'herbs'],
  ['Spring Onion', '🧅', 'alliums'],
  ['Beetroot', '🫜', 'roots'],
  ['Bottle Gourd', '🥒', 'gourds'],
  ['Pumpkin', '🎃', 'gourds'],
  ['Radish', '🥕', 'roots'],
  ['Sweet Corn', '🌽', 'grains'],
  ['Mushroom', '🍄', 'mushrooms'],
  ['Drumstick', '🌿', 'fruiting'],
];

window.catalogProducts = productCatalog.map(([name, emoji, category]) => ({
  name,
  emoji,
  category,
  default_unit: 'kg',
}));

const productGrid = document.getElementById('productGrid');

function getFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem('m2k-favorite-products') || '[]');
    return new Set(Array.isArray(saved) ? saved.filter((name) => typeof name === 'string') : []);
  } catch {
    return new Set();
  }
}

function getLastOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem('m2k-last-order') || '[]');
    return Array.isArray(saved)
      ? saved.filter((line) => (
        line
        && typeof line.p === 'string'
        && typeof line.u === 'string'
        && Number.isFinite(Number(line.q))
        && Number(line.q) > 0
      ))
      : [];
  } catch {
    return [];
  }
}

function renderCatalog() {
  if (!productGrid) return;

  const query = (document.getElementById('catalogSearch')?.value || '')
    .trim()
    .toLocaleLowerCase();
  const category = document.getElementById('catalogCategory')?.value || '';
  const favoritesOnly = document.getElementById('favoritesOnly')?.getAttribute('aria-pressed') === 'true';
  const favorites = getFavorites();
  const matches = productCatalog
    .map(([name, emoji, group]) => ({
      name,
      emoji,
      category: group,
      default_unit: 'kg',
    }))
    .filter((product) => (
      (!category || product.category === category)
      && (!query || product.name.toLocaleLowerCase().includes(query))
      && (!favoritesOnly || favorites.has(product.name))
    ));

  window.catalogProducts = matches;
  productGrid.innerHTML = matches.length
    ? matches.map((product, index) => {
      const saved = favorites.has(product.name);

      return [
        '<article class="product">',
        `<button type="button" class="favorite-toggle${saved ? ' is-favorite' : ''}" aria-label="${saved ? 'Remove' : 'Add'} ${product.name} ${saved ? 'from' : 'to'} favorites" aria-pressed="${saved}" onclick="toggleFavorite('${product.name}')">${saved ? '★' : '☆'}</button>`,
        `<div class="emoji" aria-hidden="true">${product.emoji}</div>`,
        `<h3>${product.name}</h3>`,
        '<p>Availability confirmed with your order</p>',
        '<span class="price">Rate confirmed via WhatsApp</span>',
        '<div class="catalog-controls">',
        `<input id="catalogQty-${index}" type="number" min="0.1" step="0.1" value="1" aria-label="${product.name} quantity">`,
        `<select id="catalogUnit-${index}" aria-label="${product.name} unit"><option>kg</option><option>piece</option><option>bunch</option><option>box</option><option>crate</option></select>`,
        `<button type="button" class="add-product" onclick="addProduct(${index})">Add to order</button>`,
        `<button type="button" class="quick-order" aria-label="WhatsApp order for ${product.name}" onclick="startProductOrder(${index})">WhatsApp order ↗</button>`,
        '</div>',
        '</article>',
      ].join('');
    }).join('')
    : '<p class="catalog-empty">No products match your search.</p>';

  const results = document.getElementById('productResults');
  if (results) results.textContent = `${matches.length} ${matches.length === 1 ? 'product' : 'products'}`;

  const repeatButton = document.getElementById('repeatLastOrder');
  if (repeatButton) repeatButton.hidden = getLastOrder().length === 0;
}

function toggleFavorite(name) {
  const favorites = getFavorites();
  if (favorites.has(name)) {
    favorites.delete(name);
  } else {
    favorites.add(name);
  }

  try {
    localStorage.setItem('m2k-favorite-products', JSON.stringify([...favorites]));
  } catch {
  }

  renderCatalog();
}

function showCatalogToast(message) {
  const toast = document.getElementById('catalogToast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showCatalogToast.timer);
  showCatalogToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

if (productGrid) {
  const categories = [...new Set(productCatalog.map(([, , category]) => category))].sort();
  document.getElementById('catalogCategory').innerHTML = '<option value="">All categories</option>'
    + categories.map((category) => `<option value="${category}">${category.replace(/\b\w/g, (letter) => letter.toUpperCase())}</option>`).join('');
  document.getElementById('catalogSearch').addEventListener('input', renderCatalog);
  document.getElementById('catalogCategory').addEventListener('change', renderCatalog);
  document.getElementById('favoritesOnly').addEventListener('click', (event) => {
    const active = event.currentTarget.getAttribute('aria-pressed') === 'true';
    event.currentTarget.setAttribute('aria-pressed', String(!active));
    event.currentTarget.textContent = active ? '☆ Favorites' : '★ Favorites only';
    renderCatalog();
  });
  document.getElementById('repeatLastOrder').addEventListener('click', repeatLastOrder);
  renderCatalog();
}

let lines = [];

try {
  const saved = JSON.parse(localStorage.getItem('m2k-order-lines') || '[]');
  if (Array.isArray(saved)) {
    lines = saved.filter((line) => (
      line
      && typeof line.p === 'string'
      && typeof line.u === 'string'
      && Number.isFinite(Number(line.q))
      && Number(line.q) > 0
    ));
  }
} catch {
}

function saveOrder() {
  try {
    localStorage.setItem('m2k-order-lines', JSON.stringify(lines));
  } catch {
  }
  updateOrderCount();
}

function updateOrderCount() {
  const badge = document.getElementById('orderCount');
  if (badge) {
    badge.textContent = lines.length;
    badge.hidden = lines.length === 0;
    badge.setAttribute('aria-label', `${lines.length} ${lines.length === 1 ? 'item' : 'items'} in order`);
  }
  const cartBar = document.getElementById('catalogCart');
  if (cartBar) {
    cartBar.hidden = lines.length === 0;
    cartBar.classList.toggle('is-visible', lines.length > 0);
    document.getElementById('catalogCartSummary').textContent = `${lines.length} ${lines.length === 1 ? 'product' : 'products'} in your order`;
  }
}

function openOrder() {
  document.getElementById('orderModal').classList.add('show');
  renderLines();
}

function openRequest() {
  document.getElementById('requestModal').classList.add('show');
}

function closeModal() {
  document.querySelectorAll('.modal').forEach((modal) => modal.classList.remove('show'));
}

function toggleMenu() {
  const nav = document.getElementById('siteNav');
  const button = document.querySelector('.menu-toggle');
  const open = button.getAttribute('aria-expanded') === 'true';

  button.setAttribute('aria-expanded', String(!open));
  button.setAttribute('aria-label', open ? 'Open navigation menu' : 'Close navigation menu');
  button.title = open ? 'Open navigation menu' : 'Close navigation menu';
  nav.classList.toggle('mobile-open', !open);
}

function closeMenu() {
  const nav = document.getElementById('siteNav');
  const button = document.querySelector('.menu-toggle');

  button.setAttribute('aria-expanded','false');
  button.setAttribute('aria-label','Open navigation menu');
  button.title = 'Open navigation menu';
  nav.classList.remove('mobile-open');
}

function addProduct(index, openCheckout = false) {
  const product = window.catalogProducts[index];
  const quantityInput = document.getElementById(`catalogQty-${index}`);
  const quantity = Number(quantityInput?.value);
  const unit = document.getElementById(`catalogUnit-${index}`)?.value;

  if (!product || !quantityInput) return false;
  quantityInput.setCustomValidity('');
  if (!Number.isFinite(quantity) || quantity <= 0) {
    quantityInput.setCustomValidity('Enter a quantity greater than zero.');
    quantityInput.reportValidity();
    return false;
  }

  const existing = lines.find((line) => line.p === product.name && line.u === unit);
  if (existing) {
    existing.q = Number(existing.q) + quantity;
  } else {
    lines.push({ p: product.name, q: quantity, u: unit });
  }

  saveOrder();
  showCatalogToast(`${product.name} added · ${quantity} ${unit}`);
  if (openCheckout) openOrder();
  return true;
}

function buildProductOrderMessage(index) {
  const product = window.catalogProducts[index];
  const quantityInput = document.getElementById(`catalogQty-${index}`);
  const unitInput = document.getElementById(`catalogUnit-${index}`);
  if (!product || !quantityInput || !unitInput) return null;

  const quantity = Number(quantityInput.value);
  const unit = unitInput.value;
  if (!Number.isFinite(quantity) || quantity <= 0) {
    quantityInput.setCustomValidity('Enter a quantity greater than zero.');
    quantityInput.reportValidity();
    return null;
  }
  quantityInput.setCustomValidity('');
  return `Hello Mandi2Kitchen,\n\nI’d like to order ${quantity} ${unit} of ${product.name}.\n\nMy name: \nRestaurant: \nDelivery area: \n\nPlease confirm availability and delivery details.\nThank you.`
}

function startProductOrder(index) {
  const message = buildProductOrderMessage(index);
  if (!message) return;

  window.open(
    `https://wa.me/919695871673?text=${encodeURIComponent(message)}`,
    '_blank',
    'noopener,noreferrer',
  );
}

function repeatLastOrder() {
  const previous = getLastOrder();
  if (!previous.length) {
    showCatalogToast('No previous order saved yet.');
    return;
  }

  previous.forEach((item) => {
    const existing = lines.find((line) => line.p === item.p && line.u === item.u);
    if (existing) {
      existing.q = Number(existing.q) + Number(item.q);
    } else {
      lines.push({ ...item, q: Number(item.q) });
    }
  });
  saveOrder();
  showCatalogToast('Previous order added to your basket.');
}

function clearOrder() {
  lines = [];
  saveOrder();
  renderLines();
  showCatalogToast('Basket cleared.');
}

function addLine() {
  const productInput = document.getElementById('customProduct');
  const quantityInput = document.getElementById('customQty');
  const productName = productInput.value.trim();
  const quantity = Number(quantityInput.value);
  const unit = document.getElementById('customUnit').value;
  if (!productName || !Number.isFinite(quantity) || quantity <= 0) return;

  const existing = lines.find((line) => line.p === productName && line.u === unit);
  if (existing) {
    existing.q = Number(existing.q) + quantity;
  } else {
    lines.push({ p: productName, q: quantity, u: unit });
  }

  productInput.value = '';
  quantityInput.value = '';
  saveOrder();
  renderLines();
}

function updateLine(index, key, value) {
  lines[index][key] = key === 'q' ? Number(value) : value;
  saveOrder();
}

function removeLine(index) {
  lines.splice(index, 1);
  saveOrder();
  renderLines();
}

function renderLines() {
  document.getElementById('orderLines').innerHTML = lines.length
    ? lines.map((line, index) => [
      '<div class="line">',
      `<input value="${esc(line.p)}" aria-label="Product ${index + 1}" onchange="updateLine(${index},'p',this.value)">`,
      `<input type="number" min="0.1" step="0.1" value="${esc(line.q)}" aria-label="${esc(line.p)} quantity" onchange="updateLine(${index},'q',this.value)">`,
      `<input value="${esc(line.u)}" aria-label="${esc(line.p)} unit" onchange="updateLine(${index},'u',this.value)">`,
      `<button type="button" aria-label="Remove ${esc(line.p)}" onclick="removeLine(${index})">×</button>`,
      '</div>',
    ].join('')).join('')
    : '<p style="color:#718278;font-size:12px">Add your kitchen requirements below. Quantities can be as large as needed.</p>';
}

function buildOrderSummary() {
  const name = document.getElementById('restaurantName').value.trim();
  const contactName = document.getElementById('orderContactName').value.trim();
  const phone = document.getElementById('orderPhone').value.trim();
  const area = document.getElementById('orderArea').value;
  const date = document.getElementById('orderDate').value;
  const address = document.getElementById('orderAddress').value.trim();
  const notes = document.getElementById('orderNotes').value.trim();
  const windowPreference = document.getElementById('orderWindow').value;
  const reference = document.getElementById('orderReference').value.trim();

  return [
    'Hello Mandi2Kitchen,',
    `My name is ${contactName} from ${name}. I’d like to place this order.`,
    '',
    `Contact: ${phone}`,
    `Delivery area: ${area}`,
    `Required date: ${date}`,
    `Preferred delivery window: ${windowPreference || 'No preference'}`,
    `PO / kitchen reference: ${reference || 'None'}`,
    `Delivery address: ${address}`,
    '',
    `Products:\n${lines.map((line) => `${line.p} — ${line.q} ${line.u}`).join('\n')}`,
    `Kitchen / delivery notes: ${notes || 'None'}`,
    '',
    'Please confirm product availability and delivery details.',
    'Thank you.',
  ].join('\n')
}

const savedOrderDetailIds = [
  'restaurantName',
  'orderContactName',
  'orderPhone',
  'orderArea',
  'orderAddress',
  'orderWindow',
  'orderReference',
];

function loadSavedOrderDetails() {
  const rememberCheckbox = document.getElementById('rememberOrderDetails');
  if (!rememberCheckbox) return;

  try {
    const saved = JSON.parse(localStorage.getItem('m2k-saved-order-details') || 'null');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return;

    savedOrderDetailIds.forEach((id) => {
      const field = document.getElementById(id);
      if (field && typeof saved[id] === 'string') field.value = saved[id];
    });
    rememberCheckbox.checked = true;
    document.getElementById('forgetSavedDetails').hidden = false;
  } catch {
    localStorage.removeItem('m2k-saved-order-details');
  }
}

function saveOrderDetailsPreference() {
  const rememberCheckbox = document.getElementById('rememberOrderDetails');
  if (!rememberCheckbox) return;

  if (!rememberCheckbox.checked) {
    localStorage.removeItem('m2k-saved-order-details');
    return;
  }

  const details = Object.fromEntries(savedOrderDetailIds.map((id) => [
    id,
    document.getElementById(id).value,
  ]));
  try {
    localStorage.setItem('m2k-saved-order-details', JSON.stringify(details));
    document.getElementById('forgetSavedDetails').hidden = false;
  } catch {
    showCatalogToast('Could not save details in this browser.');
  }
}

function forgetOrderDetails() {
  localStorage.removeItem('m2k-saved-order-details');
  document.getElementById('rememberOrderDetails').checked = false;
  document.getElementById('forgetSavedDetails').hidden = true;
  showCatalogToast('Saved details forgotten. Current order is unchanged.');
}

async function copyOrderSummary() {
  if (!lines.length) {
    showCatalogToast('Add at least one product first.');
    return;
  }

  try {
    await navigator.clipboard.writeText(buildOrderSummary());
    showCatalogToast('Order details copied.');
  } catch {
    const field = document.createElement('textarea');
    field.value = buildOrderSummary();
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    showCatalogToast(copied ? 'Order details copied.' : 'Copy failed. Please use Send Order on WhatsApp.');
  }
}

function sendOrder() {
  if (!lines.length) {
    alert('Add at least one product.');
    return;
  }
  if (lines.some((line) => !line.p.trim() || !Number.isFinite(Number(line.q)) || Number(line.q) <= 0)) {
    alert('Check each product and quantity.');
    return;
  }
  const requiredFields = [
    ['restaurantName', 'Enter your restaurant or business name.'],
    ['orderContactName', 'Enter your name.'],
    ['orderPhone', 'Enter a contact phone number.'],
    ['orderArea', 'Choose a delivery area.'],
    ['orderDate', 'Choose a required delivery date.'],
    ['orderAddress', 'Enter the delivery address and landmark.'],
  ];
  for (const [id, message] of requiredFields) {
    const field = document.getElementById(id);
    field.setCustomValidity('');
    if (!field.value.trim()) {
      field.setCustomValidity(message);
      field.reportValidity();
      return;
    }
  }
  const phone = document.getElementById('orderPhone');
  const digits = phone.value.replace(/\D/g, '');
  phone.setCustomValidity('');
  if (digits.length < 10 || digits.length > 13) {
    phone.setCustomValidity('Enter a valid phone number with 10 to 13 digits.');
    phone.reportValidity();
    return;
  }
  const dateField = document.getElementById('orderDate');
  if (dateField.value < dateField.min) {
    dateField.setCustomValidity('Choose today or a future date.');
    dateField.reportValidity();
    return;
  }

  const message = buildOrderSummary();
  saveOrderDetailsPreference();
  try {
    localStorage.setItem('m2k-last-order', JSON.stringify(lines.map(({ p, q, u }) => ({ p, q, u }))));
  } catch {
  }
  document.getElementById('repeatLastOrder')?.removeAttribute('hidden');
  window.open(`https://wa.me/919695871673?s=t&text=${encodeURIComponent(message)}`, '_blank', 'noopener');
}

function sendRequest() {
  const product = document.getElementById('reqProduct').value.trim();
  const quantity = document.getElementById('reqQty').value;
  const unit = document.getElementById('reqUnit').value;
  const date = document.getElementById('reqDate').value;
  const quality = document.getElementById('reqQuality').value.trim();
  const notes = document.getElementById('reqNotes').value.trim();
  if (!product || !quantity) {
    alert('Please enter product and quantity.');
    return;
  }
  const message = [
    'CUSTOM PRODUCT REQUEST — Mandi2Kitchen',
    `Product: ${product}`,
    `Quantity: ${quantity} ${unit}`,
    `Required date: ${date || 'As soon as possible'}`,
    `Quality: ${quality || 'Standard fresh quality'}`,
    `Notes: ${notes || 'None'}`,
    '',
    'Please confirm product availability and next steps.',
  ].join('\n');
  window.open(`https://wa.me/919695871673?s=t&text=${encodeURIComponent(message)}`, '_blank', 'noopener');
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}
document.querySelectorAll('#siteNav a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});
document.querySelectorAll('.modal').forEach((modal) => modal.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
}));
updateOrderCount();
const orderDate = document.getElementById('orderDate');
if (orderDate) {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  orderDate.min = today.toISOString().slice(0, 10);
}
loadSavedOrderDetails();

const scene = document.querySelector('.scene');
if (scene && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  scene.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    const bounds = scene.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    scene.style.setProperty('--tilt-x', `${x * 12}deg`);
    scene.style.setProperty('--tilt-y', `${y * -8}deg`);
  });
  scene.addEventListener('pointerleave', () => {
    scene.style.removeProperty('--tilt-x');
    scene.style.removeProperty('--tilt-y');
  });
}
