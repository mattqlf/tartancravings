-- First, check if email column exists in profiles table, if not add it
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Drop the existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a more robust function that handles all cases
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, display_name, email, stripe_account_id, stripe_onboarding_complete, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
        NEW.email,
        NULL,
        FALSE,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Also ensure existing users have profiles (run this to fix any missing profiles)
INSERT INTO profiles (id, email, display_name, stripe_account_id, stripe_onboarding_complete, created_at, updated_at)
SELECT
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', email, 'User'),
    NULL,
    FALSE,
    created_at,
    NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;