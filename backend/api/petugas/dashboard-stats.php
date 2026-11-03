<?php
/**
 * API Dashboard Stats - Petugas
 * Endpoint: GET /backend/api/petugas/dashboard-stats.php
 * Menampilkan statistik pengaduan yang sudah diverifikasi admin
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

try {
    // Cek apakah user adalah petugas
    $stmt = $pdo->prepare("SELECT id, username, role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user || $user['role'] !== 'petugas') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Akses ditolak. Hanya untuk petugas.']);
        exit();
    }
    
    // Hitung statistik pengaduan yang sudah diverifikasi (status != 'diajukan' dan != 'ditolak')
    // Total tugas = semua pengaduan yang sudah diverifikasi (status: verifikasi, proses, selesai)
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as total 
        FROM pengaduan 
        WHERE status IN ('verifikasi', 'proses', 'selesai')
    ");
    $stmt->execute();
    $total = (int)$stmt->fetch()['total'];
    
    // Diterima = status verifikasi (sudah diverifikasi admin, menunggu petugas)
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as total 
        FROM pengaduan 
        WHERE status = 'verifikasi'
    ");
    $stmt->execute();
    $diterima = (int)$stmt->fetch()['total'];
    
    // Dalam Proses = status proses
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as total 
        FROM pengaduan 
        WHERE status = 'proses'
    ");
    $stmt->execute();
    $proses = (int)$stmt->fetch()['total'];
    
    // Selesai = status selesai
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as total 
        FROM pengaduan 
        WHERE status = 'selesai'
    ");
    $stmt->execute();
    $selesai = (int)$stmt->fetch()['total'];
    
    echo json_encode([
        'success' => true,
        'data' => [
            'total' => $total,
            'diterima' => $diterima,
            'proses' => $proses,
            'selesai' => $selesai
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error database: ' . $e->getMessage()]);
}
?>