<?php
/**
 * API Reset Password
 * Endpoint: POST /backend/api/auth/reset-password.php
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit();
}

require_once '../../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');
$token = $data['token'] ?? '';
$new_password = $data['new_password'] ?? '';

if (empty($email) || empty($token) || empty($new_password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Semua field wajib diisi']);
    exit();
}

if (strlen($new_password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Password minimal 6 karakter']);
    exit();
}

try {
    // Debug: Cek data di database
    $stmt = $pdo->prepare("
        SELECT id, email, password_reset_token, password_reset_expiry 
        FROM users 
        WHERE email = ?
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email tidak ditemukan']);
        exit();
    }
    
    // Debug: Tampilkan info token
    error_log("Token dari URL: " . $token);
    error_log("Token dari DB: " . $user['password_reset_token']);
    error_log("Expiry: " . $user['password_reset_expiry']);
    error_log("Current time: " . date('Y-m-d H:i:s'));
    
    if (empty($user['password_reset_token'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Token tidak ditemukan. Silakan ulangi proses reset password.']);
        exit();
    }
    
    // Cek apakah token cocok
    if ($user['password_reset_token'] !== $token) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Token tidak cocok. Silakan ulangi proses reset password.']);
        exit();
    }
    
    // Cek kadaluarsa menggunakan PHP time
    $expiryTime = strtotime($user['password_reset_expiry']);
    $currentTime = time();
    
    if ($expiryTime < $currentTime) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Token sudah kadaluarsa. Silakan ulangi proses reset password.']);
        exit();
    }
    
    // Update password
    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("
        UPDATE users 
        SET password = ?,
            password_reset_token = NULL,
            password_reset_expiry = NULL,
            password_reset_otp = NULL
        WHERE id = ?
    ");
    $stmt->execute([$hashed_password, $user['id']]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Kata sandi berhasil diatur ulang. Silakan login dengan kata sandi baru.'
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error database: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>