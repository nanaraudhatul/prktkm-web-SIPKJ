<?php
require_once '../../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email harus diisi']);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Email tidak terdaftar']);
        exit();
    }

    $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+10 minutes'));

    $stmt = $pdo->prepare("INSERT INTO otp_tokens (user_id, otp_code, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$user['id'], $otp, $expiresAt]);

    echo json_encode([
        'success' => true,
        'message' => 'Kode OTP telah dikirim ke email',
        'data' => ['otp' => $otp, 'user_id' => $user['id']]
    ]);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>