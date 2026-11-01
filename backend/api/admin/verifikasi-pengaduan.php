<?php
/**
 * API Verifikasi Pengaduan - Admin
 * Endpoint: POST /backend/api/admin/verifikasi-pengaduan.php
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

$data = json_decode(file_get_contents('php://input'), true);
$pengaduan_id = (int)($data['pengaduan_id'] ?? 0);
$status = $data['status'] ?? '';
$catatan = trim($data['catatan'] ?? '');
$valid = $data['valid'] ?? true;

if ($pengaduan_id <= 0 || empty($status)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
    exit();
}

// Validasi status
$allowedStatus = ['proses', 'ditolak', 'selesai'];
if (!in_array($status, $allowedStatus)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Status tidak valid']);
    exit();
}

try {
    $pdo->beginTransaction();

    // Update status pengaduan
    $stmt = $pdo->prepare("
        UPDATE pengaduan 
        SET status = ?, 
            updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$status, $pengaduan_id]);

    // Insert ke status_log
    $keterangan = $catatan ?: ($status === 'proses' ? 'Pengaduan diverifikasi dan diproses' : 'Pengaduan ditolak');
    $stmt = $pdo->prepare("
        INSERT INTO status_log (pengaduan_id, status, keterangan, created_by) 
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$pengaduan_id, $status, $keterangan, $userId]);

    $pdo->commit();

    $message = $status === 'proses' ? 'Pengaduan berhasil diverifikasi dan diproses' : 'Pengaduan berhasil ditolak';
    
    echo json_encode([
        'success' => true,
        'message' => $message
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error database: ' . $e->getMessage()]);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>