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
                // PAPAR MESEJ CUTI
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
                // BUKA MOD SCAN
                rfidInput.classList.remove('hidden');
                scanBukaIcon.classList.remove('hidden');
                scanTitle.classList.remove('hidden');
                scanSub.classList.remove('hidden');
                scanTutupMsg.classList.add('hidden');
                
                rfidInput.value = '';
                
                // PENTING: Paksa kursor masuk ke dalam kotak RFID
                setTimeout(() => rfidInput.focus(), 100); 
                
                // Jika pengguna terklik tempat lain di skrin, sistem tetap paksa kursor patah balik ke kotak input
                document.getElementById('page-scan').onclick = function() {
                    rfidInput.focus();
                };
            }
        }
        
        function handleScanInput(e) { 
            if(e.key==='Enter' && e.target.value.trim()){ 
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

            // Kosongkan kotak dan paksa fokus semula untuk murid seterusnya
            rfidInput.value = ''; 
            setTimeout(() => rfidInput.focus(), 50);

            const now = new Date();
            const h = now.getHours();
            const min = now.getMinutes();
            
            // KIRAAN LEWAT (Selepas 7:40 Pagi)
            let stat = (h > 7 || (h === 7 && min > 40)) ? 'Lewat' : 'Hadir'; 
            
            // TUKAR KEPADA HURUF BESAR untuk samakan format bacaan RFID dan pangkalan data
            const cleanUID = uid.trim().toUpperCase();
            
            const m = db.murid.find(x => x.uid.toUpperCase() === cleanUID);
            
            if(m) {
                let r = m.kehadiran.find(x => x.tarikh === today);
                if(!r) {
                    // Jika murid belum ada rekod hari ini, masukkan rekod baru
                    m.kehadiran.push({
                        tarikh: today, 
                        status: stat, 
                        masa: getLocalSystemTime()
                    }); 
                } else {
                    // Jika murid DAH ADA rekod hari ini, cuma paparkan semula status asalnya
                    stat = r.status;
                }
                
                // Paparkan Notis Hijau / Kuning pada skrin imbasan
                document.getElementById('scan-name').innerText = m.nama; 
                document.getElementById('scan-status-text').innerText = stat; 
                document.getElementById('scan-status-text').style.color = stat === 'Lewat' ? 'var(--warning)' : 'var(--success)';
                
                document.getElementById('scan-result').classList.remove('hidden'); 
                
                // Sembunyikan notis selepas 3 saat
                setTimeout(() => document.getElementById('scan-result').classList.add('hidden'), 3000);
            } else {
                alert("Kad Tidak Dikenali! Sila daftarkan UID kad ini terlebih dahulu.");
            }
        }
