-- Houserz Database Schema
-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS property_images;
DROP TABLE IF EXISTS viewing_requests;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(20) DEFAULT 'client' CHECK (role IN ('client', 'agent', 'admin')),
    profile_image VARCHAR(500),
    bio TEXT,
    company VARCHAR(255),
    license_number VARCHAR(100),
    years_experience INTEGER,
    specialization VARCHAR(255),
    is_verified BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Properties table
CREATE TABLE properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    property_type VARCHAR(50) NOT NULL,
    listing_type VARCHAR(20) DEFAULT 'sale' CHECK (listing_type IN ('sale', 'rent')),
    price DECIMAL(15,2) NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    sqft INTEGER,
    lot_size DECIMAL(10,2),
    year_built INTEGER,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Nigeria',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    features TEXT, -- JSON string of features/amenities
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'rented', 'inactive')),
    is_featured BOOLEAN DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Property images table
CREATE TABLE property_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Viewing requests table
CREATE TABLE viewing_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    agent_id INTEGER NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time TIME NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    agent_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages table
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    property_id INTEGER,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_properties_agent ON properties(agent_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_property_images_property ON property_images(property_id);
CREATE INDEX idx_viewing_requests_property ON viewing_requests(property_id);
CREATE INDEX idx_viewing_requests_client ON viewing_requests(client_id);
CREATE INDEX idx_viewing_requests_agent ON viewing_requests(agent_id);
CREATE INDEX idx_viewing_requests_status ON viewing_requests(status);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_read ON messages(is_read);

-- Insert sample admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, role, is_verified, is_active) VALUES 
('admin@houserz.com', '$2b$10$8K6k8YhW.x2W9vOQJP8LKeG3LrM4.XnR5A6PqHDmL.2nkJEKxKJxW', 'System Administrator', 'admin', 1, 1);

-- Insert sample agent (password: agent123)
INSERT INTO users (email, password_hash, full_name, phone, role, company, license_number, years_experience, specialization, is_verified, is_active) VALUES 
('agent@houserz.com', '$2b$10$vJ9o2Y1vG.x6W8xOLP7LKtG2LrM3.WmR4A5PpHAmL.1nkJDKwJJxV', 'John Agent', '+234-801-234-5678', 'agent', 'Prime Properties Ltd', 'RE-LAG-2023-001', 5, 'Residential Properties', 1, 1);

-- Insert sample client (password: client123)
INSERT INTO users (email, password_hash, full_name, phone, role, is_verified, is_active) VALUES 
('client@houserz.com', '$2b$10$mI8n1X0uF.w5V7wNKO6KJsF1KqL2.VlQ3A4OnGZlK.0mjICJvIIwU', 'Jane Client', '+234-802-345-6789', 'client', 1, 1);
