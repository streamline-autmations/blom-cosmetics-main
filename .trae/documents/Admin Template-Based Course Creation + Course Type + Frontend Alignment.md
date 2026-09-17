## Goal (What You Want)
- In the admin app, when creating a new course, choose a “template” (based on the 3 existing customer course pages) so the form auto-fills fields.
- Add an explicit **Course Type** (Online vs In-Person) in admin so the customer site can reliably:
  - place cards into the correct section
  - show the correct CTA copy/booking behavior
- Update the customer frontend to prefer the new `course_type` field, while still supporting older rows.

## Important Constraint (Template vs Full Detail)
- Your current admin DB schema only stores: `title, slug, description, price, image_url, duration, level, is_active, created_at`.
- The customer **Course Detail pages** contain richer data (packages, module accordion, instructor bio, etc.) that is **not in the DB**.
- So “template-based creation” can mean two levels:
  - **Level A (Recommended now):** Template only pre-fills the fields that exist in the DB + sets course_type.
  - **Level B (Optional later):** Make packages/modules/instructor editable by adding JSON columns (e.g., `content_jsonb`) and updating customer detail rendering.

## Admin/Backend Plan (Prompt You Can Give the Admin Team)
### 1) Database changes (Supabase SQL)
- Add a `course_type` column so online/in-person is not guessed from slug/duration.
  - Option 1 (simple text):
    - `alter table public.courses add column if not exists course_type text not null default 'in-person';`
    - Add a check constraint: `course_type in ('online','in-person')`
  - Keep existing RLS exactly the same; policies still apply.
- Optional but helpful: add a `template_key` column to remember which template was used.
  - `alter table public.courses add column if not exists template_key text null;`
  - Example values: `professional-acrylic-training`, `online-watercolour-workshop`, `christmas-watercolor-workshop`.

### 2) Admin UI (Course create/edit)
- Add **Course Type** field to the form:
  - A select: Online / In-Person
  - Persist it to `courses.course_type`
- Add **Start from Template** dropdown on create (`/courses/new`) only:
  - Templates: 
    - Professional Acrylic Training
    - Online Watercolour Workshop
    - Christmas Watercolor Workshop
  - When selected, auto-fill:
    - title, slug, description, price, image_url, duration, level, course_type, is_active
  - Keep everything editable after auto-fill.

### 3) Server-side write flow (Netlify functions)
- Update `save-course.ts` to accept and write:
  - `course_type`
  - (optional) `template_key`
- Update types/validation accordingly.

### 4) Admin data adapter
- Update `listCourses/getCourse/upsertCourse` to include `course_type` (+ template_key if added).
- In the courses list table, add a column “Type” (Online/In-Person) for quick scanning.

### 5) Seeding the 3 legacy courses
- Insert the 3 courses into Supabase (using fixed UUIDs that match the customer detail pages) and set:
  - `course_type` appropriately (1 in-person, 2 online)
  - `template_key` to match the slug (if you add template_key)

## Customer Frontend Plan (blom-cosmetics-main)
### 1) Courses listing split logic
- Keep the existing two sections UI.
- Change the split logic to:
  - **Prefer** `course_type` if the column exists on the row
  - **Fallback** to current convention (`slug` starts with `online-` OR `duration` contains `self-paced`) for older rows

### 2) Course detail isOnline logic
- Prefer `course_type`:
  - `course_type === 'online'` → online behavior
  - `course_type === 'in-person'` → in-person behavior
- Fallback to slug/duration convention if course_type isn’t present.

### 3) Template mapping (keeping your 3 rich detail pages)
- Keep the existing hardcoded template content for those 3 slugs (packages/modules/etc).
- Continue overriding editable display fields from Supabase (title/description/image/duration/level/price/id).
- Optional improvement if admin adds `template_key`: use it to pick the correct template even if slug changes.

## Files Expected To Change
**Admin repo (blom-admin):**
- `SUPABASE_COURSES_SETUP.sql` (add course_type + optional template_key)
- `netlify/functions/save-course.ts` (accept/write course_type (+ template_key))
- `src/pages/CourseEdit.jsx` (add Course Type + Template dropdown + autofill)
- `src/pages/Courses.jsx` (display Type column)
- `src/components/data/supabaseAdapter.jsx` (include new fields)

**Customer repo (blom-cosmetics-main):**
- `src/pages/CoursesPage.tsx` (prefer `course_type` for section split)
- `src/pages/CourseDetailPage.tsx` (prefer `course_type` for isOnline)

## Verification (Admin + Customer)
- Admin:
  - Create course from a template → fields auto-fill → save → row has correct `course_type`.
  - Edit course → changes reflect on customer site.
- Customer:
  - `/courses` shows correct items under correct section.
  - `/courses/{slug}` loads from Supabase and preserves legacy template content for the 3 template slugs.

## Deliverable (Copy/Paste Prompt For Admin Team)
- I’ll include a single “implementation brief” message with the above DB/UI/function changes, plus the exact template default values for the 3 templates (title/slug/desc/price/image_url/duration/level/course_type).