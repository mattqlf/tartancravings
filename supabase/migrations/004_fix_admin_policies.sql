-- Fix RLS policies to allow admin user to create restaurants
-- Drop existing restrictive policies and recreate with proper admin access

-- First, let's create a function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin_user_by_email()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'email' = 'mdli2@andrew.cmu.edu';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing restaurant policies
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON restaurants;
DROP POLICY IF EXISTS "Restaurant staff can update their restaurant" ON restaurants;
DROP POLICY IF EXISTS "Admins can manage all restaurants" ON restaurants;

-- Create new restaurant policies with proper admin access
CREATE POLICY "Anyone can view active restaurants"
  ON restaurants FOR SELECT
  TO authenticated
  USING (is_active = true AND is_cmu_user());

CREATE POLICY "Admin can manage all restaurants"
  ON restaurants FOR ALL
  TO authenticated
  USING (is_admin_user_by_email())
  WITH CHECK (is_admin_user_by_email());

-- Also fix menu categories and menu items policies for admin
DROP POLICY IF EXISTS "Restaurant staff can manage their menu categories" ON menu_categories;
DROP POLICY IF EXISTS "Restaurant staff can manage their menu items" ON menu_items;

CREATE POLICY "Admin can manage all menu categories"
  ON menu_categories FOR ALL
  TO authenticated
  USING (is_admin_user_by_email())
  WITH CHECK (is_admin_user_by_email());

CREATE POLICY "Admin can manage all menu items"
  ON menu_items FOR ALL
  TO authenticated
  USING (is_admin_user_by_email())
  WITH CHECK (is_admin_user_by_email());

-- Allow admin to view/manage all orders
CREATE POLICY "Admin can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (is_admin_user_by_email());

CREATE POLICY "Admin can manage all orders"
  ON orders FOR ALL
  TO authenticated
  USING (is_admin_user_by_email())
  WITH CHECK (is_admin_user_by_email());

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION is_admin_user_by_email() TO authenticated;

-- Also ensure the user creation trigger works for the admin user
-- Update the handle_new_user function to set admin role for mdli2@andrew.cmu.edu
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    CASE
      WHEN NEW.email = 'mdli2@andrew.cmu.edu' THEN 'admin'
      ELSE 'student'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;