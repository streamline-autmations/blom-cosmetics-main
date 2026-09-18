## Copy/Paste Prompt for blom-admin (Courses Templates + Course Type)

You are working in the BLOM admin repo (blom-admin). This is an update to existing code, not a rebuild.

### Constraints (Non-Negotiable)
- Do not change folder structure.
- Do not add dependencies.
- Do not change authentication logic.
- Preserve existing styling/layout/components.
- Match existing Products CRUD patterns where applicable.
- Supabase remains the source of truth.
- Admin WRITES via Netlify functions (service role), frontend READS.

---

## Goal
1) Add a **Course Type** field (Online / In-Person) when creating/editing courses in the admin app.
2) Add a **Start from Template** dropdown on the create form so new courses can be created using the 3 existing customer course pages as defaults.
3) Ensure the admin app handles the required fields correctly (especially `instructor_name` which is NOT NULL).

---

## Database / Supabase (SQL only; run in Supabase)
The `courses` table schema has been updated to include `image_url`, `duration`, `level`, `template_key`, and requires `instructor_name`.

If you haven't run the migration yet, ensure these columns exist:

```sql
-- Ensure columns exist (idempotent)
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS level text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS template_key text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS instructor_name text; -- Should be NOT NULL in production
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS instructor_bio text;

-- Add course_type if missing
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS course_type text NOT NULL DEFAULT 'in-person';
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_course_type_check;
ALTER TABLE public.courses ADD CONSTRAINT courses_course_type_check CHECK (course_type IN ('online', 'in-person'));
```

---

## Netlify Functions (Writes)
### save-course.ts
Extend the payload and DB upsert to include all display fields and the required `instructor_name`.

Example payload shape:
```ts
{
  id?,
  title,
  slug,
  description?,
  price?,
  image_url?,      // Maps to `image_url` column (text)
  duration?,       // Maps to `duration` column (text)
  level?,          // Maps to `level` column (text)
  is_active?,
  course_type,     // 'online' | 'in-person'
  template_key?,   // string | null
  instructor_name, // REQUIRED (string)
  instructor_bio?  // string | null
}
```

---

## Admin UI (Courses)
### 1) CourseEdit.jsx (create/edit page)
Add these UI controls:

#### A) Course Type select (required)
- Field name: `course_type`
- Options:
  - Online (`online`)
  - In-Person (`in-person`)

#### B) Instructor Fields (Required)
- **Instructor Name** (required): `instructor_name`
- **Instructor Bio** (optional): `instructor_bio`

#### C) Start from Template dropdown (create-only)
Show only when `id === 'new'`.
- Label: “Start from Template”
- Options:
  - None
  - Professional Acrylic Training
  - Flower Nail Art Workshop
  - Christmas Watercolor Workshop

When a template is selected, auto-fill these fields:
- title, slug, description, price
- image_url (or uploaded Storage URL)
- duration, level
- is_active, course_type
- template_key
- instructor_name, instructor_bio

**Template defaults:**

1) Professional Acrylic Training
- template_key: `professional-acrylic-training`
- title: `Professional Acrylic Training`
- slug: `professional-acrylic-training`
- description: `Master the art of acrylic nail application with hands-on training in Randfontein. Master prep, application, structure & finishing in 5 days.`
- price: `7200.00`
- image_url: `/professional-acrylic-training-hero.webp`
- duration: `5 Days`
- level: `Beginner to Intermediate`
- course_type: `in-person`
- instructor_name: `Avané Crous`
- instructor_bio: `Professional nail artist and educator with over 8 years of experience in acrylic nail application.`
- is_active: true

2) Flower Nail Art Workshop
- template_key: `blom-flower-watercolor-workshop`
- title: `Flower Nail Art Workshop`
- slug: `blom-flower-watercolor-workshop`
- description: `Learn how to create soft, dreamy flower nail art designs from the comfort of your home with step-by-step videos and detailed guidance.`
- price: `480.00`
- image_url: `/online-watercolor-card.webp`
- duration: `Self-Paced`
- level: `All Levels`
- course_type: `online`
- instructor_name: `Avané Crous`
- instructor_bio: `Professional nail artist and educator with over 8 years of experience.`
- is_active: true

3) Christmas Watercolor Nail Art Workshop
- template_key: `holiday-watercolor-workshop`
- title: `Christmas Watercolor Nail Art Workshop`
- slug: `holiday-watercolor-workshop`
- description: `Paint festive watercolor nail art for the holidays! Learn Christmas tree designs, snowflakes, and winter wonderland techniques.`
- price: `450.00`
- image_url: `/christmas-watercolor-card.webp`
- duration: `Self-Paced`
- level: `All Levels`
- course_type: `online`
- instructor_name: `Avané Crous`
- instructor_bio: `Professional nail artist and educator with over 8 years of experience.`
- is_active: true

### 2) Courses.jsx (list page)
- Add a “Type” column showing `course_type`.

---

## Data Adapter (Admin)
Update `supabaseAdapter.jsx` to include `image_url`, `duration`, `level`, `template_key`, `instructor_name`, `instructor_bio` in read and write flows.

---

## Verification Checklist
- Create a new course from each template and verify fields auto-fill.
- Save and confirm the row has the correct `course_type` and `instructor_name`.
- Customer frontend shows the course under the correct section (Online vs In-Person).
