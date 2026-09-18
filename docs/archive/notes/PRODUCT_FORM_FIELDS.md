# Complete Product Form Fields Guide

This document lists **ALL fields** the owner needs to create products via a form for both **Product Cards** and **Product Pages**.

---

## 📋 **1. BASIC INFORMATION** (Required for Cards & Pages)

### Required Fields:
- **Product Name** (`name`) - Text input
  - Example: "Orchid Manicure Table"
  - Used in: Cards, Pages, SEO, Cart

- **Product Slug** (`slug`) - Auto-generated from name, or manual override
  - Example: "orchid-manicure-table"
  - Used for: URL (`/products/orchid-manicure-table`)
  - Must be unique, lowercase, hyphens only

- **SKU** (`sku`) - Stock Keeping Unit
  - Example: "BLOM-ORT-001"
  - Must be unique
  - Used for: Inventory, Orders, Tracking

- **Category** (`category_id` or `category`) - Dropdown/Select
  - Link to existing categories or create new
  - Example: "Acrylic System", "Gel System", "Tools"
  - Used for: Filtering, Navigation, SEO

---

## 💰 **2. PRICING & INVENTORY** (Required for Cards & Pages)

### Required Fields:
- **Price** (`price`) - Number input (in Rands, e.g., 3700.00)
  - Used in: Cards, Pages, Cart calculations

- **Compare At Price** (`compare_at_price`) - Optional number input
  - Original price before discount
  - If set, shows as "was R410, now R370" with discount badge
  - Used in: Cards, Pages

- **Inventory Quantity** (`inventory_quantity`) - Number input
  - Current stock level
  - Used for: "In Stock" / "Out of Stock" badges

- **Track Inventory** (`track_inventory`) - Checkbox
  - Whether to automatically track stock
  - If unchecked, always shows "In Stock"

### Optional Fields:
- **Barcode** (`barcode`) - Text input
  - For scanning/point-of-sale systems

- **Weight** (`weight`) - Number input (in grams)
  - For shipping calculations

---

## 📝 **3. DESCRIPTIONS** (Required for Pages, Optional for Cards)

### Required Fields:
- **Short Description** (`short_description`) - Textarea (max 200 chars)
  - Brief summary shown on product cards
  - Example: "Essential prep duo - Dehydrator & Primer - save R40!"
  - Used in: Cards, Product page header

- **Full Description / Overview** (`description` or `overview`) - Rich text editor
  - Detailed product description
  - Supports HTML formatting
  - Used in: Product page "Overview" accordion section

---

## 🖼️ **4. IMAGES** (Required for Cards & Pages)

### Required Fields:
- **Front Image / Primary Image** (`thumbnail_url` or first in `gallery_urls[]`)
  - Main product image (white background)
  - Used in: Product cards, Product page main display
  - Format: URL (upload or paste URL)
  - Minimum: 800x800px recommended

- **Hover Image / Secondary Image** (`gallery_urls[1]` or second image)
  - Colorful/alternate product image
  - Used in: Product cards (flip effect on hover)
  - Format: URL
  - Optional but recommended

### Optional Fields:
- **Gallery Images** (`gallery_urls[]`) - Multiple image URLs
  - Additional product photos
  - Used in: Product page thumbnail carousel
  - Can add unlimited images
  - Each image can have:
    - **Image URL** (required)
    - **Alt Text** (for accessibility/SEO)
    - **Sort Order** (display order)

---

## 🏷️ **5. VARIANTS** (Optional - for products with different options)

### Variant Fields (can add multiple variants):
For each variant:
- **Variant Title** (`title`) - Text input
  - Example: "Pink - 15ml", "Red - 30ml"
  
- **Variant Price** (`price`) - Number input
  - Can override base product price
  - If not set, uses base product price

- **Variant Compare At Price** (`compare_at_price`) - Optional
  - Discount price for this variant

- **Variant SKU** (`sku`) - Text input
  - Unique SKU for this variant
  - Example: "BLOM-ORT-001-PINK-15"

- **Option 1** (`option1`) - Dropdown/Text
  - First variant option (e.g., "Color")
  - Examples: "Pink", "Red", "Blue"

- **Option 2** (`option2`) - Dropdown/Text
  - Second variant option (e.g., "Size")
  - Examples: "15ml", "30ml", "50ml"

- **Option 3** (`option3`) - Dropdown/Text
  - Third variant option (optional)
  - Examples: "Finish" → "Matte", "Glossy"

- **Variant Inventory** (`inventory_quantity`) - Number input
  - Stock level for this specific variant

- **Variant Weight** (`weight`) - Number input (grams)
  - Shipping weight for this variant

- **Is Active** (`is_active`) - Checkbox
  - Whether this variant is available for purchase

---

## ✨ **6. FEATURES & BENEFITS** (Required for Product Pages)

### Required Fields:
- **Features List** (`features[]`) - Multiple text inputs
  - Bullet points of product benefits
  - Example:
    - "Complete nail preparation system"
    - "Professional-grade adhesion products"
    - "Prevents lifting and ensures long-lasting results"
  - Used in: Product page "Features & Benefits" accordion
  - Can add unlimited features

---

## 📖 **7. HOW TO USE / APPLICATION STEPS** (Required for Product Pages)

### Required Fields:
- **Usage Steps** (`how_to_use[]`) - Multiple text inputs (ordered list)
  - Step-by-step instructions
  - Example:
    1. "Start with clean, shaped natural nails"
    2. "Apply Prep Solution to dehydrate the nail plate"
    3. "Allow to dry completely (30-60 seconds)"
  - Used in: Product page "How to Use" accordion
  - Numbered steps (1, 2, 3, etc.)

---

## 🧪 **8. INGREDIENTS** (Required for Product Pages)

### Required Fields:
- **INCI Ingredients** (`inci_ingredients[]`) - Multiple text inputs
  - International Nomenclature of Cosmetic Ingredients
  - Scientific/technical ingredient names
  - Example:
    - "Ethyl Acetate"
    - "Butyl Acetate"
    - "Nitrocellulose"
  - Used in: Product page "Ingredients" accordion (left column)

- **Key Ingredients** (`key_ingredients[]`) - Multiple text inputs
  - User-friendly ingredient descriptions
  - Highlight main benefits
  - Example:
    - "Vitamin E – Nourishes and strengthens nails"
    - "Keratin – Builds nail structure"
  - Used in: Product page "Ingredients" accordion (right column)

---

## 📦 **9. PRODUCT DETAILS** (Required for Product Pages)

### Required Fields:
- **Size** (`size`) - Text input
  - Example: "15ml", "30ml", "500ml"
  - Used in: Product page "Details" accordion

- **Shelf Life** (`shelf_life`) - Text input
  - Example: "24 months", "36 months from manufacture date"
  - Used in: Product page "Details" accordion

- **Claims** (`claims[]`) - Multiple checkboxes or text inputs
  - Product certifications/claims
  - Examples:
    - "Vegan" (shows with leaf icon)
    - "Cruelty-Free" (shows with heart icon)
    - "HEMA-Free" (shows with shield icon)
    - "Paraben-Free"
    - "Toxic-Free"
  - Used in: Product page "Details" accordion, badges on cards
  - Icons automatically assigned based on claim type

---

## 🎯 **10. MARKETING & SEO** (Required for visibility)

### Required Fields:
- **Meta Title** (`meta_title`) - Text input (max 60 chars)
  - SEO title for search engines
  - Example: "Orchid Manicure Table | BLOM Cosmetics"
  - Used in: Browser tab, search results

- **Meta Description** (`meta_description`) - Textarea (max 160 chars)
  - SEO description for search engines
  - Example: "Professional manicure table perfect for nail salons. Durable construction, adjustable height, and elegant design."
  - Used in: Search result snippets

### Optional Fields:
- **Badges** (`badges[]`) - Multiple checkboxes or text inputs
  - Product badges for cards
  - Examples: "Bestseller", "New", "Sale", "Limited Edition"
  - Used in: Product cards (top-left corner)

---

## 🎨 **11. DISPLAY SETTINGS** (Optional but recommended)

### Optional Fields:
- **Is Active** (`is_active`) - Checkbox
  - Whether product is visible on site
  - Unchecked = hidden from customers

- **Is Featured** (`is_featured`) - Checkbox
  - Whether to show on homepage featured section
  - Used in: Homepage "Featured Products" carousel

- **Status** (`status`) - Dropdown
  - Options: "draft", "published", "archived"
  - Draft = not visible, Published = live, Archived = hidden

---

## 🔗 **12. RELATED PRODUCTS** (Optional)

### Optional Fields:
- **Related Products** (`related[]`) - Multi-select dropdown
  - Link to other products
  - Used in: Product page "Related Products" section
  - Shows at bottom of product page

---

## 📊 **13. REVIEWS & RATINGS** (Auto-generated, but can be set)

### Optional Fields (usually auto-calculated):
- **Average Rating** (`rating`) - Number (0-5)
  - Auto-calculated from reviews
  - Can manually override for display

- **Review Count** (`review_count`) - Number
  - Auto-calculated from reviews
  - Can manually override

---

## 📋 **FORM SUMMARY BY PRIORITY**

### **MUST HAVE** (Required for product to appear):
1. Product Name
2. Slug (auto-generated)
3. SKU
4. Price
5. Category
6. Short Description
7. Front Image
8. Inventory Quantity

### **SHOULD HAVE** (Important for good product pages):
9. Full Description/Overview
10. Hover Image
11. Features List
12. How to Use Steps
13. Ingredients (INCI + Key)
14. Product Details (Size, Shelf Life, Claims)
15. Meta Title & Description

### **NICE TO HAVE** (Enhances user experience):
16. Gallery Images
17. Variants
18. Compare At Price
19. Badges
20. Related Products
21. Weight
22. Barcode

---

## 🎨 **VISUAL FIELD GROUPING FOR FORM**

### **Section 1: Basic Info**
- Name, Slug, SKU, Category

### **Section 2: Pricing & Stock**
- Price, Compare At Price, Inventory, Track Inventory

### **Section 3: Images**
- Front Image, Hover Image, Gallery Images

### **Section 4: Descriptions**
- Short Description, Full Description

### **Section 5: Product Details**
- Size, Shelf Life, Weight

### **Section 6: Features & Usage**
- Features List, How to Use Steps

### **Section 7: Ingredients**
- INCI Ingredients, Key Ingredients

### **Section 8: Claims & Certifications**
- Claims (checkboxes)

### **Section 9: Variants**
- Add variant button → variant form (Price, SKU, Options, Inventory)

### **Section 10: SEO**
- Meta Title, Meta Description

### **Section 11: Display Settings**
- Is Active, Is Featured, Status, Badges

### **Section 12: Related Products**
- Multi-select dropdown

---

## 💡 **TIPS FOR FORM DESIGN**

1. **Progressive Disclosure**: Show basic fields first, advanced fields in expandable sections
2. **Image Upload**: Allow drag-and-drop or URL paste
3. **Dynamic Lists**: Add/remove buttons for features, steps, ingredients, variants
4. **Auto-save**: Save draft as user types
5. **Validation**: 
   - Slug must be unique
   - SKU must be unique
   - Price must be > 0
   - Images must be valid URLs
6. **Preview**: Show product card and page preview in real-time
7. **Help Text**: Tooltips explaining each field

---

## 🔄 **DATA STRUCTURE EXAMPLE**

```json
{
  "name": "Orchid Manicure Table",
  "slug": "orchid-manicure-table",
  "sku": "BLOM-ORT-001",
  "category_id": "uuid-here",
  "price": 3700.00,
  "compare_at_price": null,
  "short_description": "Professional manicure table perfect for nail salons.",
  "description": "Full detailed description here...",
  "overview": "Complete overview text...",
  "inventory_quantity": 10,
  "track_inventory": true,
  "thumbnail_url": "https://example.com/front-image.jpg",
  "gallery_urls": [
    "https://example.com/front-image.jpg",
    "https://example.com/hover-image.jpg",
    "https://example.com/gallery-1.jpg"
  ],
  "features": [
    "Feature 1",
    "Feature 2"
  ],
  "how_to_use": [
    "Step 1",
    "Step 2"
  ],
  "inci_ingredients": [
    "Ingredient 1",
    "Ingredient 2"
  ],
  "key_ingredients": [
    "Key ingredient 1",
    "Key ingredient 2"
  ],
  "size": "Standard",
  "shelf_life": "24 months",
  "claims": ["Vegan", "Cruelty-Free"],
  "meta_title": "Orchid Manicure Table | BLOM",
  "meta_description": "Professional manicure table...",
  "is_active": true,
  "is_featured": false,
  "badges": ["Bestseller"],
  "variants": [
    {
      "title": "Pink - 15ml",
      "price": 3700.00,
      "sku": "BLOM-ORT-001-PINK-15",
      "option1": "Pink",
      "option2": "15ml",
      "inventory_quantity": 5
    }
  ]
}
```

---

## ✅ **CHECKLIST FOR OWNER**

Before publishing a product, ensure:
- [ ] Name is clear and descriptive
- [ ] Slug is URL-friendly and unique
- [ ] SKU is unique and follows naming convention
- [ ] Price is set correctly
- [ ] At least one image (front image) is uploaded
- [ ] Short description is compelling (2-3 sentences)
- [ ] Full description is complete
- [ ] Features list has at least 3-5 benefits
- [ ] How to use has step-by-step instructions
- [ ] Ingredients are listed (INCI + Key)
- [ ] Size and shelf life are specified
- [ ] Claims/certifications are selected
- [ ] Meta title and description are SEO-optimized
- [ ] Inventory quantity is accurate
- [ ] Product is set to "Active" and "Published"


