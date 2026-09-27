function togglePartnerMenu() {
	const nav = document.getElementById('siteNav');
	const button = document.querySelector('.menu-toggle');
	const open = button.getAttribute('aria-expanded') === 'true';

	button.setAttribute('aria-expanded', String(!open));
	button.setAttribute('aria-label', open ? 'Open navigation menu' : 'Close navigation menu');
	button.title = open ? 'Open navigation menu' : 'Close navigation menu';
	nav.classList.toggle('mobile-open', !open);
}

function closePartnerMenu() {
	const nav = document.getElementById('siteNav');
	const button = document.querySelector('.menu-toggle');

	button.setAttribute('aria-expanded', 'false');
	button.setAttribute('aria-label', 'Open navigation menu');
	button.title = 'Open navigation menu';
	nav.classList.remove('mobile-open');
}

document.querySelectorAll('#siteNav a').forEach((link) => {
	link.addEventListener('click', closePartnerMenu);
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') closePartnerMenu();
});

document.getElementById('partnerForm').addEventListener('submit', (event) => {
	event.preventDefault();
	const form = event.currentTarget;
	if (!form.reportValidity()) return;

	const data = new FormData(form);
	const value = (name) => data.get(name)?.trim() || 'Not provided';
	const message = [
		'RESTAURANT PARTNER INQUIRY — Mandi2Kitchen',
		`Business: ${value('businessName')}`,
		`Contact: ${value('contactName')}`,
		`Phone / WhatsApp: ${value('phone')}`,
		`Email: ${value('email')}`,
		`Business type: ${value('businessType')}`,
		`Delivery area: ${value('deliveryArea')}`,
		`Delivery address: ${value('address')}`,
		`Ordering frequency: ${value('frequency')}`,
		`Approx. weekly volume: ${value('volume')}`,
		`Regular produce needs: ${value('produceNeeds')}`,
		`Additional notes: ${value('notes')}`,
		'',
		'Please confirm delivery coverage and availability, then let me know the next steps.',
	].join('\n');

	window.open(
		`https://wa.me/919695871673?text=${encodeURIComponent(message)}`,
		'_blank',
		'noopener,noreferrer',
	);
});