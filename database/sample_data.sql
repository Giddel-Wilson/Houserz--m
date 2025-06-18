-- Sample data for testing

-- Insert sample properties
INSERT INTO properties (agent_id, title, description, property_type, listing_type, price, bedrooms, bathrooms, sqft, address, city, state, features, status, is_featured) VALUES 
(2, 'The Pinnacle at Highland Park', 'Luxury 4-bedroom duplex in a serene environment with modern amenities including swimming pool, gym, and 24/7 security.', 'Duplex', 'sale', 85000000.00, 4, 3, 2500, '15 Highland Park Estate, Victoria Island', 'Lagos', 'Lagos State', '["Swimming Pool", "Gym", "24/7 Security", "Generator", "Parking Space", "Garden"]', 'active', 1),

(2, 'Modern Family Home Abuja', 'Spacious 5-bedroom house perfect for families. Located in a quiet neighborhood with excellent schools nearby.', 'House', 'sale', 120000000.00, 5, 4, 3200, '8 Maitama District', 'Abuja', 'FCT', '["Garage", "Garden", "Security", "Generator", "Water Treatment"]', 'active', 1),

(2, 'Executive Apartment Port Harcourt', 'Well-furnished 4-bedroom apartment in the heart of Port Harcourt with city views.', 'Apartment', 'sale', 95000000.00, 4, 3, 2800, '12 GRA Phase 2', 'Port Harcourt', 'Rivers State', '["Furnished", "City View", "Elevator", "Parking", "Security"]', 'active', 0),

(2, 'Cozy Bungalow Ibadan', 'Beautiful 3-bedroom bungalow in a peaceful area of Ibadan.', 'Bungalow', 'sale', 75000000.00, 3, 2, 2200, '25 Bodija Estate', 'Ibadan', 'Oyo State', '["Garden", "Parking", "Security", "Bore Hole"]', 'active', 0),

(2, 'Luxury Villa Kano', 'Magnificent 5-bedroom villa with premium finishes and landscaped gardens.', 'Villa', 'sale', 110000000.00, 5, 4, 3500, '5 Nassarawa GRA', 'Kano', 'Kano State', '["Swimming Pool", "Garden", "Garage", "Security", "Generator"]', 'active', 0),

(2, 'Modern Duplex Enugu', 'Contemporary 4-bedroom duplex in the coal city with modern amenities.', 'Duplex', 'sale', 90000000.00, 4, 3, 2600, '18 Independence Layout', 'Enugu', 'Enugu State', '["Parking", "Security", "Generator", "Water Supply"]', 'active', 0);

-- Insert sample property images
INSERT INTO property_images (property_id, image_url, alt_text, is_primary, display_order) VALUES 
(1, '/house-1.jpg', 'The Pinnacle at Highland Park - Main View', 1, 1),
(1, '/house-1-2.jpg', 'The Pinnacle at Highland Park - Living Room', 0, 2),
(1, '/house-1-3.jpg', 'The Pinnacle at Highland Park - Kitchen', 0, 3),

(2, '/house-2.jpg', 'Modern Family Home Abuja - Exterior', 1, 1),
(2, '/house-2-2.jpg', 'Modern Family Home Abuja - Interior', 0, 2),

(3, '/house-3.jpg', 'Executive Apartment Port Harcourt - Building', 1, 1),
(4, '/house-4.jpg', 'Cozy Bungalow Ibadan - Front View', 1, 1),
(5, '/house-5.jpg', 'Luxury Villa Kano - Main Entrance', 1, 1),
(6, '/house-6.jpg', 'Modern Duplex Enugu - Exterior', 1, 1);

-- Insert sample viewing requests
INSERT INTO viewing_requests (property_id, client_id, agent_id, preferred_date, preferred_time, message, status) VALUES 
(1, 3, 2, '2025-02-15', '14:00:00', 'I would like to view this property this weekend. Very interested in the swimming pool area.', 'pending'),
(2, 3, 2, '2025-02-20', '10:00:00', 'Looking for a family home. Can we schedule a viewing?', 'confirmed'),
(3, 3, 2, '2025-02-10', '16:00:00', 'Interested in this apartment for investment purposes.', 'completed');

-- Insert sample messages
INSERT INTO messages (sender_id, recipient_id, property_id, subject, message, is_read) VALUES 
(3, 2, 1, 'Inquiry about The Pinnacle at Highland Park', 'Hello, I am very interested in this property. Can you provide more details about the payment terms?', 0),
(2, 3, 1, 'Re: Inquiry about The Pinnacle at Highland Park', 'Thank you for your interest. We offer flexible payment plans. Would you like to schedule a viewing?', 1),
(3, 2, NULL, 'General Inquiry', 'Do you have any properties in Lekki area?', 0);
