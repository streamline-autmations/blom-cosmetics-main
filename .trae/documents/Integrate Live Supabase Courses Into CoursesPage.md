## Data-Fetching Strategy
- In [CoursesPage.tsx](file:///c:/Users/User/OneDrive/Blom-Cosmetics/Blom-Working_repo/blom-cosmetics-main/src/pages/CoursesPage.tsx), remove the static course arrays and fetch live data on mount using the existing Supabase client.
- Query (matches admin-required schema + RLS):
  - `from('courses').select('*').eq('is_active', true).order('created_at', { ascending: false })`
- Do not order by `is_featured` (not in your SQL plan).
- Do not split by `course_type` (not in your SQL plan).

## State Handling Plan
- Add local state in CoursesPage:
  - `isLoading`: boolean
  - `error`: string | null
  - `courses`: array
- UI flow:
  - Loading: show a spinner or skeleton in the listing area (within the existing page structure).
  - Success: render the fetched courses as cards.
  - Error: show a compact inline error message + a Retry action that re-runs the fetch.

## Mapping: DB Fields → UI
Using your SQL table columns:
- Image: `image_url` (fallback to an existing placeholder if empty)
- Title: `title`
- Description: `description` (truncated to a fixed length to protect card layout)
- Level: `level`
- Duration: `duration`
- Price: `price` (numeric) formatted as `R…`
- Click: `/courses/{slug}` using `slug`

## Layout / Rendering Plan (Preserve Card Design)
- Keep Header/Footer/Container exactly as-is.
- Keep the existing card markup/styles (same Card component/classes, same button styles).
- Since the backend schema does not provide a reliable “online vs in-person” discriminator and we are not adding heuristics, render a single unified course grid (no data-driven splitting).
- Keep the “Why Train with BLOM” section unchanged.
- Update the IntersectionObserver setup so it attaches to dynamically rendered `.course-card` elements after the fetch completes.

## Error + Empty Handling
- Empty state:
  - If `courses.length === 0` after a successful fetch, render exactly: “No courses available at the moment.”
- Error state:
  - If the Supabase call returns an error, set `error` and show a user-safe message.
  - Console-log only safe debugging info (no secrets).

## Files To Be Touched
- [CoursesPage.tsx](file:///c:/Users/User/OneDrive/Blom-Cosmetics/Blom-Working_repo/blom-cosmetics-main/src/pages/CoursesPage.tsx) only.

## Backend ↔ Frontend Correspondence
- This plan aligns 1:1 with the admin SQL schema (`image_url`, `duration`, `level`, `price`, `is_active`) and its RLS policy allowing anon read of active courses.