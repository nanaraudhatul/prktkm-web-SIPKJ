<?php
/**
 * API Dummy List Pengaduan
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

// Mapping nama pelapor berdasarkan user_id (user_id 7 s/d 36)
$NAMA_PELAPOR = [
    "Budi Santoso", "Siti Aminah", "Ahmad Fauzi", "Dewi Lestari", "Rizky Pratama",
    "Nurul Hidayah", "Eko Prasetyo", "Rina Wulandari", "Agus Setiawan", "Maya Sari",
    "Hendra Gunawan", "Fitriani", "Doni Kusuma", "Lina Marlina", "Yudi Hermawan",
    "Ani Suryani", "Bambang Sutrisno", "Citra Dewi", "Dedi Kurniawan", "Eka Putri"
];

// Inject nama_pelapor ke setiap item
foreach ($data as &$item) {
    $userId = (int)$item['user_id'];
    $index = abs($userId - 7) % count($NAMA_PELAPOR);
    $item['nama_pelapor'] = $NAMA_PELAPOR[$index];
}
unset($item);

// --- Filter Logic ---
$status = isset($_GET['status']) ? trim($_GET['status']) : null;
$kategori = isset($_GET['kategori']) ? trim($_GET['kategori']) : null;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 0;

if ($status) {
    $data = array_values(array_filter($data, function($item) use ($status) {
        return strtolower($item['status'] ?? '') === strtolower($status);
    }));
}

if ($kategori) {
    $data = array_values(array_filter($data, function($item) use ($kategori) {
        return strtolower($item['kategori'] ?? '') === strtolower($kategori);
    }));
}

// Sort: Terbaru di atas (Descending)
usort($data, function($a, $b) {
    $dateA = isset($a['created_at']) ? strtotime($a['created_at']) : 0;
    $dateB = isset($b['created_at']) ? strtotime($b['created_at']) : 0;
    return $dateB <=> $dateA;
});

if ($limit > 0) {
    $data = array_slice($data, 0, $limit);
}

echo json_encode([
    'success' => true,
    'data' => $data,
    'total' => count($data),
    'source' => 'dummy_json'
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>