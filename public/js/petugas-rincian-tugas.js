// Data Tugas
const taskData = {
    1: {
        title: 'Lampu jalan mati',
        priority: 'Tinggi',
        priorityClass: 'priority-high',
        deadline: '20 Okt, 23:59',
        status: 'Proses',
        desc: 'Lampu penerangan jalan padam di pertigaan dekat toko swalayan sejak 3 hari lalu. Kondisi jalan sangat gelap di malam hari.',
        location: 'Jl. Sudirman No.15',
        area: 'Ternate Tengah',
        progress: 33
    },
    2: {
        title: 'Rambu roboh',
        priority: 'Sedang',
        priorityClass: 'priority-medium',
        deadline: '21 Okt, 23:59',
        status: 'Menunggu',
        desc: 'Rambu lalu lintas di pinggir jalan ditemukan roboh dan perlu diperiksa serta dipasang kembali.',
        location: 'Jl. Raya Kastela',
        area: 'Pulau Ternate',
        progress: 0
    },
    3: {
        title: 'Jalan berlubang',
        priority: 'Rendah',
        priorityClass: 'priority-low',
        deadline: '18 Okt, 23:59',
        status: 'Selesai',
        desc: 'Perbaikan lubang jalan telah selesai dilakukan.',
        location: 'Jl. Maluku Utara',
        area: 'Ternate Tengah',
        progress: 100
    }
};

let selectedTaskId = 1;

function selectTask(id) {
    // Remove selected class from all rows
    document.querySelectorAll('.data-table tr').forEach(row => {
        row.classList.remove('selected');
    });
    
    // Add selected class to clicked row
    const selectedRow = document.getElementById(`row-${id}`);
    if (selectedRow) {
        selectedRow.classList.add('selected');
    }
    
    selectedTaskId = id;
    updateDetailPanel(id);
}

function updateDetailPanel(id) {
    const task = taskData[id];
    if (!task) return;
    
    // Update title
    document.getElementById('detailTitle').textContent = task.title;
    
    // Update priority
    const priorityEl = document.getElementById('detailPriority');
    priorityEl.textContent = '● ' + task.priority;
    priorityEl.className = 'detail-priority ' + task.priorityClass;
    
    // Update deadline
    document.getElementById('detailDeadline').innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        ${task.deadline}
    `;
    
    // Update description
    document.getElementById('detailDesc').textContent = task.desc;
    
    // Update location
    document.getElementById('detailLocation').textContent = task.location;
    document.getElementById('detailArea').textContent = task.area;
    
    // Update progress
    updateProgress(task.progress);
}

function updateProgress(progress) {
    const progressLine = document.getElementById('progressLine');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    
    // Reset all steps
    [step1, step2, step3].forEach(step => {
        step.className = 'progress-step';
    });
    
    // Update progress line
    progressLine.style.width = progress + '%';
    
    // Update steps based on progress
    if (progress >= 33) {
        step1.classList.add('completed');
    }
    if (progress >= 66) {
        step2.classList.add('completed');
    } else if (progress >= 33) {
        step2.classList.add('active');
    }
    if (progress >= 100) {
        step3.classList.add('completed');
    }
}

function kerjakanTask(id) {
    alert('Membuka form pengerjaan untuk tugas #' + id);
}

function updateStatus() {
    alert('Update status untuk tugas #' + selectedTaskId);
}

function handleLogout() {
    if(confirm('Apakah Anda yakin ingin logout?')) {
        window.location.href = '../auth/login.html';
    }
}

// Initialize: Select first task by default when page loads
document.addEventListener('DOMContentLoaded', () => {
    selectTask(1);
});