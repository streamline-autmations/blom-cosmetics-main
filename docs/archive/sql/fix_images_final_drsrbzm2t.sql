-- FIX: Update ALL images to the CORRECT Cloudinary Account (drsrbzm2t)
-- This script replaces both 'blom-cosmetics' (Old) and 'dd89enrjz' (Incorrect) with 'drsrbzm2t' (Correct)

-- 1. Update Products (Variants - JSONB)
UPDATE products
SET variants = REGEXP_REPLACE(
    REGEXP_REPLACE(variants::text, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/drsrbzm2t', 'g'),
    'res.cloudinary.com/dd89enrjz', 
    'res.cloudinary.com/drsrbzm2t', 
    'g'
)::jsonb
WHERE variants::text LIKE '%res.cloudinary.com/blom-cosmetics%' 
   OR variants::text LIKE '%res.cloudinary.com/dd89enrjz%';

-- 2. Update Products (Gallery URLs - Text Array)
-- We need to handle array updates carefully. A simple text replacement on the whole array string works for basic cases,
-- but unnesting is safer. However, for bulk updates, let's try a direct text cast approach if possible or stick to the unnest.
-- Let's stick to the unnest approach but do it in two passes to be safe and simple.

-- Pass 2a: Fix blom-cosmetics
UPDATE products
SET gallery_urls = ARRAY(
    SELECT REPLACE(unnest_col, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/drsrbzm2t')
    FROM unnest(gallery_urls) AS unnest_col
)
WHERE gallery_urls::text LIKE '%res.cloudinary.com/blom-cosmetics%';

-- Pass 2b: Fix dd89enrjz
UPDATE products
SET gallery_urls = ARRAY(
    SELECT REPLACE(unnest_col, 'res.cloudinary.com/dd89enrjz', 'res.cloudinary.com/drsrbzm2t')
    FROM unnest(gallery_urls) AS unnest_col
)
WHERE gallery_urls::text LIKE '%res.cloudinary.com/dd89enrjz%';

-- 3. Update Products (Thumbnail URL)
UPDATE products
SET thumbnail_url = REPLACE(REPLACE(thumbnail_url, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/drsrbzm2t'), 'res.cloudinary.com/dd89enrjz', 'res.cloudinary.com/drsrbzm2t')
WHERE thumbnail_url LIKE '%res.cloudinary.com/blom-cosmetics%' OR thumbnail_url LIKE '%res.cloudinary.com/dd89enrjz%';

-- 4. Update Products (Hover Image)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'hover_image') THEN
        UPDATE products 
        SET hover_image = REPLACE(REPLACE(hover_image, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/drsrbzm2t'), 'res.cloudinary.com/dd89enrjz', 'res.cloudinary.com/drsrbzm2t')
        WHERE hover_image LIKE '%res.cloudinary.com/blom-cosmetics%' OR hover_image LIKE '%res.cloudinary.com/dd89enrjz%';
    END IF;
END $$;

-- 5. Update Product Images Table
UPDATE product_images 
SET image_url = REPLACE(REPLACE(image_url, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/drsrbzm2t'), 'res.cloudinary.com/dd89enrjz', 'res.cloudinary.com/drsrbzm2t')
WHERE image_url LIKE '%res.cloudinary.com/blom-cosmetics%' OR image_url LIKE '%res.cloudinary.com/dd89enrjz%';

-- 6. Verify Results (Should show mostly 'Correct Account')
SELECT 
    CASE 
        WHEN variants::text LIKE '%res.cloudinary.com/blom-cosmetics%' THEN 'Still Old (Error)'
        WHEN variants::text LIKE '%res.cloudinary.com/dd89enrjz%' THEN 'Still Incorrect (Error)'
        WHEN variants::text LIKE '%res.cloudinary.com/drsrbzm2t%' THEN 'Correct Account (drsrbzm2t)'
        ELSE 'Other/Local'
    END as account_source,
    COUNT(*) as product_count
FROM products
GROUP BY 1;
