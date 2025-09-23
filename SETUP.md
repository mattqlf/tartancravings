# Tartan Cravings Setup Guide

This guide will help you set up and run the Tartan Cravings food delivery application for Carnegie Mellon University.

## Prerequisites

- Node.js 18+ installed
- A Supabase account
- A Google Cloud Console account (for OAuth)

## 1. Clone and Install Dependencies

```bash
cd tartancravings
npm install
```

## 2. Set up Supabase

### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/login and create a new project
3. Wait for the project to be provisioned
4. Go to Settings > API to get your project URL and anon key

### Run Database Migrations
1. Install Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref YOUR_PROJECT_REF`
4. Run migrations: `supabase db push`

Alternatively, you can manually run the SQL files in the Supabase dashboard:
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Run the query
5. Repeat for `002_seed_data.sql` and `003_rls_policies.sql`

## 3. Set up Google OAuth

### Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 Client ID
5. Set authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://YOUR_DOMAIN.com/auth/callback` (for production)

### Configure Supabase Auth
1. In your Supabase dashboard, go to Authentication > Providers
2. Enable Google provider
3. Add your Google Client ID and Client Secret
4. Add your site URL: `http://localhost:3000` (for development)
5. Add redirect URLs: `http://localhost:3000/auth/callback`

## 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_anon_key

# Optional: For local Supabase development
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 5. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The application will be available at `http://localhost:3000`

## 6. Testing the Application

### Test Authentication
1. Go to `http://localhost:3000`
2. Click "Get Started" or "Sign in"
3. Try signing in with a non-CMU email (should be blocked)
4. Sign in with a @andrew.cmu.edu email (should work)

### Test Restaurant Listing
1. After successful authentication, you should be redirected to the restaurants page
2. Browse restaurants, use filters, and search functionality
3. Try favoriting restaurants

## Troubleshooting

### Common Issues

1. **"Invalid redirect URL"**: Make sure your redirect URLs are properly configured in both Google Cloud Console and Supabase

2. **Database connection errors**: Ensure your Supabase URL and keys are correct in `.env.local`

3. **Authentication fails**: Check that:
   - Google OAuth is properly configured
   - The domain restriction is working
   - RLS policies are applied correctly

4. **No restaurants showing**: Make sure the seed data was properly inserted

### Development Tips

- Use Supabase Table Editor to view and modify data
- Check browser Network tab for API errors
- Use Supabase logs for debugging database issues
- Test with different CMU email addresses

## Project Structure

```
tartancravings/
├── app/                    # Next.js app router pages
├── components/             # React components
├── lib/                   # Utilities and API functions
├── supabase/              # Database migrations
├── types/                 # TypeScript type definitions
└── SETUP.md              # This file
```

## Next Steps

The application currently includes:
- ✅ CMU-only authentication
- ✅ Restaurant listing and filtering
- ✅ Basic favoriting system

To complete the full food delivery experience, you would add:
- 🔄 Restaurant detail pages with menus
- 🔄 Shopping cart and checkout
- 🔄 Order management and tracking
- 🔄 Distance-based pricing
- 🔄 Payment integration

## Support

For issues with this setup, check:
1. Next.js documentation
2. Supabase documentation
3. Google OAuth documentation