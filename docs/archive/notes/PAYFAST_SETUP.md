# PayFast + Invoices (blom-cosmetics-main)

## Environment variables
- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`
- `PAYFAST_PASSPHRASE` (required for ITN signature validation)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (required for order updates + invoice upload)
- `SITE_URL` (public website URL used in receipt footer, e.g. `https://blom-cosmetics.co.za/`)
- `SITE_BASE_URL` (optional; used to construct PayFast notify/return/cancel URLs)

## Canonical identifiers
- `m_payment_id` is the canonical payment identifier used across:
  - orders creation
  - PayFast redirect (`m_payment_id` sent to PayFast)
  - PayFast ITN lookup
  - invoice generation and storage naming
The code is resilient to legacy schemas that use `merchant_payment_id` by looking up orders with either field.

## Required `orders` fields (expected)
- `m_payment_id` (text)
- `subtotal_cents` (int)
- `shipping_cents` (int)
- `discount_cents` (int)
- `total_cents` (int)
- `total` (numeric/decimal)
- `invoice_url` (text, nullable)
- `status` (e.g. `placed`, `paid`)
- `payment_status` (e.g. `unpaid`, `paid`)

## Order creation flow
- Frontend (checkout) calls `/.netlify/functions/create-order`.
  - The server recomputes and persists `subtotal_cents`, `shipping_cents`, `discount_cents` and `total_cents`.
  - The server generates (or normalizes) a canonical `m_payment_id`.
- Frontend then calls `/.netlify/functions/payfast-redirect`.
  - The function constructs the PayFast form and signs it using `PAYFAST_PASSPHRASE`.
  - `notify_url` is always `${SITE_BASE_URL}/.netlify/functions/payfast-itn`.
## PayFast ITN flow
- PayFast POSTs to `/.netlify/functions/payfast-itn`.
  - A browser GET will return `405 Method Not Allowed` (expected).
- The ITN handler:
  - Validates the signature using `PAYFAST_PASSPHRASE`.
  - Finds the order by `m_payment_id` (or legacy `merchant_payment_id`).
  - Marks the order paid.
  - Triggers invoice generation by POSTing to `/.netlify/functions/invoice-pdf`.
## Invoice generation
- `/.netlify/functions/invoice-pdf`:
  - Loads the order and items.
  - Computes totals from persisted cents fields (with safe fallbacks).
  - Uploads a PDF to Supabase Storage bucket `invoices`.
  - Updates `orders.invoice_url`.
## Backfill (safety net)
- `/.netlify/functions/backfill-invoices` is a Netlify Scheduled Function (`@hourly`).
  - Finds paid orders where `invoice_url` is null.
  - Triggers `invoice-pdf` for each.
## Quick verification checklist
- Create an order and confirm the `orders` row includes:
  - `m_payment_id`, `subtotal_cents`, `shipping_cents`, `discount_cents`, `total_cents`.
- Simulate an ITN POST and confirm:
  - `orders.status='paid'`, `orders.payment_status='paid'`, `orders.paid_at` set.
  - `orders.invoice_url` populated.
- Confirm the generated PDF total equals:
  - `(subtotal_cents + shipping_cents - discount_cents) / 100`.
