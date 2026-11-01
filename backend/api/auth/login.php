<?php
/**
 * API Login - Support Email & Username
 * Endpoint: POST /backend/api/auth/login.php
 */

// Untuk debugging sementara, kita matikan display_errors agar tidak merusak JSON, 
// tapi kita catat di error_log XAMPP.
error_reporting(0);
ini_set('display_errors', 0);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan. Gunakan POST.']);
    exit();
}

require_once '../../config/database.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Data tidak valid atau format JSON salah']);
    exit();
}

// Frontend mengirim kunci 'email' untuk menampung username ATAU email
$email_or_username = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (empty($email_or_username) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Username/Email dan kata sandi wajib diisi']);
    exit();
}

try {
    // Cek apakah input berupa format email
    $isEmail = filter_var($email_or_username, FILTER_VALIDATE_EMAIL);
    
    if ($isEmail) {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email_or_username]);
    } else {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$email_or_username]);
    }
    
    $user = $stmt->fetch();
    
    if (!$user) {
        // DEBUG: Catat di error log XAMPP jika user tidak ditemukan
        error_log("LOGIN GAGAL: User '$email_or_username' TIDAK DITEMUKAN di database.");
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Username/Email atau kata sandi salah']);
        exit();
    }
    
    // Verifikasi password
    $isPasswordValid = password_verify($password, $user['password']);
    
    if (!$isPasswordValid) {
        // DEBUG: Catat di error log XAMPP jika password salah
        error_log("LOGIN GAGAL: Password SALAH untuk user '$email_or_username'.");
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Username/Email atau kata sandi salah']);
        exit();
    }
    
    // Cek apakah email sudah diverifikasi (jika login pakai email)
    if ($isEmail && isset($user['email_verified']) && !$user['email_verified']) {
        http_response_code(403);
        echo json_encode([
            'success' => false, 
            'message' => 'Email belum terverifikasi. Silakan cek email Anda untuk verifikasi.'
        ]);
        exit();
    }
    
    // Generate token
    $token = base64_encode($user['id'] . ':' . time());
    
    // Hapus password dari response demi keamanan
    unset($user['password']);
    
    echo json_encode([
        'success' => true,
        'message' => 'Login berhasil',
        'data' => $user,
        'token' => $token
    ]);
    
} catch (PDOException $e) {
    error_log("LOGIN DATABASE ERROR: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error database: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("LOGIN SERVER ERROR: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error server: ' . $e->getMessage()]);
}
?>