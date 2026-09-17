-- Fix Blushing Bridgerton Image
UPDATE products
SET 
  thumbnail_url = 'https://res.cloudinary.com/drsrbzm2t/image/upload/v1771405672/Blushing_Bridgerton_m6ixlv.jpg',
  image_url = 'https://res.cloudinary.com/drsrbzm2t/image/upload/v1771405672/Blushing_Bridgerton_m6ixlv.jpg',
  gallery_urls = ARRAY['https://res.cloudinary.com/drsrbzm2t/image/upload/v1771405672/Blushing_Bridgerton_m6ixlv.jpg']
WHERE id = 'e6e2fedb-8711-4d3c-a946-8956abb905e2';
