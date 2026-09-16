# Bundle Template - Easy Copy & Paste for Owner

Use this template to quickly add new bundle deals to your shop.

## 📋 Instructions
1. Copy the "Shop Page Bundle" section below
2. Paste it into `src/pages/ShopPage.tsx` in the `allProducts` array (after line 25)
3. Copy the "Product Detail Bundle" section below
4. Paste it into `src/pages/ProductDetailPage.tsx` in the `productDatabase` object (after line 54)
5. Replace ALL placeholders (marked with `[...]`) with your bundle information
6. Add your bundle images to the `public` folder with these exact names:
   - `/bundle-[your-bundle-slug]-white.webp` (normal/white background)
   - `/bundle-[your-bundle-slug]-colorful.webp` (hover/colorful version)

---

## 🛍️ Shop Page Bundle Code

**Copy this entire block and paste into `src/pages/ShopPage.tsx`:**

```typescript
{
  id: 'bundle-X',  // ⚠️ CHANGE X to next number (e.g., bundle-2, bundle-3, etc.)
  name: '[BUNDLE NAME]',  // e.g., 'Gel Essentials Bundle'
  slug: '[bundle-slug]',  // e.g., 'gel-essentials-bundle' (lowercase, use hyphens)
  price: [BUNDLE_PRICE],  // e.g., 500 (your discounted price)
  compareAtPrice: [ORIGINAL_TOTAL],  // e.g., 650 (sum of individual product prices)
  short_description: '[SHORT DESCRIPTION - save RXX!]',  // e.g., 'Complete gel system - save R150!'
  shortDescription: '[SHORT DESCRIPTION - save RXX!]',  // Same as above
  description: '[FULL DESCRIPTION]',  // e.g., 'Everything you need for perfect gel nails.'
  images: ['/bundle-[your-slug]-white.webp', '/bundle-[your-slug]-colorful.webp'],
  category: 'bundle-deals',  // ⚠️ DO NOT CHANGE THIS
  rating: 0,  // ⚠️ DO NOT CHANGE THIS
  reviews: 0,  // ⚠️ DO NOT CHANGE THIS
  badges: ['Bundle', 'Save [X]%'],  // Calculate %: ((compareAtPrice - price) / compareAtPrice) * 100
  inStock: true,  // Change to false if out of stock
  includedProducts: [
    { productId: '[ID]', productName: '[PRODUCT NAME]', quantity: [QTY] },
    // Add more products - see Product IDs list below
  ],
  variants: []  // ⚠️ DO NOT CHANGE THIS
},
```

---

## 📄 Product Detail Page Bundle Code

**Copy this entire block and paste into `src/pages/ProductDetailPage.tsx`:**

```typescript
'[bundle-slug]': {  // ⚠️ MUST match the slug from ShopPage (same as above)
  id: 'bundle-X',  // ⚠️ MUST match the id from ShopPage
  name: '[BUNDLE NAME]',  // Same as ShopPage
  slug: '[bundle-slug]',  // Same as ShopPage
  category: 'Bundle Deals',  // ⚠️ DO NOT CHANGE THIS
  shortDescription: '[SHORT DESCRIPTION - save RXX!]',  // Same as ShopPage
  overview: '[DETAILED OVERVIEW - Write 2-3 sentences explaining what this bundle includes and why customers should buy it]',
  price: [BUNDLE_PRICE],  // Same as ShopPage
  compareAtPrice: [ORIGINAL_TOTAL],  // Same as ShopPage
  stock: 'In Stock',  // Change to 'Out of Stock' if needed
  images: ['/bundle-[your-slug]-white.webp', '/bundle-[your-slug]-colorful.webp'],  // Same as ShopPage
  features: [
    '[Feature or benefit 1]',
    '[Feature or benefit 2]',
    '[Feature or benefit 3]',
    'Save R[AMOUNT] compared to buying individually',  // Calculate: compareAtPrice - price
    '[Any other benefits]'
  ],
  howToUse: [
    '[Step 1 - How to use the first product]',
    '[Step 2 - How to use the second product]',
    '[Step 3 - Next step in the process]',
    '[Step 4 - Final step or tip]',
    // Add more steps if needed
  ],
  ingredients: {
    inci: ['See individual product pages for full ingredient lists'],  // ⚠️ Keep this as is
    key: [
      '[Product 1 Name] – [Brief description of what it does]',
      '[Product 2 Name] – [Brief description of what it does]',
      '[Product 3 Name] – [Brief description of what it does]'
    ]
  },
  includedProducts: [
    { id: '[PRODUCT_ID]', name: '[PRODUCT NAME]', quantity: [QTY], price: [INDIVIDUAL_PRICE] },
    // Add all products in this bundle - see Product IDs list below
  ],
  details: {
    bundleValue: 'R[ORIGINAL_TOTAL]',  // Same as compareAtPrice
    bundlePrice: 'R[BUNDLE_PRICE]',  // Same as price
    savings: 'R[SAVINGS_AMOUNT] ([X]% off)',  // Calculate both
    totalItems: '[X] products included'  // Count the products
  },
  variants: [],  // ⚠️ DO NOT CHANGE THIS
  rating: 0,  // ⚠️ DO NOT CHANGE THIS
  reviewCount: 0,  // ⚠️ DO NOT CHANGE THIS
  reviews: []  // ⚠️ DO NOT CHANGE THIS
}
```

---

## 📦 CURRENT EXAMPLE: Prep & Primer Bundle

### Shop Page Code:
```typescript
{
  id: 'bundle-1',
  name: 'Prep & Primer Bundle',
  slug: 'prep-primer-bundle',
  price: 370,
  compareAtPrice: 410,
  short_description: 'Essential prep duo - Dehydrator & Primer - save R40!',
  shortDescription: 'Essential prep duo - Dehydrator & Primer - save R40!',
  description: 'Perfect nail preparation starts here. Get both our Prep Solution and Vitamin Primer together and save.',
  images: ['/bundle-prep-primer-white.webp', '/bundle-prep-primer-colorful.webp'],
  category: 'bundle-deals',
  rating: 0,
  reviews: 0,
  badges: ['Bundle', 'Save 10%'],
  inStock: true,
  includedProducts: [
    { productId: '3', productName: 'Prep Solution (Nail Dehydrator)', quantity: 1 },
    { productId: '2', productName: 'Vitamin Primer', quantity: 1 }
  ],
  variants: []
},
```

### Product Detail Code:
```typescript
'prep-primer-bundle': {
  id: 'bundle-1',
  name: 'Prep & Primer Bundle',
  slug: 'prep-primer-bundle',
  category: 'Bundle Deals',
  shortDescription: 'Essential prep duo - Dehydrator & Primer - save R40!',
  overview: 'Get the perfect foundation for long-lasting nail enhancements with our Prep & Primer Bundle. This essential duo combines our Prep Solution (Nail Dehydrator) to remove oils and moisture, with our Vitamin Primer for superior adhesion. Save R40 when you buy them together.',
  price: 370,
  compareAtPrice: 410,
  stock: 'In Stock',
  images: ['/bundle-prep-primer-white.webp', '/bundle-prep-primer-colorful.webp'],
  features: [
    'Complete nail preparation system',
    'Professional-grade adhesion products',
    'Save R40 compared to buying individually',
    'Perfect for gel and acrylic applications',
    'Prevents lifting and ensures long-lasting results',
    'Suitable for both beginners and professionals'
  ],
  howToUse: [
    'Start with clean, shaped natural nails',
    'Apply Prep Solution to dehydrate the nail plate',
    'Allow to dry completely (30-60 seconds)',
    'Apply a thin layer of Vitamin Primer',
    'Let primer dry before applying gel or acrylic',
    'Proceed with your nail enhancement application'
  ],
  ingredients: {
    inci: ['See individual product pages for full ingredient lists'],
    key: [
      'Prep Solution – Removes oils and moisture from nail plate',
      'Vitamin Primer – Acid-free, vitamin-enriched adhesion formula',
      'Both products work together for maximum bond strength'
    ]
  },
  includedProducts: [
    { id: '3', name: 'Prep Solution (Nail Dehydrator)', quantity: 1, price: 200 },
    { id: '2', name: 'Vitamin Primer', quantity: 1, price: 210 }
  ],
  details: {
    bundleValue: 'R410',
    bundlePrice: 'R370',
    savings: 'R40 (10% off)',
    totalItems: '2 products included'
  },
  variants: [],
  rating: 0,
  reviewCount: 0,
  reviews: []
}
```

---

## 🔢 PRODUCT IDS & PRICES (Use these in your bundles)

| ID | Product Name | Price |
|----|--------------|-------|
| '1' | Cuticle Oil | R140 |
| '2' | Vitamin Primer | R210 |
| '3' | Prep Solution (Nail Dehydrator) | R200 |
| '4' | Top Coat | R190 |
| '5' | Fairy Dust Top Coat | R195 |
| '6' | Nail File (80/80 Grit) | R35 |
| '7' | Nail Forms | R290 |
| '8' | Crystal Kolinsky Sculpting Brush | R450 |
| '9' | Core Acrylics (56 g) | R280 |
| '10' | Nail Liquid (Monomer) | R380 |

---

## 💡 TIPS FOR CREATING GREAT BUNDLES

### 1. **Pricing Strategy**
- Aim for **10-20% discount** to make it attractive
- Example: If products cost R410 individually, sell bundle for R370 (save R40 = 10%)

### 2. **Product Combinations**
Group products that:
- Are used together (e.g., primer + dehydrator)
- Complete a process (e.g., prep → apply → finish)
- Save time for professionals
- Help beginners start out

### 3. **Calculating Savings**
```
Original Total = Product1 Price + Product2 Price + Product3 Price
Your Bundle Price = (Choose your discounted price)
Savings = Original Total - Bundle Price
Percentage = (Savings / Original Total) × 100
```

**Example:**
- Prep Solution: R200
- Vitamin Primer: R210
- **Total: R410**
- Bundle Price: R370
- **Savings: R40 (10%)**

### 4. **Image Requirements**
- **White version**: Product bottles on white background (like other products)
- **Colorful version**: Same products with colorful/styled background (for hover effect)
- **Size**: 800x800px minimum (square)
- **Format**: `.webp` (preferred) or `.jpg`
- **File names**: MUST match exactly (e.g., `/bundle-prep-primer-white.webp`)

---

## ✅ CHECKLIST BEFORE ADDING BUNDLE

- [ ] Bundle name is clear and descriptive
- [ ] Slug uses lowercase and hyphens (no spaces)
- [ ] Price is discounted by 10-20%
- [ ] All product IDs are correct
- [ ] Savings percentage is calculated correctly
- [ ] Both images are created and named correctly
- [ ] Short description mentions the savings amount
- [ ] "How to Use" explains the complete process
- [ ] Code is pasted in BOTH files (ShopPage.tsx AND ProductDetailPage.tsx)

---

## 🎯 WHERE TO PASTE THE CODE

### ShopPage.tsx
1. Open `src/pages/ShopPage.tsx`
2. Find line 25 (after `const allProducts = [`)
3. Find the comment `// Bundle Deals`
4. Paste your new bundle code AFTER the existing bundle (before `// Live Products`)

### ProductDetailPage.tsx
1. Open `src/pages/ProductDetailPage.tsx`
2. Find line 54 (after `const productDatabase = {`)
3. Paste your new bundle code AFTER the existing bundle (before `'cuticle-oil': {`)

---

## 🆘 TROUBLESHOOTING

**Bundle not showing up?**
- Check that `category: 'bundle-deals'` is correct
- Make sure the slug is unique (no duplicates)
- Verify both Shop and Detail pages have the bundle

**Images not loading?**
- Check file names match exactly (case-sensitive)
- Images must be in the `public` folder
- Use `.webp` format for best results

**Price display wrong?**
- `price` = discounted bundle price
- `compareAtPrice` = sum of individual products
- Check your math!

---

## 📞 NEED HELP?

If you get stuck:
1. Look at the current "Prep & Primer Bundle" example
2. Double-check all placeholder text is replaced
3. Verify product IDs match the table above
4. Make sure images are in the `public` folder

Happy bundling! 🎉
