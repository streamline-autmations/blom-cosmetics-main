-- Diagnostic: Check Cuticle Oil Product and Variants
SELECT id, name, thumbnail_url, variants
FROM products
WHERE name ILIKE '%Cuticle Oil%';
