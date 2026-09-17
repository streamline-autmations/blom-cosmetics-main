# BLOM Cosmetics Website

A modern, responsive e-commerce website for BLOM Cosmetics featuring professional nail products and educational courses.

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Container.tsx       # Responsive container wrapper
│   │   ├── Header.tsx          # Navigation with mobile menu
│   │   └── Footer.tsx          # Site footer with links
│   ├── sections/
│   │   ├── HeroSlider.tsx      # Homepage hero slider
│   │   └── FeaturedProducts.tsx # Dynamic featured products
│   └── ui/
│       ├── Button.tsx          # Reusable button component
│       └── Card.tsx            # Card components
├── pages/
│   └── HomePage.tsx            # Main homepage
├── lib/
│   └── supabase.ts            # Database client and types
└── index.css                  # Global styles and design system
```

## Features

### Design System
- **Colors**: Pink primary (#FF8BB3), Blue secondary (#CEE5FF)
- **Typography**: Responsive headings, consistent spacing
- **Components**: Reusable buttons, cards, containers
- **Layout**: Mobile-first responsive design

### Navigation
- **Desktop**: Full navigation with mega menus
- **Mobile**: Hamburger menu (homepage only)
- **Consistent**: Header/footer across all pages

### Database Integration
- **Supabase**: PostgreSQL with Row Level Security
- **Tables**: Products, Categories, Courses, Blog Posts
- **Real-time**: Dynamic content loading
- **Fallback**: Static content if database unavailable

### Mobile Optimization
- **Responsive**: Works on all screen sizes
- **Touch-friendly**: 44px minimum touch targets
- **Performance**: Optimized images and loading

## Global CSS Classes

### Buttons
- `.btn` - Base button styles
- `.btn-primary` - Pink primary button
- `.btn-secondary` - White secondary button
- `.btn-outline` - Outlined button
- `.btn-ghost` - Transparent button

### Layout
- `.container-custom` - Responsive container
- `.grid-responsive` - Auto-fit grid
- `.section-padding` - Consistent section spacing

### Utilities
- `.text-gradient` - Pink to blue gradient text
- `.card` - Basic card styling

## Database Schema

### Products
- Complete product management
- Variants support (colors, sizes)
- Image galleries
- Category relationships

### Categories
- Hierarchical structure
- SEO-friendly slugs
- Active/inactive states

### Courses
- Online/in-person options
- Instructor information
- Pricing and scheduling

### Blog Posts
- Rich content support
- SEO optimization
- Tag system

## Adding New Features

### New Pages
1. Create component in `src/pages/`
2. Add navigation links in `Header.tsx`
3. Update routing logic

### New Components
1. Create in appropriate `src/components/` subfolder
2. Follow existing naming conventions
3. Use global CSS classes

### New Database Tables
1. Create migration with `mcp__supabase__apply_migration`
2. Add TypeScript types to `supabase.ts`
3. Create helper queries

### Styling Changes
1. Update CSS variables in `index.css`
2. Changes apply globally across site
3. Maintain responsive design

## Environment Variables

These must be set in Netlify (and locally for `netlify dev`):

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- PAYFAST_MERCHANT_ID
- PAYFAST_MERCHANT_KEY
- PAYFAST_PASSPHRASE (or PF_PASSPHRASE)
- SITE_BASE_URL (or SITE_URL)
- N8N_ORDER_STATUS_WEBHOOK (preferred) or N8N_BASE (fallback)

Notes:
- order-status function forwards to `N8N_ORDER_STATUS_WEBHOOK` if set, otherwise `${N8N_BASE}/webhook/order-status-update`.
- PayFast functions read PAYFAST_* (PF_* as fallbacks) and SITE_* for URLs.

Required in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Deployment

The project builds to static files in `dist/` folder and can be deployed to any static hosting service.

---

Note: Repository synchronized with remote on 2025-09-30.

<!-- Test commit for push verification -->