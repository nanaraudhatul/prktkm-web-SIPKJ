<?php
/**
 * API Update Profile User
 * Endpoint: POST /backend/api/user/update-profile.php
 */

// Matikan error display agar tidak mengacaukan JSON
error_reporting(0);
ini_set('display_errors', 0);

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
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

// Ambil data dari request body
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Data tidak valid']);
    exit();
}

// Ambil dan sanitasi input
$username = trim($data['username'] ?? '');
$email = trim($data['email'] ?? '');
$telepon = trim($data['telepon'] ?? '');

// Validasi input
if (empty($username)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Username wajib diisi']);
    exit();
}

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email wajib diisi']);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Format email tidak valid']);
    exit();
}

try {
    // Cek apakah username sudah digunakan user lain
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
    $stmt->execute([$username, $user['id']]);
    
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Username sudah digunakan oleh user lain']);
        exit();
    }
    
    // Cek apakah email sudah digunakan user lain
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
    $stmt->execute([$email, $user['id']]);
    
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email sudah digunakan oleh user lain']);
        exit();
    }
    
    // Update data user
    $stmt = $pdo->prepare("
        UPDATE users 
        SET username = ?, email = ?, telepon = ?, updated_at = NOW()
        WHERE id = ?
    ");
    
    $stmt->execute([$username, $email, $telepon, $user['id']]);
    
    // Ambil data user yang sudah diupdate
    $stmt = $pdo->prepare("
        SELECT id, username, email, telepon, role, created_at, updated_at 
        FROM users 
        WHERE id = ?
    ");
    $stmt->execute([$user['id']]);
    $updatedUser = $stmt->fetch();
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Profil berhasil diperbarui',
        'data' => $updatedUser
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error database: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error server: ' . $e->getMessage()
    ]);
}
?>