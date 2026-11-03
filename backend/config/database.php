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
// Database Config (STABIL & TIDAK TERGANTUNG IP)
// ==========================================
// PENTING: Gunakan '127.0.0.1' atau 'localhost'. 
// Ini akan selalu berhasil selama MySQL XAMPP berwarna HIJAU, 
// terlepas dari berapa pun port Apache (80/8080) atau IP jaringan Anda.
$host = '127.0.0.1';       
$dbname = 'sipkj_db';      

// Default XAMPP adalah 'root' dan password kosong. 
// Jika Anda sudah membuat user khusus 'sipkj', kembalikan ke 'sipkj'.
$username = 'root';        
$password = '';            

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
        'message' => 'Koneksi database gagal. Pastikan: 1) MySQL XAMPP sudah START (Hijau), 2) Nama database "sipkj_db" sudah dibuat.'
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
    
    // Token berlaku selama 24 jam (86400 detik)
    if (time() - $timestamp > 86400) {
        return false;
    }
    
    $stmt = $pdo->prepare("SELECT id, username, email, role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    return $user ?: false;
}
?>