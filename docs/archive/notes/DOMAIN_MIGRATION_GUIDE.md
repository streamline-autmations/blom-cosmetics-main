# Domain Migration Guide

## Overview
This guide lists all files and configurations that need to be updated when migrating from `blom-cosmetics.co.za` to your new domain.

**Current Domain:** `https://blom-cosmetics.co.za`  
**New Domain:** `https://YOUR-NEW-DOMAIN.com` (replace with your actual domain)

---

## 📋 Files to Update

### 1. **HTML Files**

#### `index.html` (Main entry point)
**Lines to update:**
- Line 18: `<link rel="canonical" href="https://blom-cosmetics.co.za/" />`
- Line 22: `<meta property="og:url" content="https://blom-cosmetics.co.za/" />`
- Line 25: `<meta property="og:image" content="https://blom-cosmetics.co.za/blom-cosmetics-og-image.webp" />`
- Line 33: `<meta property="twitter:url" content="https://blom-cosmetics.co.za/" />`
- Line 36: `<meta property="twitter:image" content="https://blom-cosmetics.co.za/blom-cosmetics-og-image.webp" />`
- Line 80: `"url": "https://blom-cosmetics.co.za"`
- Line 81: `"logo": "https://blom-cosmetics.co.za/blom-cosmetics-logo.webp"`

**Action:** Replace all instances of `https://blom-cosmetics.co.za` with your new domain.

#### `dist/index.html` (Built version)
Same changes as above - will be regenerated when you rebuild the project.

---

### 2. **SEO & Sitemap Files**

#### `public/sitemap.xml`
**Contains 250+ URLs** - All need domain replacement:
- Lines 7, 19, 27, 34, 41, 48, 56, 67, 74, 81, 88, 96, 103, 110, 117, 124, 131, 138, 145, 153, 160, 167, 175, 182, 189, 197, 204, 211, 218, 225, 233, 240, 247
- Also image locations on lines 12, 61, etc.

**Action:** Find and replace all `https://blom-cosmetics.co.za` with your new domain.

#### `public/images-sitemap.xml`
**Contains 170+ image URLs** - All need domain replacement:
- Lines 7, 9, 14, 21, 23, 28, 35, 37, 42, 49, 51, 56, 63, 65, 70, 78, 80, 85, 92, 94, 101, 103, 111, 113, 118, 123, 131, 133, 140, 142, 149, 151, 158, 160, 168, 170

**Action:** Find and replace all `https://blom-cosmetics.co.za` with your new domain.

#### `public/robots.txt`
**Lines to update:**
- Line 5: `Sitemap: https://blom-cosmetics.co.za/sitemap.xml`
- Line 6: `Sitemap: https://blom-cosmetics.co.za/images-sitemap.xml`

#### `dist/sitemap.xml` & `dist/images-sitemap.xml` & `dist/robots.txt`
Same as public versions - will be regenerated on build.

---

### 3. **React/TypeScript Source Files**

#### `src/lib/seo.ts`
**Lines to update:**
- Line 16: `image: "https://blom-cosmetics.co.za/blom-cosmetics-og-image.webp"`
- Line 17: `url: "https://blom-cosmetics.co.za"`
- Line 86: `url: \`https://blom-cosmetics.co.za/products/${productName...}\``
- Line 95: `url: \`https://blom-cosmetics.co.za/courses/${courseName...}\``
- Line 103: `url: \`https://blom-cosmetics.co.za${path}\``

#### `src/lib/payfast.ts`
**Lines to update:**
- Line 61: `const baseUrl = process.env.SITE_URL || window.location.origin;`
- Line 183: `site_url: process.env.SITE_URL || window.location.origin`

**Note:** This uses environment variable `SITE_URL` - update in Netlify environment variables.

#### `src/components/seo/ProductStructuredData.tsx`
**Lines to update:**
- Line 23: `"image": product.image.startsWith('http') ? product.image : \`https://blom-cosmetics.co.za${product.image}\``
- Line 32: `"url": \`https://blom-cosmetics.co.za/products/${product.id}\``

#### `src/components/seo/OptimizedImage.tsx`
**Lines to update:**
- Line 103: `"license": "https://blom-cosmetics.co.za"`

#### `src/components/seo/EnhancedSEO.tsx`
**Lines to update:**
- Line 66: `const baseUrl = 'https://blom-cosmetics.co.za';`

#### `src/pages/HomePage.tsx`
**Lines to update:**
- Line 22: `url: "https://blom-cosmetics.co.za/"`
- Line 28: `"https://blom-cosmetics.co.za/"`

#### `src/pages/OrderDetailPage.tsx`
**Lines to update:**
- Line 267: `<div className="text-right text-sm text-gray-600">blom-cosmetics.co.za</div>`

---

### 4. **Netlify Functions (Backend)**

#### `netlify/functions/payfast-redirect.ts`
**Lines to update:**
- Lines 144-146: `return_url`, `cancel_url`, `notify_url` - These use environment variables
- **Environment Variables Required:**
  - `SITE_URL` or `SITE_BASE_URL`

#### `netlify/functions/payfast-itn.ts`
**Lines to update:**
- Line 7: `const SITE = process.env.SITE_URL || 'https://cute-stroopwafel-203cac.netlify.app'`

**Action:** Update fallback URL and set `SITE_URL` environment variable.

#### `netlify/functions/invoice-pdf.ts`
**Lines to update:**
- Line 6: `const SITE = process.env.SITE_BASE_URL || process.env.SITE_URL || "https://blom-cosmetics.co.za"`
- Line 263: `drawRightText(SITE.replace(/^https?:\/\//, "") || "blom-cosmetics.co.za", ...)`

#### `netlify/functions/dev-itn.ts`
**Lines to update:**
- Line 50: `const base = process.env.SITE_BASE_URL || process.env.SITE_URL || 'https://blom-cosmetics.co.za'`

#### `netlify/functions/backfill-receipts.ts`
**Lines to update:**
- Line 5: `const SITE = (process.env.SITE_BASE_URL || process.env.SITE_URL || 'https://blom-cosmetics.co.za').replace(/\/+$/, '')`

---

### 5. **Documentation Files**

#### `SEO_SETUP_GUIDE.md`
**Lines to update:**
- Line 51: `2. Create a new property for \`blom-cosmetics.co.za\``
- Line 64: `2. Add your property: \`https://blom-cosmetics.co.za\``
- Line 90: `2. Add your sitemap: \`https://blom-cosmetics.co.za/sitemap.xml\``
- Line 95: `2. Add your sitemap: \`https://blom-cosmetics.co.za/sitemap.xml\``

#### `GOOGLE_SEO_IMPROVEMENTS.md`
**Lines to update:**
- Line 35: `4. Submit: \`https://blom-cosmetics.co.za/images-sitemap.xml\``
- Lines 40-42: Product URLs for indexing requests

#### `scripts/dev/send-order-status.ts`
**Lines to update:**
- Line 12: `site_url: 'https://blom-cosmetics.co.za'`

---

### 6. **Environment Variables (Netlify Dashboard)**

Update these in your Netlify project settings:

```bash
# Primary domain variable
SITE_URL=https://YOUR-NEW-DOMAIN.com
SITE_BASE_URL=https://YOUR-NEW-DOMAIN.com

# PayFast URLs (automatically constructed from SITE_URL)
# These are built dynamically in the code:
# - return_url: ${SITE_URL}/order-confirmation
# - cancel_url: ${SITE_URL}/checkout
# - notify_url: ${SITE_URL}/.netlify/functions/payfast-itn
```

---

## 🔧 Step-by-Step Migration Process

### Step 1: Update Environment Variables
1. Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables
2. Update or add:
   - `SITE_URL=https://YOUR-NEW-DOMAIN.com`
   - `SITE_BASE_URL=https://YOUR-NEW-DOMAIN.com`

### Step 2: Update Source Code Files
Run these find-and-replace operations:

```bash
# In your code editor, find and replace:
Find: https://blom-cosmetics.co.za
Replace: https://YOUR-NEW-DOMAIN.com

Find: blom-cosmetics.co.za
Replace: YOUR-NEW-DOMAIN.com
```

**Files to update manually:**
1. `index.html`
2. `public/sitemap.xml`
3. `public/images-sitemap.xml`
4. `public/robots.txt`
5. `src/lib/seo.ts`
6. `src/components/seo/EnhancedSEO.tsx`
7. `src/components/seo/ProductStructuredData.tsx`
8. `src/components/seo/OptimizedImage.tsx`
9. `src/pages/HomePage.tsx`
10. `src/pages/OrderDetailPage.tsx`
11. `netlify/functions/invoice-pdf.ts`
12. `netlify/functions/payfast-itn.ts`
13. `netlify/functions/dev-itn.ts`
14. `netlify/functions/backfill-receipts.ts`

### Step 3: Update Documentation (Optional)
1. `SEO_SETUP_GUIDE.md`
2. `GOOGLE_SEO_IMPROVEMENTS.md`
3. `README.md` (if it contains domain references)

### Step 4: Rebuild and Deploy
```bash
npm run build
# Then deploy to Netlify or push to GitHub (auto-deploys)
```

### Step 5: Update External Services

#### Google Analytics
1. Go to [Google Analytics](https://analytics.google.com)
2. Update property settings with new domain
3. Update GA4 Measurement ID in `index.html` if needed

#### Google Search Console
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add new domain as a property
3. Verify ownership
4. Submit new sitemaps:
   - `https://YOUR-NEW-DOMAIN.com/sitemap.xml`
   - `https://YOUR-NEW-DOMAIN.com/images-sitemap.xml`

#### PayFast
1. Log into PayFast merchant dashboard
2. Update:
   - Return URL: `https://YOUR-NEW-DOMAIN.com/order-confirmation`
   - Cancel URL: `https://YOUR-NEW-DOMAIN.com/checkout`
   - Notify URL: `https://YOUR-NEW-DOMAIN.com/.netlify/functions/payfast-itn`

#### Social Media
Update links on:
- Instagram bio
- Facebook page
- TikTok bio
- Any other social profiles

### Step 6: DNS & Domain Setup
1. Point your new domain to Netlify:
   - Add custom domain in Netlify Dashboard
   - Update DNS records at your domain registrar
   - Enable HTTPS/SSL certificate
2. Set up redirects from old domain (if keeping it):
   - Add to `netlify.toml` or `_redirects` file

---

## 📝 Quick Reference Checklist

- [ ] Update `SITE_URL` environment variable in Netlify
- [ ] Update `SITE_BASE_URL` environment variable in Netlify
- [ ] Replace domain in `index.html`
- [ ] Replace domain in `public/sitemap.xml`
- [ ] Replace domain in `public/images-sitemap.xml`
- [ ] Replace domain in `public/robots.txt`
- [ ] Update all `src/lib/seo.ts` URLs
- [ ] Update `src/components/seo/*.tsx` files
- [ ] Update `src/pages/*.tsx` files
- [ ] Update Netlify functions fallback URLs
- [ ] Rebuild project (`npm run build`)
- [ ] Deploy to Netlify
- [ ] Add custom domain in Netlify Dashboard
- [ ] Update DNS records
- [ ] Enable SSL certificate
- [ ] Update Google Analytics property
- [ ] Add new domain to Google Search Console
- [ ] Submit sitemaps to Google Search Console
- [ ] Update PayFast merchant settings
- [ ] Update social media profile links
- [ ] Test checkout flow with new domain
- [ ] Test PayFast payment notifications (ITN)

---

## ⚠️ Important Notes

1. **PayFast ITN (Instant Transaction Notification):**
   - The `notify_url` MUST be accessible from PayFast servers
   - Test thoroughly after migration
   - Use `dev-itn.ts` function for testing

2. **Environment Variables:**
   - Set in Netlify Dashboard, not in code
   - Never commit sensitive keys to Git
   - `SITE_URL` is critical for payment flows

3. **SEO Impact:**
   - Set up 301 redirects from old domain to new domain
   - Keep old domain active during transition period
   - Monitor Google Search Console for crawl errors

4. **SSL Certificate:**
   - Netlify provides free SSL via Let's Encrypt
   - Ensure HTTPS is enabled before going live
   - PayFast requires HTTPS for production

---

## 🔍 Testing After Migration

1. **Homepage loads correctly**
2. **Product pages display properly**
3. **Checkout flow works**
4. **PayFast payment redirects correctly**
5. **Order confirmation page shows**
6. **Email notifications contain correct domain**
7. **Sitemap is accessible**
8. **Robots.txt is accessible**
9. **Social sharing shows correct images/URLs**
10. **Invoice PDFs show correct domain**

---

## Need Help?

If you encounter issues:
1. Check Netlify function logs for errors
2. Verify environment variables are set correctly
3. Test PayFast in sandbox mode first
4. Check browser console for JavaScript errors
5. Verify DNS propagation (can take 24-48 hours)

---

**Last Updated:** 2025-11-21
