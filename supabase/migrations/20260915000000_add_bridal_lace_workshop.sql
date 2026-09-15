-- Add the Bridal and Lace Nail Art Workshop (in-person, Randfontein, Yolanda Botha)
-- to the store's courses table. The id matches CourseDetailPage.tsx.

INSERT INTO public.courses (
  id,
  title,
  slug,
  description,
  short_description,
  price,
  image_url,
  featured_image,
  duration,
  level,
  is_active,
  course_type,
  template_key,
  instructor_name,
  instructor_bio,
  start_date
) VALUES (
  'be26f87c-0dde-46b0-9c0e-4218f366fec0',
  'Bridal and Lace Nail Art Workshop',
  'bridal-and-lace-nail-art-workshop',
  'Master the art of bridal nails and delicate lace designs in a hands-on, one-day workshop at Blom Cosmetics SA, Randfontein. Kit included.',
  'One-day bridal & lace nail art workshop in Randfontein. Kit included.',
  1850,
  'https://res.cloudinary.com/hmvetruz/image/upload/f_auto,q_auto/v1789466319/courses/bridal-and-lace-nail-art-workshop/1_docwzm.png',
  'https://res.cloudinary.com/hmvetruz/image/upload/f_auto,q_auto/v1789466319/courses/bridal-and-lace-nail-art-workshop/1_docwzm.png',
  '1 Day',
  'All Levels',
  true,
  'in-person',
  'bridal-and-lace-nail-art-workshop',
  'Yolanda Botha',
  'Professional nail artist with years of experience in nail artistry.',
  '2026-10-10 08:30:00+02'
)
ON CONFLICT (slug) DO NOTHING;
