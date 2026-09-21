-- Add missing columns to match frontend expectations
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS level text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS template_key text;

-- Insert/Update the 3 legacy courses
INSERT INTO public.courses (
  id,
  title,
  slug,
  description,
  price,
  image_url,
  duration,
  level,
  is_active,
  course_type,
  template_key,
  instructor_name,
  instructor_bio,
  created_at
) VALUES 
(
  'a603be5f-2c56-4e95-9423-8229c8991b40',
  'Professional Acrylic Training',
  'professional-acrylic-training',
  'Master the art of acrylic nail application with hands-on training in Randfontein.',
  7600,
  '/professional-acrylic-training-hero.webp',
  '5 Days',
  'Beginner to Intermediate',
  true,
  'in-person',
  'professional-acrylic-training',
  'Avané Crous',
  'Professional nail artist and educator with over 8 years of experience in acrylic nail application.',
  now()
),
(
  '7c5276c1-9207-4653-89c3-bb4c675db5e2',
  'Flower Nail Art Workshop',
  'blom-flower-watercolor-workshop',
  'Learn how to create soft, dreamy flower nail art designs from the comfort of your home.',
  480,
  '/online-watercolor-card.webp',
  'Self-Paced',
  'All Levels',
  true,
  'online',
  'blom-flower-watercolor-workshop',
  'Avané Crous',
  'Professional nail artist and educator with over 8 years of experience.',
  now() - interval '1 day'
),
(
  'efe16488-1de6-4522-aeb3-b08cfae3a640',
  'Christmas Watercolor Nail Art Workshop',
  'holiday-watercolor-workshop',
  'Paint festive watercolor nail art for the holidays! Learn Christmas tree designs, snowflakes, and winter wonderland techniques.',
  450,
  '/christmas-watercolor-card.webp',
  'Self-Paced',
  'All Levels',
  true,
  'online',
  'holiday-watercolor-workshop',
  'Avané Crous',
  'Professional nail artist and educator with over 8 years of experience.',
  now() - interval '2 days'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  duration = EXCLUDED.duration,
  level = EXCLUDED.level,
  is_active = EXCLUDED.is_active,
  course_type = EXCLUDED.course_type,
  template_key = EXCLUDED.template_key,
  instructor_name = EXCLUDED.instructor_name,
  instructor_bio = EXCLUDED.instructor_bio;
