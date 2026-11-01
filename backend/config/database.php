<?php
// Matikan error display untuk production
error_reporting(0);
ini_set('display_errors', 0);

// CORS Headers - HARUS di paling atas sebelum output apapun
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ==========================================
// Database Config (DIPERBARUI)
// ==========================================
$host = '192.168.1.38';       // IP Komputer Host
$dbname = 'sipkj_db';         // Nama Database
$username = 'sipkj';          // Username yang dibuat di phpMyAdmin
$password = 'kelompok9';      // Password user tersebut
// ==========================================

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Koneksi database gagal. Pastikan MySQL running dan user memiliki akses remote.'
    ]);
    exit();
}

function generateToken($userId) {
    return base64_encode($userId . ':' . time());
}

function validateToken($pdo) {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (empty($authHeader) || strpos($authHeader, 'Bearer ') !== 0) {
        return false;
    }
    
    $token = substr($authHeader, 7);
    $decoded = base64_decode($token);
    
    if (!$decoded || strpos($decoded, ':') === false) {
        return false;
    }
    
    list($userId, $timestamp) = explode(':', $decoded);
    
    if (time() - $timestamp > 86400) {
        return false;
    }
    
    $stmt = $pdo->prepare("SELECT id, username, email, role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    return $user ?: false;
}
?>