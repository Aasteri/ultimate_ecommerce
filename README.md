# The Tailors Market

Marketplace for tailoring materials — fabrics, tools, patterns, and supplies from vendors. Built with Laravel (PHP) + React.

## Stack

- **Backend:** PHP 8.1, Laravel 10, MySQL, Sanctum auth, Flutterwave payments
- **Frontend:** React 19, TypeScript, Vite
- **Database:** `monogram_market` (MySQL, root, no password)

## Quick start

### Backend

```bash
cd backend
php artisan serve
```

Runs at http://localhost:8000

### Frontend

```bash
cd frontend
npm run dev
```

Runs at http://localhost:5173 (proxies API to backend)

## Default admin login

- Email: `admin@thetailorsmarket.com`
- Password: `password123`

## Flutterwave setup

Add your keys to `backend/.env`:

```
FLUTTERWAVE_PUBLIC_KEY=your_public_key
FLUTTERWAVE_SECRET_KEY=your_secret_key
FLUTTERWAVE_ENCRYPTION_KEY=your_encryption_key
FLUTTERWAVE_SECRET_HASH=your_secret_hash
```

Set webhook URL: `https://yourdomain.com/api/checkout/webhook`

### Test payments

**Yes — you can test payments without charging real money.**

| Method | When to use |
|--------|-------------|
| **Simulate test payment** | Default with public demo keys (`SANDBOXDEMOKEY`). Completes order locally — no Flutterwave modal. |
| **Pay with Flutterwave** | After you add your own **test keys** from [Flutterwave dashboard](https://dashboard.flutterwave.com) → Settings → API Keys (test mode) → paste in Admin → Settings. |

**v3 test cards** (inline checkout — what this app uses):

| Card | CVV | PIN | OTP |
|------|-----|-----|-----|
| 4242 4242 4242 4242 | 123 | 3310 | 12345 |
| 5060 6666 6666 6666 666 (Verve) | 123 | 3310 | 12345 |

**Flutterwave [testing docs](https://developer.flutterwave.com/docs/testing)** describe v4 sandbox scenarios (`X-Scenario-Key` for approved, declined, insufficient funds, etc.) on the Charges API. This project uses **v3 inline checkout** — use the test cards above, or the simulate button for local dev.

Test data is archived after 30 days on Flutterwave sandbox ([docs](https://developer.flutterwave.com/docs/testing)).

## Features

### Storefront
- Browse/search products by category, format, keyword
- Digital vs physical product selection with separate pricing
- Cart and Flutterwave checkout
- Instant digital downloads library
- Static pages (FAQs, Terms, Privacy, Licensing)
- Newsletter signup, contact form

### Admin panel (`/admin`)
- Dashboard stats
- Product management (required Digital / Physical / Both, with matching form fields)
- Order management with physical fulfillment tracking
- Category management
- Shipping zones (fixed rates per region)
- Site settings
- Contact messages
- CMS pages

## Project structure

```
backend/          Laravel API
frontend/         React SPA
```
# ultimate_ecommerce
