# Tartan Cravings - Project Context

## Project Overview
**Tartan Cravings** is a food delivery application for Carnegie Mellon University, similar to Grubhub. The app allows users to place orders from restaurants and input delivery locations, with pricing scaled based on distance between restaurant and delivery location.

## Key Requirements
- **CMU-only authentication**: Force users to sign in with @andrew.cmu.edu Google accounts
- **Admin access**: Restricted to mdli2@andrew.cmu.edu for restaurant management
- **Distance-based pricing**: Scale delivery fees based on location
- **Campus integration**: Use CMU buildings and campus-specific features

## Tech Stack
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, authentication, real-time)
- **Authentication**: Google OAuth with domain restriction
- **Styling**: Tailwind CSS with custom CMU colors

## CMU Branding Colors
```css
colors: {
  'cmu-red': '#C41E3A',
  'cmu-darkred': '#A41729',
  'cmu-gold': '#FFB81C',
  'cmu-gray': '#53565A'
}
```

## Database Schema
Located in `/supabase/migrations/`:
- `001_initial_schema.sql` - Core tables (users, restaurants, orders, etc.)
- `002_seed_data.sql` - CMU buildings and initial data
- `003_rls_policies.sql` - Row Level Security policies
- `004_fix_admin_policies.sql` - Admin-specific RLS fixes

### Key Tables
- `users` - User profiles with CMU-specific fields
- `restaurants` - Restaurant details with location and pricing
- `cmu_buildings` - Campus buildings for delivery locations
- `orders` - Order tracking with status and delivery info
- `order_items` - Individual items in orders
- `menu_items` - Restaurant menu items

## Authentication Flow
1. **Google OAuth Setup**: Configured with `hd=andrew.cmu.edu` parameter
2. **Multi-layer Validation**:
   - Client-side: `lib/auth/cmu-validator.ts`
   - Server-side: API routes and middleware
   - Database: RLS policies
3. **Admin Access**: Hardcoded to mdli2@andrew.cmu.edu

## Key Files Created/Modified

### Authentication
- `components/auth/CMUSignInButton.tsx` - Custom sign-in with CMU domain restriction
- `lib/auth/cmu-validator.ts` - CMU email validation utilities
- `middleware.ts` - Authentication middleware for protected routes

### Admin System
- `app/admin/page.tsx` - Admin dashboard for restaurant management
- `components/admin/AdminGuard.tsx` - Admin access control
- `app/api/admin/restaurants/` - API routes bypassing RLS for admin operations
- `lib/api/admin.ts` - Admin API functions

### Core Pages
- `app/page.tsx` - Landing page with CMU branding
- `app/(protected)/restaurants/page.tsx` - Restaurant listing
- `app/(protected)/orders/page.tsx` - User order history
- `app/(protected)/orders/[id]/page.tsx` - Individual order details
- `app/(protected)/profile/page.tsx` - User profile management

### Components
- `components/ui/` - Reusable UI components (buttons, cards, inputs, etc.)
- `components/restaurant/RestaurantCard.tsx` - Restaurant display component

## Issues Resolved

### 1. Google OAuth 500 Error
**Problem**: "Trying to sign in gives 500. That's an error"
**Solution**: Added proper Google OAuth configuration and debug logging

### 2. Runtime TypeError
**Problem**: `now.toLocaleLowerCase is not a function`
**Solution**: Fixed date handling in restaurant cards:
```typescript
// Before (broken)
now.toLocaleLowerCase()

// After (fixed)
now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
```

### 3. RLS Policy Violations
**Problem**: "new row violates row-level security policy for table 'restaurants'"
**Solution**: Created admin API routes and updated RLS policies to allow admin operations

### 4. 404 Page Errors
**Problem**: Orders and Profile pages leading to 404
**Solution**: Created missing pages with full functionality

## Current Status

### ✅ Completed
- [x] Google OAuth configuration and authentication flow
- [x] Restaurant listing API and display
- [x] Authentication redirect flow
- [x] Database connection testing and debugging
- [x] Admin page for restaurant management
- [x] Orders and Profile pages

### 🔄 Pending
- [ ] Run database migrations and set up initial data
- [ ] Implement shopping cart and ordering system
- [ ] Add campus building selector and distance-based pricing

## Setup Instructions

### 1. Environment Variables
Create `.env.local` with:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth (need to set up in Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 2. Database Setup
Run migrations in Supabase SQL Editor:
1. `001_initial_schema.sql`
2. `002_seed_data.sql`
3. `003_rls_policies.sql`
4. `004_fix_admin_policies.sql`

### 3. Google OAuth Setup
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs for Supabase
4. Configure hosted domain restriction

### 4. Run Development Server
```bash
npm run dev
```

## Next Steps
1. **Complete Google OAuth setup** in Google Cloud Console
2. **Run database migrations** in Supabase dashboard
3. **Implement shopping cart** functionality for placing orders
4. **Add distance-based pricing** using CMU building locations
5. **Test full user flow** from authentication to order placement

## File Structure
```
tartancravings/
├── app/
│   ├── (protected)/
│   │   ├── orders/
│   │   ├── profile/
│   │   └── restaurants/
│   ├── admin/
│   ├── api/
│   │   └── admin/
│   └── auth/
├── components/
│   ├── admin/
│   ├── auth/
│   ├── restaurant/
│   └── ui/
├── lib/
│   ├── api/
│   ├── auth/
│   └── supabase/
├── supabase/
│   └── migrations/
└── types/
```

## Important Notes
- Admin access is hardcoded to `mdli2@andrew.cmu.edu`
- All authentication requires @andrew.cmu.edu domain
- RLS policies enforce data security
- API routes bypass RLS for admin operations
- CMU branding and colors are consistently applied