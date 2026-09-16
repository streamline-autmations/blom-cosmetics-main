-- Add the Customized Shaping Workshop (in-person, Blom Cosmetics HQ Randfontein, Avané Crous)
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
  'f95e1464-0391-4f4d-81db-043a13d3bd4b',
  'Customized Shaping Workshop',
  'customized-shaping-workshop',
  'Shape, style, create. A hands-on one-day workshop at Blom Cosmetics Headquarters in Randfontein covering multiple nail shapes, perfect structure and small art techniques.',
  'One-day nail shaping & structure workshop at Blom HQ, Randfontein.',
  1500,
  'https://res.cloudinary.com/hmvetruz/image/upload/f_auto,q_auto/v1789553798/courses/customized-shaping-workshop/shaping_usiqzr.png',
  'https://res.cloudinary.com/hmvetruz/image/upload/f_auto,q_auto/v1789553798/courses/customized-shaping-workshop/shaping_usiqzr.png',
  '1 Day',
  'All Levels',
  true,
  'in-person',
  'customized-shaping-workshop',
  'Avané Crous',
  'Professional nail artist and educator with over 8 years of experience in shape, structure and balance.',
  '2026-09-29 00:00:00+02'
)
ON CONFLICT (slug) DO NOTHING;
