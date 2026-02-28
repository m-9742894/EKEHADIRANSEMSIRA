// --- 1. KONFIGURASI FIREBASE CIkGU ---
const BASE_URL = "https://semsira-3c634-default-rtdb.asia-southeast1.firebasedatabase.app/";

let dataGuruCloud = {};
let dataMuridCloud = {};

// --- 2. FUNGSI TARIK DATA (SYNC) ---
// Fungsi ni akan tarik data Guru & Murid supaya website kenal siapa yang boleh login/scan
function syncData() {
    fetch(BASE_URL + ".json")
        .then(res => res.json())
        .then(data => {
            if(data) {
                dataGuruCloud = data.guru || {};
                dataMuridCloud = data.murid || {};
                console.log("Data Cloud Berjaya Dikemaskini!");
            }
        })
        .catch(err => console.error("Ralat Sync:", err));
}

// Jalankan sync sebaik web dibuka
syncData();

// --- 3. FUNGSI DAFTAR GURU ---
function registerGuru() {
    let n = document.getElementById('reg-name').value;
    let t = document.getElementById('reg-tel').value; 
    let e = document.getElementById('reg-email').value;
    let p = document.getElementById('reg-pass').value;

    if(n && e && p) {
        let newGuru = { nama: n, tel: t, email: e, pass: p };
        
        // Simpan ke Firebase (Node Guru)
        fetch(BASE_URL + "guru.json", {
            method: 'POST',
            body: JSON.stringify(newGuru)
        }).then(() => {
            alert("Pendaftaran Guru Berjaya Disimpan ke Cloud!");
            syncData(); // Tarik data baru
            showPage('page-login-guru');
        });
    } else {
        alert("Sila isi semua maklumat!");
    }
}

// --- 4. FUNGSI LOG MASUK GURU ---
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
        
        // Semak dalam dataGuruCloud (Firebase)
        let found = Object.values(dataGuruCloud).find(g => g.email === email && String(g.pass) === String(pass));
        
        if(found) {
            currentUser = found; 
            document.getElementById('guru-name-display').innerText = found.nama;
            setupNav('guru'); showPage('page-dashboard-guru'); switchMenu('uruskehadiran', 'guru');
        } else {
            alert("E-mel atau Kata Laluan Salah! Cuba lagi.");
        }
    }
}

// --- 5. FUNGSI IMBAS RFID (KEHADIRAN) ---
function processRFID(uid) {
    const today = getLocalSystemDate(); // Guna fungsi date sedia ada cikgu
    const cleanUID = uid.trim().toUpperCase();
    const rfidInput = document.getElementById('rfid-listener');
    
    rfidInput.value = ''; 
    setTimeout(() => rfidInput.focus(), 50);

    // Cari murid dalam list (Cikgu boleh tambah murid manual kat Firebase Console dulu)
    // Kalau tak jumpa murid, kita tetap simpan tapi letak nama "Pelawat/Unknown"
    let m = Object.values(dataMuridCloud).find(x => x.uid.toUpperCase() === cleanUID);
    
    let namaMurid = m ? m.nama : "KAD TIDAK DIKENALI ("+cleanUID+")";
    let icMurid = m ? m.ic : "-";
    
    const now = new Date();
    let stat = (now.getHours() > 7 || (now.getHours() === 7 && now.getMinutes() > 40)) ? 'Lewat' : 'Hadir';
    let masaSekarang = getLocalSystemTime();

    let dataScan = {
        tarikh: today,
        nama: namaMurid,
        ic: icMurid,
        status: stat,
        masa: masaSekarang,
        uid: cleanUID
    };

    // Simpan Kehadiran ke Firebase (Node Kehadiran)
    fetch(BASE_URL + "kehadiran.json", {
        method: 'POST',
        body: JSON.stringify(dataScan)
    }).then(() => {
        document.getElementById('scan-name').innerText = namaMurid; 
        document.getElementById('scan-status-text').innerText = stat; 
        document.getElementById('scan-status-text').style.color = stat === 'Lewat' ? 'orange' : 'green';
        document.getElementById('scan-result').classList.remove('hidden'); 
        setTimeout(() => document.getElementById('scan-result').classList.add('hidden'), 3000);
    });
}
