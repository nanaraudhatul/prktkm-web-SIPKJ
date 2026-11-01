<?php
/**
 * API Detail Pengaduan
 * Endpoint: GET /backend/api/pengaduan/detail.php?id=123
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
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan. Gunakan GET.']);
    exit();
}

require_once '../../config/database.php';

// Validasi token
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Token tidak valid atau expired']);
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

// Ambil data user yang login
$stmt = $pdo->prepare("SELECT id, username, role FROM users WHERE id = ?");
$stmt->execute([$userId]);
$currentUser = $stmt->fetch();

if (!$currentUser) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'User tidak ditemukan']);
    exit();
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID pengaduan tidak valid']);
    exit();
}

try {
    // Ambil data pengaduan dengan JOIN ke users
    $stmt = $pdo->prepare("
        SELECT 
            p.*, 
            u.username as pelapor,
            u.email as email_pelapor,
            u.telepon as telepon_pelapor,
            u.role as role_pelapor
        FROM pengaduan p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
    ");
    $stmt->execute([$id]);
    $pengaduan = $stmt->fetch();

    if (!$pengaduan) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Pengaduan tidak ditemukan']);
        exit();
    }

    // ✅ PERBAIKAN: Semua user bisa lihat detail pengaduan (tidak ada batasan)
    $isOwner = ($pengaduan['user_id'] == $currentUser['id']);

    $tanggal = date('d M Y, H:i', strtotime($pengaduan['created_at']));
    
    $kategoriLabel = [
        'permukaan' => 'Permukaan Jalan',
        'drainase' => 'Drainase',
        'fasilitas' => 'Fasilitas Jalan',
        'marka' => 'Marka Jalan',
        'lainnya' => 'Lainnya'
    ];
    $kategoriText = $kategoriLabel[$pengaduan['kategori']] ?? $pengaduan['kategori'];

    $statusLabel = [
        'diajukan' => 'Diajukan',
        'baru' => 'Diajukan',
        'verifikasi' => 'Verifikasi',
        'proses' => 'Proses',
        'selesai' => 'Selesai',
        'ditolak' => 'Ditolak'
    ];
    $statusText = $statusLabel[$pengaduan['status']] ?? $pengaduan['status'];

// Path foto - PERBAIKAN: kembalikan sebagai array
$fotoList = [];
if (!empty($pengaduan['foto'])) {
    // Jika foto adalah string (single file)
    if (is_string($pengaduan['foto'])) {
        $fotoList[] = '/sipkj/backend/uploads/' . $pengaduan['foto'];
    }
    // Jika foto adalah array (multiple files)
    elseif (is_array($pengaduan['foto'])) {
        foreach ($pengaduan['foto'] as $f) {
            $fotoList[] = '/sipkj/backend/uploads/' . $f;
        }
    }
}

// Cek juga field foto_lainnya jika ada
if (!empty($pengaduan['foto_lainnya'])) {
    $fotoLain = is_string($pengaduan['foto_lainnya']) 
        ? explode(',', $pengaduan['foto_lainnya']) 
        : $pengaduan['foto_lainnya'];
    foreach ($fotoLain as $f) {
        $f = trim($f);
        if (!empty($f)) {
            $fotoList[] = '/sipkj/backend/uploads/' . $f;
        }
    }
}

echo json_encode([
    'success' => true,
    'message' => 'Detail pengaduan berhasil diambil',
    'data' => [
        'id' => $pengaduan['id'],
        'judul' => $pengaduan['judul'],
        'kategori' => $kategoriText,
        'kategori_key' => $pengaduan['kategori'],
        'deskripsi' => $pengaduan['deskripsi'],
        'lokasi' => $pengaduan['lokasi'],
        'maps_link' => $pengaduan['maps_link'],
        'foto' => $fotoList,              // Array of URLs
        'foto_array' => $fotoList,         // Backup
        'foto_nama' => $pengaduan['foto'],
        'status' => $pengaduan['status'],  // PASTIKAN INI ADA
        'status_label' => $statusText,
        'tanggal' => $tanggal,
        'created_at' => $pengaduan['created_at'],
        'updated_at' => $pengaduan['updated_at'],
        'pelapor' => $pengaduan['pelapor'] ?? 'Unknown',
        'email_pelapor' => $pengaduan['email_pelapor'] ?? '-',
        'telepon_pelapor' => $pengaduan['telepon_pelapor'] ?? '-',
        'role_pelapor' => $pengaduan['role_pelapor'] ?? 'masyarakat',
        'user_id' => $pengaduan['user_id'],
        'current_user_id' => $currentUser['id'],
        'current_user_role' => $currentUser['role'],
        'is_owner' => ($pengaduan['user_id'] == $currentUser['id']),
        'status_log' => $statusLog
    ]
]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error database: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>