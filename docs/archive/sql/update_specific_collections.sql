-- Update Collections with User Provided URLs (Correct Filenames)

-- 1. Blooming Love Acrylic Collection
UPDATE products
SET thumbnail_url = 'https://res.cloudinary.com/drsrbzm2t/image/upload/v1771405810/blooming_love_collection_vhc6aq.jpg',
    image_url = 'https://res.cloudinary.com/drsrbzm2t/image/upload/v1771405810/blooming_love_collection_vhc6aq.jpg'
WHERE name ILIKE '%Blooming Love Acrylic Collection%' AND status = 'active';

-- 2. High Tea Brigerton Combo
UPDATE products
SET thumbnail_url = 'https://res.cloudinary.com/drsrbzm2t/image/upload/v1772439520/high_tea_tayuk2.jpg',
    image_url = 'https://res.cloudinary.com/drsrbzm2t/image/upload/v1772439520/high_tea_tayuk2.jpg'
WHERE name ILIKE '%High Tea%' AND status = 'active';

-- 3. Pastel Acrylic Collection
UPDATE products
SET thumbnail_url = 'https://res.cloudinary.com/drsrbzm2t/image/upload/v1772439776/pasterl_acrylic_mpmtcq.jpg',
    image_url = 'https://res.cloudinary.com/drsrbzm2t/image/upload/v1772439776/pasterl_acrylic_mpmtcq.jpg'
WHERE name ILIKE '%Pastel Acrylic Collection%' AND status = 'active';

-- 4. Red Collection
UPDATE products
SET thumbnail_url = 'https://res.cloudinary.com/drsrbzm2t/image/upload/v1772439777/red_fmhxka.jpg',
    image_url = 'https://res.cloudinary.com/drsrbzm2t/image/upload/v1772439777/red_fmhxka.jpg'
WHERE name ILIKE '%Red Collection%' AND status = 'active';

-- 5. Petal Collection Bundle
UPDATE products
SET thumbnail_url = 'https://res.cloudinary.com/drsrbzm2t/image/upload/v1772439778/petal_w1pblm.jpg',
    image_url = 'https://res.cloudinary.com/drsrbzm2t/image/upload/v1772439778/petal_w1pblm.jpg'
WHERE name ILIKE '%Petal Collection%' AND status = 'active';

-- 6. Snowberry Christmas Collection
UPDATE products
SET thumbnail_url = 'https://res.cloudinary.com/drsrbzm2t/image/upload/v1772439779/snowberry_cqxya8.jpg',
    image_url = 'https://res.cloudinary.com/drsrbzm2t/image/upload/v1772439779/snowberry_cqxya8.jpg'
WHERE name ILIKE '%Snowberry%' AND status = 'active';

-- 7. Ensure the duplicate Blooming Love is definitely gone (safety check)
UPDATE products 
SET status = 'archived', is_active = false 
WHERE id = '75309f85-b147-4e24-b050-18dc38b48b7e';
