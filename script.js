// --- KONFIGURASI DATABASE GOOGLE ---
const URL_API = "https://script.google.com/macros/s/AKfycbwyOa1OfrMdU9GC__OyV2x_pI4OX0sgdShxGDsPNWGE1eNd73HuU-YPb8w7RnvFf7g/exec";

// Fungsi untuk hantar data ke Google Sheets
function hantarKeGoogleSheets(dataMurid) {
    fetch(URL_API, {
        method: 'POST',
        mode: 'no-cors', // Penting untuk mengelakkan ralat CORS dengan Google Script
        cache: 'no-cache',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataMurid)
    })
    .then(() => console.log("Data berjaya dihantar ke Google Sheets!"))
    .catch(err => console.error("Ralat penghantaran:", err));
}

// --- SCANNER UI (DIKEMASKINI) ---
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
            // 1. Simpan dalam Memori Browser (Local)
            m.kehadiran.push({
                tarikh: today, 
                status: stat, 
                masa: masaSekarang
            }); 

            // 2. HANTAR KE GOOGLE SHEETS (Database Kekal)
            const dataKeSheets = {
                tarikh: today,
                nama: m.nama,
                status: stat,
                masa: masaSekarang,
                uid: cleanUID
            };
            hantarKeGoogleSheets(dataKeSheets);

        } else {
            stat = r.status;
        }
        
        document.getElementById('scan-name').innerText = m.nama; 
        document.getElementById('scan-status-text').innerText = stat; 
        document.getElementById('scan-status-text').style.color = stat === 'Lewat' ? 'var(--warning)' : 'var(--success)';
        document.getElementById('scan-result').classList.remove('hidden'); 
        
        setTimeout(() => document.getElementById('scan-result').classList.add('hidden'), 3000);
    } else {
        alert("Kad Tidak Dikenali! Sila daftarkan UID kad ini terlebih dahulu.");
    }
}
