-- Backfill the Rubber Base Perfection & Russian Manicure course row.
-- The course has always been sellable (prices are client-supplied for
-- everything except Trendy Ring), but it had no `courses` row, so it never
-- appeared in the admin Courses list. The id matches CourseDetailPage.tsx.

INSERT INTO public.courses (
  id, title, slug, description, short_description, price,
  image_url, duration, level, is_active, course_type, template_key,
  deposit_amount, instructor_name, instructor_bio
) VALUES (
  'b8f2a3e1-4c7d-4e2f-8a9b-1c3d5e7f9a0b',
  'Rubber Base Perfection & Russian Manicure',
  'rubber-base-perfection-course',
  'A 2-in-1 beginner-friendly intensive course. Master rubber base application and Russian manicure techniques over 3 to 4 full days of hands-on training.',
  '2-in-1 rubber base & Russian manicure intensive, Randfontein & Orkney.',
  4819,
  'https://res.cloudinary.com/dy1gw7dr2/image/upload/q_auto/f_auto/v1778584938/ChatGPT_Image_May_12_2026_01_20_22_PM_ia7dr2.png',
  '3 Full Days (Intensive Training)',
  'Beginner to Intermediate',
  true,
  'in-person',
  'rubber-base-perfection-course',
  1800,
  'Avané Crous',
  'Professional nail artist and educator with over 8 years of experience. Avané specialises in rubber base systems and Russian manicure techniques.'
)
ON CONFLICT (slug) DO NOTHING;
