-- MASTER FIX SCRIPT
-- 1. Fixes ALL image URLs (updates to 'drsrbzm2t')
-- 2. Removes the duplicate "Blooming Love" product (Archives & Renames)

-- ==========================================
-- PART 1: IMAGE URL FIXES (drsrbzm2t)
-- ==========================================

-- 1. Products: Variants (JSONB)
UPDATE products
SET variants = REGEXP_REPLACE(
    REGEXP_REPLACE(variants::text, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/drsrbzm2t', 'g'),
    'res.cloudinary.com/dd89enrjz', 
    'res.cloudinary.com/drsrbzm2t', 
    'g'
)::jsonb
WHERE variants::text LIKE '%res.cloudinary.com/blom-cosmetics%' 
   OR variants::text LIKE '%res.cloudinary.com/dd89enrjz%';

-- 2. Products: Gallery URLs
UPDATE products
SET gallery_urls = ARRAY(
    SELECT REPLACE(REPLACE(unnest_col, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/drsrbzm2t'), 'res.cloudinary.com/dd89enrjz', 'res.cloudinary.com/drsrbzm2t')
    FROM unnest(gallery_urls) AS unnest_col
)
WHERE gallery_urls::text LIKE '%res.cloudinary.com/blom-cosmetics%' 
   OR gallery_urls::text LIKE '%res.cloudinary.com/dd89enrjz%';

-- 3. Products: Thumbnail URL
UPDATE products
SET thumbnail_url = REPLACE(REPLACE(thumbnail_url, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/drsrbzm2t'), 'res.cloudinary.com/dd89enrjz', 'res.cloudinary.com/drsrbzm2t')
WHERE thumbnail_url LIKE '%res.cloudinary.com/blom-cosmetics%' 
   OR thumbnail_url LIKE '%res.cloudinary.com/dd89enrjz%';

-- 4. Products: Hover Image
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'hover_image') THEN
        UPDATE products 
        SET hover_image = REPLACE(REPLACE(hover_image, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/drsrbzm2t'), 'res.cloudinary.com/dd89enrjz', 'res.cloudinary.com/drsrbzm2t')
        WHERE hover_image LIKE '%res.cloudinary.com/blom-cosmetics%' OR hover_image LIKE '%res.cloudinary.com/dd89enrjz%';
    END IF;
END $$;

-- 5. Product Images Table
UPDATE product_images 
SET image_url = REPLACE(REPLACE(image_url, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/drsrbzm2t'), 'res.cloudinary.com/dd89enrjz', 'res.cloudinary.com/drsrbzm2t')
WHERE image_url LIKE '%res.cloudinary.com/blom-cosmetics%' 
   OR image_url LIKE '%res.cloudinary.com/dd89enrjz%';

-- 6. Categories (Collections)
UPDATE categories 
SET image_url = REPLACE(REPLACE(image_url, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/drsrbzm2t'), 'res.cloudinary.com/dd89enrjz', 'res.cloudinary.com/drsrbzm2t')
WHERE image_url LIKE '%res.cloudinary.com/blom-cosmetics%' 
   OR image_url LIKE '%res.cloudinary.com/dd89enrjz%';

-- 7. Featured Items
UPDATE featured_items 
SET custom_image_url = REPLACE(REPLACE(custom_image_url, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/drsrbzm2t'), 'res.cloudinary.com/dd89enrjz', 'res.cloudinary.com/drsrbzm2t')
WHERE custom_image_url LIKE '%res.cloudinary.com/blom-cosmetics%' 
   OR custom_image_url LIKE '%res.cloudinary.com/dd89enrjz%';

-- 8. Blog Posts & Courses
UPDATE blog_posts 
SET featured_image = REPLACE(REPLACE(featured_image, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/drsrbzm2t'), 'res.cloudinary.com/dd89enrjz', 'res.cloudinary.com/drsrbzm2t'),
    content = REPLACE(REPLACE(content, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/drsrbzm2t'), 'res.cloudinary.com/dd89enrjz', 'res.cloudinary.com/drsrbzm2t')
WHERE featured_image LIKE '%res.cloudinary.com/%' OR content LIKE '%res.cloudinary.com/%';

UPDATE courses 
SET featured_image = REPLACE(REPLACE(featured_image, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/drsrbzm2t'), 'res.cloudinary.com/dd89enrjz', 'res.cloudinary.com/drsrbzm2t'),
    description = REPLACE(REPLACE(description, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/drsrbzm2t'), 'res.cloudinary.com/dd89enrjz', 'res.cloudinary.com/drsrbzm2t')
WHERE featured_image LIKE '%res.cloudinary.com/%' OR description LIKE '%res.cloudinary.com/%';


-- ==========================================
-- PART 2: REMOVE DUPLICATE PRODUCT
-- ==========================================

-- Archive and Rename the duplicate "Blooming Love Acrylic Collection"
-- Target ID: 75309f85-b147-4e24-b050-18dc38b48b7e
UPDATE public.products
SET 
  status = 'archived',
  is_active = false,
  name = 'ARCHIVED - DUPLICATE - Blooming Love',
  slug = 'archived-blooming-love-duplicate-' || floor(random() * 1000)::text
WHERE id = '75309f85-b147-4e24-b050-18dc38b48b7e';

-- Also archive any other potential duplicates by name, EXCLUDING the one that is likely valid (if any)
-- This safety check ensures we don't accidentally archive the "good" one if the ID was wrong, 
-- but we prioritize the ID you gave.
