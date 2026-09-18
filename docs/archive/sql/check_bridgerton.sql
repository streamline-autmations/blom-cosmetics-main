-- Check Blushing Bridgerton-(009) images
SELECT id, name, thumbnail_url, image_url, gallery_urls
FROM products
WHERE name ILIKE '%Blushing Bridgerton%';
