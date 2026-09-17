# BLOM Course Enrollment Flow — Complete Reference
> Shared document across all 3 repos: Shop (blom-cosmetics-main), Academy (watercolor-workshop), Admin (blom-admin).
> Last updated: 2026-05-04
> When Claude updates this file in one repo, copy the changes to the other two.

---

## 1. System Overview

| Repo | URL | Role in enrollment |
|------|-----|--------------------|
| **Shop** (`blom-cosmetics-main`) | blom-cosmetics.co.za | Checkout, payment, triggers enrollment |
| **Academy** (`watercolor-workshop`) | blom-academy.vercel.app | Course content, invite redemption, enrollments |
| **Admin** (`blom-admin`) | admin.blom-cosmetics.co.za | (No course management yet — see §6) |

Supabase projects are **separate**:
- Shop DB: `SUPABASE_URL` (env var in Shop Netlify)
- Academy DB: `SUPABASE_URL` (env var in Academy Vercel / Supabase Edge Functions)

---

## 2. Full Purchase → Enrollment Flow

```
Customer buys course on Shop
        ↓
PayFast/Payflex payment webhook fires
  (payfast-itn.ts or payflex-webhook.ts)
        ↓
  Marks order paid, deducts stock, generates invoice
        ↓
  Reads course_purchases rows for this order_id
        ↓
  For each course: calls enrollCourse() in enroll-helper.ts
        ↓
  enroll-helper POSTs to Academy edge function:
  POST https://yvmnedjybrpvlupygusf.supabase.co/functions/v1/course-purchase
        ↓
  Academy edge function (course-purchase/index.ts):
    1. Idempotency: skip if status already 'sent' or 'redeemed'
    2. Upsert course_purchases row in Academy DB
    3. Lookup buyer email in Academy auth.users
       - Existing user → enroll_user_by_id() → status = 'redeemed' → action = 'enrolled'
       - New user → create_course_invite() (60-day expiry) → n8n webhook → status = 'sent' → action = 'invited'
        ↓
  enroll-helper updates Shop DB course_purchases:
    - action='enrolled' → invitation_status = 'enrolled'  ⚠️ see Issue #1
    - action='invited'  → invitation_status = 'sent'
        ↓
  n8n (Course-Invite-New workflow) sends email + WhatsApp:
  Invite URL: https://blom-academy.vercel.app/accept-invite?invite=TOKEN
        ↓
Customer clicks invite link → AcceptInvite.tsx
    - Not logged in → shows "Sign up" / "Log in" buttons
    - Logged in → calls claim_course_invite(token, user_id) RPC
    - Success → redirect to /course/{courseSlug}
        ↓
  If customer signs up (new) → SimpleSignup.tsx (/signup?invite=TOKEN)
    - Creates Supabase account
    - If no email confirmation needed (instant session):
        Calls claim_course_invite immediately → redirect to course
    - If email confirmation required:
        emailRedirectTo = /accept-invite?invite=TOKEN
        After email confirm → back to AcceptInvite → must log in first
        AcceptInvite shows "Log in" → /login?invite=TOKEN
        After login → back to AcceptInvite → claims invite
```

---

## 3. Key Files by Repo

### Shop (`blom-cosmetics-main`)
| File | Purpose |
|------|---------|
| `netlify/functions/_lib/enroll-helper.ts` | Calls Academy edge function, updates Shop DB status |
| `netlify/functions/payfast-itn.ts` | PayFast webhook — triggers enrollment |
| `netlify/functions/payflex-webhook.ts` | Payflex webhook — triggers enrollment |
| `netlify/functions/enroll-course.ts` | Manual/admin HTTP endpoint that calls enrollCourse() |
| `netlify/functions/retry-failed-invites.ts` | Retries all rows with invitation_status='failed' |
| `netlify/functions/redeem-invite.ts` | **LEGACY — do not use** (see Issue #2) |
| `src/pages/CourseDetailPage.tsx` | Course product page for customers |
| `src/pages/CoursesPage.tsx` | Courses listing page |
| `supabase/migrations/20260407_add_faded_flowers_workshop.sql` | Adds faded-flowers-workshop to Shop DB |

### Academy (`watercolor-workshop`)
| File | Purpose |
|------|---------|
| `supabase/functions/course-purchase/index.ts` | Main edge function — creates invites or enrolls directly |
| `src/pages/AcceptInvite.tsx` | Invite redemption page (claims invite after login) |
| `src/pages/SimpleSignup.tsx` | Signup page — handles invite token, claims on signup |
| `src/pages/AdminInvites.tsx` | Admin UI to view/create/revoke invites (weak auth — see Issue #4) |
| `src/hooks/useCourseInvites.ts` | Hook for createInvite, claimCourseInvite, getInvites, revokeInvite |
| `src/App.tsx` | Routes — must have /accept-invite, /signup, /login |
| `supabase/migrations/fix_invite_rpcs.sql` | Latest RPC definitions |

### Admin (`blom-admin`)
| File | Purpose |
|------|---------|
| *(none yet)* | No course/invite management currently built |

---

## 4. Environment Variables

### Shop (Netlify)
```
ACADEMY_FUNCTION_URL=https://yvmnedjybrpvlupygusf.supabase.co/functions/v1
ACADEMY_WEBHOOK_SECRET=<shared secret — must match Academy WEBHOOK_SECRET>
SUPABASE_URL=<shop supabase project URL>
SUPABASE_SERVICE_ROLE_KEY=<shop service role key>
```

### Academy (Supabase Edge Function Secrets)
```
WEBHOOK_SECRET=<same shared secret as ACADEMY_WEBHOOK_SECRET in Shop>
SUPABASE_URL=<auto-set by Supabase>
SUPABASE_SERVICE_ROLE_KEY=<auto-set by Supabase>
```

---

## 5. Database Tables (Both DBs)

### Shop DB (`course_purchases`)
```sql
order_id          text
course_slug       text
buyer_email       text
buyer_name        text
buyer_phone       text
amount_paid_cents integer
invitation_status text  -- 'pending' | 'sent' | 'enrolled' | 'redeemed' | 'failed'
invited_at        timestamptz
academy_user_id   uuid
redeemed_at       timestamptz
```

### Academy DB
- `courses` — course catalog (id, slug, title, ...)
- `course_invites` — invite tokens (token, course_id, email, expires_at, redeemed_at)
- `course_purchases` — mirrors Shop's purchases (order_id, course_slug, buyer_email, ...)
- `enrollments` — grants access (user_id, course_id, status='active')

### Academy DB RPCs
- `create_course_invite(p_course_id, p_email, p_expires_in_days)` → `{ token, expires_at }`
- `claim_course_invite(p_token, p_user_id)` → `{ success, course_slug, course_id }`
- `enroll_user_by_id(p_user_id, p_course_slugs[])` → void
- `get_user_id_by_email(p_email)` → uuid

---

## 6. Known Issues (as of 2026-05-04)

### Issue #1 — `invitation_status` mismatch: 'enrolled' vs 'redeemed' ✅ FIXED 2026-05-04
**Location:** `enroll-helper.ts` + Academy `course-purchase/index.ts`

When an existing Academy user buys a course:
- Edge function sets Shop DB status → `'redeemed'`
- Then `enroll-helper.ts` overwrites it → `'enrolled'` (line: `result.action === 'enrolled' ? 'enrolled' : 'sent'`)
- Edge function's idempotency check only looks for `'sent'` or `'redeemed'`
- Status `'enrolled'` is NOT in that check → retry would reprocess the order

**Fix (Shop side):** In `enroll-helper.ts`, change the status mapping:
```typescript
// Change this:
const invitationStatus = result.action === 'enrolled' ? 'enrolled' : 'sent'
// To this:
const invitationStatus = result.action === 'enrolled' ? 'redeemed' : 'sent'
```
Or alternatively, add `'enrolled'` to the idempotency check in the edge function.

---

### Issue #2 — `redeem-invite.ts` is a legacy dead-end ⚠️ CLEANUP NEEDED
**Location:** `netlify/functions/redeem-invite.ts` (Shop)

This old function:
- Calls Academy Supabase directly (not the edge function)
- Uses `auth.admin.listUsers()` to find users — fetches ALL users, fragile
- Updates `course_purchases` by `buyer_email` only (not `order_id`) — could match multiple rows
- Is NOT called by the current enrollment flow (AcceptInvite.tsx uses RPC directly)

**Fix:** Remove or deprecate `redeem-invite.ts`. It is not in the happy path.

---

### Issue #3 — `faded-flowers-workshop` may be missing from Academy DB ⚠️ VERIFY
**Context:** The Shop migration `20260407_add_faded_flowers_workshop.sql` adds this course to the Shop DB. But the Academy DB also needs this course in its `courses` table for the `course-purchase` edge function to resolve the course title correctly.

The edge function has graceful fallback (uses slug as title if course not found), but the course must exist for enrollment to work correctly.

**Fix (Academy side):** Run in Academy Supabase SQL editor:
```sql
INSERT INTO courses (title, slug, description, price, image_url, duration, level, is_active, course_type, instructor_name, instructor_bio)
VALUES (
  'Faded Flowers Workshop',
  'faded-flowers-workshop',
  'Master the art of faded flower nail designs. Step-by-step video tutorials for six stunning designs.',
  69000,  -- in cents? or check what the Academy uses
  'https://res.cloudinary.com/dnlgohkcc/image/upload/q_auto/f_auto/v1775453928/WhatsApp_Image_2026-04-03_at_12.34.07_uelxcc.jpg',
  'Self-Paced',
  'All Levels',
  true,
  'online',
  'Avané Crous',
  'Professional nail artist and educator with over 8 years of experience.'
)
ON CONFLICT (slug) DO NOTHING;
```

---

### Issue #4 — AdminInvites.tsx uses insecure admin check ⚠️ LOW PRIORITY
**Location:** `src/pages/AdminInvites.tsx` (Academy)

```typescript
const isAdmin = user?.email?.includes('admin') || user?.email?.includes('blom');
```

Anyone with "blom" or "admin" in their email gets admin access to the invites page. Should use `profiles.role = 'admin'` check.

---

### Issue #5 — Login page invite token handling ✅ VERIFIED WORKING 2026-05-04
`src/pages/Login.tsx` reads `?invite=TOKEN` from the URL. When the session becomes active after sign-in, it redirects to `/accept-invite?invite=TOKEN`. No fix needed.

---

## 7. Course Slug Reference (canonical — use everywhere)

| Course Name | Slug | Status |
|-------------|------|--------|
| Faded Flowers Workshop | `faded-flowers-workshop` | Active |
| Flower Nail Art Workshop | `blom-flower-watercolor-workshop` | Active |
| Christmas Watercolor Workshop | `holiday-watercolor-workshop` | Active |
| Online Watercolour Workshop | `online-watercolour-workshop` | Active |
| Professional Acrylic Training | `professional-acrylic-training` | In-person (no online enrollment) |

**Retired slugs (do not use):**
- `christmas-watercolor-workshop` → use `holiday-watercolor-workshop`
- `blom-flower-workshop` → use `blom-flower-watercolor-workshop`

---

## 8. Retry / Recovery

### Retry failed invites
```bash
curl -X POST https://blom-cosmetics.co.za/.netlify/functions/retry-failed-invites \
  -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>"
```
Fetches all `invitation_status='failed'` rows and retries them.

### Manual enroll (admin)
```bash
curl -X POST https://blom-cosmetics.co.za/.netlify/functions/enroll-course \
  -H "Content-Type: application/json" \
  -d '{"order_id":"...","course_slug":"faded-flowers-workshop","buyer_email":"...","buyer_name":"...","buyer_phone":"..."}'
```

### Check a purchase in Shop DB
```sql
SELECT order_id, course_slug, buyer_email, invitation_status, invited_at, redeemed_at
FROM course_purchases
WHERE buyer_email = 'customer@example.com'
ORDER BY created_at DESC;
```

### Check invites in Academy DB
```sql
SELECT ci.token, ci.email, ci.expires_at, ci.redeemed_at,
       cp.order_id, cp.invitation_status
FROM course_invites ci
LEFT JOIN course_purchases cp ON cp.buyer_email = ci.email
WHERE ci.email = 'customer@example.com'
ORDER BY ci.created_at DESC;
```

---

## 9. n8n Webhooks

| Webhook | URL | Triggered by |
|---------|-----|-------------|
| Order notification | `https://dockerfile-1n82.onrender.com/webhook/notify-order` | payfast-itn, payflex-webhook |
| Course invite | `https://dockerfile-1n82.onrender.com/webhook/course-invite` | Academy course-purchase edge function |

**n8n course-invite payload:**
```json
{
  "to": "buyer@email.com",
  "name": "Customer Name",
  "phone": "+27...",
  "course_slug": "Faded Flowers Workshop",  // human-readable title, not slug
  "invite_url": "https://blom-academy.vercel.app/accept-invite?invite=TOKEN",
  "expires_at": "2026-07-03T..."
}
```

---

## 10. Admin's Role (Current + Planned)

### Currently
The Admin app (`blom-admin`) has no course or invite management.
Admins can manage courses manually via:
- Academy `/admin-invites` page (weak auth — see Issue #4)
- Direct Supabase SQL editor

### Planned
Add to Admin app:
- View `course_purchases` across all orders (join with `orders`)
- Manually trigger enrollment for a purchase
- View/resend failed invites
- Create manual invites (bypass payment)

Reference prompt: `ADMIN_COURSES_TEMPLATE_PROMPT.md` in Shop repo.

---

## 11. Testing Checklist

Before declaring the enrollment flow working, verify each step:

- [ ] Buy a course as a new user (no Academy account) → invite email arrives within 2 minutes
- [ ] Click invite link → redirected to Academy AcceptInvite page
- [ ] Sign up with a new account → course appears in My Courses immediately after signup
- [ ] Buy a course as an existing Academy user → enrolled immediately (no invite email needed)
- [ ] Buy same course twice (idempotency) → only one invite/enrollment created
- [ ] Shop DB `invitation_status` is `'sent'` after new-user enrollment
- [ ] Shop DB `invitation_status` is `'redeemed'` after existing-user direct enrollment (see Issue #1 — currently sets 'enrolled')
- [ ] `retry-failed-invites` endpoint re-processes `status='failed'` rows
- [ ] `faded-flowers-workshop` invite email shows correct course name (not raw slug)
