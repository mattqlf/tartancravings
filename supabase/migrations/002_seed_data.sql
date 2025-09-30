-- Insert CMU Buildings
INSERT INTO cmu_buildings (name, code, address, latitude, longitude, zone) VALUES
-- Academic Buildings
('Gates Hillman Center', 'GHC', '4902 Forbes Ave, Pittsburgh, PA 15213', 40.4436, -79.9459, 'Central Campus'),
('Wean Hall', 'WEH', '5000 Forbes Ave, Pittsburgh, PA 15213', 40.4436, -79.9447, 'Central Campus'),
('Doherty Hall', 'DH', '5000 Forbes Ave, Pittsburgh, PA 15213', 40.4441, -79.9437, 'Central Campus'),
('Baker Hall', 'BH', '5000 Forbes Ave, Pittsburgh, PA 15213', 40.4447, -79.9433, 'Central Campus'),
('Porter Hall', 'PH', '5000 Forbes Ave, Pittsburgh, PA 15213', 40.4448, -79.9421, 'Central Campus'),
('Hamerschlag Hall', 'HH', '5000 Forbes Ave, Pittsburgh, PA 15213', 40.4450, -79.9420, 'Central Campus'),
('Hunt Library', 'HL', '4909 Frew St, Pittsburgh, PA 15213', 40.4412, -79.9438, 'Central Campus'),
('Mellon Institute', 'MI', '4400 Fifth Ave, Pittsburgh, PA 15213', 40.4456, -79.9525, 'Central Campus'),

-- Residential Buildings
('Morewood Gardens', 'MG', '5032 Forbes Ave, Pittsburgh, PA 15213', 40.4459, -79.9406, 'Central Campus'),
('Mudge House', 'MH', '5000 Forbes Ave, Pittsburgh, PA 15213', 40.4445, -79.9418, 'Central Campus'),
('Resnik House', 'RH', '5000 Wilkins Ave, Pittsburgh, PA 15213', 40.4422, -79.9382, 'East Campus'),
('Stever House', 'SH', '5000 Wilkins Ave, Pittsburgh, PA 15213', 40.4418, -79.9372, 'East Campus'),
('Donner House', 'DO', '5000 Forbes Ave, Pittsburgh, PA 15213', 40.4448, -79.9412, 'Central Campus'),
('Scobell House', 'SC', '5000 Forbes Ave, Pittsburgh, PA 15213', 40.4449, -79.9408, 'Central Campus'),

-- Dining and Recreation
('University Center', 'UC', '5000 Forbes Ave, Pittsburgh, PA 15213', 40.4443, -79.9427, 'Central Campus'),
('Cohon University Center', 'CUC', '5000 Forbes Ave, Pittsburgh, PA 15213', 40.4443, -79.9427, 'Central Campus'),
('Carnegie Mellon Cafe', 'CMC', '5000 Forbes Ave, Pittsburgh, PA 15213', 40.4441, -79.9430, 'Central Campus'),
('Tepper Quad', 'TQ', '5000 Forbes Ave, Pittsburgh, PA 15213', 40.4454, -79.9442, 'Central Campus'),

-- Graduate Housing
('Graduate House', 'GH', '5000 Wilkins Ave, Pittsburgh, PA 15213', 40.4425, -79.9385, 'East Campus'),
('Fairfax Apartments', 'FA', '5000 Wilkins Ave, Pittsburgh, PA 15213', 40.4420, -79.9375, 'East Campus'),
('Webster Apartments', 'WA', '4935 Wilkins Ave, Pittsburgh, PA 15213', 40.4415, -79.9390, 'East Campus'),

-- Off-Campus Popular Areas
('The Cut', 'CUT', 'The Cut, Pittsburgh, PA 15213', 40.4425, -79.9450, 'Central Campus'),
('Schenley Park', 'SP', 'Schenley Park, Pittsburgh, PA 15213', 40.4380, -79.9420, 'South Campus'),
('Oakland', 'OAK', 'Oakland, Pittsburgh, PA 15213', 40.4400, -79.9530, 'West Campus');

-- Create delivery zones
INSERT INTO delivery_zones (name, description, price_per_mile, base_fee, minimum_fee, maximum_fee) VALUES
('Central Campus', 'Main campus buildings and dorms', 0.25, 1.99, 1.99, 4.99),
('East Campus', 'Graduate housing and east side buildings', 0.50, 2.99, 2.99, 6.99),
('South Campus', 'Schenley area and south buildings', 0.75, 3.99, 3.99, 8.99),
('West Campus', 'Oakland and west side areas', 1.00, 4.99, 4.99, 9.99);

-- Sample restaurants
INSERT INTO restaurants (name, description, cuisine_type, building_id, address, latitude, longitude, phone, opening_hours, minimum_order, base_delivery_fee, accepts_dining_dollars) VALUES
(
  'The Tartan Table',
  'Classic American comfort food with a Scottish twist, located right in the heart of campus.',
  'American',
  (SELECT id FROM cmu_buildings WHERE code = 'UC'),
  'University Center, 5000 Forbes Ave, Pittsburgh, PA 15213',
  40.4443, -79.9427,
  '(412) 268-2000',
  '{"monday": {"open": "07:00", "close": "22:00"}, "tuesday": {"open": "07:00", "close": "22:00"}, "wednesday": {"open": "07:00", "close": "22:00"}, "thursday": {"open": "07:00", "close": "22:00"}, "friday": {"open": "07:00", "close": "23:00"}, "saturday": {"open": "08:00", "close": "23:00"}, "sunday": {"open": "08:00", "close": "22:00"}}',
  15.00,
  2.99,
  true
),
(
  'Scotty''s Pizza',
  'Authentic New York style pizza made fresh daily. Perfect for late-night study sessions.',
  'Italian',
  (SELECT id FROM cmu_buildings WHERE code = 'GHC'),
  'Gates Hillman Center, 4902 Forbes Ave, Pittsburgh, PA 15213',
  40.4436, -79.9459,
  '(412) 268-3000',
  '{"monday": {"open": "11:00", "close": "02:00"}, "tuesday": {"open": "11:00", "close": "02:00"}, "wednesday": {"open": "11:00", "close": "02:00"}, "thursday": {"open": "11:00", "close": "02:00"}, "friday": {"open": "11:00", "close": "03:00"}, "saturday": {"open": "11:00", "close": "03:00"}, "sunday": {"open": "12:00", "close": "02:00"}}',
  12.00,
  3.49,
  true
),
(
  'Carnegie Curry House',
  'Authentic Indian cuisine with vegetarian and vegan options. Spice levels from mild to face-melting.',
  'Indian',
  (SELECT id FROM cmu_buildings WHERE code = 'TQ'),
  'Tepper Quad, 5000 Forbes Ave, Pittsburgh, PA 15213',
  40.4454, -79.9442,
  '(412) 268-4000',
  '{"monday": {"open": "11:00", "close": "21:00"}, "tuesday": {"open": "11:00", "close": "21:00"}, "wednesday": {"open": "11:00", "close": "21:00"}, "thursday": {"open": "11:00", "close": "21:00"}, "friday": {"open": "11:00", "close": "22:00"}, "saturday": {"open": "11:00", "close": "22:00"}, "sunday": {"open": "12:00", "close": "21:00"}}',
  18.00,
  4.99,
  false
),
(
  'Robotics Ramen',
  'Modern Japanese ramen bar featuring traditional and fusion bowls. Robot-fast service!',
  'Japanese',
  (SELECT id FROM cmu_buildings WHERE code = 'WEH'),
  'Wean Hall, 5000 Forbes Ave, Pittsburgh, PA 15213',
  40.4436, -79.9447,
  '(412) 268-5000',
  '{"monday": {"open": "11:30", "close": "21:30"}, "tuesday": {"open": "11:30", "close": "21:30"}, "wednesday": {"open": "11:30", "close": "21:30"}, "thursday": {"open": "11:30", "close": "21:30"}, "friday": {"open": "11:30", "close": "22:30"}, "saturday": {"open": "11:30", "close": "22:30"}, "sunday": {"open": "12:00", "close": "21:00"}}',
  14.00,
  3.99,
  true
);

-- Sample menu categories for The Tartan Table
INSERT INTO menu_categories (restaurant_id, name, description, display_order) VALUES
((SELECT id FROM restaurants WHERE name = 'The Tartan Table'), 'Appetizers', 'Start your meal right', 1),
((SELECT id FROM restaurants WHERE name = 'The Tartan Table'), 'Burgers & Sandwiches', 'Hearty mains between bread', 2),
((SELECT id FROM restaurants WHERE name = 'The Tartan Table'), 'Scottish Classics', 'Traditional dishes from the homeland', 3),
((SELECT id FROM restaurants WHERE name = 'The Tartan Table'), 'Salads', 'Fresh and healthy options', 4),
((SELECT id FROM restaurants WHERE name = 'The Tartan Table'), 'Beverages', 'Drinks to quench your thirst', 5);

-- Sample menu items for The Tartan Table
INSERT INTO menu_items (restaurant_id, category_id, name, description, price, dietary_tags, prep_time, is_featured) VALUES
-- Appetizers
((SELECT id FROM restaurants WHERE name = 'The Tartan Table'),
 (SELECT id FROM menu_categories WHERE name = 'Appetizers' AND restaurant_id = (SELECT id FROM restaurants WHERE name = 'The Tartan Table')),
 'Haggis Bites', 'Traditional Scottish haggis served with whisky cream sauce', 8.99, '{}', 12, false),

((SELECT id FROM restaurants WHERE name = 'The Tartan Table'),
 (SELECT id FROM menu_categories WHERE name = 'Appetizers' AND restaurant_id = (SELECT id FROM restaurants WHERE name = 'The Tartan Table')),
 'Loaded Shortbread Fries', 'Crispy fries with cheddar, bacon, and green onions', 7.49, '{}', 8, true),

-- Burgers
((SELECT id FROM restaurants WHERE name = 'The Tartan Table'),
 (SELECT id FROM menu_categories WHERE name = 'Burgers & Sandwiches' AND restaurant_id = (SELECT id FROM restaurants WHERE name = 'The Tartan Table')),
 'The Carnegie Burger', 'Double patty with aged cheddar, lettuce, tomato, special sauce', 13.99, '{}', 15, true),

((SELECT id FROM restaurants WHERE name = 'The Tartan Table'),
 (SELECT id FROM menu_categories WHERE name = 'Burgers & Sandwiches' AND restaurant_id = (SELECT id FROM restaurants WHERE name = 'The Tartan Table')),
 'Highland Veggie Burger', 'House-made black bean patty with avocado and sprouts', 11.99, '{vegetarian}', 12, false),

-- Scottish Classics
((SELECT id FROM restaurants WHERE name = 'The Tartan Table'),
 (SELECT id FROM menu_categories WHERE name = 'Scottish Classics' AND restaurant_id = (SELECT id FROM restaurants WHERE name = 'The Tartan Table')),
 'Fish & Chips', 'Beer-battered cod with hand-cut chips and mushy peas', 16.99, '{}', 18, true),

((SELECT id FROM restaurants WHERE name = 'The Tartan Table'),
 (SELECT id FROM menu_categories WHERE name = 'Scottish Classics' AND restaurant_id = (SELECT id FROM restaurants WHERE name = 'The Tartan Table')),
 'Shepherd''s Pie', 'Ground lamb with vegetables topped with creamy mashed potatoes', 14.99, '{}', 20, false),

-- Salads
((SELECT id FROM restaurants WHERE name = 'The Tartan Table'),
 (SELECT id FROM menu_categories WHERE name = 'Salads' AND restaurant_id = (SELECT id FROM restaurants WHERE name = 'The Tartan Table')),
 'Kale & Quinoa Power Bowl', 'Superfood salad with roasted vegetables and tahini dressing', 12.99, '{vegetarian, vegan, gluten-free}', 8, false),

-- Beverages
((SELECT id FROM restaurants WHERE name = 'The Tartan Table'),
 (SELECT id FROM menu_categories WHERE name = 'Beverages' AND restaurant_id = (SELECT id FROM restaurants WHERE name = 'The Tartan Table')),
 'Scottish Breakfast Tea', 'Strong black tea blend perfect for any time of day', 2.99, '{vegetarian, vegan}', 3, false),

((SELECT id FROM restaurants WHERE name = 'The Tartan Table'),
 (SELECT id FROM menu_categories WHERE name = 'Beverages' AND restaurant_id = (SELECT id FROM restaurants WHERE name = 'The Tartan Table')),
 'Irn-Bru', 'Scotland''s other national drink - imported orange soda', 3.49, '{vegetarian, vegan}', 1, false);

-- Update restaurant ratings (simulate some activity)
UPDATE restaurants SET
  rating = 4.2,
  total_reviews = 127
WHERE name = 'The Tartan Table';

UPDATE restaurants SET
  rating = 4.5,
  total_reviews = 89
WHERE name = 'Scotty''s Pizza';

UPDATE restaurants SET
  rating = 4.3,
  total_reviews = 156
WHERE name = 'Carnegie Curry House';

UPDATE restaurants SET
  rating = 4.1,
  total_reviews = 74
WHERE name = 'Robotics Ramen';