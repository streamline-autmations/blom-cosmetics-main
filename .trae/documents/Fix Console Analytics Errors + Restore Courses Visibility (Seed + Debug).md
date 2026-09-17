## What The Console Errors Mean
- The `net::ERR_ABORTED` errors you pasted are Google Analytics (gtag) network requests being blocked/aborted in the local Trae preview/browser environment (common with adblockers, strict privacy settings, or embedded webviews).
- They are noisy but typically not what’s preventing the page from rendering.

## Why The Course Cards Aren’t Showing
- Your screenshot shows both sections rendering the empty-state text, which means the Supabase query succeeded but returned **0 active rows** (or you’re connected to the wrong Supabase project / RLS is filtering everything).
- Most likely causes:
  - The 3 legacy courses were not inserted into `public.courses` yet (seed not run / admin not used yet)
  - `is_active` is false on the rows
  - Supabase env vars point to a different project than the one you seeded
  - RLS policy for anon select isn’t applied (would usually be an error, but we’ll confirm)

## Plan: Reduce Console Noise (Analytics)
- Update [index.html](file:///c:/Users/User/OneDrive/Blom-Cosmetics/Blom-Working_repo/blom-cosmetics-main/index.html) to only load analytics scripts when appropriate:
  - Do not load GA/Facebook/Hotjar when `location.hostname` is `localhost` or `127.0.0.1`
  - Also do not load if the IDs are placeholders (e.g. `YOUR_FACEBOOK_PIXEL_ID`)
- Optionally (recommended), update [analytics.ts](file:///c:/Users/User/OneDrive/Blom-Cosmetics/Blom-Working_repo/blom-cosmetics-main/src/lib/analytics.ts) so the default analytics instance does **not** initialize GA tracking unless a real GA ID is provided via env (still no new dependencies).

## Plan: Make Courses Show Up (Correct Data + Better Debug)
- Step 1 (data): ensure the 3 courses exist in Supabase by running the seed SQL file:
  - [SUPABASE_COURSES_SEED.sql](file:///c:/Users/User/OneDrive/Blom-Cosmetics/Blom-Working_repo/blom-cosmetics-main/SUPABASE_COURSES_SEED.sql)
- Step 2 (verify): add lightweight, dev-only console output in [CoursesPage.tsx](file:///c:/Users/User/OneDrive/Blom-Cosmetics/Blom-Working_repo/blom-cosmetics-main/src/pages/CoursesPage.tsx) so we can immediately see:
  - Which Supabase URL is being used
  - Whether the query returned rows or was filtered
  - Any Supabase error message/code
- Step 3 (UX): if Supabase returns 0 rows, keep the current empty UI, but surface a more actionable hint in dev (e.g., “No courses found. Have you run the seed / enabled RLS policy?”) without changing the design.

## Plan: Ensure Course Pages Work With Admin Improvements
- Keep current logic:
  - Listing and detail pages prefer `course_type` when present, and fall back to slug/duration conventions.
  - Detail page can choose legacy templates via `template_key` if the admin adds it.

## Files To Be Touched
- [index.html](file:///c:/Users/User/OneDrive/Blom-Cosmetics/Blom-Working_repo/blom-cosmetics-main/index.html) (gate analytics scripts on localhost + placeholders)
- [analytics.ts](file:///c:/Users/User/OneDrive/Blom-Cosmetics/Blom-Working_repo/blom-cosmetics-main/src/lib/analytics.ts) (avoid initializing analytics with placeholder IDs)
- [CoursesPage.tsx](file:///c:/Users/User/OneDrive/Blom-Cosmetics/Blom-Working_repo/blom-cosmetics-main/src/pages/CoursesPage.tsx) (dev-only fetch diagnostics / clearer empty hint)

## Verification
- Reload `/courses` on localhost:
  - Console should be clean (no GA aborted spam)
  - If courses are seeded and active, the 3 cards should appear in the correct sections
  - If not, the console diagnostics should clearly show why (wrong project, 0 rows, RLS error)