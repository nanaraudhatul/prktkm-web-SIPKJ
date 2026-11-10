<?php
/**
 * API Dummy Dashboard Admin Stats
 * Endpoint: GET /backend/api/admin/dashboard-stats-dummy.php
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

// Hitung statistik
$total = count($data);
$diajukan = count(array_filter($data, fn($i) => in_array($i['status'] ?? '', ['diajukan', 'baru'])));
$verifikasi = count(array_filter($data, fn($i) => ($i['status'] ?? '') === 'verifikasi'));
$proses = count(array_filter($data, fn($i) => ($i['status'] ?? '') === 'proses'));
$selesai = count(array_filter($data, fn($i) => ($i['status'] ?? '') === 'selesai'));
$ditolak = count(array_filter($data, fn($i) => ($i['status'] ?? '') === 'ditolak'));

// Pengaduan terbaru (5 terakhir)
$terbaru = array_slice($data, 0, 5);

echo json_encode([
    'success' => true,
    'data' => [
        'total' => $total,
        'diajukan' => $diajukan,
        'verifikasi' => $verifikasi,
        'proses' => $proses,
        'selesai' => $selesai,
        'ditolak' => $ditolak,
        'terbaru' => $terbaru
    ],
    'source' => 'dummy_json'
], JSON_UNESCAPED_UNICODE);
?>