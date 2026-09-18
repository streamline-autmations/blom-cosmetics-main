/*
  FIX: Replace all 'blom-cosmetics' (Old Account) URLs with 'dd89enrjz' (New Account)
  
  The diagnostic query showed 203 products are still using "Other/Local" which includes the old account.
  Only 5 products are using the new account.
  
  This confirms that the vast majority of your product images are pointing to the OLD Cloudinary account.
  If that account is closed or the images were moved, they will 404.
  
  We must update the database to point to the new account where the images actually exist.
*/

-- 1. Update Products (Variants - JSONB)
UPDATE products
SET variants = REGEXP_REPLACE(
    variants::text, 
    'res.cloudinary.com/blom-cosmetics', 
    'res.cloudinary.com/dd89enrjz', 
    'g'
)::jsonb
WHERE variants::text LIKE '%res.cloudinary.com/blom-cosmetics%';

-- 2. Update Products (Gallery URLs - Text Array)
UPDATE products
SET gallery_urls = ARRAY(
    SELECT REPLACE(unnest_col, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/dd89enrjz')
    FROM unnest(gallery_urls) AS unnest_col
)
WHERE gallery_urls::text LIKE '%res.cloudinary.com/blom-cosmetics%';

-- 3. Update Products (Thumbnail URL)
UPDATE products
SET thumbnail_url = REPLACE(thumbnail_url, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/dd89enrjz')
WHERE thumbnail_url LIKE '%res.cloudinary.com/blom-cosmetics%';

-- 4. Update Products (Hover Image)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'hover_image') THEN
        UPDATE products 
        SET hover_image = REPLACE(hover_image, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/dd89enrjz')
        WHERE hover_image LIKE '%res.cloudinary.com/blom-cosmetics%';
    END IF;
END $$;

-- 5. Update Product Images Table
UPDATE product_images 
SET image_url = REPLACE(image_url, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/dd89enrjz')
WHERE image_url LIKE '%res.cloudinary.com/blom-cosmetics%';

-- 6. Verify Update
SELECT 
    CASE 
        WHEN variants::text LIKE '%res.cloudinary.com/blom-cosmetics%' THEN 'Old Account (blom-cosmetics)'
        WHEN variants::text LIKE '%res.cloudinary.com/dd89enrjz%' THEN 'New Account (dd89enrjz)'
        ELSE 'Other/Local'
    END as account_source,
    COUNT(*) as product_count
FROM products
GROUP BY 1;
