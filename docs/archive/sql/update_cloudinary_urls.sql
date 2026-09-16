-- Migration to update Cloudinary URLs from old account (blom-cosmetics) to new account (dd89enrjz)

-- 1. Update Categories
UPDATE categories 
SET image_url = REPLACE(image_url, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/dd89enrjz')
WHERE image_url LIKE '%res.cloudinary.com/blom-cosmetics%';

-- 2. Update Products (Description)
UPDATE products 
SET description = REPLACE(description, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/dd89enrjz')
WHERE description LIKE '%res.cloudinary.com/blom-cosmetics%';

-- 3. Update Product Images
UPDATE product_images 
SET image_url = REPLACE(image_url, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/dd89enrjz')
WHERE image_url LIKE '%res.cloudinary.com/blom-cosmetics%';

-- 4. Update Blog Posts
UPDATE blog_posts 
SET featured_image = REPLACE(featured_image, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/dd89enrjz'),
    content = REPLACE(content, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/dd89enrjz')
WHERE featured_image LIKE '%res.cloudinary.com/blom-cosmetics%' 
   OR content LIKE '%res.cloudinary.com/blom-cosmetics%';

-- 5. Update Courses
UPDATE courses 
SET featured_image = REPLACE(featured_image, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/dd89enrjz'),
    description = REPLACE(description, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/dd89enrjz')
WHERE featured_image LIKE '%res.cloudinary.com/blom-cosmetics%' 
   OR description LIKE '%res.cloudinary.com/blom-cosmetics%';

-- 6. Update Product Reviews (images column)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_reviews' AND column_name = 'images') THEN
        UPDATE product_reviews 
        SET images = REPLACE(images::text, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/dd89enrjz')::jsonb
        WHERE images::text LIKE '%res.cloudinary.com/blom-cosmetics%';
    END IF;
END $$;

-- 7. Update Product Reviews (photos column - fallback)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_reviews' AND column_name = 'photos') THEN
        UPDATE product_reviews 
        SET photos = REPLACE(photos::text, 'res.cloudinary.com/blom-cosmetics', 'res.cloudinary.com/dd89enrjz')::jsonb
        WHERE photos::text LIKE '%res.cloudinary.com/blom-cosmetics%';
    END IF;
END $$;

-- 8. Verify updates
SELECT 'Categories Updated' as check, count(*) FROM categories WHERE image_url LIKE '%dd89enrjz%';
SELECT 'Product Images Updated' as check, count(*) FROM product_images WHERE image_url LIKE '%dd89enrjz%';
