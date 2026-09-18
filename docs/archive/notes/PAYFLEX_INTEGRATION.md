# Payflex BNPL Integration

## What It Does
Adds Payflex "Buy Now, Pay Later" (4 interest-free instalments) as a second payment option alongside PayFast. Customers select their preferred method at checkout.

---

## Sandbox Credentials (UAT Only)
| Variable | Value |
|---|---|
| `PAYFLEX_CLIENT_ID` | `X3d0TaDZZO4qPpAqkU6mg1zeuV2pxMfK` |
| `PAYFLEX_CLIENT_SECRET` | `fC7r00Vh4R6raFEvbb7VPw7nNgY5AW3IioVutD2jItmBPSb6WBk7dWupYZBpXZTX` |
| `PAYFLEX_API_URL` | `https://api.uat.payflex.co.za` |
| `PAYFLEX_AUTH_URL` | `https://auth-uat.payflex.co.za/auth/merchant` |
| `PAYFLEX_AUDIENCE` | `https://auth-dev.payflex.co.za` |

**Set these in Netlify → Site → Environment Variables.** Never commit secrets to code.

Test account: `integrating@payflex.co.za` / `ResetPF2024#` (R10–R4500 sandbox limit)

---

## API Flow

```
Customer selects Payflex → payflex-redirect → Payflex checkout → payflex-webhook → order marked paid
```

1. **Auth**: POST `PAYFLEX_AUTH_URL` with client credentials → returns `access_token`
2. **Create Order**: POST `PAYFLEX_API_URL/order` with Bearer token → returns `redirectUrl`
3. **Redirect**: Customer sent to `redirectUrl` on Payflex's site
4. **Webhook**: Payflex POSTs status to `/.netlify/functions/payflex-webhook`
5. **Verify**: Webhook re-fetches order from API (no signature — must verify yourself)
6. **Fulfill**: On `Approved` → mark paid, generate invoice, deduct stock, notify N8N, book Uber

---

## Routes / Functions

### `POST /.netlify/functions/payflex-redirect`
**File:** `netlify/functions/payflex-redirect.ts`

Initiates checkout. Called by the frontend when customer clicks "Place Order" with Payflex selected.

**Request body:**
```json
{
  "order_id": "uuid",
  "m_payment_id": "BL-XXXXX",
  "amount": 599.00,
  "shipping_amount": 120.00,
  "consumer": { "givenNames": "Jane", "surname": "Doe", "email": "...", "phoneNumber": "+2782..." },
  "items": [{ "name": "...", "sku": "...", "quantity": 1, "price": 479.00 }]
}
```

**Response:**
```json
{ "checkout_url": "https://checkout.uat.payflex.co.za/...", "payflex_order_id": "pf-guid" }
```

---

### `POST /.netlify/functions/payflex-webhook`
**File:** `netlify/functions/payflex-webhook.ts`

Receives payment status from Payflex. Handles the full post-payment workflow.

**Incoming payload (from Payflex):**
```json
{ "orderId": "pf-guid", "orderStatus": "Approved", "merchantReference": "BL-XXXXX" }
```

**Status values:** `Created`, `Initiated`, `Approved`, `Declined`, `Abandoned`

**On Approved → runs in order:**
- A) Mark order `paid` in Supabase
- B) Increment coupon usage
- C) Generate invoice PDF
- D) Deduct stock (RPC)
- E) Notify N8N webhook
- F) Book Uber delivery (if quote exists)
- G) Enroll in courses (if applicable)

---

## Files Changed

| File | Change |
|---|---|
| `netlify/functions/payflex-redirect.ts` | **NEW** — checkout initiation |
| `netlify/functions/payflex-webhook.ts` | **NEW** — payment notification + fulfillment |
| `src/pages/CheckoutPage.tsx` | Added Calendar icon, 2-option payment selector, Payflex routing in handlePlaceOrder |
| `src/pages/ProductDetailPage.tsx` | Payflex widget script injection + container div below price |

---

## Pending: Manual Setup Required

### 1. Netlify Environment Variables
Add the 5 variables from the table above in **Netlify → Site → Environment Variables**. This triggers a redeploy automatically.

### 2. Supabase SQL Migration
Run in **Supabase Dashboard → SQL Editor** for the Blom Cosmetics project (`yvmnedjybrpvlupygusf`):

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'payfast';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payflex_order_id TEXT;
```

> Note: Checkout still works without these columns — failures are non-blocking. But adding them enables clean order tracking by payment method.

---

## Switching to Production (Live)

When Payflex approves the live merchant account, update these 4 env vars in Netlify:

| Variable | Live Value |
|---|---|
| `PAYFLEX_CLIENT_ID` | From Payflex live onboarding |
| `PAYFLEX_CLIENT_SECRET` | From Payflex live onboarding |
| `PAYFLEX_API_URL` | `https://api.payflex.co.za` |
| `PAYFLEX_AUTH_URL` | `https://auth.payflex.co.za/auth/merchant` |
| `PAYFLEX_AUDIENCE` | `https://auth-production.payflex.co.za` |
