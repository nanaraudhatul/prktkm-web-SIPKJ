<?php
// Matikan error display
error_reporting(0);
ini_set('display_errors', 0);

require_once '../../config/database.php';

// Baca input
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

// Handle jika JSON tidak valid
if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit();
}

$email = trim($data['email'] ?? '');
$username = trim($data['username'] ?? '');
$telepon = trim($data['telepon'] ?? '');
$password = $data['password'] ?? '';
$role = $data['role'] ?? 'masyarakat';

// Validasi
if (empty($email) || empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email, username, dan password wajib diisi']);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Format email tidak valid']);
    exit();
}

if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Password minimal 8 karakter']);
    exit();
}

try {
    // Cek username sudah ada
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Username sudah terdaftar']);
        exit();
    }

    // Cek email sudah ada
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email sudah terdaftar']);
        exit();
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert user
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password, telepon, role, is_verified) VALUES (?, ?, ?, ?, ?, 1)");
    $stmt->execute([$username, $email, $hashedPassword, $telepon, $role]);

    echo json_encode([
        'success' => true,
        'message' => 'Pendaftaran berhasil! Silakan login.',
        'data' => ['username' => $username, 'role' => $role]
    ]);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>