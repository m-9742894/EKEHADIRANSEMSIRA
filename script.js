// --- KONFIGURASI DATABASE GOOGLE ---
const URL_API = "https://script.google.com/macros/s/AKfycbwyOa1OfrMdU9GC__OyV2x_pI4OX0sgdShxGDsPNWGE1eNd73HuU-YPb8w7RnvFf7g/exec";

let senaraiGuruCloud = [];

// 1. Fungsi Tarik Data Guru (Bila web dibuka, dia terus kenal siapa yang dah daftar)
function syncGuruData() {
    fetch(URL_API)
        .then(response => response.json())
        .then(data => {
            senaraiGuruCloud = data;
            console.log("Data Guru Berjaya Disinkronkan!");
        })
        .catch(err => console.error("Ralat Sync Guru:", err));
}

// Jalankan sync setiap kali web dibuka
syncGuruData();

// 2. Fungsi Hantar Data (Untuk Kehadiran & Pendaftaran Guru)
function hantarKeCloud(dataData) {
    fetch(URL_API, {
        method: 'POST',
        mode: 'no-cors', 
        cache: 'no-cache',
        body: JSON.stringify(dataData)
    })
    .then(() => console.log("Data Berjaya Dihantar ke Cloud!"))
    .catch(err => console.error("Ralat Cloud:", err));
}

// --- FUNGSI LOGIN ---
function login(role) {
    if(role === 'host') {
        let email = document.getElementById('login-host-email').value;
        let pass = document.getElementById('login-host-pass').value;
        if(email === "hostsemsira@gmail.com" && pass === "Semsira1969") {
            setupNav('host'); showPage('page-dashboard-host'); switchMenu('tetapan', 'host');
        } else alert("Akses Host Ditolak!");
    } else {
        let email = document.getElementById('login-guru-email').value;
        let pass = document.getElementById('login-guru-pass').value;
        
        // Semak dalam senarai dari Google Sheets
        let g = senaraiGuruCloud.find(x => x.email === email && String(x.pass) === String(pass));
        
        if(g) {
            currentUser = g; 
            document.getElementById('guru-name-display').innerText = g.name;
            setupNav('guru'); showPage('page-dashboard-guru'); switchMenu('uruskehadiran', 'guru');
        } else {
            alert("E-mel atau Kata Laluan Salah! Jika baru daftar, tunggu 10 saat dan refresh.");
            syncGuruData();
        }
    }
}

// --- FUNGSI DAFTAR GURU ---
function registerGuru() {
    let n = document.getElementById('reg-name').value;
    let e = document.getElementById('reg-email').value;
    let p = document.getElementById('reg-pass').value;
    let t = document.getElementById('reg-tel').value; 

    if(n && e && p) {
        const dataGuru = {
            jenis: "guru",
            nama: n,
            email: e,
            password: p,
            notel: t
        };

        hantarKeCloud(dataGuru);
        alert("Pendaftaran Berjaya Dihantar! Sila tunggu sebentar sebelum Log Masuk.");
        setTimeout(syncGuruData, 3000); // Sync balik selepas 3 saat
        showPage('page-login-guru');
    } else {
        alert("Sila isi semua maklumat!");
    }
}

// --- SCANNER UI ---
function startScanMode() { 
    showPage('page-scan'); 
    
    const today = getLocalSystemDate();
    const cutiHariIni = db.cuti.find(c => c.tarikh === today);
    const rfidInput = document.getElementById('rfid-listener');
    const scanTutupMsg = document.getElementById('scan-tutup-msg');
    const scanBukaIcon = document.getElementById('scan-buka-icon');
    const scanTitle = document.getElementById('scan-title');
    const scanResult = document.getElementById('scan-result');
    const scanSub = document.getElementById('scan-sub');
    
    if(cutiHariIni) {
        rfidInput.classList.add('hidden');
        scanBukaIcon.classList.add('hidden');
        scanTitle.classList.add('hidden');
        scanResult.classList.add('hidden');
        scanSub.classList.add('hidden');
        
        scanTutupMsg.innerHTML = `
            <i class="fas fa-calendar-times" style="font-size: 5rem; color: var(--danger); margin-bottom: 20px;"></i>
            <h2 style="color: var(--danger);">MAAF, RFID DITUTUP</h2>
            <h3 style="margin-top:10px; color: var(--warning);">BAGI CUTI: ${cutiHariIni.nama.toUpperCase()}</h3>
        `;
        scanTutupMsg.classList.remove('hidden');
    } else {
        rfidInput.classList.remove('hidden');
        scanBukaIcon.classList.remove('hidden');
        scanTitle.classList.remove('hidden');
        scanSub.classList.remove('hidden');
        scanTutupMsg.classList.add('hidden');
        
        rfidInput.value = '';
        setTimeout(() => rfidInput.focus(), 100); 
        
        document.getElementById('page-scan').onclick = function() {
            rfidInput.focus();
        };
    }
}

function handleScanInput(e) { 
    if(e.key === 'Enter' && e.target.value.trim()){ 
        processRFID(e.target.value); 
    } 
}

function processRFID(uid) {
    const today = getLocalSystemDate();
    const rfidInput = document.getElementById('rfid-listener');
    
    if(db.cuti.find(c => c.tarikh === today)) {
        alert("Sistem ditutup untuk hari cuti.");
        rfidInput.value = '';
        rfidInput.focus();
        return;
    }

    rfidInput.value = ''; 
    setTimeout(() => rfidInput.focus(), 50);

    const now = new Date();
    const h = now.getHours();
    const min = now.getMinutes();
    
    let stat = (h > 7 || (h === 7 && min > 40)) ? 'Lewat' : 'Hadir'; 
    const cleanUID = uid.trim().toUpperCase();
    const m = db.murid.find(x => x.uid.toUpperCase() === cleanUID);
    
    if(m) {
        let r = m.kehadiran.find(x => x.tarikh === today);
        let masaSekarang = getLocalSystemTime();

        if(!r) {
            // 1. Simpan Lokal (Pantas)
            m.kehadiran.push({
                tarikh: today, 
                status: stat, 
                masa: masaSekarang
            }); 

            // 2. Simpan Cloud (Kekal)
            const dataKeSheets = {
                jenis: "kehadiran",
                tarikh: today,
                nama: m.nama,
                status: stat,
                masa: masaSekarang,
                uid: cleanUID
            };
            hantarKeCloud(dataKeSheets);

        } else {
            stat = r.status;
        }
        
        document.getElementById('scan-name').innerText = m.nama; 
        document.getElementById('scan-status-text').innerText = stat; 
        document.getElementById('scan-status-text').style.color = stat === 'Lewat' ? 'var(--warning)' : 'var(--success)';
        document.getElementById('scan-result').classList.remove('hidden'); 
        
        setTimeout(() => document.getElementById('scan-result').classList.add('hidden'), 3000);
    } else {
        alert("Kad Tidak Dikenali! Sila daftarkan UID murid di dalam pangkalan data.");
    }
}
