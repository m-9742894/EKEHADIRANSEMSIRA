const URL_API = "https://script.googleusercontent.com/a/macros/moe-dl.edu.my/echo?user_content_key=AY5xjrQkvlArf3WtSXbv-tmwXPMWBxPDqN0qL4DbxKXgTizpb4kmNzC3RI5BG-aT5VFQ9S8XZJRR79gUpBH0h9qwCiF4MPx7hpDfJwcMqpNoqq6yQ6jZ3Uf4WohfIxQyUK2JYDuMgGFtKKXobZky86WtHSmzrvAN6aU7MJEJP70Uhq8wQW7_rUi8-nGyt_B06Ov53QHX5OSSKg8Mtj2DU8wo9ZsC7AnjecPnEjTxx6UZygvf0hnLQUehUC_Y6ZGRyIcUdJUosIk-CYqxyROvzki1-5ASXU3JVc0H_LKA_oiLmeLoqsGSJdc&lib=MATy-uD7Uf6H5dwa-YPeFMHXm7oHYQnAr";
let senaraiGuru = [];
let senaraiMurid = [];

// Tarik data sebaik web dibuka
fetch(URL_API).then(r => r.json()).then(d => {
    senaraiGuru = d.guru;
    senaraiMurid = d.murid;
    console.log("Data Berjaya Tarik!");
});

function registerGuru() {
    let n = document.getElementById('reg-name').value;
    let e = document.getElementById('reg-email').value;
    let p = document.getElementById('reg-pass').value;
    let t = document.getElementById('reg-tel').value;

    fetch(URL_API, {
        method: 'POST',
        body: JSON.stringify({jenis:"guru", nama:n, email:e, password:p, notel:t})
    }).then(() => {
        alert("Pendaftaran Masuk Ke Sheets!");
        location.reload(); // Refresh untuk tarik data baru
    });
}

function processRFID(uid) {
    let m = senaraiMurid.find(x => x.uid.toUpperCase() === uid.trim().toUpperCase());
    if(m) {
        let d = {
            jenis: "kehadiran",
            tarikh: new Date().toLocaleDateString(),
            nama: m.nama,
            status: "Hadir",
            masa: new Date().toLocaleTimeString(),
            uid: uid,
            ic: m.ic
        };
        fetch(URL_API, { method: 'POST', body: JSON.stringify(d) });
        alert("Hadir: " + m.nama);
    } else {
        alert("Murid Tiada Dalam Sheets!");
    }
}
