<?php
/**
 * API Create Pengaduan
 * Endpoint: POST /backend/api/pengaduan/create.php
 */

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Hanya terima POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan. Gunakan POST.']);
    exit();
}

// Load database
require_once '../../config/database.php';

// Validasi token
$user = validateToken($pdo);
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Token tidak valid atau expired']);
    exit();
}

try {
    // Ambil data dari $_POST
    $judul = trim($_POST['judul'] ?? '');
    $kategori = $_POST['kategori'] ?? '';
    $deskripsi = trim($_POST['deskripsi'] ?? '');
    $lokasi = trim($_POST['lokasi'] ?? '');
    $maps_link = trim($_POST['maps_link'] ?? '');

    // Validasi input
    if (empty($judul) || empty($kategori) || empty($deskripsi) || empty($lokasi)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Semua field wajib diisi']);
        exit();
    }

    // Handle upload foto
    $foto = null;
    if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../../uploads/';
        
        // Buat folder uploads jika belum ada
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $file = $_FILES['foto'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowedExts = ['jpg', 'jpeg', 'png'];

        // Validasi tipe file
        if (!in_array($ext, $allowedExts)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Format file tidak valid. Gunakan JPG, JPEG, atau PNG']);
            exit();
        }

        // Validasi ukuran file (max 5MB)
        if ($file['size'] > 5 * 1024 * 1024) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Ukuran file maksimal 5MB']);
            exit();
        }

        // Generate nama file unik
        $filename = 'pengaduan_' . time() . '_' . uniqid() . '.' . $ext;
        
        if (move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
            $foto = $filename;
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Gagal mengunggah foto']);
            exit();
        }
    } else {
        // Jika tidak ada foto yang diupload
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Foto bukti wajib diunggah']);
        exit();
    }

    // Insert ke database dengan status 'diajukan' (BUKAN 'baru')
    $stmt = $pdo->prepare("
        INSERT INTO pengaduan (user_id, judul, kategori, deskripsi, lokasi, maps_link, foto, status, status_diajukan_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 'diajukan', NOW())
    ");
    $stmt->execute([$user['id'], $judul, $kategori, $deskripsi, $lokasi, $maps_link, $foto]);

    $pengaduanId = $pdo->lastInsertId();

    // Insert ke status_log dengan status 'diajukan'
    $stmt = $pdo->prepare("
        INSERT INTO status_log (pengaduan_id, status, keterangan, created_by) 
        VALUES (?, 'diajukan', 'Pengaduan baru diajukan', ?)
    ");
    $stmt->execute([$pengaduanId, $user['id']]);

    echo json_encode([
        'success' => true,
        'message' => 'Pengaduan berhasil diajukan',
        'data' => ['id' => $pengaduanId]
    ]);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error database: ' . $e->getMessage()]);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>