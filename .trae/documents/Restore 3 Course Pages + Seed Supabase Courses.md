## What You’re Asking For (End Result)
- Bring back the 3 original course cards on the customer Courses page (in the same two-section layout: In-Person Training + Online Workshops).
- Make the Course Detail pages for those slugs still work.
- Add those 3 courses into Supabase so you can edit them in the admin UI and have the customer site reflect the changes.

## Key Constraint / Reality Check
- The customer frontend app is read-only to Supabase (anon). That means it cannot “add courses to Supabase” by itself.
- The correct way to seed those 3 courses is:
  - Either create them via the admin UI (recommended), or
  - Run a SQL seed script in Supabase (I can add the SQL file to the repo for you).

## Data-Fetching Strategy (Customer Frontend)
- Courses listing ([CoursesPage.tsx](file:///c:/Users/User/OneDrive/Blom-Cosmetics/Blom-Working_repo/blom-cosmetics-main/src/pages/CoursesPage.tsx))
  - Continue fetching from Supabase: `courses` table, `is_active = true`, ordered by `created_at` desc.
  - Keep current loading/error/empty handling.
  - Split into two UI sections **without adding new DB fields** using a stable convention:
    - Online if `slug` starts with `online-` OR `duration` contains `self-paced` (case-insensitive)
    - Otherwise In-Person
  - This keeps your old two-section page layout while staying compatible with the admin schema.

- Course detail ([CourseDetailPage.tsx](file:///c:/Users/User/OneDrive/Blom-Cosmetics/Blom-Working_repo/blom-cosmetics-main/src/pages/CourseDetailPage.tsx))
  - Add a Supabase fetch by slug:
    - `from('courses').select('*').eq('slug', slug).eq('is_active', true).single()`
  - Use the DB row as the primary source for: `title`, `description`, `image_url` (hero), `duration`, `level`, `price`, and `id`.
  - Keep the existing page layout/components and booking/payment flow.

## State Handling Plan
- CoursesPage
  - Keep: loading spinner, inline error + Retry, empty message.
  - For section-level empty: if Online or In-Person is empty, show “No courses available at the moment.” under that section only.

- CourseDetailPage
  - Add: loading state (simple centered spinner inside the existing layout).
  - Add: not-found state if Supabase returns 0 rows for that slug (friendly message + link/button back to /courses).
  - Add: error state if Supabase errors (friendly message + Retry).

## Mapping of DB Fields → UI (Admin Schema)
- Listing cards
  - Image: `image_url`
  - Title: `title`
  - Description: `description` (truncated)
  - Duration: `duration`
  - Level: `level`
  - Price: `price` formatted as `R…`
  - Click: `/courses/{slug}`

- Detail page
  - Hero image: `image_url`
  - Header title/description: `title`, `description`
  - Meta rows: `duration`, `level`, `price`
  - Payment/order: use DB `id` as the `product_id` for orders

## Keeping the Old “3 Courses” Content While Still Being Editable
Your current detail page has extra rich content (packages, accordion modules, instructor bio) that is **not in the admin DB schema**.
- For the 3 legacy courses only, we will keep their richer static structures (packages, accordionData, instructor, etc.) as “templates”, but **override** the editable fields from Supabase (title/description/image/duration/level/price/id).
- For any new course you create in admin (that won’t have a static template), the detail page will still render using a safe default template:
  - 1 package (“Standard”) priced from DB `price`
  - availableDates: “Available Now”
  - accordion/modules: hidden if none
  - instructor: default existing instructor block (so layout stays intact)

## Seeding Those 3 Courses Into Supabase (So Admin Can Edit Them)
- Add a SQL seed file (to be run in Supabase SQL editor) that inserts/updates these 3 rows by slug:
  - `professional-acrylic-training`
  - `online-watercolour-workshop`
  - `christmas-watercolor-workshop`
- Seed will include:
  - the same UUIDs currently hardcoded in CourseDetailPage (so order/payment IDs stay consistent)
  - title/description/price/image_url/duration/level/is_active
  - `on conflict (slug) do update` so it’s safe to re-run

## Files To Be Touched
- [CoursesPage.tsx](file:///c:/Users/User/OneDrive/Blom-Cosmetics/Blom-Working_repo/blom-cosmetics-main/src/pages/CoursesPage.tsx)
  - Restore the two-section UI and split fetched courses into those sections.
- [CourseDetailPage.tsx](file:///c:/Users/User/OneDrive/Blom-Cosmetics/Blom-Working_repo/blom-cosmetics-main/src/pages/CourseDetailPage.tsx)
  - Add Supabase fetch-by-slug, state handling, and DB overrides.
- Add a new SQL file in the repo (name like `SUPABASE_COURSES_SEED.sql`) containing the three inserts/updates.

## Verification
- Run typecheck + build.
- Run local dev and confirm:
  - /courses shows two sections with the seeded courses in the correct section
  - clicking each card opens /courses/:slug and renders (with DB values visible)
  - empty/error states still behave correctly when Supabase is unreachable or when no rows are active