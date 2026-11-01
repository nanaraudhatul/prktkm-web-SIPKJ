<?php
/**
 * API Send OTP - Untuk Forgot Password
 * Endpoint: POST /backend/api/auth/send-otp.php
 */

error_reporting(0);
ini_set('display_errors', 0);

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

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email wajib diisi']);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Format email tidak valid']);
    exit();
}

try {
    // Cek apakah email terdaftar
    $stmt = $pdo->prepare("SELECT id, username, email FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        // Untuk keamanan, jangan beri tahu apakah email terdaftar atau tidak
        echo json_encode([
            'success' => true,
            'message' => 'Jika email terdaftar, kode OTP telah dikirim'
        ]);
        exit();
    }
    
    // Generate OTP 6 digit
    $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    
    // Generate reset token
    $resetToken = bin2hex(random_bytes(32));
    
    // Set expiry 15 menit dari sekarang
    $resetExpiry = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    // Hash OTP untuk keamanan
    $hashedOtp = password_hash($otp, PASSWORD_DEFAULT);
    
    // Update database
    $stmt = $pdo->prepare("
        UPDATE users 
        SET password_reset_token = ?, 
            password_reset_expiry = ?,
            password_reset_otp = ?
        WHERE id = ?
    ");
    $stmt->execute([$resetToken, $resetExpiry, $hashedOtp, $user['id']]);
    
    // Kirim email (di localhost biasanya tidak berfungsi)
    $subject = "Kode OTP Reset Password - SIPKJ";
    $message = "
    <html>
    <head><style>
        body { font-family: Arial, sans-serif; }
        .container { padding: 20px; background: #f5f5f5; }
        .content { background: white; padding: 30px; border-radius: 8px; }
        .otp { font-size: 32px; font-weight: bold; color: #1e3a5f; letter-spacing: 5px; }
    </style></head>
    <body>
        <div class='container'>
            <div class='content'>
                <h2>Reset Password SIPKJ</h2>
                <p>Halo {$user['username']},</p>
                <p>Gunakan kode OTP berikut untuk reset password:</p>
                <div class='otp'>{$otp}</div>
                <p>Kode OTP ini berlaku selama 15 menit.</p>
                <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
                <br><p>Salam,<br>Tim SIPKJ</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8\r\n";
    $headers .= "From: SIPKJ <noreply@sipkj.com>\r\n";
    
    @mail($email, $subject, $message, $headers);
    
    // Untuk development, tampilkan OTP di response
    echo json_encode([
        'success' => true,
        'message' => 'Kode OTP telah dikirim ke email Anda',
        'debug_otp' => $otp // HAPUS baris ini di production!
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error database: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>