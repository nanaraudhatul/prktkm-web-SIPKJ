<?php
require_once '../../config/database.php';

$user = validateToken($pdo);

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit();
}

$oldPassword = $data['old_password'] ?? '';
$newPassword = $data['new_password'] ?? '';

if (empty($oldPassword) || empty($newPassword)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Password lama dan baru wajib diisi']);
    exit();
}

if (strlen($newPassword) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Password baru minimal 8 karakter']);
    exit();
}

try {
    // Ambil password lama dari database
    $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->execute([$user['id']]);
    $userData = $stmt->fetch();

    if (!$userData) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User tidak ditemukan']);
        exit();
    }

    // Verifikasi password lama
    if (!password_verify($oldPassword, $userData['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Password lama salah']);
        exit();
    }

    // Hash password baru
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

    // Update password
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
    $stmt->execute([$hashedPassword, $user['id']]);

    echo json_encode([
        'success' => true,
        'message' => 'Password berhasil diubah!'
    ]);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>