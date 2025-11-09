-- Create Database
CREATE DATABASE cafe_pos_db;

-- Connect to database
\c cafe_pos_db;

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'cashier',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Menu Table
CREATE TABLE IF NOT EXISTS menu (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('food', 'drink')),
    price INTEGER NOT NULL,
    image VARCHAR(10),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    total INTEGER NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'cash',
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    menu_id INTEGER REFERENCES menu(id) ON DELETE SET NULL,
    menu_name VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Menu Items (30 items)
INSERT INTO menu (name, category, price, image) VALUES
-- Makanan (15 items)
('Nasi Goreng Spesial', 'food', 25000, '🍳'),
('Mie Goreng', 'food', 20000, '🍜'),
('Nasi Ayam Geprek', 'food', 22000, '🍗'),
('Nasi Rendang', 'food', 28000, '🍛'),
('Soto Ayam', 'food', 18000, '🍲'),
('Gado-Gado', 'food', 17000, '🥗'),
('Nasi Uduk', 'food', 15000, '🍚'),
('Bakso Spesial', 'food', 20000, '🍜'),
('Ayam Bakar', 'food', 25000, '🍗'),
('Ikan Bakar', 'food', 30000, '🐟'),
('Sate Ayam', 'food', 23000, '�串'),
('Capcay', 'food', 22000, '🥘'),
('French Fries', 'food', 15000, '🍟'),
('Chicken Wings', 'food', 24000, '🍗'),
('Club Sandwich', 'food', 26000, '🥪'),

-- Minuman (15 items)
('Es Teh Manis', 'drink', 5000, '🧃'),
('Es Jeruk', 'drink', 8000, '🍊'),
('Kopi Hitam', 'drink', 10000, '☕'),
('Cappuccino', 'drink', 18000, '☕'),
('Latte', 'drink', 20000, '☕'),
('Espresso', 'drink', 15000, '☕'),
('Jus Alpukat', 'drink', 15000, '🥑'),
('Jus Mangga', 'drink', 15000, '🥭'),
('Jus Strawberry', 'drink', 18000, '🍓'),
('Milkshake Coklat', 'drink', 22000, '🥤'),
('Milkshake Vanilla', 'drink', 22000, '🥤'),
('Thai Tea', 'drink', 12000, '🧋'),
('Lemon Tea', 'drink', 10000, '🍋'),
('Mineral Water', 'drink', 5000, '💧'),
('Soft Drink', 'drink', 8000, '🥤');

-- Create Indexes for better performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_menu_category ON menu(category);
CREATE INDEX idx_users_username ON users(username);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_updated_at BEFORE UPDATE ON menu
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password, name, role) VALUES
('admin', '$2b$10$rHj5YWQy5xJXzKqJqT3EJ.xGZJ9qRPHKP0LFl0jqVZxGZ0qQqQqQq', 'Administrator', 'admin');

COMMENT ON TABLE users IS 'Tabel untuk menyimpan data pengguna sistem';
COMMENT ON TABLE menu IS 'Tabel untuk menyimpan data menu makanan dan minuman';
COMMENT ON TABLE orders IS 'Tabel untuk menyimpan data transaksi pesanan';
COMMENT ON TABLE order_items IS 'Tabel untuk menyimpan detail item pesanan';