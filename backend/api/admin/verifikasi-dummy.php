<?php
/**
 * API Dummy Verifikasi Pengaduan Admin
 * Endpoint: GET /backend/api/admin/verifikasi-dummy.php
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$jsonPath = __DIR__ . '/../../../public/data/dummy.json';

if (!file_exists($jsonPath)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'File data dummy tidak ditemukan.']);
    exit();
}

$data = json_decode(file_get_contents($jsonPath), true);

// Filter: hanya yang belum diverifikasi (diajukan/baru)
$belumVerifikasi = array_values(array_filter($data, function($item) {
    $status = strtolower($item['status'] ?? '');
    return $status === 'diajukan' || $status === 'baru';
}));

// Urutkan dari yang terbaru
usort($belumVerifikasi, function($a, $b) {
    return strtotime($b['created_at'] ?? 0) - strtotime($a['created_at'] ?? 0);
});

// Re-index
$belumVerifikasi = array_values($belumVerifikasi);

echo json_encode([
    'success' => true,
    'data' => $belumVerifikasi,
    'total' => count($belumVerifikasi),
    'source' => 'dummy_json'
], JSON_UNESCAPED_UNICODE);
?>