# Environment Variables Configuration

## Complete List of Environment Variables for Netlify

Copy these to your Netlify Dashboard → Site Settings → Environment Variables

```bash
# ============================================================================
# ADMIN & CONTACT
# ============================================================================
ADMIN_EMAIL=admin@blom-cosmetics.co.za

# ============================================================================
# N8N WEBHOOKS (Automation Workflows)
# ============================================================================
N8N_BASE=https://dockerfile-1n82.onrender.com
N8N_REVIEW_TOKEN=REVIEW_TOKEN_123
N8N_ORDER_STATUS_WEBHOOK=https://dockerfile-1n82.onrender.com/webhook/notify-order

FLOW_A_PRODUCTS_INTAKE=https://dockerfile-1n82.onrender.com/webhook/products-intake
FLOW_B_PRODUCTS_PREVIEW=https://dockerfile-1n82.onrender.com/webhook/products-preview
FLOW_C_BUNDLES_INTAKE=https://dockerfile-1n82.onrender.com/webhook/bundles-intake
FLOW_D_BUNDLES_PREVIEW=https://dockerfile-1n82.onrender.com/webhook/bundles-preview

# ============================================================================
# GITHUB INTEGRATION
# ============================================================================
GITHUB_DEFAULT_BRANCH=main
GITHUB_REPO_NAME=blom-cosmetics-main
GITHUB_REPO_OWNER=streamlinebuilds-2
GITHUB_TOKEN=your_github_personal_access_token_here

# ============================================================================
# SITE CONFIGURATION
# ============================================================================
NODE_ENV=production
SITE_BASE_URL=https://blom-cosmetics.co.za
SITE_URL=https://blom-cosmetics.co.za

# ============================================================================
# PAYFAST PAYMENT GATEWAY
# ============================================================================
PAYFAST_BASE=https://www.payfast.co.za
PAYFAST_MERCHANT_ID=31795795
PAYFAST_MERCHANT_KEY=xgkekcjgmr21u
PAYFAST_PASSPHRASE=BlomPF-2025_AuroraSky-72
PAYFAST_RETURN_URL=https://blom-cosmetics.co.za/checkout/status
PAYFAST_CANCEL_URL=https://blom-cosmetics.co.za/checkout/cancel
PAYFAST_NOTIFY_URL=https://blom-cosmetics.co.za/.netlify/functions/payfast-itn

# ============================================================================
# SHIPLOGIC (Shipping Integration)
# ============================================================================
SHIPLOGIC_BASE=https://api.shiplogic.com
SHIPLOGIC_TOKEN=b959792e4653488496e83a15735f0a4c

# ============================================================================
# EMAIL (SMTP via Brevo)
# ============================================================================
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=98a7f0001@smtp-brevo.com
SMTP_PASS=YOUR_BREVO_SMTP_PASSWORD
SMTP_SENDER_EMAIL=no-reply@blom-cosmetics.co.za
SMTP_SENDER_NAME=Blom Cosmetics

# ============================================================================
# SUPABASE (Main Store Database)
# ============================================================================
SUPABASE_URL=https://yvmnedjybrpvlupygusf.supabase.co
SUPABASE_DATABASE_URL=https://yvmnedjybrpvlupygusf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_JWT_SECRET=your_supabase_jwt_secret_here

# ============================================================================
# VITE (Frontend Build Variables)
# ============================================================================
VITE_SUPABASE_URL=https://yvmnedjybrpvlupygusf.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# ============================================================================
# CLOUDINARY (Image Hosting)
# ============================================================================
VITE_CLOUDINARY_CLOUD_NAME=dd89enrjz
VITE_CLOUDINARY_FOLDER=products
VITE_CLOUDINARY_UPLOAD_PRESET=blom_unsigned

# ============================================================================
# ACADEMY (Separate Learning Platform)
# ============================================================================
ACADEMY_URL=https://blom-academy.vercel.app
ACADEMY_SUPABASE_URL=https://udsrdgfhqfvrkmqghyyj.supabase.co
ACADEMY_SUPABASE_SERVICE_KEY=your_academy_supabase_service_key_here
ACADEMY_SUPABASE_ANON_KEY=your_academy_supabase_anon_key_here

# ============================================================================
# TESTING
# ============================================================================
TEST_ITN_SECRET=some-unguessable-string
```

## How to Add These to Netlify

### Method 1: Netlify Dashboard (Recommended)
1. Go to: https://app.netlify.com
2. Select your site: `blom-cosmetics-main`
3. Go to: **Site Settings** → **Environment Variables**
4. Click **Add a variable**
5. Copy each variable name and value from above
6. Click **Save**

### Method 2: Netlify CLI
```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to your site
netlify link

# Set environment variables (example)
netlify env:set SITE_URL "https://blom-cosmetics.co.za"
netlify env:set PAYFAST_MERCHANT_ID "31795795"
# ... repeat for all variables
```

### Method 3: Import from File
1. Save the variables to a `.env` file (DO NOT commit to Git)
2. Use Netlify's bulk import feature in the dashboard

## ⚠️ Security Notes

1. **Never commit these to Git** - They contain sensitive API keys
2. **GitHub Token** - Has write access to your repository
3. **Supabase Keys** - Service role key has full database access
4. **PayFast Credentials** - Connected to real payment processing
5. **SMTP Password** - Update `YOUR_BREVO_SMTP_PASSWORD` with actual password

## Variables by Function

### Payment Processing (PayFast)
- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`
- `PAYFAST_PASSPHRASE`
- `PAYFAST_RETURN_URL`
- `PAYFAST_CANCEL_URL`
- `PAYFAST_NOTIFY_URL`

### Database (Supabase)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Email Notifications
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SENDER_EMAIL`
- `SMTP_SENDER_NAME`
- `N8N_ORDER_STATUS_WEBHOOK`

### Shipping
- `SHIPLOGIC_BASE`
- `SHIPLOGIC_TOKEN`

### Site Configuration
- `SITE_URL`
- `SITE_BASE_URL`
- `NODE_ENV`

## After Setting Environment Variables

1. **Trigger a new deploy** in Netlify to apply the changes
2. **Test the checkout flow** to ensure PayFast integration works
3. **Test email notifications** to verify SMTP settings
4. **Check function logs** for any errors

## Verification Checklist

- [ ] All environment variables added to Netlify
- [ ] Site redeployed after adding variables
- [ ] PayFast payment flow tested
- [ ] Email notifications working
- [ ] Order creation successful
- [ ] Invoice generation working
- [ ] Shipping integration functional
- [ ] Academy course enrollment working

---

**Last Updated:** 2025-11-21
**Domain:** blom-cosmetics.co.za
