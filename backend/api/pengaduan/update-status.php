<?php
/**
 * API Update Status Pengaduan
 * Endpoint: POST /backend/api/pengaduan/update-status.php
 */

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
    echo json_encode(['success' => false, 'message' => 'Gunakan POST']);
    exit();
}

require_once '../../config/database.php';

$user = validateToken($pdo);
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$pengaduan_id = $data['pengaduan_id'] ?? 0;
$status_baru = $data['status'] ?? '';
$keterangan = $data['keterangan'] ?? '';

// Validasi
if (empty($pengaduan_id) || empty($status_baru)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
    exit();
}

// Cek apakah user berhak update (admin/petugas)
$stmt = $pdo->prepare("SELECT * FROM pengaduan WHERE id = ?");
$stmt->execute([$pengaduan_id]);
$pengaduan = $stmt->fetch();

if (!$pengaduan) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Pengaduan tidak ditemukan']);
    exit();
}

// Update status di tabel pengaduan
try {
    $pdo->beginTransaction();
    
    // Update status utama
    $stmt = $pdo->prepare("UPDATE pengaduan SET status = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$status_baru, $pengaduan_id]);
    
    // Update timestamp kolom spesifik berdasarkan status
    $timestamp_column = '';
    switch($status_baru) {
        case 'diajukan':
            $timestamp_column = 'status_diajukan_at';
            break;
        case 'verifikasi':
            $timestamp_column = 'status_verifikasi_at';
            break;
        case 'proses':
            $timestamp_column = 'status_proses_at';
            break;
        case 'selesai':
            $timestamp_column = 'status_selesai_at';
            break;
    }
    
    if ($timestamp_column) {
        $stmt = $pdo->prepare("UPDATE pengaduan SET $timestamp_column = NOW() WHERE id = ?");
        $stmt->execute([$pengaduan_id]);
    }
    
    // Insert ke status_log
    $stmt = $pdo->prepare("
        INSERT INTO status_log (pengaduan_id, status, keterangan, created_by) 
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$pengaduan_id, $status_baru, $keterangan, $user['id']]);
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Status berhasil diupdate'
    ]);
    
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>