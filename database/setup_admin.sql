-- Insert admin default ke database
INSERT INTO users (username, email, password, telepon, role, email_verified, created_at, updated_at) 
VALUES 
('admin', 'admin@sipkj.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '081234567890', 'admin', 1, NOW(), NOW());

-- Password default: password123
-- Anda bisa mengubah password setelah login pertama kali