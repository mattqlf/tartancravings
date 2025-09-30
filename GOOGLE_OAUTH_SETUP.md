# Google OAuth Setup for Tartan Cravings

## Current Error: 500 from Google OAuth

The "500. That's an error. Please try again later." message from Google indicates that the OAuth configuration is incomplete or incorrect.

## Step-by-Step Fix

### 1. Google Cloud Console Setup

**Create OAuth Credentials:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project or create a new one
3. Enable the **Google+ API** (or People API)
4. Go to **"Credentials"** in the left sidebar
5. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**

**Configure OAuth Client:**

- **Application type**: Web application
- **Name**: Tartan Cravings (or any name you prefer)
- **Authorized JavaScript origins**:
  - `http://localhost:3000`
  - `https://dnoqgvzngpxqdhkspcnp.supabase.co`
- **Authorized redirect URIs**:
  - `https://dnoqgvzngpxqdhkspcnp.supabase.co/auth/v1/callback`
  - `http://localhost:3000/auth/callback`

**Save the credentials:**
- Copy the **Client ID** (you'll need this for Supabase)
- The **Client Secret** is already in your `.env.local` file

### 2. Supabase Dashboard Configuration

**Enable Google Provider:**

1. Go to your [Supabase Dashboard](https://app.supabase.com/project/dnoqgvzngpxqdhkspcnp)
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list and click to configure
4. **Enable** the Google provider
5. Enter your credentials:
   - **Client ID**: (from Google Cloud Console step above)
   - **Client Secret**: `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`

**Configure URLs:**

In **Authentication** → **URL Configuration**:
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: Add `http://localhost:3000/auth/callback`

### 3. Test the Configuration

1. Save all changes in Supabase
2. Refresh your browser at `http://localhost:3000`
3. Try signing in again
4. Check browser console for debug messages

### 4. Common Issues and Solutions

**Issue: "OAuth consent screen not configured"**
- Solution: In Google Cloud Console, configure the OAuth consent screen first

**Issue: "Redirect URI mismatch"**
- Solution: Ensure the redirect URIs match exactly between Google Cloud Console and Supabase

**Issue: "Invalid client ID"**
- Solution: Double-check that the Client ID is correctly entered in Supabase

**Issue: Still getting 500 error**
- Solution: Try creating a new OAuth client in Google Cloud Console

### 5. Debug Information

The sign-in button now includes debug logging. Check the browser console for:
- Supabase URL confirmation
- OAuth response details
- Specific error messages

### 6. Alternative: Test Without OAuth (Temporary)

If you want to test the app without OAuth setup, you can temporarily disable authentication:

1. Comment out the AuthGuard in protected routes
2. Mock a user session for testing

Let me know if you need help with any of these steps!

## Expected Flow After Setup

1. User clicks "Sign in with Andrew ID"
2. Redirected to Google OAuth consent screen
3. User selects their @andrew.cmu.edu account
4. Google redirects back to `/auth/callback`
5. User is signed in and redirected to restaurants page