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
  if (unit.toLocaleLowerCase() !== 'kg' || quantity < 10) {
    showCatalogToast('Minimum order is 10 kg. Use the basket to combine kilogram items.');
    return null;
  }
  return `ORDER REQUEST — RATE CONFIRMATION NEEDED\n\nI’d like to order ${quantity} ${unit} of ${product.name}.\n\nMy name: \nRestaurant: \nDelivery area: \nRequired date: \n\nPlease confirm availability, current unit rate, delivery details and any applicable charges. This is a request, not a confirmed order; I will approve the details before fulfillment.`
}

function getKilogramTotal() {
  return lines.reduce((total, line) => (
    String(line.u).trim().toLocaleLowerCase() === 'kg'
    && Number.isFinite(Number(line.q))
    && Number(line.q) > 0
      ? total + Number(line.q)
      : total
  ), 0);
}

function updateKilogramProgress() {
  const total = getKilogramTotal();
  const status = document.getElementById('kilogramMinimumStatus');
  if (status) {
    status.textContent = `Kilogram items: ${Number(total.toFixed(2))} kg / 10 kg minimum. Other units do not count toward the minimum.`;
    status.classList.toggle('is-met', total >= 10);
  }
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

function getOrderTemplates() {
  try {
    const saved = JSON.parse(localStorage.getItem('m2k-order-templates') || '[]');
    return Array.isArray(saved)
      ? saved.filter((template) => (
        template
        && typeof template.name === 'string'
        && Array.isArray(template.lines)
        && template.lines.length > 0
      )).map((template) => ({
        name: template.name.slice(0, 40),
        lines: template.lines.filter((line) => (
          line
          && typeof line.p === 'string'
          && typeof line.u === 'string'
          && Number.isFinite(Number(line.q))
          && Number(line.q) > 0
        )).map((line) => ({ p: line.p, q: Number(line.q), u: line.u })),
      })).filter((template) => template.lines.length > 0)
      : [];
  } catch {
    return [];
  }
}

function renderOrderTemplates() {
  const select = document.getElementById('savedOrderTemplates');
  if (!select) return;

  const templates = getOrderTemplates();
  select.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = templates.length ? 'Choose a template' : 'No templates saved';
  select.append(placeholder);
  templates.forEach((template, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = template.name;
    select.append(option);
  });
  select.onchange = updateOrderTemplateButtons;
  updateOrderTemplateButtons();
}

function updateOrderTemplateButtons() {
  const hasSelection = Boolean(document.getElementById('savedOrderTemplates')?.value);
  const loadButton = document.getElementById('loadOrderTemplateButton');
  const deleteButton = document.getElementById('deleteOrderTemplateButton');
  if (loadButton) loadButton.disabled = !hasSelection;
  if (deleteButton) deleteButton.disabled = !hasSelection;
}

function saveOrderTemplate() {
  const nameField = document.getElementById('orderTemplateName');
  const name = nameField.value.trim();
  if (!lines.length) {
    showCatalogToast('Add products before saving a template.');
    return;
  }
  if (!name) {
    nameField.setCustomValidity('Enter a name for this order template.');
    nameField.reportValidity();
    return;
  }

  nameField.setCustomValidity('');
  const templates = getOrderTemplates();
  const existingIndex = templates.findIndex((template) => template.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  if (existingIndex < 0 && templates.length >= 8) {
    showCatalogToast('You can save up to 8 templates in this browser.');
    return;
  }

  const template = {
    name,
    lines: lines.map(({ p, q, u }) => ({ p, q: Number(q), u })),
  };
  if (existingIndex >= 0) templates[existingIndex] = template;
  else templates.push(template);

  try {
    localStorage.setItem('m2k-order-templates', JSON.stringify(templates));
    renderOrderTemplates();
    document.getElementById('savedOrderTemplates').value = String(existingIndex >= 0 ? existingIndex : templates.length - 1);
    updateOrderTemplateButtons();
    nameField.value = '';
    showCatalogToast(existingIndex >= 0 ? 'Order template updated.' : 'Order template saved in this browser.');
  } catch {
    showCatalogToast('Could not save the template in this browser.');
  }
}

function loadOrderTemplate() {
  const select = document.getElementById('savedOrderTemplates');
  if (!select.value) {
    showCatalogToast('Choose a saved template first.');
    return;
  }
  const index = Number(select.value);
  const template = getOrderTemplates()[index];
  if (!template) {
    showCatalogToast('Choose a saved template first.');
    return;
  }
  if (lines.length && !window.confirm('Replace the current basket with this template?')) return;

  lines = template.lines.map((line) => ({ ...line }));
  saveOrder();
  renderLines();
  showCatalogToast(`Loaded “${template.name}” into your basket.`);
}

function deleteOrderTemplate() {
  const select = document.getElementById('savedOrderTemplates');
  if (!select.value) {
    showCatalogToast('Choose a saved template first.');
    return;
  }
  const index = Number(select.value);
  const templates = getOrderTemplates();
  const template = templates[index];
  if (!template) {
    showCatalogToast('Choose a saved template first.');
    return;
  }
  if (!window.confirm(`Delete the “${template.name}” template?`)) return;

  templates.splice(index, 1);
  try {
    localStorage.setItem('m2k-order-templates', JSON.stringify(templates));
    renderOrderTemplates();
    showCatalogToast('Order template deleted.');
  } catch {
    showCatalogToast('Could not delete the template in this browser.');
  }
}

const deliveryLocationFieldIds = [
  'orderArea',
  'orderAddress',
  'orderWindow',
  'orderNotes',
];

function getDeliveryLocations() {
  try {
    const saved = JSON.parse(localStorage.getItem('m2k-delivery-locations') || '[]');
    return Array.isArray(saved)
      ? saved.filter((location) => (
        location
        && typeof location.name === 'string'
        && typeof location.orderArea === 'string'
        && typeof location.orderAddress === 'string'
      )).slice(0, 10)
      : [];
  } catch {
    return [];
  }
}

function renderDeliveryLocations() {
  const select = document.getElementById('savedDeliveryLocations');
  if (!select) return;

  const locations = getDeliveryLocations();
  select.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = locations.length ? 'Choose a location' : 'No locations saved';
  select.append(placeholder);
  locations.forEach((location, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = location.name;
    select.append(option);
  });
  updateDeliveryLocationButtons();
}

function updateDeliveryLocationButtons() {
  const hasSelection = Boolean(document.getElementById('savedDeliveryLocations')?.value);
  const applyButton = document.getElementById('applyDeliveryLocationButton');
  const deleteButton = document.getElementById('deleteDeliveryLocationButton');
  if (applyButton) applyButton.disabled = !hasSelection;
  if (deleteButton) deleteButton.disabled = !hasSelection;
}

function saveDeliveryLocation() {
  const nameField = document.getElementById('deliveryLocationName');
  const name = nameField.value.trim();
  const area = document.getElementById('orderArea').value;
  const address = document.getElementById('orderAddress').value.trim();
  if (!name || !area || !address) {
    showCatalogToast('Enter a location name, delivery area and address first.');
    return;
  }

  const locations = getDeliveryLocations();
  const existingIndex = locations.findIndex((location) => location.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  if (existingIndex < 0 && locations.length >= 10) {
    showCatalogToast('You can save up to 10 delivery locations in this browser.');
    return;
  }

  const location = { name };
  deliveryLocationFieldIds.forEach((id) => {
    location[id] = document.getElementById(id).value;
  });
  if (existingIndex >= 0) locations[existingIndex] = location;
  else locations.push(location);

  try {
    localStorage.setItem('m2k-delivery-locations', JSON.stringify(locations));
    renderDeliveryLocations();
    document.getElementById('savedDeliveryLocations').value = String(existingIndex >= 0 ? existingIndex : locations.length - 1);
    nameField.value = '';
    showCatalogToast(existingIndex >= 0 ? 'Delivery location updated.' : 'Delivery location saved on this device.');
  } catch {
    showCatalogToast('Could not save the delivery location in this browser.');
  }
}

function applyDeliveryLocation() {
  const select = document.getElementById('savedDeliveryLocations');
  if (!select.value) {
    showCatalogToast('Choose a saved location first.');
    return;
  }
  const location = getDeliveryLocations()[Number(select.value)];
  if (!location) {
    showCatalogToast('Choose a saved location first.');
    return;
  }

  deliveryLocationFieldIds.forEach((id) => {
    if (typeof location[id] === 'string') document.getElementById(id).value = location[id];
  });
  showCatalogToast(`Applied delivery details for “${location.name}”.`);
}

function deleteDeliveryLocation() {
  const select = document.getElementById('savedDeliveryLocations');
  if (!select.value) {
    showCatalogToast('Choose a saved location first.');
    return;
  }
  const locations = getDeliveryLocations();
  const index = Number(select.value);
  const location = locations[index];
  if (!location) {
    showCatalogToast('Choose a saved location first.');
    return;
  }
  if (!window.confirm(`Delete the “${location.name}” delivery location?`)) return;

  locations.splice(index, 1);
  try {
    localStorage.setItem('m2k-delivery-locations', JSON.stringify(locations));
    renderDeliveryLocations();
    showCatalogToast('Delivery location deleted.');
  } catch {
    showCatalogToast('Could not delete the delivery location.');
  }
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
  updateKilogramProgress();
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
  updateKilogramProgress();
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
  const substitution = document.getElementById('orderSubstitution').value;

  return [
    'ORDER REQUEST — RATE CONFIRMATION NEEDED',
    '',
    `My name is ${contactName} from ${name}. I’d like to place this order.`,
    '',
    `Contact: ${phone}`,
    `Delivery area: ${area}`,
    `Required date: ${date}`,
    `Preferred delivery window: ${windowPreference || 'No preference'}`,
    `PO / kitchen reference: ${reference || 'None'}`,
    `Delivery address: ${address}`,
    '',
    `Products requested:\n${lines.map((line) => `${line.p} — ${line.q} ${line.u}`).join('\n')}`,
    `Substitution preference: ${substitution || 'Please confirm with me before substituting'}`,
    `Kitchen / delivery notes: ${notes || 'None'}`,
    '',
    'Please reply with availability, current unit rates, any applicable delivery or handling charges, and the delivery plan.',
    'This is a request, not a confirmed order. I will review and approve the details before fulfillment.',
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
  'orderSubstitution',
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
  if (getKilogramTotal() < 10) {
    showCatalogToast(`Minimum order is 10 kg of kilogram-priced items. Current total: ${Number(getKilogramTotal().toFixed(2))} kg.`);
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

async function sendOrder() {
  if (!lines.length) {
    alert('Add at least one product.');
    return;
  }
  if (lines.some((line) => !line.p.trim() || !Number.isFinite(Number(line.q)) || Number(line.q) <= 0)) {
    alert('Check each product and quantity.');
    return;
  }
  if (getKilogramTotal() < 10) {
    showCatalogToast(`Minimum order is 10 kg of kilogram-priced items. Current total: ${Number(getKilogramTotal().toFixed(2))} kg.`);
    document.getElementById('kilogramMinimumStatus')?.focus();
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

  const whatsappWindow = window.open('about:blank', '_blank');
  if (whatsappWindow) {
    whatsappWindow.opener = null;
    whatsappWindow.document.title = 'Preparing order request';
    whatsappWindow.document.body.textContent = 'Saving your order request and opening WhatsApp…';
  }

  let whatsappMessage = message;
  const apiBase = window.M2K_API_URL || (window.location.protocol === 'file:' ? 'http://localhost:5000' : window.location.origin);
  try {
    const response = await fetch(`${apiBase}/orders`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: {
          name: document.getElementById('restaurantName').value.trim(),
          phone: document.getElementById('orderPhone').value.trim(),
          address: document.getElementById('orderAddress').value.trim(),
        },
        items: lines.map((line) => ({
          productName: line.p.trim(),
          quantity: Number(line.q),
          unit: line.u.trim().toLocaleLowerCase(),
        })),
        deliveryDate: document.getElementById('orderDate').value,
        deliveryWindow: document.getElementById('orderWindow').value,
        reference: document.getElementById('orderReference').value.trim(),
        substitutionPreference: document.getElementById('orderSubstitution').value,
        notes: document.getElementById('orderNotes').value.trim(),
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || `Backend returned ${response.status}.`);

    whatsappMessage += [
      '',
      `Saved order request: ${result.order._id}`,
      `Indicative catalogue total: ₹${Number(result.order.total).toFixed(2)}. Final rates and charges require confirmation.`,
    ].join('\n');
    showCatalogToast('Request saved. Opening WhatsApp for rate confirmation.');
  } catch (error) {
    showCatalogToast(`Not saved online: ${error.message}. Continuing to WhatsApp.`);
  }

  const whatsappUrl = `https://wa.me/919695871673?s=t&text=${encodeURIComponent(whatsappMessage)}`;
  if (whatsappWindow) whatsappWindow.location.replace(whatsappUrl);
  else window.location.assign(whatsappUrl);
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
    'Please confirm availability, current unit rate, delivery details and any applicable charges. This is a sourcing inquiry, not a confirmed order. Confirmed orders must meet the 10 kg minimum across kilogram items; other units do not count toward the minimum.',
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
renderOrderTemplates();
renderDeliveryLocations();
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

const homeRevealItems = document.querySelectorAll('.home-page [data-home-reveal]');
if (
  homeRevealItems.length
  && window.IntersectionObserver
  && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
) {
  document.body.classList.add('home-reveal-ready');
  const homeRevealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  homeRevealItems.forEach((item) => homeRevealObserver.observe(item));
}
