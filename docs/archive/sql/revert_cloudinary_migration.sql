-- REVERT SCRIPT: Fix Broken Images (Undo Migration)
-- This script reverses the domain change from 'dd89enrjz' back to 'blom-cosmetics'
-- Run this IMMEDIATELY if the migration caused images to break.

-- 1. Revert 'variants' JSONB column in 'products' table
UPDATE products
SET variants = REGEXP_REPLACE(
    variants::text, 
    'res.cloudinary.com/dd89enrjz', 
    'res.cloudinary.com/blom-cosmetics', 
    'g'
)::jsonb
WHERE variants::text LIKE '%res.cloudinary.com/dd89enrjz%';

-- 2. Revert 'gallery_urls' text array column in 'products' table
UPDATE products
SET gallery_urls = ARRAY(
    SELECT REPLACE(unnest_col, 'res.cloudinary.com/dd89enrjz', 'res.cloudinary.com/blom-cosmetics')
    FROM unnest(gallery_urls) AS unnest_col
)
WHERE gallery_urls::text LIKE '%res.cloudinary.com/dd89enrjz%';

-- 3. Revert 'thumbnail_url' in 'products' table
UPDATE products
SET thumbnail_url = REPLACE(thumbnail_url, 'res.cloudinary.com/dd89enrjz', 'res.cloudinary.com/blom-cosmetics')
WHERE thumbnail_url LIKE '%res.cloudinary.com/dd89enrjz%';

-- 4. Revert 'hover_image' in 'products' table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'hover_image') THEN
        UPDATE products 
        SET hover_image = REPLACE(hover_image, 'res.cloudinary.com/dd89enrjz', 'res.cloudinary.com/blom-cosmetics')
        WHERE hover_image LIKE '%res.cloudinary.com/dd89enrjz%';
    END IF;
END $$;

-- 5. Revert Categories
UPDATE categories 
SET image_url = REPLACE(image_url, 'res.cloudinary.com/dd89enrjz', 'res.cloudinary.com/blom-cosmetics')
WHERE image_url LIKE '%res.cloudinary.com/dd89enrjz%';

-- 6. Revert Product Images Table
UPDATE product_images 
SET image_url = REPLACE(image_url, 'res.cloudinary.com/dd89enrjz', 'res.cloudinary.com/blom-cosmetics')
WHERE image_url LIKE '%res.cloudinary.com/dd89enrjz%';
