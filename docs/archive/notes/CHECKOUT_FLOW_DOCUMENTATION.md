# BLOM Cosmetics - Complete Checkout Flow & Data Storage

## 📋 Complete Order Flow (Real Checkout)

### STEP 1: Customer Clicks "Place Order" (Frontend)
**Location:** `src/pages/CheckoutPage.tsx` - `handlePlaceOrder()` function

**What happens:**
1. Customer fills out checkout form with:
   - Shipping info (name, email, phone, address)
   - Cart items
   - Payment method (PayFast)

2. Form submits to: `/.netlify/functions/create-order`

**Payload sent:**
```json
{
  "items": [
    { "product_id": "uuid", "sku": "SKU-123", "price": 35.00, "qty": 2, "product_name": "Product Name" }
  ],
  "shippingInfo": { "firstName": "John", "lastName": "Doe", "email": "john@example.com", "phone": "0821234567" },
  "deliveryAddress": { "street_address": "123 Main St", "city": "Cape Town", ... },
  "shippingMethod": "delivery" | "collection",
  "total": 70.00,
  "subtotal": 70.00,
  "shipping": 0,
  "discount": 0,
  "customerId": "user-uuid-if-logged-in"
}
```

---

### STEP 2: Create Order (Backend Function)
**Location:** `netlify/functions/create-order.ts`

**What happens:**
1. Receives cart items and customer info
2. Generates unique `m_payment_id`: `BL-{timestamp}` (e.g., `BL-A1B2C3D4E5F6`)
3. Calculates total from items
4. **Stores in Supabase:**

#### 📦 Table: `orders`
**Fields stored:**
```sql
INSERT INTO orders (
  id,                    -- Auto-generated UUID
  m_payment_id,          -- "BL-A1B2C3D4E5F6"
  status,                -- "pending"
  total,                 -- 70.00 (calculated from items)
  user_id,               -- UUID if logged in, null if guest
  buyer_name,            -- "John Doe"
  buyer_email,           -- "john@example.com"
  buyer_phone,           -- "0821234567"
  fulfillment_method,    -- "delivery" or "collection"
  delivery_address,      -- JSON: { "street_address": "...", "city": "...", ... }
  collection_location,   -- null or location string
  created_at             -- Timestamp
)
```

#### 📦 Table: `order_items`
**Fields stored (one row per cart item):**
```sql
INSERT INTO order_items (
  id,                    -- Auto-generated UUID
  order_id,              -- Links to orders.id
  product_id,            -- UUID from products table (resolved by SKU lookup)
  product_name,          -- "Product Name" (snapshot at time of order)
  sku,                   -- "SKU-123" (snapshot)
  quantity,              -- 2
  unit_price,            -- 35.00
  line_total,            -- 70.00 (quantity * unit_price)
  created_at
)
```

**Returns to frontend:**
```json
{
  "order_id": "uuid",
  "m_payment_id": "BL-A1B2C3D4E5F6",
  "amount": "70.00"
}
```

---

### STEP 3: Redirect to PayFast (Frontend)
**Location:** `src/pages/CheckoutPage.tsx` - After create-order success

**What happens:**
1. Calls `/.netlify/functions/payfast-checkout` with:
   ```json
   {
     "m_payment_id": "BL-A1B2C3D4E5F6",
     "amount": "70.00",
     "name_first": "John",
     "name_last": "Doe",
     "email_address": "john@example.com",
     "item_name": "BLOM Order BL-A1B2C3D4E5F6",
     "order_id": "uuid"
   }
   ```

2. PayFast function (`netlify/functions/payfast-checkout.ts`):
   - Builds signed PayFast URL
   - Returns: `{ "redirect": "https://www.payfast.co.za/eng/process?merchant_id=...&signature=..." }`

3. Frontend redirects customer to PayFast payment page

**⚠️ At this point:** Order is in `orders` table with `status = 'pending'`

---

### STEP 4: Customer Pays on PayFast
- Customer enters payment details on PayFast
- PayFast processes payment
- PayFast redirects customer back to your site (success/cancel URLs)

---

### STEP 5: PayFast ITN Webhook (Backend)
**Location:** `netlify/functions/payfast-itn.ts`

**What happens:**
1. PayFast sends ITN (Instant Transaction Notification) POST request
2. Function validates:
   - MD5 signature matches
   - Amount matches order total

3. **Updates Supabase:**

#### 📦 Table: `orders` (UPDATE)
```sql
UPDATE orders SET
  status = 'paid',
  payment_status = 'paid',
  paid_at = NOW(),
  pf_payment_id = 'PF-12345'  -- PayFast transaction ID
WHERE m_payment_id = 'BL-A1B2C3D4E5F6'
```

#### 📦 Table: `payments` (INSERT)
```sql
INSERT INTO payments (
  id,                    -- Auto-generated UUID
  order_id,              -- Links to orders.id
  provider,               -- "payfast"
  amount_cents,          -- 7000 (70.00 * 100)
  status,                -- "succeeded"
  provider_txn_id,       -- PayFast reference
  pf_payment_id,         -- PayFast payment ID
  raw,                   -- Full ITN payload as JSON
  created_at,
  paid_at
)
```

4. **Triggers invoice generation:**
   - Calls `/.netlify/functions/invoice-generate-pdf?m_payment_id=BL-A1B2C3D4E5F6`
   - Generates PDF receipt
   - Uploads to Supabase Storage: `invoices/BL-A1B2C3D4E5F6.pdf`
   - **Updates `orders.invoice_url`** with public URL

5. **Forwards to n8n** (optional webhook for automation)

---

## 📊 Complete Data Storage Summary

### **Primary Tables:**

#### 1. `orders` (Main order record)
```sql
-- Key fields captured:
id                  -- UUID (primary key)
m_payment_id        -- "BL-A1B2C3D4E5F6" (used for receipts)
order_number        -- Human-readable order number
status              -- "pending" → "paid" → "fulfilled"
total               -- 70.00 (calculated from items)
user_id             -- UUID if logged in (from auth.users)
buyer_name          -- "John Doe"
buyer_email         -- "john@example.com"
buyer_phone         -- "0821234567"
fulfillment_method  -- "delivery" | "collection"
delivery_address    -- JSONB: full address object
collection_location -- String if collection
invoice_url         -- URL to PDF receipt (after payment)
created_at          -- When order was placed
paid_at             -- When payment completed
```

#### 2. `order_items` (Line items)
```sql
-- One row per product in cart:
id           -- UUID
order_id     -- Links to orders.id
product_id   -- UUID from products table (nullable, can be null if product deleted)
product_name -- Snapshot at time of order
sku          -- Snapshot at time of order
quantity     -- 2
unit_price   -- 35.00
line_total   -- 70.00 (quantity * unit_price)
```

#### 3. `payments` (Payment transactions)
```sql
-- One row per successful payment:
id             -- UUID
order_id       -- Links to orders.id
provider       -- "payfast"
amount_cents   -- 7000
status         -- "succeeded"
pf_payment_id  -- PayFast transaction ID
provider_txn_id -- PayFast reference number
raw            -- Full PayFast ITN payload (JSONB)
paid_at        -- Payment timestamp
```

---

## 🔍 How to View Your Real Order Data

### **Option 1: Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Navigate to: **Table Editor** → **orders**
3. See all orders with:
   - `m_payment_id`
   - `status`
   - `total`
   - `buyer_email`
   - `created_at`

### **Option 2: Query via SQL**
```sql
-- Get order with items
SELECT 
  o.m_payment_id,
  o.status,
  o.total,
  o.buyer_name,
  o.buyer_email,
  o.created_at,
  o.invoice_url,
  json_agg(json_build_object(
    'product_name', oi.product_name,
    'quantity', oi.quantity,
    'unit_price', oi.unit_price,
    'line_total', oi.line_total
  )) as items
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.m_payment_id = 'BL-A1B2C3D4E5F6'
GROUP BY o.id;
```

### **Option 3: Account Page**
- User logs in → sees orders via `orders_account_v1` view
- Orders filtered by `user_id` OR `buyer_email`

---

## 🎯 Key Identifiers

- **`m_payment_id`**: Used for PayFast and receipt generation (e.g., `BL-A1B2C3D4E5F6`)
- **`order.id`**: UUID primary key (e.g., `815f1f76-9120-461c-8840-7f80a57dc67c`)
- **`order_number`**: Human-readable number (may be generated later)

---

## 📝 Complete Data Flow Diagram

```
Customer fills checkout form
    ↓
Frontend calls: /.netlify/functions/create-order
    ↓
[create-order.ts] 
    ├─→ Creates order in `orders` table (status: 'pending')
    ├─→ Creates items in `order_items` table
    └─→ Returns: { order_id, m_payment_id, amount }
    ↓
Frontend calls: /.netlify/functions/payfast-checkout
    ↓
[payfast-checkout.ts]
    └─→ Returns: { redirect: "https://payfast.co.za/..." }
    ↓
Customer redirected to PayFast
    ↓
Customer pays on PayFast
    ↓
PayFast sends ITN webhook: /.netlify/functions/payfast-itn
    ↓
[payfast-itn.ts]
    ├─→ Validates signature & amount
    ├─→ Updates `orders.status` = 'paid'
    ├─→ Inserts into `payments` table
    ├─→ Calls invoice-generate-pdf
    │   └─→ Uploads PDF to Supabase Storage
    │   └─→ Updates `orders.invoice_url`
    └─→ Forwards to n8n webhook (optional)
    ↓
Order complete! ✅
```

---

## 🔐 Security Notes

- Orders are protected by RLS (Row Level Security)
- Users can only see their own orders (by `user_id` or `buyer_email`)
- All functions use `SUPABASE_SERVICE_ROLE_KEY` for admin operations

---

## 📍 Where Everything Lives

| Data | Table | Key Fields |
|------|-------|------------|
| **Order Header** | `orders` | `id`, `m_payment_id`, `status`, `total`, `buyer_*`, `fulfillment_*` |
| **Order Items** | `order_items` | `order_id`, `product_id`, `product_name`, `sku`, `quantity`, `unit_price`, `line_total` |
| **Payment** | `payments` | `order_id`, `provider`, `amount_cents`, `status`, `pf_payment_id` |
| **PDF Receipt** | Supabase Storage | `invoices/{m_payment_id}.pdf` |
| **Receipt URL** | `orders.invoice_url` | Full public URL to PDF |

---

## ✅ Verification Checklist

After placing a real order, verify:

1. ✅ Order exists in `orders` table with `status = 'pending'` initially
2. ✅ Items exist in `order_items` table linked to the order
3. ✅ After payment, `orders.status` = 'paid'
4. ✅ Payment record exists in `payments` table
5. ✅ `orders.invoice_url` points to PDF receipt
6. ✅ PDF exists in Supabase Storage bucket `invoices/`
