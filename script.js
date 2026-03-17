// js/app.js

// ==================== DATABASE ====================
let db = {
    host: { email: 'hostsemsira@gmail.com', pass: 'Semsira1969' },
    gurus: [{ id: 1, name: 'Ahmad Albab', phone: '0123456789', email: 'ahmad@semsira.edu.my', pass: '123' }],
    kelas: [
        { id: 1, name: '5 Sains 1', guruId: 1 },
        { id: 2, name: '4 Sains 1', guruId: 1 }
    ],
    murid: [
        { 
            id: 1, 
            nama: 'Ali bin Abu', 
            ic: '080101015563', 
            uid: 'A1B2C3D4', 
            kelasId: 1, 
            sejarahKelas: [{tahun: '2025', kelasId: 2}, {tahun: '2026', kelasId: 1}], 
            kehadiran: [
                {tarikh:'2025-05-15', status:'Hadir', masa:'07:15:00'},
                {tarikh:'2026-02-28', status:'Hadir', masa:'07:20:00'}
            ] 
        },
        { 
            id: 2, 
            nama: 'Siti Aminah', 
            ic: '080202026654', 
            uid: 'E5F6G7H8', 
            kelasId: 1, 
            sejarahKelas: [{tahun: '2026', kelasId: 1}], 
            kehadiran: [
                {tarikh:'2026-02-28', status:'Lewat', masa:'07:45:00'}
            ] 
        }
    ],
    hariOperasi: 10, 
    cuti: [],
    tetapanWaktu: { buka: '06:30', lewat: '07:30', tutup: '14:00' }
};

let currentUser = null; 
let currentClassDetailId = null; 
let charts = { hostOverall: null, hostKelas: null, hostStudent: null, guruOverall: null };

// ==================== UTILITY FUNCTIONS ====================
const getLocalSystemDate = () => { 
    const now = new Date(); 
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; 
};

const getLocalSystemTime = () => { 
    const now = new Date(); 
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`; 
};

const getCurrentYear = () => { 
    return new Date().getFullYear().toString(); 
};

function showPage(pageId) {
    document.querySelectorAll('.container').forEach(el => el.classList.add('hidden'));
    const page = document.getElementById(pageId);
    if (page) page.classList.remove('hidden');
}

function logout() { 
    currentUser = null; 
    window.location.href = 'index.html'; 
}

// ==================== NAVIGATION FUNCTIONS ====================
function setupHostNav() { 
    const navMenus = document.getElementById('nav-menus');
    if (navMenus) {
        navMenus.innerHTML = `
            <button onclick="switchMenu('statistik', 'host')">Keseluruhan</button>
            <button onclick="switchMenu('kelas-stats', 'host')">Kehadiran Kelas</button>
            <button onclick="switchMenu('datamurid', 'host')">Carian Murid</button>
            <button onclick="switchMenu('guru', 'host')">Urus Data</button>
            <button onclick="switchMenu('sejarah', 'host')">Sejarah</button>
            <button onclick="switchMenu('tetapan', 'host')">Tetapan</button>
            <button onclick="logout()" style="color:var(--danger);">Keluar</button>
        `;
    }
}

function setupGuruNav() { 
    const navMenus = document.getElementById('nav-menus');
    if (navMenus) {
        navMenus.innerHTML = `
            <button onclick="switchMenu('profil', 'guru')"><i class="fas fa-user"></i> Profil</button>
            <button onclick="switchMenu('kelassaya', 'guru')">Kelas Saya</button>
            <button onclick="switchMenu('semuakelas', 'guru')">Kehadiran Kelas</button>
            <button onclick="switchMenu('carian', 'guru')">Carian Murid</button>
            <button onclick="switchMenu('keseluruhan', 'guru')">Keseluruhan</button>
            <button onclick="switchMenu('uruskehadiran', 'guru')">Urus Kehadiran</button>
            <button onclick="switchMenu('sejarah', 'guru')">Sejarah</button>
            <button onclick="logout()" style="color:var(--danger);">Keluar</button>
        `;
    }
}

function switchMenu(menuId, roleType = 'guru') {
    document.querySelectorAll(`.${roleType}-menu`).forEach(el => el.classList.add('hidden'));
    
    const menuElement = document.getElementById(`menu-${roleType}-${menuId}`);
    if (menuElement) menuElement.classList.remove('hidden');
    
    if(roleType === 'host') {
        if(menuId === 'statistik') { 
            const dateInput = document.getElementById('host-overall-date');
            if (dateInput) dateInput.value = getLocalSystemDate(); 
            renderHostStatistik(); 
        }
        if(menuId === 'kelas-stats') { 
            const dateInput = document.getElementById('host-kelas-date');
            if (dateInput) dateInput.value = getLocalSystemDate(); 
            renderHostKelasStats(); 
        }
        if(menuId === 'datamurid') renderDataMurid(); 
        if(menuId === 'guru') renderHostGuru(); 
        if(menuId === 'tetapan') renderTetapan();
        if(menuId === 'sejarah') renderDropdownSejarah('host');
    } else if(roleType === 'guru') { 
        if(menuId === 'profil') renderGuruProfil();
        if(menuId === 'kelassaya') renderGuruKelasSaya();
        if(menuId === 'semuakelas') { 
            const dateInput = document.getElementById('guru-kelas-date');
            if (dateInput) dateInput.value = getLocalSystemDate(); 
            renderGuruSemuaKelas(); 
        }
        if(menuId === 'carian') renderCarianGuruMenu();
        if(menuId === 'keseluruhan') { 
            const dateInput = document.getElementById('guru-overall-date');
            if (dateInput) dateInput.value = getLocalSystemDate(); 
            renderGuruKeseluruhan(); 
        }
        if(menuId === 'uruskehadiran') { 
            const dateInput = document.getElementById('guru-myclass-date');
            if (dateInput) dateInput.value = getLocalSystemDate(); 
            renderGuruKehadiranKelasSaya(); 
        }
        if(menuId === 'sejarah') renderDropdownSejarah('guru');
    }
}

function kembaliKeHostMenu(menuId) { 
    window.location.href = 'dashboard-host.html';
}

// ==================== AUTHENTICATION FUNCTIONS ====================
function loginGuru() {
    const email = document.getElementById('login-guru-email')?.value;
    const pass = document.getElementById('login-guru-pass')?.value;
    const guru = db.gurus.find(x => x.email === email && x.pass === pass);
    
    if(guru) { 
        currentUser = guru; 
        localStorage.setItem('currentUser', JSON.stringify(guru));
        window.location.href = 'dashboard-guru.html'; 
    } else { 
        alert("Emel atau kata laluan guru salah!");
    }
}

function loginHost() {
    const email = document.getElementById('login-host-email')?.value;
    const pass = document.getElementById('login-host-pass')?.value;
    
    if(email === db.host.email && pass === db.host.pass) {
        currentUser = { role: 'host' };
        localStorage.setItem('currentUser', JSON.stringify({ role: 'host' }));
        window.location.href = 'dashboard-host.html';
    } else {
        alert("Emel atau Kata Laluan Host Salah!");
    }
}

function registerGuru() { 
    const name = document.getElementById('reg-name')?.value;
    const phone = document.getElementById('reg-phone')?.value;
    const email = document.getElementById('reg-email')?.value;
    const pass = document.getElementById('reg-pass')?.value;
    
    if(name && email && pass) { 
        db.gurus.push({
            id: Date.now(), 
            name: name, 
            phone: phone, 
            email: email, 
            pass: pass
        }); 
        alert("Pendaftaran Berjaya! Sila log masuk."); 
        window.location.href = 'login-guru.html'; 
    } else {
        alert("Sila isi semua maklumat!");
    }
}

// ==================== GURU FUNCTIONS ====================
function renderGuruProfil() { 
    if (!currentUser) {
        const saved = localStorage.getItem('currentUser');
        if (saved) currentUser = JSON.parse(saved);
    }
    
    const nameInput = document.getElementById('pg-name');
    const phoneInput = document.getElementById('pg-phone');
    const emailInput = document.getElementById('pg-email');
    const passInput = document.getElementById('pg-pass');
    
    if (nameInput) nameInput.value = currentUser?.name || '';
    if (phoneInput) phoneInput.value = currentUser?.phone || '';
    if (emailInput) emailInput.value = currentUser?.email || '';
    if (passInput) passInput.value = currentUser?.pass || '';
    
    const nameDisplay = document.getElementById('guru-name-display');
    if (nameDisplay) nameDisplay.innerText = currentUser?.name || '';
}

function simpanProfilGuru() { 
    if (!currentUser) return;
    
    currentUser.name = document.getElementById('pg-name')?.value || currentUser.name;
    currentUser.phone = document.getElementById('pg-phone')?.value || currentUser.phone;
    currentUser.email = document.getElementById('pg-email')?.value || currentUser.email;
    currentUser.pass = document.getElementById('pg-pass')?.value || currentUser.pass;
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    const nameDisplay = document.getElementById('guru-name-display');
    if (nameDisplay) nameDisplay.innerText = currentUser.name;
    
    alert("Profil berjaya dikemaskini!"); 
}

function renderGuruKelasSaya() { 
    const container = document.getElementById('pg-kelas-container'); 
    if (!container) return;
    
    container.innerHTML = ''; 
    
    const kelasGuru = db.kelas.filter(k => k.guruId === currentUser?.id); 
    
    if(kelasGuru.length === 0) { 
        container.innerHTML = `
            <p style="color:var(--warning); margin-bottom:10px;">Anda belum mempunyai kelas.</p>
            <input type="text" id="pg-add-kelas-name" class="inline-input no-print" placeholder="Masukkan Nama Kelas (Cth: 5 Sains)">
            <button class="btn btn-success no-print" onclick="pgTambahKelas()">Tambah Kelas</button>
        `; 
        return; 
    } 
    
    kelasGuru.forEach(k => { 
        let html = `
            <div class="sub-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <div style="display:flex; align-items:center;">
                        <input type="text" id="pg-edit-kelas-${k.id}" value="${k.name}" class="inline-input" style="font-size:1.2rem; font-weight:bold; color:var(--primary); width:200px;">
                        <button class="btn no-print" style="padding: 5px 10px;" onclick="pgSimpanNamaKelas(${k.id})">
                            <i class="fas fa-save"></i>
                        </button>
                    </div>
                    <button class="btn btn-danger no-print" onclick="pgBuangKelas(${k.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                <div class="no-print" style="background:#0f172a; padding:15px; border-radius:5px; margin-bottom:15px; border:1px dashed var(--primary);">
                    <input type="text" id="pg-add-m-n-${k.id}" class="inline-input" placeholder="Nama Penuh">
                    <input type="text" id="pg-add-m-ic-${k.id}" class="inline-input" placeholder="No IC">
                    <input type="text" id="pg-add-m-u-${k.id}" class="inline-input" placeholder="UID">
                    <button class="btn btn-success" onclick="pgTambahMurid(${k.id})">Tambah</button>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Nama</th>
                            <th>IC</th>
                            <th>UID</th>
                            <th class="no-print">Tindakan</th>
                        </tr>
                    </thead>
                    <tbody>
        `; 
        
        const muridKelas = db.murid.filter(m => m.kelasId === k.id); 
        
        if(muridKelas.length === 0) { 
            html += `<tr><td colspan="4" style="text-align:center;">Belum ada murid.</td></tr>`; 
        } else { 
            muridKelas.forEach(m => { 
                html += `
                    <tr>
                        <td><input type="text" id="pg-em-n-${m.id}" value="${m.nama}"></td>
                        <td><input type="text" id="pg-em-ic-${m.id}" value="${m.ic}"></td>
                        <td><input type="text" id="pg-em-u-${m.id}" value="${m.uid}"></td>
                        <td class="no-print">
                            <button class="btn btn-success" onclick="pgSimpanMurid(${m.id})"><i class="fas fa-save"></i></button>
                            <button class="btn btn-danger" onclick="pgBuangMurid(${m.id})"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `; 
            }); 
        } 
        
        container.innerHTML += html + `</tbody></table></div>`; 
    }); 
}

function pgTambahKelas() { 
    const nameInput = document.getElementById('pg-add-kelas-name');
    if (!nameInput) return;
    
    const name = nameInput.value; 
    if(name) { 
        db.kelas.push({
            id: Date.now(), 
            name: name, 
            guruId: currentUser?.id
        }); 
        renderGuruKelasSaya(); 
    } 
}

function pgSimpanNamaKelas(kId) { 
    const input = document.getElementById(`pg-edit-kelas-${kId}`);
    if (!input) return;
    
    const kelas = db.kelas.find(x => x.id === kId); 
    if (kelas) {
        kelas.name = input.value; 
        alert("Nama kelas disimpan!"); 
    }
}

function pgBuangKelas(kId) { 
    if(confirm("Pasti mahu buang?")) { 
        db.kelas = db.kelas.filter(x => x.id !== kId); 
        db.murid = db.murid.filter(x => x.kelasId !== kId); 
        renderGuruKelasSaya(); 
    } 
}

function pgTambahMurid(kId) { 
    const nameInput = document.getElementById(`pg-add-m-n-${kId}`);
    const icInput = document.getElementById(`pg-add-m-ic-${kId}`);
    const uidInput = document.getElementById(`pg-add-m-u-${kId}`);
    
    if (!nameInput || !icInput) return;
    
    const name = nameInput.value;
    const ic = icInput.value;
    const uid = uidInput ? uidInput.value : '';
    
    if(name && ic) { 
        db.murid.push({
            id: Date.now(), 
            nama: name, 
            ic: ic, 
            uid: uid, 
            kelasId: kId, 
            sejarahKelas: [{tahun: getCurrentYear(), kelasId: kId}], 
            kehadiran: []
        }); 
        renderGuruKelasSaya(); 
    } 
}

function pgSimpanMurid(mId) { 
    const murid = db.murid.find(x => x.id === mId);
    if (!murid) return;
    
    const namaInput = document.getElementById(`pg-em-n-${mId}`);
    const icInput = document.getElementById(`pg-em-ic-${mId}`);
    const uidInput = document.getElementById(`pg-em-u-${mId}`);
    
    if (namaInput) murid.nama = namaInput.value; 
    if (icInput) murid.ic = icInput.value; 
    if (uidInput) murid.uid = uidInput.value; 
    
    alert("Maklumat murid disimpan!"); 
}

function pgBuangMurid(mId) { 
    if(confirm("Pasti?")) { 
        db.murid = db.murid.filter(x => x.id !== mId); 
        renderGuruKelasSaya(); 
    } 
}

function renderGuruSemuaKelas() { 
    const container = document.getElementById('guru-semuakelas-grid'); 
    if (!container) return;
    
    container.innerHTML = ''; 
    const dateInput = document.getElementById('guru-kelas-date');
    const date = dateInput ? dateInput.value : getLocalSystemDate(); 
    
    db.kelas.forEach(k => { 
        const mk = db.murid.filter(m => m.kelasId === k.id); 
        let h = 0; 
        mk.forEach(m => { 
            if(m.kehadiran.some(r => r.tarikh === date)) h++; 
        }); 
        const prct = mk.length === 0 ? 0 : Math.round((h/mk.length)*100); 
        
        container.innerHTML += `
            <div class="card clickable-row" style="text-align:center; border: 1px solid var(--primary);" onclick="paparKelasDetail(${k.id}, '${date}')">
                <h2 style="color:var(--primary);">${k.name}</h2>
                <div style="font-size:2rem; font-weight:bold; margin: 10px 0;">${prct}%</div>
                <p>Hadir: ${h}/${mk.length}</p>
            </div>
        `; 
    }); 
}

function renderCarianGuruMenu() { 
    const selectKelas = document.getElementById('pg-carian-kelas'); 
    if (!selectKelas) return;
    
    selectKelas.innerHTML = '<option value="">Semua Kelas</option>'; 
    db.kelas.forEach(k => { 
        selectKelas.innerHTML += `<option value="${k.id}">${k.name}</option>`; 
    }); 
    carianMuridGuru(); 
}

function carianMuridGuru() { 
    const teksCarianInput = document.getElementById('pg-carian-nama');
    const idKelasSelect = document.getElementById('pg-carian-kelas');
    const jadual = document.querySelector('#pg-jadual-carian tbody');
    
    if (!teksCarianInput || !idKelasSelect || !jadual) return;
    
    const teksCarian = teksCarianInput.value.toLowerCase(); 
    const idKelas = idKelasSelect.value; 
    
    jadual.innerHTML = ''; 
    
    let hasilCarian = db.murid.filter(m => { 
        let padanNamaIC = m.nama.toLowerCase().includes(teksCarian) || m.ic.includes(teksCarian); 
        let padanKelas = idKelas === "" ? true : (m.kelasId.toString() === idKelas); 
        return padanNamaIC && padanKelas; 
    }); 
    
    if (hasilCarian.length === 0) { 
        jadual.innerHTML = '<tr><td colspan="4" style="text-align:center;">Tiada rekod.</td></tr>'; 
        return; 
    } 
    
    hasilCarian.forEach(m => { 
        const k = db.kelas.find(x => x.id === m.kelasId); 
        jadual.innerHTML += `
            <tr class="clickable-row">
                <td>${m.nama}</td>
                <td>${m.ic}</td>
                <td>${k ? k.name : '-'}</td>
                <td class="no-print">
                    <button class="btn btn-primary" onclick="window.location.href='student-detail.html?id=${m.id}'">
                        <i class="fas fa-eye"></i> Profil
                    </button>
                </td>
            </tr>
        `; 
    }); 
}

function renderGuruKeseluruhan() { 
    const dateInput = document.getElementById('guru-overall-date');
    const date = dateInput ? dateInput.value : getLocalSystemDate(); 
    
    let h = 0, l = 0, th = 0; 
    let lstH = [], lstL = [], lstTH = []; 
    
    db.murid.forEach(m => { 
        const r = m.kehadiran.find(x => x.tarikh === date); 
        if(r) { 
            if(r.status === 'Lewat') { 
                l++; 
                lstL.push(`<li><span class="clickable-text" onclick="window.location.href='student-detail.html?id=${m.id}'">${m.nama}</span></li>`); 
            } else { 
                h++; 
                lstH.push(`<li><span class="clickable-text" onclick="window.location.href='student-detail.html?id=${m.id}'">${m.nama}</span></li>`); 
            } 
        } else { 
            th++; 
            lstTH.push(`<li><span class="clickable-text" onclick="window.location.href='student-detail.html?id=${m.id}'">${m.nama}</span></li>`); 
        } 
    }); 
    
    // Update chart
    const canvas = document.getElementById('guruOverallChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if(charts.guruOverall) charts.guruOverall.destroy(); 
        
        charts.guruOverall = new Chart(ctx, { 
            type: 'bar', 
            data: {
                labels: ['Hadir', 'Lewat', 'Tak Hadir'], 
                datasets: [{
                    data: [h, l, th], 
                    backgroundColor: ['#22c55e', '#f59e0b', '#ef4444']
                }]
            }, 
            options: {
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } }, 
                scales: {
                    y: { ticks: { color: '#fff', stepSize: 1 } }, 
                    x: { ticks: { color: '#fff' } }
                }
            }
        });
    }
    
    const hadirList = document.getElementById('guru-list-hadir');
    const lewatList = document.getElementById('guru-list-lewat');
    const takhadirList = document.getElementById('guru-list-takhadir');
    
    if (hadirList) hadirList.innerHTML = lstH.join('') || 'Tiada'; 
    if (lewatList) lewatList.innerHTML = lstL.join('') || 'Tiada'; 
    if (takhadirList) takhadirList.innerHTML = lstTH.join('') || 'Tiada'; 
}

function renderGuruKehadiranKelasSaya() { 
    const container = document.getElementById('pg-myclass-container'); 
    if (!container) return;
    
    container.innerHTML = ''; 
    
    const dateInput = document.getElementById('guru-myclass-date');
    const date = dateInput ? dateInput.value : getLocalSystemDate(); 
    
    if (!currentUser) return;
    
    const kelasGuru = db.kelas.filter(k => k.guruId === currentUser.id); 
    
    if(kelasGuru.length === 0) { 
        container.innerHTML = '<p style="color:var(--warning);">Tiada kelas didaftarkan.</p>'; 
        return; 
    } 
    
    kelasGuru.forEach(k => { 
        const mk = db.murid.filter(m => m.kelasId === k.id); 
        let html = `
            <div class="sub-card">
                <h4 style="font-size:1.5rem; color:var(--primary); margin-bottom:15px;">${k.name}</h4>
                <table style="background:var(--panel-bg); width: 100%;">
                    <thead>
                        <tr>
                            <th>Nama Murid</th>
                            <th>Status Kehadiran</th>
                            <th class="no-print">Tindakan</th>
                        </tr>
                    </thead>
                    <tbody>
        `; 
        
        if(mk.length === 0) { 
            html += `<tr><td colspan="3" style="text-align:center;">Tiada murid.</td></tr>`; 
        } else { 
            mk.forEach(m => { 
                const r = m.kehadiran.find(x => x.tarikh === date); 
                let statT = r ? r.status : 'Belum Hadir'; 
                let statC = 'var(--danger)'; 
                
                if(r && r.status === 'Hadir') statC = 'var(--success)'; 
                if(r && r.status === 'Lewat') statC = 'var(--warning)'; 
                
                html += `
                    <tr>
                        <td><span class="clickable-text" onclick="window.location.href='student-detail.html?id=${m.id}'">${m.nama}</span></td>
                        <td style="color:${statC}; font-weight: bold;">${statT}</td>
                        <td class="no-print">
                            <button class="btn btn-warning" style="color:black; font-size: 0.8rem;" onclick="bukaOverride(${m.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        </td>
                    </tr>
                `; 
            }); 
        } 
        
        container.innerHTML += html + `</tbody></table></div>`; 
    }); 
}

// ==================== HOST FUNCTIONS ====================
function renderTetapan() { 
    const hariInput = document.getElementById('tetapan-hari');
    const waktuBuka = document.getElementById('tetapan-waktu-buka');
    const waktuLewat = document.getElementById('tetapan-waktu-lewat');
    const waktuTutup = document.getElementById('tetapan-waktu-tutup');
    const cutiUI = document.getElementById('senarai-cuti-ui');
    
    if (hariInput) hariInput.value = db.hariOperasi; 
    if (waktuBuka) waktuBuka.value = db.tetapanWaktu.buka;
    if (waktuLewat) waktuLewat.value = db.tetapanWaktu.lewat;
    if (waktuTutup) waktuTutup.value = db.tetapanWaktu.tutup;
    
    if (cutiUI) {
        cutiUI.innerHTML = ''; 
        db.cuti.forEach(c => { 
            cutiUI.innerHTML += `
                <li style="margin-bottom:8px;">
                    ${c.tarikh} - ${c.nama} 
                    <button class="btn btn-danger no-print" style="padding: 2px 5px; font-size:0.8rem; margin-left:10px;" onclick="buangCuti(${c.id})">
                        <i class="fas fa-times"></i>
                    </button>
                </li>
            `; 
        }); 
    }
}

function simpanHariOperasi() { 
    const hariInput = document.getElementById('tetapan-hari');
    if (hariInput) {
        db.hariOperasi = parseInt(hariInput.value) || 0; 
        alert("Jumlah hari operasi disimpan!"); 
    }
}

function simpanWaktuOperasi() {
    const waktuBuka = document.getElementById('tetapan-waktu-buka');
    const waktuLewat = document.getElementById('tetapan-waktu-lewat');
    const waktuTutup = document.getElementById('tetapan-waktu-tutup');
    
    if (waktuBuka) db.tetapanWaktu.buka = waktuBuka.value || '06:30';
    if (waktuLewat) db.tetapanWaktu.lewat = waktuLewat.value || '07:30';
    if (waktuTutup) db.tetapanWaktu.tutup = waktuTutup.value || '14:00';
    
    alert("Tetapan masa kehadiran telah dikemaskini!");
}

function tambahCuti() { 
    const dateInput = document.getElementById('tambah-cuti-date');
    const namaInput = document.getElementById('tambah-cuti-nama');
    
    if (!dateInput || !namaInput) return;
    
    const date = dateInput.value;
    const name = namaInput.value;
    
    if(date && name) { 
        db.cuti.push({id: Date.now(), tarikh: date, nama: name}); 
        if (namaInput) namaInput.value = '';
        renderTetapan(); 
    } 
}

function buangCuti(id) { 
    db.cuti = db.cuti.filter(c => c.id !== id); 
    renderTetapan(); 
}

function renderHostStatistik() { 
    const dateInput = document.getElementById('host-overall-date');
    const date = dateInput ? dateInput.value : getLocalSystemDate(); 
    
    let h = 0, l = 0, th = 0; 
    let lstH = [], lstL = [], lstTH = []; 
    
    db.murid.forEach(m => { 
        const r = m.kehadiran.find(x => x.tarikh === date); 
        if(r) { 
            if(r.status === 'Lewat') { 
                l++; 
                lstL.push(`<li><span class="clickable-text" onclick="window.location.href='student-detail.html?id=${m.id}'">${m.nama}</span></li>`); 
            } else { 
                h++; 
                lstH.push(`<li><span class="clickable-text" onclick="window.location.href='student-detail.html?id=${m.id}'">${m.nama}</span></li>`); 
            } 
        } else { 
            th++; 
            lstTH.push(`<li><span class="clickable-text" onclick="window.location.href='student-detail.html?id=${m.id}'">${m.nama}</span></li>`); 
        } 
    }); 
    
    const canvas = document.getElementById('hostOverallChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if(charts.hostOverall) charts.hostOverall.destroy(); 
        
        charts.hostOverall = new Chart(ctx, { 
            type: 'bar', 
            data: {
                labels: ['Hadir', 'Lewat', 'Tak Hadir'], 
                datasets: [{
                    data: [h, l, th], 
                    backgroundColor: ['#22c55e', '#f59e0b', '#ef4444']
                }]
            }, 
            options: {
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } }, 
                scales: {
                    y: { ticks: { color: '#fff', stepSize: 1 } }, 
                    x: { ticks: { color: '#fff' } }
                }
            }
        });
    }
    
    const hadirList = document.getElementById('host-list-hadir');
    const lewatList = document.getElementById('host-list-lewat');
    const takhadirList = document.getElementById('host-list-takhadir');
    
    if (hadirList) hadirList.innerHTML = lstH.join('') || 'Tiada'; 
    if (lewatList) lewatList.innerHTML = lstL.join('') || 'Tiada'; 
    if (takhadirList) takhadirList.innerHTML = lstTH.join('') || 'Tiada'; 
}

function renderHostKelasStats() { 
    const container = document.getElementById('host-kelas-grid'); 
    if (!container) return;
    
    container.innerHTML = ''; 
    
    const dateInput = document.getElementById('host-kelas-date');
    const date = dateInput ? dateInput.value : getLocalSystemDate(); 
    
    db.kelas.forEach(k => { 
        const mk = db.murid.filter(m => m.kelasId === k.id); 
        let h = 0; 
        mk.forEach(m => { 
            if(m.kehadiran.some(r => r.tarikh === date)) h++; 
        }); 
        const prct = mk.length === 0 ? 0 : Math.round((h/mk.length)*100); 
        
        container.innerHTML += `
            <div class="card clickable-row" style="text-align:center; border: 1px solid var(--primary);" onclick="window.location.href='class-detail.html?id=${k.id}&date=${date}'">
                <h2 style="color:var(--primary);">${k.name}</h2>
                <div style="font-size:2rem; font-weight:bold; margin: 10px 0;">${prct}%</div>
                <p>Hadir: ${h}/${mk.length}</p>
            </div>
        `; 
    }); 
}

function renderDataMurid() { 
    const selectKelas = document.getElementById('carian-kelas'); 
    if (!selectKelas) return;
    
    selectKelas.innerHTML = '<option value="">Semua Kelas</option>'; 
    db.kelas.forEach(k => { 
        selectKelas.innerHTML += `<option value="${k.id}">${k.name}</option>`; 
    }); 
    carianMuridLaksana(); 
}

function carianMuridLaksana() { 
    const teksCarianInput = document.getElementById('carian-nama');
    const idKelasSelect = document.getElementById('carian-kelas');
    const jadual = document.querySelector('#jadual-carian-murid tbody');
    
    if (!teksCarianInput || !idKelasSelect || !jadual) return;
    
    const teksCarian = teksCarianInput.value.toLowerCase(); 
    const idKelas = idKelasSelect.value; 
    
    jadual.innerHTML = ''; 
    
    let hasilCarian = db.murid.filter(m => { 
        let padanNamaIC = m.nama.toLowerCase().includes(teksCarian) || m.ic.includes(teksCarian); 
        let padanKelas = idKelas === "" ? true : (m.kelasId.toString() === idKelas); 
        return padanNamaIC && padanKelas; 
    }); 
    
    if (hasilCarian.length === 0) { 
        jadual.innerHTML = '<tr><td colspan="4" style="text-align:center;">Tiada rekod.</td></tr>'; 
        return; 
    } 
    
    hasilCarian.forEach(m => { 
        const k = db.kelas.find(x => x.id === m.kelasId); 
        jadual.innerHTML += `
            <tr class="clickable-row">
                <td>${m.nama}</td>
                <td>${m.ic}</td>
                <td>${k ? k.name : '-'}</td>
                <td class="no-print">
                    <button class="btn btn-primary" onclick="window.location.href='student-detail.html?id=${m.id}'">
                        <i class="fas fa-chart-pie"></i> Profil
                    </button>
                </td>
            </tr>
        `; 
    }); 
}

function renderHostGuru() { 
    const tb = document.querySelector('#host-table-guru tbody'); 
    if (!tb) return;
    
    tb.innerHTML = ''; 
    
    db.gurus.forEach(g => {
        tb.innerHTML += `
            <tr class="clickable-row" onclick="window.location.href='teacher-detail.html?id=${g.id}'">
                <td><i class="fas fa-user-circle"></i> ${g.name}</td>
                <td>${g.phone || '-'}</td>
                <td>${g.email}</td>
                <td class="no-print"><button class="btn btn-primary no-print">Profil</button></td>
            </tr>
        `; 
    }); 
}

function tambahGuruHost() { 
    const nameInput = document.getElementById('add-g-name');
    const emailInput = document.getElementById('add-g-email');
    const phoneInput = document.getElementById('add-g-phone');
    const passInput = document.getElementById('add-g-pass');
    
    if (!nameInput || !emailInput) return;
    
    const name = nameInput.value;
    const email = emailInput.value;
    const phone = phoneInput ? phoneInput.value : '';
    const pass = passInput ? passInput.value : '';
    
    if(name && email) { 
        db.gurus.push({
            id: Date.now(), 
            name: name, 
            email: email, 
            phone: phone, 
            pass: pass
        }); 
        renderHostGuru(); 
        alert('Guru ditambah!'); 
    } 
}

// ==================== SCAN FUNCTIONS ====================
function startScanMode() { 
    window.location.href = 'scan.html';
}

function handleScanInput(e) { 
    if(e.key === 'Enter' && e.target.value.trim()){ 
        processRFID(e.target.value); 
    } 
}

function processRFID(uid) { 
    const today = getLocalSystemDate(); 
    const rfidInput = document.getElementById('rfid-listener'); 
    
    // Check for holidays
    if(db.cuti.find(c => c.tarikh === today)) { 
        alert("Sistem ditutup untuk hari cuti."); 
        if (rfidInput) {
            rfidInput.value = ''; 
            rfidInput.focus(); 
        }
        return; 
    } 
    
    // Get current time
    const now = new Date(); 
    const currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    
    // Check opening time
    if (currentTime < db.tetapanWaktu.buka) {
        alert("Sistem kehadiran belum dibuka. Waktu buka: " + db.tetapanWaktu.buka);
        if (rfidInput) {
            rfidInput.value = ''; 
            rfidInput.focus(); 
        }
        return;
    }

    // Check closing time
    if (currentTime > db.tetapanWaktu.tutup) {
        alert("Sistem kehadiran telah ditutup pada: " + db.tetapanWaktu.tutup);
        if (rfidInput) {
            rfidInput.value = ''; 
            rfidInput.focus(); 
        }
        return;
    }

    // Determine status
    let stat = (currentTime > db.tetapanWaktu.lewat) ? 'Lewat' : 'Hadir';

    if (rfidInput) {
        rfidInput.value = ''; 
        setTimeout(() => rfidInput.focus(), 50); 
    }
    
    const cleanUID = uid.trim().toUpperCase(); 
    const murid = db.murid.find(x => x.uid.toUpperCase() === cleanUID); 
    
    if(murid) { 
        let attendance = murid.kehadiran.find(x => x.tarikh === today); 
        if(!attendance) { 
            murid.kehadiran.push({tarikh: today, status: stat, masa: getLocalSystemTime()}); 
        } else { 
            stat = attendance.status;
        } 
        
        const scanName = document.getElementById('scan-name');
        const scanStatus = document.getElementById('scan-status-text');
        const scanResult = document.getElementById('scan-result');
        
        if (scanName) scanName.innerText = murid.nama; 
        if (scanStatus) {
            scanStatus.innerText = stat; 
            scanStatus.style.color = stat === 'Lewat' ? 'var(--warning)' : 'var(--success)'; 
        }
        if (scanResult) {
            scanResult.classList.remove('hidden'); 
            setTimeout(() => scanResult.classList.add('hidden'), 3000); 
        }
    } else { 
        alert("Kad Tidak Dikenali! Sila daftarkan UID kad ini terlebih dahulu."); 
    } 
}

// ==================== OVERRIDE MODAL FUNCTIONS ====================
function bukaOverride(mId) { 
    const murid = db.murid.find(x => x.id === mId);
    if (!murid) return;
    
    const ovrNama = document.getElementById('ovr-nama');
    const ovrId = document.getElementById('ovr-id');
    const ovrDate = document.getElementById('ovr-date');
    const modal = document.getElementById('modal-override');
    
    if (ovrNama) ovrNama.innerText = murid.nama; 
    if (ovrId) ovrId.value = mId; 
    if (ovrDate) ovrDate.value = getLocalSystemDate(); 
    if (modal) modal.classList.remove('hidden'); 
}

function simpanOverride() { 
    const ovrId = document.getElementById('ovr-id');
    const ovrDate = document.getElementById('ovr-date');
    const ovrStatus = document.getElementById('ovr-status');
    const ovrTime = document.getElementById('ovr-time');
    const modal = document.getElementById('modal-override');
    
    if (!ovrId || !ovrDate || !ovrStatus || !ovrTime) return;
    
    const id = parseInt(ovrId.value); 
    const tarikh = ovrDate.value; 
    const stat = ovrStatus.value; 
    const masa = ovrTime.value + ':00'; 
    
    const murid = db.murid.find(x => x.id === id); 
    if (!murid) return;
    
    const idx = murid.kehadiran.findIndex(r => r.tarikh === tarikh); 
    
    if(stat === 'Tak Hadir') { 
        if(idx > -1) murid.kehadiran.splice(idx,1); 
    } else { 
        if(idx > -1) { 
            murid.kehadiran[idx].status = stat; 
            murid.kehadiran[idx].masa = masa; 
        } else { 
            murid.kehadiran.push({tarikh: tarikh, status: stat, masa: masa}); 
        } 
    } 
    
    alert('Status kehadiran disunting!'); 
    if (modal) modal.classList.add('hidden'); 
    
    // Refresh current view
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('id');
    if (studentId && window.location.pathname.includes('student-detail.html')) {
        loadStudentDetail(parseInt(studentId));
    }
}

// ==================== DROPDOWN SEJARAH ====================
function renderDropdownSejarah(role) { 
    const tahunEl = document.getElementById(`${role}-sej-tahun`);
    const kelasEl = document.getElementById(`${role}-sej-kelas`);
    
    if (!tahunEl || !kelasEl) return;
    
    let tahunSet = new Set(); 
    db.murid.forEach(m => { 
        if(m.sejarahKelas) { 
            m.sejarahKelas.forEach(sk => tahunSet.add(sk.tahun)); 
        } else { 
            tahunSet.add(getCurrentYear()); 
        } 
    }); 
    
    let tahunArray = Array.from(tahunSet).sort().reverse(); 
    tahunEl.innerHTML = ''; 
    tahunArray.forEach(t => tahunEl.innerHTML += `<option value="${t}">${t}</option>`); 
    
    kelasEl.innerHTML = '<option value="">-- Pilih Kelas --</option>'; 
    db.kelas.forEach(k => kelasEl.innerHTML += `<option value="${k.id}">${k.name}</option>`); 
    
    paparSejarah(role); 
}

function paparSejarah(role) { 
    const tahunEl = document.getElementById(`${role}-sej-tahun`);
    const kelasEl = document.getElementById(`${role}-sej-kelas`);
    const tarikhEl = document.getElementById(`${role}-sej-tarikh`);
    const tbody = document.querySelector(`#${role}-sej-table tbody`);
    
    if (!tahunEl || !kelasEl || !tarikhEl || !tbody) return;
    
    const tahun = tahunEl.value; 
    const kelasIdStr = kelasEl.value; 
    const tarikhSpesifik = tarikhEl.value; 
    
    tbody.innerHTML = ''; 
    
    if(!kelasIdStr) { 
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--warning);">Sila pilih kelas untuk melihat sejarah kehadiran tahun ${tahun}.</td></tr>`; 
        return; 
    } 
    
    const kelasId = parseInt(kelasIdStr); 
    let muridTerlibat = []; 
    
    db.murid.forEach(m => { 
        let beradaDiKelasIni = false; 
        if(m.sejarahKelas) { 
            const rekodSejarah = m.sejarahKelas.find(sk => sk.tahun === tahun); 
            if(rekodSejarah && rekodSejarah.kelasId === kelasId) beradaDiKelasIni = true; 
        } else { 
            if(tahun === getCurrentYear() && m.kelasId === kelasId) beradaDiKelasIni = true; 
        } 
        if(beradaDiKelasIni) muridTerlibat.push(m); 
    }); 
    
    if(muridTerlibat.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Tiada rekod murid untuk kelas ini pada tahun ${tahun}.</td></tr>`; 
        return; 
    } 
    
    if(tarikhSpesifik) { 
        if(!tarikhSpesifik.startsWith(tahun)) { 
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--danger);">Tarikh yang dipilih berada di luar tahun ${tahun}. Kosong.</td></tr>`; 
            return; 
        } 
        
        muridTerlibat.forEach(m => { 
            let r = m.kehadiran.find(x => x.tarikh === tarikhSpesifik); 
            let stH = r && r.status === 'Hadir' ? 1 : 0; 
            let stL = r && r.status === 'Lewat' ? 1 : 0; 
            let stTH = !r ? 1 : 0; 
            
            tbody.innerHTML += `
                <tr>
                    <td><span class="clickable-text" onclick="window.location.href='student-detail.html?id=${m.id}'">${m.nama}</span></td>
                    <td>${m.ic}</td>
                    <td style="color:var(--success); font-weight:bold;">${stH}</td>
                    <td style="color:var(--warning); font-weight:bold;">${stL}</td>
                    <td style="color:var(--danger); font-weight:bold;">${stTH}</td>
                </tr>
            `; 
        }); 
    } else { 
        muridTerlibat.forEach(m => { 
            let h = 0, l = 0; 
            m.kehadiran.forEach(r => { 
                if(r.tarikh.startsWith(tahun)) { 
                    if(r.status === 'Lewat') l++; 
                    else h++; 
                } 
            }); 
            let th = db.hariOperasi - (h + l); 
            if(th < 0) th = 0; 
            
            tbody.innerHTML += `
                <tr>
                    <td><span class="clickable-text" onclick="window.location.href='student-detail.html?id=${m.id}'">${m.nama}</span></td>
                    <td>${m.ic}</td>
                    <td style="color:var(--success); font-weight:bold;">${h} Hari</td>
                    <td style="color:var(--warning); font-weight:bold;">${l} Hari</td>
                    <td style="color:var(--danger); font-weight:bold;">${th} Hari</td>
                </tr>
            `; 
        }); 
    } 
}

// ==================== PAGE INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    // Check for saved user
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
        } catch (e) {
            currentUser = null;
        }
    }
    
    // Setup based on current page
    const path = window.location.pathname;
    const page = path.split('/').pop();
    
    if (page === 'dashboard-guru.html') {
        if (!currentUser || currentUser.role === 'host') {
            window.location.href = 'login-guru.html';
            return;
        }
        setupGuruNav();
        renderGuruProfil();
        switchMenu('profil', 'guru');
    }
    
    if (page === 'dashboard-host.html') {
        if (!currentUser || currentUser.role !== 'host') {
            window.location.href = 'login-host.html';
            return;
        }
        setupHostNav();
        switchMenu('statistik', 'host');
    }
    
    if (page === 'teacher-detail.html') {
        const urlParams = new URLSearchParams(window.location.search);
        const teacherId = urlParams.get('id');
        if (teacherId) {
            loadTeacherDetail(parseInt(teacherId));
        }
    }
    
    if (page === 'class-detail.html') {
        const urlParams = new URLSearchParams(window.location.search);
        const classId = urlParams.get('id');
        const date = urlParams.get('date') || getLocalSystemDate();
        if (classId) {
            loadClassDetail(parseInt(classId), date);
        }
    }
    
    if (page === 'student-detail.html') {
        const urlParams = new URLSearchParams(window.location.search);
        const studentId = urlParams.get('id');
        if (studentId) {
            loadStudentDetail(parseInt(studentId));
        }
    }
    
    if (page === 'scan.html') {
        const today = getLocalSystemDate();
        const cutiHariIni = db.cuti.find(c => c.tarikh === today);
        const rfidInput = document.getElementById('rfid-listener');
        const scanBukaIcon = document.getElementById('scan-buka-icon');
        const scanTitle = document.getElementById('scan-title');
        const scanSub = document.getElementById('scan-sub');
        const scanResult = document.getElementById('scan-result');
        const scanTutupMsg = document.getElementById('scan-tutup-msg');
        
        if(cutiHariIni) { 
            if (rfidInput) rfidInput.classList.add('hidden'); 
            if (scanBukaIcon) scanBukaIcon.classList.add('hidden'); 
            if (scanTitle) scanTitle.classList.add('hidden'); 
            if (scanResult) scanResult.classList.add('hidden'); 
            if (scanSub) scanSub.classList.add('hidden'); 
            
            if (scanTutupMsg) {
                scanTutupMsg.innerHTML = `
                    <i class="fas fa-calendar-times" style="font-size: 5rem; color: var(--danger); margin-bottom: 20px;"></i>
                    <h2 style="color: var(--danger);">MAAF, RFID DITUTUP</h2>
                    <h3 style="margin-top:10px; color: var(--warning);">BAGI CUTI: ${cutiHariIni.nama.toUpperCase()}</h3>
                `; 
                scanTutupMsg.classList.remove('hidden'); 
            }
        } else { 
            if (rfidInput) {
                rfidInput.classList.remove('hidden'); 
                setTimeout(() => rfidInput.focus(), 100); 
            }
            if (scanBukaIcon) scanBukaIcon.classList.remove('hidden'); 
            if (scanTitle) scanTitle.classList.remove('hidden'); 
            if (scanSub) scanSub.classList.remove('hidden'); 
            if (scanTutupMsg) scanTutupMsg.classList.add('hidden'); 
        } 
    }
});

// ==================== DETAIL PAGE FUNCTIONS ====================
function loadTeacherDetail(teacherId) {
    const guru = db.gurus.find(g => g.id === teacherId);
    if (!guru) return;
    
    const idInput = document.getElementById('det-g-id');
    const nameInput = document.getElementById('det-g-name');
    const phoneInput = document.getElementById('det-g-phone');
    const emailInput = document.getElementById('det-g-email');
    const passInput = document.getElementById('det-g-pass');
    
    if (idInput) idInput.value = guru.id;
    if (nameInput) nameInput.value = guru.name;
    if (phoneInput) phoneInput.value = guru.phone || '';
    if (emailInput) emailInput.value = guru.email;
    if (passInput) passInput.value = guru.pass || '';
    
    renderKelasBawahGuru(teacherId);
}

function renderKelasBawahGuru(guruId) { 
    const container = document.getElementById('det-g-kelas-container'); 
    if (!container) return;
    
    container.innerHTML = ''; 
    
    db.kelas.filter(k => k.guruId === guruId).forEach(k => { 
        let html = `
            <div class="sub-card">
                <div style="display:flex; justify-content:space-between;">
                    <h4>${k.name}</h4>
                    <button class="btn btn-danger no-print" onclick="buangKelasHost(${k.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                <div class="no-print" style="margin:10px 0; background:#0f172a; padding:10px;">
                    <input type="text" id="add-m-n-${k.id}" class="inline-input" placeholder="Nama">
                    <input type="text" id="add-m-ic-${k.id}" class="inline-input" placeholder="IC">
                    <input type="text" id="add-m-u-${k.id}" class="inline-input" placeholder="UID">
                    <button class="btn btn-success" onclick="tambahMuridHost(${k.id})">Tambah Murid</button>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Nama</th>
                            <th>IC</th>
                            <th>UID</th>
                            <th class="no-print">Tindakan</th>
                        </tr>
                    </thead>
                    <tbody>
        `; 
        
        db.murid.filter(m => m.kelasId === k.id).forEach(m => { 
            html += `
                <tr>
                    <td><input type="text" id="em-n-${m.id}" value="${m.nama}"></td>
                    <td><input type="text" id="em-ic-${m.id}" value="${m.ic}"></td>
                    <td><input type="text" id="em-u-${m.id}" value="${m.uid}"></td>
                    <td class="no-print">
                        <button class="btn btn-success" onclick="simpanMuridHost(${m.id})"><i class="fas fa-save"></i></button> 
                        <button class="btn btn-warning" onclick="bukaOverride(${m.id})">Edit</button> 
                        <button class="btn btn-danger" onclick="buangMuridHost(${m.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `; 
        }); 
        
        container.innerHTML += html + `</tbody></table></div>`; 
    }); 
}

function tambahKelasHost() { 
    const idInput = document.getElementById('det-g-id');
    const nameInput = document.getElementById('add-k-name');
    
    if (!idInput || !nameInput) return;
    
    const guruId = parseInt(idInput.value);
    const name = nameInput.value;
    
    if(name) { 
        db.kelas.push({id: Date.now(), name: name, guruId: guruId}); 
        if (nameInput) nameInput.value = '';
        renderKelasBawahGuru(guruId); 
    } 
}

function buangKelasHost(kId) { 
    if(confirm('Buang kelas?')) { 
        db.kelas = db.kelas.filter(x => x.id !== kId); 
        const guruId = parseInt(document.getElementById('det-g-id')?.value || 0);
        if (guruId) renderKelasBawahGuru(guruId); 
    } 
}

function tambahMuridHost(kId) { 
    const namaInput = document.getElementById(`add-m-n-${kId}`);
    const icInput = document.getElementById(`add-m-ic-${kId}`);
    const uidInput = document.getElementById(`add-m-u-${kId}`);
    
    if (!namaInput || !icInput) return;
    
    const name = namaInput.value;
    const ic = icInput.value;
    const uid = uidInput ? uidInput.value : '';
    
    if(name) { 
        db.murid.push({
            id: Date.now(), 
            nama: name, 
            ic: ic, 
            uid: uid, 
            kelasId: kId, 
            sejarahKelas: [{tahun: getCurrentYear(), kelasId: kId}], 
            kehadiran: []
        }); 
        
        const guruId = parseInt(document.getElementById('det-g-id')?.value || 0);
        if (guruId) renderKelasBawahGuru(guruId); 
    } 
}

function simpanMuridHost(mId) { 
    const murid = db.murid.find(x => x.id === mId);
    if (!murid) return;
    
    const namaInput = document.getElementById(`em-n-${mId}`);
    const icInput = document.getElementById(`em-ic-${mId}`);
    const uidInput = document.getElementById(`em-u-${mId}`);
    
    if (namaInput) murid.nama = namaInput.value; 
    if (icInput) murid.ic = icInput.value; 
    if (uidInput) murid.uid = uidInput.value; 
    
    alert('Disimpan!'); 
}

function buangMuridHost(mId) { 
    if(confirm('Buang murid?')) { 
        db.murid = db.murid.filter(x => x.id !== mId); 
        const guruId = parseInt(document.getElementById('det-g-id')?.value || 0);
        if (guruId) renderKelasBawahGuru(guruId); 
    } 
}

function simpanEditGuru() { 
    const idInput = document.getElementById('det-g-id');
    const nameInput = document.getElementById('det-g-name');
    const phoneInput = document.getElementById('det-g-phone');
    const emailInput = document.getElementById('det-g-email');
    const passInput = document.getElementById('det-g-pass');
    
    if (!idInput || !nameInput || !emailInput) return;
    
    const id = parseInt(idInput.value); 
    const guru = db.gurus.find(x => x.id === id); 
    if (!guru) return;
    
    guru.name = nameInput.value; 
    guru.phone = phoneInput ? phoneInput.value : ''; 
    guru.email = emailInput.value; 
    guru.pass = passInput ? passInput.value : ''; 
    
    alert('Dikemaskini!'); 
}

function buangGuru() { 
    const idInput = document.getElementById('det-g-id');
    if (!idInput) return;
    
    const id = parseInt(idInput.value); 
    if(confirm('Buang guru ini?')) { 
        db.gurus = db.gurus.filter(x => x.id !== id); 
        db.kelas = db.kelas.filter(x => x.guruId !== id); 
        window.location.href = 'dashboard-host.html'; 
    } 
}

function loadClassDetail(classId, date) {
    currentClassDetailId = classId;
    
    const kelas = db.kelas.find(x => x.id === classId);
    if (!kelas) return;
    
    const guru = db.gurus.find(x => x.id === kelas.guruId);
    const muridKelas = db.murid.filter(m => m.kelasId === classId);
    
    const namaKelasEl = document.getElementById('hkd-nama-kelas');
    const namaGuruEl = document.getElementById('hkd-nama-guru');
    const tarikhEl = document.getElementById('hkd-tarikh');
    const datePicker = document.getElementById('hkd-date-picker');
    
    if (namaKelasEl) namaKelasEl.innerText = kelas.name;
    if (namaGuruEl) namaGuruEl.innerText = guru ? guru.name : '-';
    if (tarikhEl) tarikhEl.innerText = date;
    if (datePicker) datePicker.value = date;
    
    let h = 0, l = 0, th = 0;
    let sH = '', sL = '', sTH = '', sSemua = '';
    
    muridKelas.forEach(m => {
        sSemua += `<li><span class="clickable-text" onclick="window.location.href='student-detail.html?id=${m.id}'">${m.nama}</span></li>`;
        const r = m.kehadiran.find(x => x.tarikh === date);
        if(r) {
            if(r.status === 'Lewat') {
                l++;
                sL += `<li><span class="clickable-text" onclick="window.location.href='student-detail.html?id=${m.id}'">${m.nama}</span></li>`;
            } else {
                h++;
                sH += `<li><span class="clickable-text" onclick="window.location.href='student-detail.html?id=${m.id}'">${m.nama}</span></li>`;
            }
        } else {
            th++;
            sTH += `<li><span class="clickable-text" onclick="window.location.href='student-detail.html?id=${m.id}'">${m.nama}</span></li>`;
        }
    });
    
    const nisbahEl = document.getElementById('hkd-nisbah');
    const hadirList = document.getElementById('hkd-list-hadir');
    const lewatList = document.getElementById('hkd-list-lewat');
    const takhadirList = document.getElementById('hkd-list-takhadir');
    const semuaList = document.getElementById('hkd-list-semua');
    
    if (nisbahEl) nisbahEl.innerText = `${h + l}/${muridKelas.length}`;
    if (hadirList) hadirList.innerHTML = sH || 'Tiada';
    if (lewatList) lewatList.innerHTML = sL || 'Tiada';
    if (takhadirList) takhadirList.innerHTML = sTH || 'Tiada';
    if (semuaList) semuaList.innerHTML = sSemua || 'Tiada murid.';
    
    const canvas = document.getElementById('hostKelasChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if(charts.hostKelas) charts.hostKelas.destroy();
        charts.hostKelas = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Hadir', 'Lewat', 'Tak Hadir'],
                datasets: [{
                    data: [h, l, th],
                    backgroundColor: ['#22c55e', '#f59e0b', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { ticks: { color: '#fff', stepSize: 1 } },
                    x: { ticks: { color: '#fff' } }
                }
            }
        });
    }
}

function tukarTarikhKelasDetail() {
    const datePicker = document.getElementById('hkd-date-picker');
    if (currentClassDetailId && datePicker) {
        loadClassDetail(currentClassDetailId, datePicker.value);
    }
}

function loadStudentDetail(studentId) {
    const murid = db.murid.find(x => x.id === studentId);
    if (!murid) return;
    
    const kelas = db.kelas.find(x => x.id === murid.kelasId);
    
    const namaEl = document.getElementById('indv-nama');
    const icEl = document.getElementById('indv-ic');
    const kelasEl = document.getElementById('indv-kelas');
    
    if (namaEl) namaEl.innerText = murid.nama;
    if (icEl) icEl.innerText = murid.ic;
    if (kelasEl) kelasEl.innerText = kelas ? kelas.name : '-';
    
    let h = 0, l = 0;
    murid.kehadiran.forEach(r => {
        if(r.status === 'Lewat') l++;
        else h++;
    });
    let th = db.hariOperasi - (h + l);
    if(th < 0) th = 0;
    
    const hadirCount = document.getElementById('indv-count-hadir');
    const lewatCount = document.getElementById('indv-count-lewat');
    const takhadirCount = document.getElementById('indv-count-takhadir');
    
    if (hadirCount) hadirCount.innerText = h;
    if (lewatCount) lewatCount.innerText = l;
    if (takhadirCount) takhadirCount.innerText = th;
    
    const canvas = document.getElementById('hostStudentChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if(charts.hostStudent) charts.hostStudent.destroy();
        charts.hostStudent = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Hadir', 'Lewat', 'Tak Hadir'],
                datasets: [{
                    data: [h, l, th],
                    backgroundColor: ['#22c55e', '#f59e0b', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#fff' } }
                }
            }
        });
    }
    
    const rekodDisusun = [...murid.kehadiran].sort((a, b) => new Date(b.tarikh) - new Date(a.tarikh));
    const tb = document.querySelector('#indv-table tbody');
    if (tb) {
        tb.innerHTML = '';
        rekodDisusun.forEach(r => {
            let clr = r.status === 'Lewat' ? 'var(--warning)' : 'var(--success)';
            tb.innerHTML += `
                <tr>
                    <td>${r.tarikh}</td>
                    <td style="color:${clr}; font-weight:bold;">${r.status}</td>
                    <td>${r.masa}</td>
                </tr>
            `;
        });
    }
    
    // Setup edit button visibility
    const btnEdit = document.getElementById('btn-edit-kehadiran-detail');
    if (btnEdit) {
        const isHost = currentUser && currentUser.role === 'host';
        const isOwnClass = currentUser && kelas && kelas.guruId === currentUser.id;
        
        if (isHost || isOwnClass) {
            btnEdit.classList.remove('hidden');
            btnEdit.onclick = function() { bukaOverride(studentId); };
        } else {
            btnEdit.classList.add('hidden');
        }
    }
}
