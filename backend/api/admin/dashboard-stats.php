<?php
/**
 * API Dashboard Stats - Admin
 * Endpoint: GET /backend/api/admin/dashboard-stats.php
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

// Validasi token admin
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
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

$stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user || $user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Akses ditolak']);
    exit();
}

try {
    // Total pengaduan
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM pengaduan");
    $total = $stmt->fetch()['total'];

    // Menunggu verifikasi
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM pengaduan WHERE status IN ('diajukan', 'baru')");
    $pending = $stmt->fetch()['total'];

    // Dalam proses
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM pengaduan WHERE status = 'proses'");
    $process = $stmt->fetch()['total'];

    // Selesai
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM pengaduan WHERE status = 'selesai'");
    $done = $stmt->fetch()['total'];

    // Trend 7 hari terakhir
    $stmt = $pdo->query("
        SELECT DATE(created_at) as tanggal, COUNT(*) as jumlah 
        FROM pengaduan 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY tanggal ASC
    ");
    $trend = $stmt->fetchAll();

    // Kategori
    $stmt = $pdo->query("
        SELECT kategori, COUNT(*) as jumlah 
        FROM pengaduan 
        GROUP BY kategori
    ");
    $kategori = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => [
            'total' => $total,
            'menunggu_verifikasi' => $pending,
            'dalam_proses' => $process,
            'selesai' => $done,
            'trend' => $trend,
            'kategori' => $kategori
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error database: ' . $e->getMessage()]);
}
?>