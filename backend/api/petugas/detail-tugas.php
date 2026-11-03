<?php
/**
 * API Detail Tugas - Petugas
 * Endpoint: GET /backend/api/petugas/detail-tugas.php?id=123
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

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID tugas tidak valid']);
    exit();
}

try {
    // Ambil detail pengaduan yang sudah diverifikasi
    $stmt = $pdo->prepare("
        SELECT 
            p.*,
            u.username as pelapor,
            u.email as email_pelapor,
            u.telepon as telepon_pelapor
        FROM pengaduan p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = ? AND p.status IN ('verifikasi', 'proses', 'selesai')
    ");
    $stmt->execute([$id]);
    $tugas = $stmt->fetch();
    
    if (!$tugas) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Tugas tidak ditemukan']);
        exit();
    }
    
    // Map status untuk frontend
    if ($tugas['status'] === 'verifikasi') {
        $tugas['status'] = 'diterima';
    }
    
    // Path foto
    $fotoUrl = null;
    if (!empty($tugas['foto'])) {
        $fotoUrl = '/sipkj/backend/uploads/' . $tugas['foto'];
    }
    
    // Ambil status log
    $stmtLog = $pdo->prepare("
        SELECT sl.*, u.username 
        FROM status_log sl
        LEFT JOIN users u ON sl.created_by = u.id
        WHERE sl.pengaduan_id = ?
        ORDER BY sl.created_at ASC
    ");
    $stmtLog->execute([$id]);
    $statusLog = $stmtLog->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => [
            'id' => $tugas['id'],
            'judul' => $tugas['judul'],
            'kategori' => $tugas['kategori'],
            'pola_masalah' => $tugas['kategori'],
            'deskripsi' => $tugas['deskripsi'],
            'lokasi' => $tugas['lokasi'],
            'maps_link' => $tugas['maps_link'],
            'foto' => $fotoUrl,
            'foto_nama' => $tugas['foto'],
            'status' => $tugas['status'],
            'prioritas' => $tugas['prioritas'] ?? 'sedang',
            'created_at' => $tugas['created_at'],
            'updated_at' => $tugas['updated_at'],
            'pelapor' => $tugas['pelapor'],
            'email_pelapor' => $tugas['email_pelapor'],
            'telepon_pelapor' => $tugas['telepon_pelapor'],
            'status_log' => $statusLog
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error database: ' . $e->getMessage()]);
}
?>