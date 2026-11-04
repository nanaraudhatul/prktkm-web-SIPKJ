<?php
/**
 * API Trend Pengaduan - 7 Hari Terakhir
 * Endpoint: GET /backend/api/admin/trend-pengaduan.php
 */

require_once '../../config/database.php';

// Validasi token admin
$user = validateToken($pdo);
if (!$user || $user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Akses ditolak']);
    exit();
}

try {
    // Ambil data pengaduan 7 hari terakhir
    $stmt = $pdo->prepare("
        SELECT 
            DATE(created_at) as tanggal,
            COUNT(*) as jumlah
        FROM pengaduan
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY tanggal ASC
    ");
    $stmt->execute();
    $data = $stmt->fetchAll();
    
    // Lengkapi data untuk 7 hari (jika ada hari yang kosong)
    $completeData = [];
    $endDate = new DateTime();
    $startDate = (clone $endDate)->modify('-6 days');
    
    while ($startDate <= $endDate) {
        $dateStr = $startDate->format('Y-m-d');
        $found = false;
        
        foreach ($data as $item) {
            if ($item['tanggal'] === $dateStr) {
                $completeData[] = [
                    'tanggal' => $item['tanggal'],
                    'jumlah' => (int)$item['jumlah']
                ];
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            $completeData[] = [
                'tanggal' => $dateStr,
                'jumlah' => 0
            ];
        }
        
        $startDate->modify('+1 day');
    }
    
    echo json_encode([
        'success' => true,
        'data' => $completeData
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>