<?php
/**
 * API Dummy Detail Pengaduan
 */
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
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan. Gunakan GET.']);
    exit();
}

$jsonPath = __DIR__ . '/../../../public/data/dummy.json';

if (!file_exists($jsonPath)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'File data dummy tidak ditemukan.']);
    exit();
}

$jsonContent = file_get_contents($jsonPath);
$data = json_decode($jsonContent, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Format JSON tidak valid.']);
    exit();
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$foundItem = null;

foreach ($data as $item) {
    if ((int)$item['id'] === $id) {
        $foundItem = $item;
        break;
    }
}

if (!$foundItem) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Data dengan ID tersebut tidak ditemukan.']);
    exit();
}

// 1. Tambahkan nama pelapor berdasarkan user_id
$NAMA_PELAPOR = [
    "Budi Santoso", "Siti Aminah", "Ahmad Fauzi", "Dewi Lestari", "Rizky Pratama",
    "Nurul Hidayah", "Eko Prasetyo", "Rina Wulandari", "Agus Setiawan", "Maya Sari",
    "Hendra Gunawan", "Fitriani", "Doni Kusuma", "Lina Marlina", "Yudi Hermawan",
    "Ani Suryani", "Bambang Sutrisno", "Citra Dewi", "Dedi Kurniawan", "Eka Putri"
];

$userId = (int)$foundItem['user_id'];
$index = abs($userId - 7) % count($NAMA_PELAPOR);
$foundItem['nama_pelapor'] = $NAMA_PELAPOR[$index];

// 2. Handle foto null: Berikan gambar placeholder agar frontend tidak error
if (empty($foundItem['foto']) || $foundItem['foto'] === 'null' || $foundItem['foto'] === null) {
    $foundItem['foto'] = 'https://picsum.photos/seed/pengaduan' . $foundItem['id'] . '/800/600';
}

echo json_encode([
    'success' => true,
    'data' => $foundItem,
    'source' => 'dummy_json'
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>