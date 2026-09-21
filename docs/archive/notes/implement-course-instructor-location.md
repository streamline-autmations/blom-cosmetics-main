# Implementation Plan: In-Person Course Instructor & Location Selection

## Summary
Add instructor and location dropdown selection for in-person courses, with data saved to orders for admin visibility.

---

## Requirements Clarified

1. **Only for in-person courses** (not online courses)
2. **2 Instructors:**
   - Avané Crous (existing) - Randfontein location
   - Yolanda Botha (new) - Orkney location
3. **Locations:**
   - 34 Horingbek Avenue, Helikonpark, Randfontein, Gauteng (Avané)
   - 9 Addison str, Golf Park, Orkney (Yolanda)
4. **UI Flow:**
   - "Meet Your Instructors" section - update to show both instructors with their locations
   - Booking form - add dropdown to select instructor (location auto-selected based on instructor)

---

## Implementation Steps

### Phase 1: Update Course Data (CourseDetailPage.tsx)

#### 1.1 Add instructors array to course data
```typescript
instructors: [
  {
    name: 'Avané Crous',
    image: '/avane-crous-headshot.webp',
    bio: 'Professional nail artist and educator with over 8 years...',
    location: '34 Horingbek Avenue, Helikonpark, Randfontein, Gauteng'
  },
  {
    name: 'Yolanda Botha',
    image: 'https://res.cloudinary.com/dnlgohkcc/image/upload/v1774267387/WhatsApp_Image_2026-03-23_at_13.25.03_nzsq0y.jpg',
    bio: 'Professional nail artist and educator...',
    location: '9 Addison str, Golf Park, Orkney',
    email: 'blom.orkney.northwest@gmail.com',
    phone: '0731518407'
  }
]
```

#### 1.2 Update "Meet Your Instructors" section
- Display both instructors with their photo, name, bio, and location

#### 1.3 Add dropdown selector in booking form
- Dropdown shows: "Avané Crous - Randfontein" / "Yolanda Botha - Orkney"
- When selected, pass as combined field: "Yolanda Botha - Orkney"

---

### Phase 2: Database Migration

```sql
-- Add single column for combined instructor+location
ALTER TABLE orders ADD COLUMN course_instructor_location TEXT;
```

---

### Phase 3: Backend Updates

#### 3.1 Update create-order.ts
- Accept `course_instructor_location` from request body
- Save to orders table

#### 3.2 Update admin-orders.ts
- Query the new field
- Display in order list

---

## File Changes Required

| File | Changes |
|------|---------|
| `src/pages/CourseDetailPage.tsx` | Add instructors array, update UI, add dropdown |
| `migrations/007_add_instructor_location.sql` | Create migration |
| `netlify/functions/create-order.ts` | Accept new field |
| `netlify/functions/admin-orders.ts` | Display new field |

---

## Timeline Estimate
- Phase 1 (Frontend): 1-2 hours
- Phase 2 (Database): 5 minutes
- Phase 3 (Backend): 30 minutes
- Testing: 30 minutes

**Total: ~3 hours**
