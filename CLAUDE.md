# Claude Code Instructions

## Cost Reduction

After writing or modifying any code, always run the `/cost-reducer` skill to review the changes for cloud, infrastructure, and operational cost optimizations before finishing.

This applies to: database queries, edge functions, Supabase config, API calls, bundle changes, caching, and any cloud resource configuration.

## Mobile Layout: The Page Must Never Be Wider Than the Screen (hard rule)

On phones, any element wider than the viewport makes the browser zoom the whole site out. This happened on the course page when a 4th instructor tab was added. Never let it happen again:

1. **Never remove the width guard** in `src/index.css` (`html, body { overflow-x: clip }`). Use `clip`, not `hidden`, because `hidden` breaks the sticky header.
2. **The guard is a safety net, not a fix.** Content that can grow (tabs, pills, chips, filter rows, instructor or date lists, tables, carousels) must fit at 375px or scroll *inside its own container*. For tab and pill rows, use `src/components/ui/ScrollableTabRow.tsx`, which provides horizontal scroll, edge fades and a "Swipe to see all N" hint. Tables go in an `overflow-x-auto` wrapper.
3. **Never use a single-line `flex justify-center` row for a list whose length can change.** It overflows and hides the first item as soon as the list grows.
4. **Don't set fixed widths or `min-width` wider than the screen** on mobile, and don't use negative margins that push past the page edge.
5. **Verify every UI change at 375–390px** (Playwright): `document.documentElement.scrollWidth` must equal the viewport width, and screenshot the changed section. Re-check whenever you add items to data-driven lists (instructors, dates, packages).
