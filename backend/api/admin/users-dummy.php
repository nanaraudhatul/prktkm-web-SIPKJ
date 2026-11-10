<?php
/**
 * API Dummy Users untuk Admin
 * Endpoint: GET /backend/api/admin/users-dummy.php
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Data users dummy (sesuai dengan user_id di JSON)
$users = [
    ['id' => 1, 'username' => 'admin', 'email' => 'admin@sipkj.go.id', 'telepon' => '081234567890', 'role' => 'admin', 'is_verified' => 1, 'created_at' => '2026-09-01 08:00:00'],
    ['id' => 2, 'username' => 'petugas_utara', 'email' => 'petugas.utara@sipkj.go.id', 'telepon' => '081234567891', 'role' => 'petugas', 'is_verified' => 1, 'created_at' => '2026-09-01 08:00:00'],
    ['id' => 3, 'username' => 'petugas_tengah', 'email' => 'petugas.tengah@sipkj.go.id', 'telepon' => '081234567892', 'role' => 'petugas', 'is_verified' => 1, 'created_at' => '2026-09-01 08:00:00'],
    ['id' => 4, 'username' => 'petugas_selatan', 'email' => 'petugas.selatan@sipkj.go.id', 'telepon' => '081234567893', 'role' => 'petugas', 'is_verified' => 1, 'created_at' => '2026-09-01 08:00:00'],
    ['id' => 5, 'username' => 'petugas_barat', 'email' => 'petugas.barat@sipkj.go.id', 'telepon' => '081234567894', 'role' => 'petugas', 'is_verified' => 1, 'created_at' => '2026-09-01 08:00:00'],
    ['id' => 6, 'username' => 'petugas_pulau', 'email' => 'petugas.pulau@sipkj.go.id', 'telepon' => '081234567895', 'role' => 'petugas', 'is_verified' => 1, 'created_at' => '2026-09-01 08:00:00'],
];

// Generate 30 masyarakat berdasarkan user_id di JSON
$namaMasyarakat = [
    "Budi Santoso", "Siti Aminah", "Ahmad Fauzi", "Dewi Lestari", "Rizky Pratama",
    "Nurul Hidayah", "Eko Prasetyo", "Rina Wulandari", "Agus Setiawan", "Maya Sari",
    "Hendra Gunawan", "Fitriani", "Doni Kusuma", "Lina Marlina", "Yudi Hermawan",
    "Ani Suryani", "Bambang Sutrisno", "Citra Dewi", "Dedi Kurniawan", "Eka Putri",
    "Rahmat Hidayat", "Indah Permata", "Joko Widodo", "Sri Wahyuni", "Tono Supriyadi",
    "Umi Kalsum", "Vina Garut", "Wawan Setiawan", "Yuni Shara", "Zainal Abidin"
];

for ($i = 0; $i < 30; $i++) {
    $userId = 7 + $i;
    $users[] = [
        'id' => $userId,
        'username' => strtolower(str_replace(' ', '', $namaMasyarakat[$i])),
        'email' => 'masyarakat' . str_pad($i + 1, 2, '0', STR_PAD_LEFT) . '@email.com',
        'telepon' => '0812345679' . str_pad($i, 2, '0', STR_PAD_LEFT),
        'role' => 'masyarakat',
        'is_verified' => 1,
        'created_at' => '2026-09-' . str_pad($i + 1, 2, '0', STR_PAD_LEFT) . ' 08:00:00'
    ];
}

// Filter by role jika ada
$roleFilter = $_GET['role'] ?? '';
if ($roleFilter) {
    $users = array_values(array_filter($users, fn($u) => $u['role'] === $roleFilter));
}

// Search
$search = strtolower($_GET['search'] ?? '');
if ($search) {
    $users = array_values(array_filter($users, function($u) use ($search) {
        return stripos($u['username'], $search) !== false || 
               stripos($u['email'], $search) !== false;
    }));
}

// Stats
$stats = [
    'total' => count($users),
    'admin' => count(array_filter($users, fn($u) => $u['role'] === 'admin')),
    'petugas' => count(array_filter($users, fn($u) => $u['role'] === 'petugas')),
    'masyarakat' => count(array_filter($users, fn($u) => $u['role'] === 'masyarakat'))
];

echo json_encode([
    'success' => true,
    'data' => $users,
    'stats' => $stats,
    'source' => 'dummy_json'
], JSON_UNESCAPED_UNICODE);
?>