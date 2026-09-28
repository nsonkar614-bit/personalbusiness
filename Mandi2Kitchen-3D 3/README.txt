MANDI2KITCHEN — B2B VEGETABLE ORDERING WEBSITE

The public website can be hosted as static files. The optional Express/MongoDB backend adds online order capture and a password-protected admin panel.

PAGES
- index.html — homepage and business information
- products.html — vegetable catalogue and order builder
- partner.html — restaurant partner inquiry
- how-it-works.html — order and delivery process
- service-areas.html — current service regions and neighborhoods
- backend/ — Express API, MongoDB models, admin dashboard and setup guide

HOW ORDERS WORK
Customers choose products and quantities, enter their delivery details, and request a rate confirmation through WhatsApp. The minimum order is 10 kg combined across items measured in kilograms. When the backend is configured, orders are stored online and their total is estimated from managed product rates. Current market rates, availability and delivery details still require customer approval in WhatsApp.

HOSTING AND LOCAL SETUP
For static-only hosting, upload the website files listed above to one folder. To run the backend, install Node.js 18+ and MongoDB, then follow backend/README.md. A local backend/.env is included with MONGO_URI=mongodb://127.0.0.1:27017/mandi and PORT=5000. Run npm install and npm run dev from backend/. The Express server serves the public website and API together on port 5000.

Before publishing, confirm the WhatsApp number, email address, service areas and delivery information.

CONTACT
WhatsApp: https://wa.me/919695871673?s=t
Email: mandi2kitchen@gmail.com
