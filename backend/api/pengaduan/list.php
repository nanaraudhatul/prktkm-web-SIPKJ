<?php
/**
 * API List Pengaduan - Untuk Masyarakat & Admin
 * Endpoint: GET /backend/api/pengaduan/list.php
 */

error_reporting(0);
ini_set('display_errors', 0);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit();
}

require_once '../../config/database.php';

// Validasi token
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Token tidak valid']);
    exit();
}

$token = substr($authHeader, 7);
$decoded = base64_decode($token);

if (!$decoded || strpos($decoded, ':') === false) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Token tidak valid']);
    exit();
}

list($userId, $timestamp) = explode(':', $decoded);

if (time() - $timestamp > 86400) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Token expired']);
    exit();
}

// Ambil data user
$stmt = $pdo->prepare("SELECT id, username, role FROM users WHERE id = ?");
$stmt->execute([$userId]);
$currentUser = $stmt->fetch();

if (!$currentUser) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'User tidak ditemukan']);
    exit();
}

try {
    $userRole = $currentUser['role'] ?? 'masyarakat';
    
    // ✅ PERBAIKAN: SEMUA user (masyarakat, admin, petugas) bisa lihat SEMUA pengaduan
    $stmt = $pdo->prepare("
        SELECT 
            p.*, 
            u.username as pelapor,
            u.email as email_pelapor,
            u.telepon as telepon_pelapor
        FROM pengaduan p
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
    ");
    $stmt->execute();
    
    $pengaduan = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => $pengaduan,
        'user_role' => $userRole,
        'user_id' => $currentUser['id'],
        'username' => $currentUser['username']
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error database: ' . $e->getMessage()]);
}
?>