-- Check Image Status Script
-- Run this to see which images are using which Cloudinary account
-- This will help identify if you still have old links or broken links.

-- 1. Count images by Cloudinary Account
SELECT 
    CASE 
        WHEN variants::text LIKE '%res.cloudinary.com/blom-cosmetics%' THEN 'Old Account (blom-cosmetics)'
        WHEN variants::text LIKE '%res.cloudinary.com/dd89enrjz%' THEN 'New Account (dd89enrjz)'
        ELSE 'Other/Local'
    END as account_source,
    COUNT(*) as product_count
FROM products
GROUP BY 1;

-- 2. List products with OLD account images (potential broken links)
SELECT id, name, variants 
FROM products 
WHERE variants::text LIKE '%res.cloudinary.com/blom-cosmetics%'
LIMIT 50;

-- 3. List products with NEW account images (verify if these work)
SELECT id, name, variants 
FROM products 
WHERE variants::text LIKE '%res.cloudinary.com/dd89enrjz%'
LIMIT 50;
