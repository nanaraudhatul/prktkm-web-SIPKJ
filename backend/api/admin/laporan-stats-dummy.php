<?php
/**
 * API Dummy Laporan Stats Admin
 * Endpoint: GET /backend/api/admin/laporan-stats-dummy.php
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

// ========================================
// FILTER
// ========================================
$periode = $_GET['tanggal'] ?? 'this-year';
$wilayah = $_GET['wilayah'] ?? '';
$kategori = $_GET['kategori'] ?? '';
$status = $_GET['status'] ?? '';

// Filter data
$filtered = array_filter($data, function($item) use ($wilayah, $kategori, $status) {
    $match = true;
    if ($wilayah && stripos($item['lokasi'] ?? '', $wilayah) === false) $match = false;
    if ($kategori && strtolower($item['kategori'] ?? '') !== strtolower($kategori)) $match = false;
    if ($status && strtolower($item['status'] ?? '') !== strtolower($status)) $match = false;
    return $match;
});
$filtered = array_values($filtered);

// Filter periode
$bulanIndonesia = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
$kecamatanList = ['Ternate Utara', 'Ternate Tengah', 'Ternate Selatan', 'Ternate Barat', 'Pulau Ternate'];

switch ($periode) {
    case 'this-month':
        $filtered = array_filter($filtered, fn($i) => date('Y-m', strtotime($i['created_at'] ?? '')) === date('Y-m'));
        $periodLabel = date('M Y');
        break;
    case 'last-month':
        $lastMonth = date('Y-m', strtotime('-1 month'));
        $filtered = array_filter($filtered, fn($i) => date('Y-m', strtotime($i['created_at'] ?? '')) === $lastMonth);
        $periodLabel = date('M Y', strtotime('-1 month'));
        break;
    case 'this-year':
        $filtered = array_filter($filtered, fn($i) => date('Y', strtotime($i['created_at'] ?? '')) === date('Y'));
        $periodLabel = date('Y');
        break;
    default:
        $periodLabel = 'Semua Periode';
}
$filtered = array_values($filtered);

// ========================================
// STATISTIK
// ========================================
$total = count($filtered);
$selesai = count(array_filter($filtered, fn($i) => ($i['status'] ?? '') === 'selesai'));
$proses = count(array_filter($filtered, fn($i) => ($i['status'] ?? '') === 'proses'));

// ========================================
// TREND BULANAN (4 bulan terakhir)
// ========================================
$trendData = [];
$currentMonth = (int)date('m');
$currentYear = (int)date('Y');

for ($i = 3; $i >= 0; $i--) {
    $month = $currentMonth - $i;
    $year = $currentYear;
    if ($month <= 0) { $month += 12; $year--; }
    
    $masuk = count(array_filter($filtered, function($item) use ($month, $year) {
        $d = strtotime($item['created_at'] ?? '');
        return date('n', $d) == $month && date('Y', $d) == $year;
    }));
    $selesaiBulan = count(array_filter($filtered, function($item) use ($month, $year) {
        $d = strtotime($item['created_at'] ?? '');
        return date('n', $d) == $month && date('Y', $d) == $year && ($item['status'] ?? '') === 'selesai';
    }));
    
    $trendData[] = [
        'bulan' => $bulanIndonesia[$month - 1],
        'masuk' => $masuk,
        'selesai' => $selesaiBulan
    ];
}

// ========================================
// KATEGORI
// ========================================
$kategoriCount = [];
foreach ($filtered as $item) {
    $kat = strtolower($item['kategori'] ?? 'lainnya');
    $kategoriCount[$kat] = ($kategoriCount[$kat] ?? 0) + 1;
}
arsort($kategoriCount);

$kategoriLabels = [
    'permukaan' => 'Permukaan Jalan',
    'fasilitas' => 'Fasilitas PJU',
    'drainase' => 'Drainase',
    'marka' => 'Marka Jalan',
    'lainnya' => 'Lainnya'
];

$kategoriData = [];
foreach ($kategoriCount as $kat => $jumlah) {
    $kategoriData[] = [
        'kategori' => $kat,
        'kategori_label' => $kategoriLabels[$kat] ?? ucfirst($kat),
        'jumlah' => $jumlah
    ];
}

// ========================================
// TOP WILAYAH
// ========================================
$wilayahCount = [];
foreach ($filtered as $item) {
    $lokasi = $item['lokasi'] ?? '';
    foreach ($kecamatanList as $kec) {
        if (stripos($lokasi, $kec) !== false) {
            $wilayahCount[$kec] = ($wilayahCount[$kec] ?? 0) + 1;
            break;
        }
    }
}
arsort($wilayahCount);

$topWilayah = [];
foreach ($wilayahCount as $nama => $jumlah) {
    $topWilayah[] = ['nama' => $nama, 'jumlah' => $jumlah];
    if (count($topWilayah) >= 5) break;
}

if (empty($topWilayah)) {
    foreach ($kecamatanList as $kec) {
        $topWilayah[] = ['nama' => $kec, 'jumlah' => 0];
    }
}

// ========================================
// INSIGHT & EFISIENSI
// ========================================
$lastTrend = end($trendData);
$efisiensi = ($lastTrend['masuk'] ?? 0) > 0 ? round((($lastTrend['selesai'] ?? 0) / $lastTrend['masuk']) * 100, 1) : 0;

$maxMonth = null;
$maxCount = 0;
foreach ($trendData as $t) {
    if ($t['masuk'] > $maxCount) {
        $maxCount = $t['masuk'];
        $maxMonth = $t['bulan'];
    }
}

$insight = "Data laporan dari database dummy.";
if ($maxMonth && $maxCount > 0) {
    $insight = "Puncak laporan terjadi pada bulan $maxMonth dengan $maxCount laporan masuk.";
}

// ========================================
// RESPONSE
// ========================================
echo json_encode([
    'success' => true,
    'data' => [
        'total' => $total,
        'selesai' => $selesai,
        'proses' => $proses,
        'period_label' => $periodLabel,
        'efisiensi' => $efisiensi,
        'efisiensi_bulan' => $lastTrend['bulan'] ?? '-',
        'insight' => $insight,
        'trend' => $trendData,
        'kategori' => $kategoriData,
        'top_wilayah' => $topWilayah
    ],
    'source' => 'dummy_json'
], JSON_UNESCAPED_UNICODE);
?>