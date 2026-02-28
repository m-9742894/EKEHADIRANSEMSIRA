// --- 1. KONFIGURASI UTAMA ---
const URL_API = "https://script.google.com/macros/s/AKfycbwyOa1OfrMdU9GC__OyV2x_pI4OX0sgdShxGDsPNWGE1eNd73HuU-YPb8w7RnvFf7g/exec";

let senaraiGuruCloud = [];
let dbMuridCloud = [];

// --- 2. FUNGSI SYNC DATA (TARIK DARI SHEETS) ---
function syncSemuaData() {
    console.log("Sedang menarik data dari Google Sheets...");
    fetch(URL_API)
        .then(response => response.json())
        .then(data => {
            senaraiGuruCloud = data.guru;
            dbMuridCloud = data.murid;
            console.log("Data Guru & Murid Berjaya Disinkronkan!");
        })
        .catch(err => console.error("Ralat Sinkronisasi:", err));
}

// Jalankan sync setiap kali website dibuka
syncSemuaData();

// --- 3. FUNGSI LOG MASUK (GURU & HOST) ---
function login(role) {
    if(role === 'host') {
        let email = document.getElementById('login-host-email').value;
        let pass = document.getElementById('login-host-pass').value;
        // Password Host Tetap
        if(email === "hostsemsira@gmail.com" && pass === "Semsira1969") {
            setupNav('host'); showPage('page-dashboard-host'); switchMenu('tetapan', 'host');
        } else alert("Akses Host Ditolak!");
    } else {
        let email = document.getElementById('login-guru-email').value;
        let pass = document.getElementById('login-guru-pass').value;
        
        // Cari guru dalam data yang ditarik dari Sheets
        let g = senaraiGuruCloud.find(x => x.email === email && String(x.pass) === String(pass));
        
        if(g) {
            currentUser = g; 
            document.getElementById('guru-name-display').innerText = g.name;
            setupNav('guru'); showPage('page-dashboard-guru'); switchMenu('uruskehadiran', 'guru');
        } else {
            alert("E-mel atau Kata Laluan Salah! Jika anda baru daftar, sila refresh website dalam 10 saat.");
        }
    }
}

// --- 4. FUNGSI DAFTAR GURU (SIMPAN KE TAB GURU) ---
function registerGuru() {
    let n = document.getElementById('reg-name').value;
    let t = document.getElementById('reg-tel').value; 
    let e = document.getElementById('reg-email').value;
    let p = document.getElementById('reg-pass').value;

    if(n && e && p) {
        const dataGuru = {
            jenis: "guru",
            nama: n,
            notel: t,
            email: e,
            password: p
        };

        fetch(URL_API, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(dataGuru)
        }).then(() => {
            alert("Pendaftaran Berjaya! Sila tunggu 10 saat sebelum Log Masuk.");
            setTimeout(syncSemuaData, 5000); // Tarik data baru selepas 5 saat
            showPage('page-login-guru');
        });
    } else {
        alert("Sila lengkapkan semua maklumat!");
    }
}

// --- 5. FUNGSI IMBAS RFID (SIMPAN KE TAB SHEET1) ---
function processRFID(uid) {
    const today = getLocalSystemDate();
    const rfidInput = document.getElementById('rfid-listener');
    
    // Reset input rfid dengan cepat
    rfidInput.value = ''; 
    setTimeout(() => rfidInput.focus(), 50);

    const now = new Date();
    const h = now.getHours();
    const min = now.getMinutes();
    
    // Logik Hadir/Lewat (Contoh: Lewat selepas 7:40 AM)
    let stat = (h > 7 || (h === 7 && min > 40)) ? 'Lewat' : 'Hadir'; 
    const cleanUID = uid.trim().toUpperCase();

    // Cari murid dalam data yang ditarik dari tab 'Murid' di Sheets
    const m = dbMuridCloud.find(x => x.uid.toUpperCase() === cleanUID);
    
    if(m) {
        let masaSekarang = getLocalSystemTime();

        // Sediakan data untuk dihantar ke Tab Sheet1
        const dataKeSheets = {
            jenis: "kehadiran",
            tarikh: today,
            nama: m.nama,
            status: stat,
            masa: masaSekarang,
            uid: cleanUID,
            ic: m.ic // Data IC dari Sheets
        };

        // Hantar ke Google Sheets (Tab Sheet1)
        fetch(URL_API, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(dataKeSheets)
        });

        // Paparan Keputusan pada Skrin
        document.getElementById('scan-name').innerText = m.nama; 
        document.getElementById('scan-status-text').innerText = stat; 
        document.getElementById('scan-status-text').style.color = stat === 'Lewat' ? 'orange' : 'green';
        document.getElementById('scan-result').classList.remove('hidden'); 
        
        // Sembunyikan result selepas 3 saat
        setTimeout(() => document.getElementById('scan-result').classList.add('hidden'), 3000);
        
    } else {
        alert("Kad (UID: " + cleanUID + ") Tidak Dikenali! Sila daftar di tab Murid Google Sheets.");
    }
}

// --- FUNGSI START SCAN ---
function startScanMode() { 
    showPage('page-scan'); 
    const rfidInput = document.getElementById('rfid-listener');
    rfidInput.value = '';
    setTimeout(() => rfidInput.focus(), 100); 
    
    document.getElementById('page-scan').onclick = function() {
        rfidInput.focus();
    };
}

function handleScanInput(e) { 
    if(e.key === 'Enter' && e.target.value.trim()){ 
        processRFID(e.target.value); 
    } 
}
