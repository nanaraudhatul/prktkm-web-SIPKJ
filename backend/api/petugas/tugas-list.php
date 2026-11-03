<?php
/**
 * API Tugas List - Petugas
 * Endpoint: GET /backend/api/petugas/tugas-list.php?status=xxx&prioritas=xxx
 * Menampilkan pengaduan yang sudah diverifikasi admin
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
    // Get filter parameters
    $statusFilter = $_GET['status'] ?? '';
    $prioritasFilter = $_GET['prioritas'] ?? '';
    
    // Build query - HANYA ambil pengaduan yang sudah diverifikasi (status != 'diajukan' dan != 'ditolak')
    $where = "status IN ('verifikasi', 'proses', 'selesai')";
    $params = [];
    
    if ($statusFilter) {
        // Map status filter dari frontend ke database
        $statusMap = [
            'diterima' => 'verifikasi',
            'proses' => 'proses',
            'selesai' => 'selesai'
        ];
        
        if (isset($statusMap[$statusFilter])) {
            $where .= " AND status = ?";
            $params[] = $statusMap[$statusFilter];
        }
    }
    
    if ($prioritasFilter) {
        $where .= " AND prioritas = ?";
        $params[] = $prioritasFilter;
    }
    
    $stmt = $pdo->prepare("
        SELECT 
            p.id,
            p.judul,
            p.kategori as pola_masalah,
            p.prioritas,
            p.lokasi,
            p.status,
            p.created_at,
            p.updated_at,
            p.foto,
            p.deskripsi,
            u.username as pelapor,
            u.email as email_pelapor,
            u.telepon as telepon_pelapor
        FROM pengaduan p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE $where
        ORDER BY 
            CASE p.prioritas 
                WHEN 'tinggi' THEN 1 
                WHEN 'sedang' THEN 2 
                WHEN 'rendah' THEN 3 
                ELSE 4
            END,
            p.created_at DESC
    ");
    $stmt->execute($params);
    $tugasList = $stmt->fetchAll();
    
    // Map status untuk frontend
    foreach ($tugasList as &$tugas) {
        // Map status 'verifikasi' menjadi 'diterima' untuk frontend
        if ($tugas['status'] === 'verifikasi') {
            $tugas['status'] = 'diterima';
        }
        
        // Set default prioritas jika kosong
        if (empty($tugas['prioritas'])) {
            $tugas['prioritas'] = 'sedang';
        }
        
        // Format tanggal
        $tugas['created_at'] = date('Y-m-d H:i:s', strtotime($tugas['created_at']));
        $tugas['updated_at'] = date('Y-m-d H:i:s', strtotime($tugas['updated_at']));
    }
    
    echo json_encode([
        'success' => true,
        'data' => $tugasList,
        'message' => 'Daftar tugas berhasil diambil'
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error database: ' . $e->getMessage()]);
}
?>