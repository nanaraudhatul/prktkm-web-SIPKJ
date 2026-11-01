<?php
// 1. CORS Headers (Wajib di paling atas)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// 2. Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 3. PENTING: Harus GET, BUKAN POST!
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method salah. Harap gunakan GET.'
    ]);
    exit();
}

// 4. Load database
require_once '../../config/database.php';

// 5. Validasi token
$user = validateToken($pdo);
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Token tidak valid']);
    exit();
}

// 6. Ambil data user
try {
    $stmt = $pdo->prepare("SELECT id, username, email, telepon, role FROM users WHERE id = ?");
    $stmt->execute([$user['id']]);
    $userData = $stmt->fetch();

    if (!$userData) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User tidak ditemukan']);
        exit();
    }

    echo json_encode([
        'success' => true,
        'message' => 'Profil berhasil diambil',
        'data' => $userData
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>