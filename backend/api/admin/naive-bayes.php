<?php
/**
 * API Naive Bayes Classifier untuk Pengaduan
 * Endpoint: POST /backend/api/admin/naive-bayes.php
 */

error_reporting(0);
ini_set('display_errors', 0);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
    exit();
}

require_once '../../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);
$deskripsi = trim($data['deskripsi'] ?? '');
$judul = trim($data['judul'] ?? '');

if (empty($deskripsi) && empty($judul)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Deskripsi atau judul wajib diisi']);
    exit();
}

// ========================================
// DATA TRAINING NAIVE BAYES
// ========================================
// Format: [teks, kategori]
$trainingData = [
    // Permukaan Jalan
    ['jalan berlubang besar', 'permukaan'],
    ['lubang di jalan sangat dalam', 'permukaan'],
    ['permukaan jalan retak retak', 'permukaan'],
    ['jalan rusak parah banyak lubang', 'permukaan'],
    ['aspal jalan mengelupas', 'permukaan'],
    ['jalan bergelombang tidak rata', 'permukaan'],
    ['genangan air di jalan karena permukaan rusak', 'permukaan'],
    ['jalan ambles dan berlubang', 'permukaan'],
    ['retakan besar di tengah jalan', 'permukaan'],
    ['permukaan jalan hancur', 'permukaan'],
    ['lubang menganga di jalan raya', 'permukaan'],
    ['jalan banyak lubang kecil', 'permukaan'],
    ['aspal terkelupas di beberapa titik', 'permukaan'],
    ['jalan rusak dan bergelombang', 'permukaan'],
    ['kerusakan permukaan jalan parah', 'permukaan'],
    
    // Drainase
    ['drainase tersumbat sampah', 'drainase'],
    ['selokan mampet air tidak mengalir', 'drainase'],
    ['got tersumbat menyebabkan banjir', 'drainase'],
    ['saluran air rusak dan bocor', 'drainase'],
    ['drainase penuh sampah dan lumpur', 'drainase'],
    ['air menggenang karena drainase rusak', 'drainase'],
    ['selokan pinggir jalan rusak', 'drainase'],
    ['drainase tidak berfungsi dengan baik', 'drainase'],
    ['saluran drainase tersumbat total', 'drainase'],
    ['got di depan rumah mampet', 'drainase'],
    ['air tidak bisa mengalir ke selokan', 'drainase'],
    ['drainase jebol dan rusak', 'drainase'],
    ['selokan penuh lumpur dan sampah', 'drainase'],
    ['saluran air di pinggir jalan rusak', 'drainase'],
    ['drainasecollapsed dan tersumbat', 'drainase'],
    
    // Fasilitas Umum
    ['lampu jalan mati tidak menyala', 'fasilitas'],
    ['lampu penerangan jalan rusak', 'fasilitas'],
    ['rambu lalu lintas hilang', 'fasilitas'],
    ['rambu jalan rusak dan tidak terbaca', 'fasilitas'],
    ['tiang lampu jalan miring', 'fasilitas'],
    ['lampu jalan berkedip kedip', 'fasilitas'],
    ['penerangan jalan tidak ada', 'fasilitas'],
    ['rambu rambu jalan sudah pudar', 'fasilitas'],
    ['lampu penerangan mati total', 'fasilitas'],
    ['tiang lampu jalan tumbang', 'fasilitas'],
    ['rambu peringatan hilang dicuri', 'fasilitas'],
    ['lampu jalan hanya beberapa yang nyala', 'fasilitas'],
    ['fasilitas jalan rusak', 'fasilitas'],
    ['guard rail pembatas jalan rusak', 'fasilitas'],
    ['trotoar rusak dan tidak bisa dilewati', 'fasilitas'],
    
    // Marka Jalan
    ['garis jalan pudar tidak terlihat', 'marka'],
    ['zebra cross sudah hilang', 'marka'],
    ['garis pembatas jalan tidak jelas', 'marka'],
    ['marka jalan sudah pudar', 'marka'],
    ['garis tengah jalan hilang', 'marka'],
    ['tanda jalan tidak terlihat', 'marka'],
    ['garis tepi jalan sudah tidak ada', 'marka'],
    ['marka zebra cross pudar', 'marka'],
    ['garis jalan terkelupas', 'marka'],
    ['tanda arah di jalan sudah hilang', 'marka'],
    ['marka pembatas lajur tidak terlihat', 'marka'],
    ['garis putih di jalan sudah pudar', 'marka'],
    ['tanda jalan di aspal sudah hilang', 'marka'],
    ['marka jalan rusak dan tidak jelas', 'marka'],
    ['garis jalan sudah hampir tidak terlihat', 'marka'],
    
    // Lainnya
    ['pohon tumbang menutupi jalan', 'lainnya'],
    ['tanah longsor di pinggir jalan', 'lainnya'],
    ['banjir menggenangi jalan', 'lainnya'],
    ['kendaraan rusak di jalan', 'lainnya'],
    ['sampah menumpuk di jalan', 'lainnya'],
    ['hewan liar di jalan raya', 'lainnya'],
    ['bau tidak sedap dari saluran air', 'lainnya'],
    ['debu tebal dari jalan rusak', 'lainnya'],
    ['jalan licin karena minyak', 'lainnya'],
    ['kerikil berserakan di jalan', 'lainnya'],
];

// ========================================
// FUNGSI NAIVE BAYES
// ========================================

class NaiveBayesClassifier {
    private $categories = [];
    private $wordCounts = [];
    private $totalDocs = 0;
    private $categoryDocs = [];
    private $vocabulary = [];
    
    public function train($trainingData) {
        // Hitung frekuensi kata per kategori
        foreach ($trainingData as $doc) {
            $text = strtolower($doc[0]);
            $category = $doc[1];
            $words = $this->tokenize($text);
            
            if (!isset($this->categories[$category])) {
                $this->categories[$category] = true;
                $this->wordCounts[$category] = [];
                $this->categoryDocs[$category] = 0;
            }
            
            $this->categoryDocs[$category]++;
            $this->totalDocs++;
            
            foreach ($words as $word) {
                if (!isset($this->wordCounts[$category][$word])) {
                    $this->wordCounts[$category][$word] = 0;
                }
                $this->wordCounts[$category][$word]++;
                
                if (!in_array($word, $this->vocabulary)) {
                    $this->vocabulary[] = $word;
                }
            }
        }
    }
    
    private function tokenize($text) {
        // Hapus karakter khusus dan split menjadi kata-kata
        $text = preg_replace('/[^a-z0-9\s]/', '', $text);
        $words = explode(' ', $text);
        return array_filter($words, function($w) {
            return strlen($w) > 2; // Abaikan kata terlalu pendek
        });
    }
    
    public function predict($text) {
        $text = strtolower($text);
        $words = $this->tokenize($text);
        
        $scores = [];
        $vocabSize = count($this->vocabulary);
        
        foreach ($this->categories as $category => $true) {
            // Prior probability: P(category)
            $prior = log($this->categoryDocs[$category] / $this->totalDocs);
            
            // Likelihood: P(word|category) dengan Laplace smoothing
            $likelihood = 0;
            $totalWordsInCategory = array_sum($this->wordCounts[$category]);
            
            foreach ($words as $word) {
                $wordCount = isset($this->wordCounts[$category][$word]) ? $this->wordCounts[$category][$word] : 0;
                // Laplace smoothing: (count + 1) / (total + vocabSize)
                $likelihood += log(($wordCount + 1) / ($totalWordsInCategory + $vocabSize));
            }
            
            $scores[$category] = $prior + $likelihood;
        }
        
        // Cari kategori dengan skor tertinggi
        arsort($scores);
        
        // Hitung confidence (probability)
        $maxScore = reset($scores);
        $sumExp = 0;
        foreach ($scores as $score) {
            $sumExp += exp($score - $maxScore); // Untuk numerical stability
        }
        $confidence = exp($maxScore - $maxScore) / $sumExp * 100;
        
        return [
            'category' => key($scores),
            'confidence' => round($confidence, 2),
            'all_scores' => $scores
        ];
    }
    
    public function getCategoryLabel($category) {
        $labels = [
            'permukaan' => 'Kerusakan Permukaan Jalan',
            'drainase' => 'Kerusakan Drainase',
            'fasilitas' => 'Kerusakan Fasilitas Umum',
            'marka' => 'Kerusakan Marka Jalan',
            'lainnya' => 'Lainnya'
        ];
        return $labels[$category] ?? $category;
    }
}

// ========================================
// PROSES KLASIFIKASI
// ========================================

try {
    $classifier = new NaiveBayesClassifier();
    $classifier->train($trainingData);
    
    // Gabungkan judul dan deskripsi untuk analisis
    $combinedText = ($judul ? $judul . ' ' : '') . $deskripsi;
    
    $prediction = $classifier->predict($combinedText);
    
    // Format hasil
    $categoryLabel = $classifier->getCategoryLabel($prediction['category']);
    
    // Bandingkan dengan kategori yang diinput user (jika ada)
    $userCategory = $data['kategori'] ?? '';
    $matchStatus = '';
    if (!empty($userCategory)) {
        $matchStatus = ($userCategory === $prediction['category']) ? 'match' : 'mismatch';
    }
    
    echo json_encode([
        'success' => true,
        'prediction' => [
            'category' => $prediction['category'],
            'category_label' => $categoryLabel,
            'confidence' => $prediction['confidence'],
            'match_status' => $matchStatus,
            'user_category' => $userCategory
        ],
        'all_scores' => $prediction['all_scores']
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>