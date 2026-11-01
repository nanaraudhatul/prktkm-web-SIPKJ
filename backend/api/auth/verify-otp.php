<?php
/**
 * API Verify OTP - Untuk Forgot Password
 * Endpoint: POST /backend/api/auth/verify-otp.php
 */

// Aktifkan error reporting sementara untuk debugging
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
$otp = trim($data['otp'] ?? '');

if (empty($email) || empty($otp)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email dan OTP wajib diisi']);
    exit();
}

try {
    // 1. Cek apakah user ada (tanpa filter expiry dulu untuk debugging)
    $stmt = $pdo->prepare("SELECT id, email, password_reset_token, password_reset_expiry, password_reset_otp FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email tidak ditemukan di database.']);
        exit();
    }

    // 2. Cek apakah token sudah di-generate
    if (empty($user['password_reset_token']) || empty($user['password_reset_otp'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Belum ada permintaan reset password. Silakan klik "Kirim Kode" terlebih dahulu.']);
        exit();
    }

    // 3. Cek kadaluarsa menggunakan PHP time (lebih aman dari masalah timezone MySQL)
    $expiryTime = strtotime($user['password_reset_expiry']);
    $currentTime = time();

    if ($expiryTime < $currentTime) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Kode OTP sudah kadaluarsa. Silakan minta kode baru.']);
        exit();
    }

    // 4. Verifikasi OTP
    if (!password_verify($otp, $user['password_reset_otp'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Kode OTP yang Anda masukkan salah.']);
        exit();
    }

    // ✅ BERHASIL
    echo json_encode([
        'success' => true,
        'message' => 'OTP valid',
        'reset_token' => $user['password_reset_token']
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error database: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>