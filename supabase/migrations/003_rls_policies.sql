-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- CMU Buildings and Delivery Zones are public (read-only)
ALTER TABLE cmu_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

-- Function to check if user email is from CMU
CREATE OR REPLACE FUNCTION is_cmu_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'email' ILIKE '%@andrew.cmu.edu';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user ID
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN (auth.jwt() ->> 'sub')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM users
    WHERE id = current_user_id()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is restaurant staff for a specific restaurant
CREATE OR REPLACE FUNCTION is_restaurant_staff(restaurant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM users
    WHERE id = current_user_id()
    AND role = 'restaurant'
    AND email ILIKE '%' || (SELECT name FROM restaurants WHERE id = restaurant_uuid) || '%'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS table policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = current_user_id() AND is_cmu_user());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = current_user_id() AND is_cmu_user());

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = current_user_id() AND is_cmu_user());

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (is_admin_user());

-- RESTAURANTS table policies
CREATE POLICY "Anyone can view active restaurants"
  ON restaurants FOR SELECT
  TO authenticated
  USING (is_active = true AND is_cmu_user());

CREATE POLICY "Restaurant staff can update their restaurant"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (is_restaurant_staff(id) OR is_admin_user());

CREATE POLICY "Admins can manage all restaurants"
  ON restaurants FOR ALL
  TO authenticated
  USING (is_admin_user());

-- MENU CATEGORIES table policies
CREATE POLICY "Anyone can view menu categories for active restaurants"
  ON menu_categories FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND is_cmu_user()
    AND EXISTS(SELECT 1 FROM restaurants WHERE id = restaurant_id AND is_active = true)
  );

CREATE POLICY "Restaurant staff can manage their menu categories"
  ON menu_categories FOR ALL
  TO authenticated
  USING (is_restaurant_staff(restaurant_id) OR is_admin_user());

-- MENU ITEMS table policies
CREATE POLICY "Anyone can view available menu items"
  ON menu_items FOR SELECT
  TO authenticated
  USING (
    is_available = true
    AND is_cmu_user()
    AND EXISTS(SELECT 1 FROM restaurants WHERE id = restaurant_id AND is_active = true)
  );

CREATE POLICY "Restaurant staff can manage their menu items"
  ON menu_items FOR ALL
  TO authenticated
  USING (is_restaurant_staff(restaurant_id) OR is_admin_user());

-- ORDERS table policies
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = current_user_id() AND is_cmu_user());

CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = current_user_id() AND is_cmu_user());

CREATE POLICY "Users can update their own pending orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    user_id = current_user_id()
    AND status = 'pending'
    AND is_cmu_user()
  );

CREATE POLICY "Restaurant staff can view their restaurant orders"
  ON orders FOR SELECT
  TO authenticated
  USING (is_restaurant_staff(restaurant_id) OR is_admin_user());

CREATE POLICY "Restaurant staff can update their restaurant orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (is_restaurant_staff(restaurant_id) OR is_admin_user());

-- ORDER ITEMS table policies
CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    is_cmu_user() AND
    EXISTS(SELECT 1 FROM orders WHERE id = order_id AND user_id = current_user_id())
  );

CREATE POLICY "Users can insert items for their own orders"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    is_cmu_user() AND
    EXISTS(SELECT 1 FROM orders WHERE id = order_id AND user_id = current_user_id())
  );

CREATE POLICY "Restaurant staff can view order items for their orders"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    is_cmu_user() AND (
      EXISTS(
        SELECT 1 FROM orders o
        WHERE o.id = order_id
        AND is_restaurant_staff(o.restaurant_id)
      ) OR is_admin_user()
    )
  );

-- REVIEWS table policies
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (is_cmu_user());

CREATE POLICY "Users can create reviews for their own orders"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = current_user_id()
    AND is_cmu_user()
    AND (
      order_id IS NULL OR
      EXISTS(SELECT 1 FROM orders WHERE id = order_id AND user_id = current_user_id())
    )
  );

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (user_id = current_user_id() AND is_cmu_user());

CREATE POLICY "Users can delete their own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (user_id = current_user_id() AND is_cmu_user());

-- USER FAVORITES table policies
CREATE POLICY "Users can manage their own favorites"
  ON user_favorites FOR ALL
  TO authenticated
  USING (user_id = current_user_id() AND is_cmu_user());

-- CART ITEMS table policies
CREATE POLICY "Users can manage their own cart"
  ON cart_items FOR ALL
  TO authenticated
  USING (user_id = current_user_id() AND is_cmu_user());

-- CMU BUILDINGS table policies (public read access for CMU users)
CREATE POLICY "CMU users can view buildings"
  ON cmu_buildings FOR SELECT
  TO authenticated
  USING (is_cmu_user());

CREATE POLICY "Admins can manage buildings"
  ON cmu_buildings FOR ALL
  TO authenticated
  USING (is_admin_user());

-- DELIVERY ZONES table policies (public read access for CMU users)
CREATE POLICY "CMU users can view delivery zones"
  ON delivery_zones FOR SELECT
  TO authenticated
  USING (is_active = true AND is_cmu_user());

CREATE POLICY "Admins can manage delivery zones"
  ON delivery_zones FOR ALL
  TO authenticated
  USING (is_admin_user());

-- Create a function to handle user creation from auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    'student'  -- Default role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile when someone signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION is_cmu_user() TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION is_restaurant_staff(UUID) TO authenticated;