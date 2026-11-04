<?php
/**
 * API Kategori Pengaduan
 * Endpoint: GET /backend/api/admin/kategori-pengaduan.php
 */

require_once '../../config/database.php';

// Validasi token admin
$user = validateToken($pdo);
if (!$user || $user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Akses ditolak']);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            kategori,
            COUNT(*) as jumlah
        FROM pengaduan
        GROUP BY kategori
        ORDER BY jumlah DESC
    ");
    $stmt->execute();
    $data = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>