<?php
/**
 * API Laporan Stats - Admin
 * Endpoint: GET /backend/api/admin/laporan-stats.php
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

// ========================================
// VALIDASI TOKEN ADMIN
// ========================================
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Token tidak ditemukan']);
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
    $stmt = $pdo->prepare("SELECT id, username, role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'User tidak ditemukan']);
        exit();
    }
    
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Akses ditolak. Hanya admin.']);
        exit();
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error validasi user: ' . $e->getMessage()]);
    exit();
}

// ========================================
// DAFTAR KECAMATAN
// ========================================
$kecamatanList = [
    'Ternate Utara',
    'Ternate Tengah',
    'Ternate Selatan',
    'Ternate Barat',
    'Pulau Ternate',
    'Moti',
    'Batang 2',
    'Hiri'
];

// Fungsi normalisasi kecamatan
function normalizeKecamatan($lokasi, $kecamatanList) {
    if (empty($lokasi)) return null;
    $lokasiLower = strtolower($lokasi);
    
    foreach ($kecamatanList as $kec) {
        if (strpos($lokasiLower, strtolower($kec)) !== false) {
            return $kec;
        }
    }
    
    // Mapping alternatif berdasarkan kata kunci
    if (strpos($lokasiLower, 'melati') !== false || strpos($lokasiLower, 'tengah') !== false) {
        return 'Ternate Tengah';
    }
    if (strpos($lokasiLower, 'sudirman') !== false || strpos($lokasiLower, 'selatan') !== false) {
        return 'Ternate Selatan';
    }
    if (strpos($lokasiLower, 'anggrek') !== false || strpos($lokasiLower, 'utara') !== false) {
        return 'Ternate Utara';
    }
    if (strpos($lokasiLower, 'bastiong') !== false || strpos($lokasiLower, 'barat') !== false) {
        return 'Ternate Barat';
    }
    if (strpos($lokasiLower, 'pulau') !== false || strpos($lokasiLower, 'ternate') !== false) {
        return 'Pulau Ternate';
    }
    if (strpos($lokasiLower, 'moti') !== false) {
        return 'Moti';
    }
    if (strpos($lokasiLower, 'batang') !== false) {
        return 'Batang 2';
    }
    if (strpos($lokasiLower, 'hiri') !== false) {
        return 'Hiri';
    }
    
    return null;
}

// ========================================
// GET FILTERS
// ========================================
$periode = $_GET['tanggal'] ?? 'this-quarter';
$wilayah = $_GET['wilayah'] ?? '';
$kategori = $_GET['kategori'] ?? '';
$status = $_GET['status'] ?? '';

// Validasi kecamatan
if ($wilayah && !in_array($wilayah, $kecamatanList)) {
    $wilayah = '';
}

try {
    // Build where clause
    $where = "1=1";
    $params = [];
    
    if ($wilayah) {
        $where .= " AND lokasi LIKE ?";
        $params[] = '%' . $wilayah . '%';
    }
    if ($kategori) {
        $where .= " AND kategori = ?";
        $params[] = $kategori;
    }
    if ($status) {
        $where .= " AND status = ?";
        $params[] = $status;
    }
    
    // Date filter
    $dateWhere = "";
    $periodLabel = "";
    switch ($periode) {
        case 'this-month':
            $dateWhere = " AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())";
            $periodLabel = date('M Y');
            break;
        case 'last-month':
            $dateWhere = " AND MONTH(created_at) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(created_at) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)";
            $periodLabel = date('M Y', strtotime('-1 month'));
            break;
        case 'this-quarter':
            $quarter = ceil(date('n') / 3);
            $startMonth = ($quarter - 1) * 3 + 1;
            $endMonth = $quarter * 3;
            $dateWhere = " AND MONTH(created_at) BETWEEN $startMonth AND $endMonth AND YEAR(created_at) = YEAR(CURRENT_DATE())";
            $periodLabel = "Q$quarter " . date('Y');
            break;
        case 'last-quarter':
            $quarter = ceil(date('n') / 3) - 1;
            if ($quarter < 1) $quarter = 4;
            $startMonth = ($quarter - 1) * 3 + 1;
            $endMonth = $quarter * 3;
            $year = date('Y');
            if ($quarter == 4) $year = date('Y') - 1;
            $dateWhere = " AND MONTH(created_at) BETWEEN $startMonth AND $endMonth AND YEAR(created_at) = $year";
            $periodLabel = "Q$quarter $year";
            break;
        case 'this-year':
            $dateWhere = " AND YEAR(created_at) = YEAR(CURRENT_DATE())";
            $periodLabel = date('Y');
            break;
        default:
            $periodLabel = "Semua Periode";
    }
    
    // ========================================
    // TOTAL LAPORAN
    // ========================================
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM pengaduan WHERE $where $dateWhere");
    $stmt->execute($params);
    $total = (int)$stmt->fetch()['total'];
    
    // ========================================
    // SELESAI
    // ========================================
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM pengaduan WHERE $where AND status = 'selesai' $dateWhere");
    $stmt->execute($params);
    $selesai = (int)$stmt->fetch()['total'];
    
    // ========================================
    // PROSES
    // ========================================
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM pengaduan WHERE $where AND status = 'proses' $dateWhere");
    $stmt->execute($params);
    $proses = (int)$stmt->fetch()['total'];
    
    // ========================================
    // TREND BULANAN (4 BULAN TERAKHIR)
    // ========================================
    $trendData = [];
    $bulanLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    $currentMonth = (int)date('m');
    
    for ($i = 3; $i >= 0; $i--) {
        $month = $currentMonth - $i;
        $year = date('Y');
        
        if ($month <= 0) {
            $month += 12;
            $year--;
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as masuk,
                SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as selesai
            FROM pengaduan 
            WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
        ");
        $stmt->execute([$month, $year]);
        $row = $stmt->fetch();
        
        $trendData[] = [
            'bulan' => $bulanLabels[$month - 1],
            'masuk' => (int)$row['masuk'],
            'selesai' => (int)$row['selesai']
        ];
    }
    
    // ========================================
    // KATEGORI
    // ========================================
    $stmt = $pdo->prepare("
        SELECT kategori, COUNT(*) as jumlah 
        FROM pengaduan 
        WHERE $where $dateWhere
        GROUP BY kategori
        ORDER BY jumlah DESC
    ");
    $stmt->execute($params);
    $kategoriRaw = $stmt->fetchAll();
    
    $kategoriLabels = [
        'permukaan' => 'Permukaan Jalan',
        'fasilitas' => 'Fasilitas PJU',
        'drainase' => 'Drainase / Gorong',
        'marka' => 'Marka & Rambu',
        'lainnya' => 'Lainnya'
    ];
    
    $kategoriData = [];
    foreach ($kategoriRaw as $k) {
        $kategoriData[] = [
            'kategori' => $k['kategori'],
            'kategori_label' => $kategoriLabels[$k['kategori']] ?? ucfirst($k['kategori']),
            'jumlah' => (int)$k['jumlah']
        ];
    }
    
    // ========================================
    // TOP WILAYAH (KECAMATAN)
    // ========================================
    $stmt = $pdo->prepare("
        SELECT lokasi, COUNT(*) as jumlah 
        FROM pengaduan 
        WHERE $where $dateWhere AND lokasi IS NOT NULL AND lokasi != ''
        GROUP BY lokasi
        ORDER BY jumlah DESC
    ");
    $stmt->execute($params);
    $wilayahRaw = $stmt->fetchAll();
    
    // Normalisasi dan agregasi per kecamatan
    $kecamatanCount = [];
    foreach ($wilayahRaw as $w) {
        $kec = normalizeKecamatan($w['lokasi'], $kecamatanList);
        if ($kec) {
            if (!isset($kecamatanCount[$kec])) {
                $kecamatanCount[$kec] = 0;
            }
            $kecamatanCount[$kec] += (int)$w['jumlah'];
        }
    }
    
    // Sort dan ambil top 3
    arsort($kecamatanCount);
    $topWilayah = [];
    foreach ($kecamatanCount as $nama => $jumlah) {
        $topWilayah[] = [
            'nama' => $nama,
            'jumlah' => $jumlah
        ];
        if (count($topWilayah) >= 3) break;
    }
    
    // Jika tidak ada data, tampilkan semua kecamatan dengan 0
    if (empty($topWilayah)) {
        foreach ($kecamatanList as $kec) {
            $topWilayah[] = [
                'nama' => $kec,
                'jumlah' => 0
            ];
        }
    }
    
    // ========================================
    // EFISIENSI & INSIGHT
    // ========================================
    $lastMonthData = end($trendData);
    $efisiensi = $lastMonthData['masuk'] > 0 ? round(($lastMonthData['selesai'] / $lastMonthData['masuk']) * 100, 1) : 0;
    
    // Insight text
    $maxMonth = null;
    $maxCount = 0;
    foreach ($trendData as $t) {
        if ($t['masuk'] > $maxCount) {
            $maxCount = $t['masuk'];
            $maxMonth = $t['bulan'];
        }
    }
    
    $insight = "Data laporan dari database real-time.";
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
            'efisiensi_bulan' => $lastMonthData['bulan'],
            'insight' => $insight,
            'trend' => $trendData,
            'kategori' => $kategoriData,
            'top_wilayah' => $topWilayah
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error database: ' . $e->getMessage()
    ]);
}
?>