<?php
/**
 * API Update Status - Petugas
 * Endpoint: POST /backend/api/petugas/update-status.php
 */

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

// Get request body
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid request body']);
    exit();
}

$id = $input['id'] ?? 0;
$status = $input['status'] ?? '';

if ($id <= 0 || empty($status)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID dan status wajib diisi']);
    exit();
}

// Validasi status
$allowedStatus = ['proses', 'selesai'];
if (!in_array($status, $allowedStatus)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Status tidak valid']);
    exit();
}

try {
    // Cek apakah pengaduan ada dan sudah diverifikasi
    $stmt = $pdo->prepare("
        SELECT id, status FROM pengaduan 
        WHERE id = ? AND status IN ('verifikasi', 'proses')
    ");
    $stmt->execute([$id]);
    $pengaduan = $stmt->fetch();
    
    if (!$pengaduan) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Pengaduan tidak ditemukan atau sudah selesai']);
        exit();
    }
    
    // Update status
    $stmt = $pdo->prepare("
        UPDATE pengaduan 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    ");
    $stmt->execute([$status, $id]);
    
    // Catat di status_log
    $stmtLog = $pdo->prepare("
        INSERT INTO status_log (pengaduan_id, old_status, new_status, created_by, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ");
    $stmtLog->execute([$id, $pengaduan['status'], $status, $userId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Status berhasil diupdate'
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error database: ' . $e->getMessage()]);
}
?>