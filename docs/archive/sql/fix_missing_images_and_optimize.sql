-- Fix missing images and optimize database URLs
-- This script targets columns that might have been missed in the first pass

-- 1. Fix 'variants' JSONB column in 'products' table
-- This is crucial as many products display images from their variants
UPDATE products
SET variants = REGEXP_REPLACE(
    variants::text, 
    'res.cloudinary.com/blom-cosmetics', 
    'res.cloudinary.com/dd89enrjz', 
    'g'
)::jsonb
WHERE variants::text LIKE '%res.cloudinary.com/blom-cosmetics%';

-- 2. Fix 'gallery_urls' text array column in 'products' table
UPDATE products
SET gallery_urls = ARRAY(
    SELECT REPLACE(unnest_col, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/dd89enrjz')
    FROM unnest(gallery_urls) AS unnest_col
)
WHERE gallery_urls::text LIKE '%res.cloudinary.com/blom-cosmetics%';

-- 3. Fix 'thumbnail_url' in 'products' table (if missed)
UPDATE products
SET thumbnail_url = REPLACE(thumbnail_url, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/dd89enrjz')
WHERE thumbnail_url LIKE '%res.cloudinary.com/blom-cosmetics%';

-- 4. Fix 'hover_image' in 'products' table (if missed)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'hover_image') THEN
        UPDATE products 
        SET hover_image = REPLACE(hover_image, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/dd89enrjz')
        WHERE hover_image LIKE '%res.cloudinary.com/blom-cosmetics%';
    END IF;
END $$;

-- 5. Verify results
SELECT count(*) as fixed_variants_count FROM products WHERE variants::text LIKE '%dd89enrjz%';
SELECT count(*) as remaining_broken_links FROM products WHERE variants::text LIKE '%blom-cosmetics%';
