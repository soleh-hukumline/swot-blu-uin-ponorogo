// Variabel Global
let universities = [];
let map;
let radarChart;
let currentSelectedUni = null;

// Konfigurasi Peta — Pulau Jawa (semua kampus dari Banten s.d. Jember)
const MAP_CENTER = [-7.4, 110.2];
const MAP_ZOOM = 7;
// maxBounds = area pan yang diizinkan (sedikit lebih besar dari Jawa agar tidak stuck)
const JAVA_BOUNDS = [[-9.2, 104.8], [-5.4, 115.2]];
const BASE_UNI_ID = "uin-ponorogo";

// Format Rupiah
const formatRp = (angka) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);
};

// 1. Inisialisasi & Fetch Data
async function loadData() {
    try {
        universities = universitiesData;
        
        initMap();
        initThemeToggle();
        initDataManager();
        
        // Pilih kampus target secara default
        const baseUni = universities.find(u => u.id === BASE_UNI_ID) || universities[0];
        updateDashboard(baseUni);
        
    } catch (error) {
        console.error("Gagal memuat data", error);
        document.getElementById('swotContainer').innerHTML = "<p style='color:red;'>Gagal memuat data JSON.</p>";
    }
}

// 2. Pemetaan OpenStreetMap (Leaflet) — Terkunci ke Pulau Jawa
function initMap() {
    map = L.map('map', {
        maxBounds: JAVA_BOUNDS,
        maxBoundsViscosity: 0.9,
        minZoom: 7,   // Zoom 7 = cukup untuk lihat seluruh Jawa (Banten–Jember)
        maxZoom: 14,
        zoomSnap: 0.5
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(map);

    // Set view default agar flyTo tidak crash sebelum fitBounds selesai
    map.setView(MAP_CENTER, MAP_ZOOM);

    renderMarkers();

    // Setelah marker dirender, fitBounds otomatis ke koordinat semua kampus
    setTimeout(() => {
        map.invalidateSize();
        // Hitung bounding box dari semua koordinat kampus
        const lats = universitiesData.map(u => u.lat);
        const lngs = universitiesData.map(u => u.lng);
        const campusBounds = [
            [Math.min(...lats) - 0.5, Math.min(...lngs) - 0.8],
            [Math.max(...lats) + 1.4, Math.max(...lngs) + 0.8]  // +1.4° north = lebih banyak Laut Jawa
        ];
        map.fitBounds(campusBounds, { padding: [10, 20] });
    }, 400);
}


function renderMarkers() {
    // Hapus marker + polyline lama
    map.eachLayer(layer => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) map.removeLayer(layer);
    });

    // Posisi default label: kampus.lat + offsetLat (ke utara = Laut Jawa)
    // offsetLat dalam derajat, ~0.011° ≈ 1km ≈ 1px di zoom 7
    const LABEL_OFFSET = {
        'uin-banten':      { dlat: 0.7,  dlng:  0.0 },
        'uin-jakarta':     { dlat: 1.0,  dlng:  0.2 },
        'uin-bandung':     { dlat: 1.5,  dlng: -0.3 },
        'uin-pekalongan':  { dlat: 1.3,  dlng:  0.0 },
        'uin-purwokerto':  { dlat: 2.0,  dlng: -0.4 },
        'uin-walisongo':   { dlat: 1.4,  dlng:  0.2 },
        'uin-salatiga':    { dlat: 1.8,  dlng:  0.4 },
        'uin-surakarta':   { dlat: 2.1,  dlng: -0.2 },
        'uin-suka':        { dlat: 2.3,  dlng:  0.1 },
        'uin-ponorogo':    { dlat: 2.4,  dlng:  0.3 },
        'iain-kediri':     { dlat: 2.15, dlng:  0.2 },
        'uin-tulungagung': { dlat: 2.6,  dlng:  0.0 },
        'uin-malang':      { dlat: 2.5,  dlng:  0.4 },
        'uin-surabaya':    { dlat: 0.8,  dlng:  0.2 },
        'uin-jember':      { dlat: 2.8,  dlng:  0.2 },
    };

    const SHORT_NAMES = {
        'uin-ponorogo':    'UIN Ponorogo',
        'uin-malang':      'UIN Malang',
        'uin-surabaya':    'UIN Sunan Ampel',
        'uin-tulungagung': 'UIN SATU',
        'uin-jember':      'UIN KH. A. Siddiq',
        'iain-kediri':     'IAIN Kediri',
        'uin-walisongo':   'UIN Walisongo',
        'uin-surakarta':   'UIN Raden Mas Said',
        'uin-salatiga':    'UIN Salatiga',
        'uin-purwokerto':  'UIN Saizu',
        'uin-pekalongan':  'UIN KH. A. Wahid',
        'uin-suka':        'UIN Sunan Kalijaga',
        'uin-jakarta':     'UIN Syarif Hidayatullah',
        'uin-bandung':     'UIN Sunan Gunung Djati',
        'uin-banten':      'UIN SMH Banten',
    };

    // Load posisi tersimpan dari localStorage
    let savedPos = {};
    try { savedPos = JSON.parse(localStorage.getItem('blulabel_pos') || '{}'); } catch(e) {}

    universities.forEach(uni => {
        const isPonorogo = uni.id === BASE_UNI_ID;

        // ── DOT MARKER ──────────────────────────────────────────────────
        let markerColor = '#3b82f6';
        if (isPonorogo)                                            markerColor = '#22c55e';
        else if (uni.accreditation === 'Unggul' && uni.blu_status) markerColor = '#ef4444';
        else if (uni.blu_status)                                   markerColor = '#f59e0b';

        const mSize = isPonorogo ? 42 : 22;
        const mShadow = isPonorogo
            ? '0 0 0 4px rgba(34,197,94,0.4),0 4px 14px rgba(0,0,0,0.6)'
            : '0 2px 6px rgba(0,0,0,0.35)';
        const pulseEl = isPonorogo
            ? `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:62px;height:62px;border-radius:50%;background:rgba(34,197,94,0.25);animation:ponorogo-pulse 1.8s ease-out infinite;"></div>`
            : '';

        const dotIcon = L.divIcon({
            className: '',
            html: `<div style="position:relative;width:${mSize+20}px;height:${mSize+20}px;display:flex;align-items:center;justify-content:center;">
                ${pulseEl}
                <div style="width:${mSize}px;height:${mSize}px;border-radius:50%;background:${markerColor};border:${isPonorogo?'3px':'2px'} solid rgba(255,255,255,${isPonorogo?1:0.7});box-shadow:${mShadow};display:flex;align-items:center;justify-content:center;position:relative;z-index:2;">
                    ${isPonorogo ? '<span style="font-size:16px;color:#fff;font-weight:900;">★</span>' : ''}
                </div>
            </div>`,
            iconSize:   [mSize+20, mSize+20],
            iconAnchor: [(mSize+20)/2, (mSize+20)/2]
        });

        const dotMarker = L.marker([uni.lat, uni.lng], {
            icon: dotIcon, zIndexOffset: isPonorogo ? 1000 : 0
        }).addTo(map);

        const accColor = uni.accreditation === 'Unggul' ? '#22c55e'
            : uni.accreditation === 'A'           ? '#22c55e'
            : uni.accreditation === 'Baik Sekali' ? '#3b82f6'
            : '#f59e0b';
        const mhsFmt = uni.students >= 1000 ? (uni.students/1000).toFixed(1)+'rb' : uni.students;

        dotMarker.on('click', () => updateDashboard(uni));
        dotMarker.bindPopup(`
            <div style="line-height:1.5;font-family:'Inter',sans-serif;min-width:200px;">
                <strong style="font-size:1em;display:block;margin-bottom:6px;color:${accColor}">${uni.name}</strong>
                <div style="font-size:0.83em;">
                    🎓 Akreditasi: <b>${uni.accreditation}</b><br>
                    🏛️ Status: <b>${uni.blu_status ? 'BLU ✅' : 'Satker ⏳'}</b><br>
                    👥 Mahasiswa: <b>${new Intl.NumberFormat('id-ID').format(uni.students)}</b><br>
                    👨‍🏫 Dosen: <b>${new Intl.NumberFormat('id-ID').format(uni.lecturers)}</b><br>
                    🏆 Guru Besar: <b>${uni.professors}</b><br>
                    💳 UKT: <b>Rp${(uni.ukt_avg/1000000).toFixed(1)}jt</b>
                </div>
            </div>`, { maxWidth: 260 });

        // ── DRAGGABLE LABEL ──────────────────────────────────────────────
        const offset = LABEL_OFFSET[uni.id] || { dlat: 1.2, dlng: 0 };
        const shortLabel = SHORT_NAMES[uni.id] || uni.name;

        // Posisi awal label: dari localStorage atau default (north offset)
        const defLat = uni.lat + offset.dlat;
        const defLng = uni.lng + offset.dlng;
        const initLat = savedPos[uni.id]?.lat ?? defLat;
        const initLng = savedPos[uni.id]?.lng ?? defLng;

        // Garis konektor (polyline)
        const lineStyle = {
            color: isPonorogo ? '#22c55e' : 'rgba(255,255,255,0.55)',
            weight: 1.5, opacity: 0.85, interactive: false
        };
        const line = L.polyline([[uni.lat, uni.lng], [initLat, initLng]], lineStyle).addTo(map);

        // Label icon (kotak saja, tanpa garis internal)
        const boxBg     = isPonorogo ? 'rgba(0,0,0,0.88)' : 'rgba(0,0,0,0.7)';
        const boxBorder = isPonorogo ? '1.5px solid #22c55e' : '1px solid rgba(255,255,255,0.25)';
        const txtColor  = isPonorogo ? '#22c55e' : '#f1f5f9';
        const nameSz    = isPonorogo ? '11px' : '9.5px';
        const nameW     = isPonorogo ? '800' : '600';

        const labelIcon = L.divIcon({
            className: 'callout-label-icon',
            html: `<div style="background:${boxBg};border:${boxBorder};border-radius:6px;padding:5px 9px;
                        backdrop-filter:blur(8px);white-space:nowrap;cursor:grab;
                        box-shadow:0 2px 8px rgba(0,0,0,0.4);"
                        title="Geser label ini ke posisi yang diinginkan">
                    <div style="font-size:${nameSz};font-weight:${nameW};color:${txtColor};">${isPonorogo ? '★ ' : ''}${shortLabel}</div>
                    <div style="font-size:8px;color:${accColor};font-weight:700;margin-top:2px;">${uni.accreditation} · ${uni.blu_status ? 'BLU' : 'Satker'}</div>
                    <div style="font-size:8px;color:rgba(203,213,225,0.85);margin-top:1px;">👥 ${mhsFmt} · 👨‍🏫 ${uni.lecturers}</div>
                </div>`,
            iconSize:   [150, 52],
            iconAnchor: [75, 26]   // center of label box
        });

        const labelMarker = L.marker([initLat, initLng], {
            icon: labelIcon,
            draggable: true,
            zIndexOffset: isPonorogo ? 900 : 50
        }).addTo(map);

        // Update garis saat label digeser
        labelMarker.on('drag', function(e) {
            const p = e.target.getLatLng();
            line.setLatLngs([[uni.lat, uni.lng], [p.lat, p.lng]]);
        });

        // Simpan posisi ke localStorage setelah dilepas
        labelMarker.on('dragend', function(e) {
            const p = e.target.getLatLng();
            try {
                const s = JSON.parse(localStorage.getItem('blulabel_pos') || '{}');
                s[uni.id] = { lat: p.lat, lng: p.lng };
                localStorage.setItem('blulabel_pos', JSON.stringify(s));
            } catch(err) {}
        });
    });
}

// Reset semua posisi label ke default
function resetLabelPositions() {
    localStorage.removeItem('blulabel_pos');
    renderMarkers();
}



// 3. Logika SWOT Otomatis
function generateSWOT(uni) {
    const baseUni = universities.find(u => u.id === BASE_UNI_ID);
    
    let html = '<div style="display:flex; flex-direction:column; gap:8px;">';
    
    // Hitung Rasio
    const ratio = Math.round(uni.students / uni.lecturers);
    const profRatio = ((uni.professors / uni.lecturers) * 100).toFixed(1);
    
    // Strengths Internal
    html += `<div><strong style="color:var(--text-main)">💪 Strengths (Kekuatan):</strong><ul style="margin-left: 20px;">`;
    if (uni.accreditation === "Unggul" || uni.accreditation === "A") html += `<li>Akreditasi Kampus sangat baik (${uni.accreditation}).</li>`;
    if (profRatio > 5) html += `<li>Rasio kepemilikan Guru Besar sangat tinggi (${profRatio}% dari total dosen).</li>`;
    if (uni.blu_status) html += `<li>Institusi sudah berstatus BLU mandiri.</li>`;
    if (uni.students > 15000) html += `<li>Daya tampung dan serapan mahasiswa masif.</li>`;
    html += `</ul></div>`;
    
    // Weaknesses Internal
    html += `<div><strong style="color:var(--text-main)">📉 Weaknesses (Kelemahan):</strong><ul style="margin-left: 20px;">`;
    if (ratio > 35) html += `<li>Rasio Dosen Mahasiswa sangat padat (1:${ratio}).</li>`;
    if (uni.accreditation !== "Unggul" && uni.accreditation !== "A") html += `<li>Akreditasi perlu ditingkatkan dari posisi (${uni.accreditation}).</li>`;
    if (!uni.blu_status) html += `<li>Belum bertransformasi menjadi BLU (PNBP Standar).</li>`;
    html += `</ul></div>`;
    
    // Opportunities (Bagi Kampus Kita terhadap mereka)
    if (uni.id !== BASE_UNI_ID) {
        html += `<div><strong style="color:var(--text-main)">🎯 Opportunities (Peluang Penetrasi):</strong><ul style="margin-left: 20px;">`;
        if (uni.ukt_avg > baseUni.ukt_avg) html += `<li>UKT mereka lebih tinggi. Kita bisa menonjolkan keunggulan biaya.</li>`;
        if (ratio > 35) html += `<li>Rasio kelas mereka padat, pelayanan akademik ke mahasiswa kita lebih intensif.</li>`;
        html += `</ul></div>`;
    }
    
    // Threats
    if (uni.id !== BASE_UNI_ID) {
        html += `<div><strong style="color:var(--text-main)">⚠️ Threats (Ancaman dari mereka):</strong><ul style="margin-left: 20px;">`;
        if (uni.accreditation === "Unggul" && baseUni.accreditation !== "Unggul") html += `<li>Akreditasi mereka berpotensi menyedot calon mhs unggulan kota sekitar.</li>`;
        if (uni.province === baseUni.province) html += `<li>Berada di provinsi yang sama, persaingan regional langsung.</li>`;
        html += `</ul></div>`;
    }
    
    html += '</div>';
    return html;
}

// 4. Update Tampilan Analisis
function updateDashboard(uni) {
    currentSelectedUni = uni;
    
    // Update Header Text
    // Update Header — hanya update text node, bukan innerHTML (agar tombol PNG tidak hilang)
    const nameEl = document.getElementById('viewUniName');
    // Cari text node pertama dan ganti, sisakan tombol export
    const textNodes = Array.from(nameEl.childNodes).filter(n => n.nodeType === 3);
    if (textNodes.length > 0) {
        textNodes[0].textContent = uni.name;
    } else {
        // Tidak ada text node — sisipkan sebelum tombol
        const btn = nameEl.querySelector('button');
        const t = document.createTextNode(uni.name);
        if (btn) nameEl.insertBefore(t, btn);
        else nameEl.prepend(t);
    }
    document.getElementById('viewAkreditasi').textContent = uni.accreditation;
    document.getElementById('viewBlu').textContent = uni.blu_status ? "BLU" : "Satker Biasa";
    
    const ratio = Math.round(uni.students / uni.lecturers);
    document.getElementById('viewRasio').textContent = `1 : ${ratio}`;
    document.getElementById('viewProfessors').textContent = new Intl.NumberFormat('id-ID').format(uni.professors || 0);
    document.getElementById('viewUkt').textContent = formatRp(uni.ukt_avg);
    
    // Pan peta ke kampus yang dipilih
    try { map.flyTo([uni.lat, uni.lng], Math.min((map.getZoom()||MAP_ZOOM) + 1, 11), { duration: 1.2 }); } catch(e) {}
    
    // Update SWOT Text
    document.getElementById('swotContainer').innerHTML = generateSWOT(uni);
    
    // Update Majors List — grouped by faculty with correct accreditation
    const majorsList = document.getElementById('viewMajorsList');
    majorsList.innerHTML = '';
    if (uni.majors && uni.majors.length > 0) {
        // Cek apakah data baru (ada field faculty) atau lama
        const hasNewFormat = uni.majors[0].hasOwnProperty('faculty');
        if (hasNewFormat) {
            // Kelompokkan per fakultas
            const byFaculty = {};
            uni.majors.forEach(m => {
                const fac = m.faculty || 'Lainnya';
                if (!byFaculty[fac]) byFaculty[fac] = [];
                byFaculty[fac].push(m);
            });
            const facOrder = ['FTIK','FASya','FUAD','FEBI','Pascasarjana'];
            const facLabels = {
                'FTIK': '📚 Fak. Tarbiyah & Ilmu Keguruan',
                'FASya': '⚖️ Fak. Syariah',
                'FUAD': '🕌 Fak. Ushuluddin, Adab & Dakwah',
                'FEBI': '💹 Fak. Ekonomi & Bisnis Islam',
                'Pascasarjana': '🎓 Pascasarjana'
            };
            facOrder.forEach(fac => {
                if (!byFaculty[fac]) return;
                const header = document.createElement('li');
                header.style.cssText = 'font-size:0.7rem;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:1px;padding:6px 0 3px;border-top:1px solid var(--border);margin-top:4px;list-style:none;';
                header.textContent = facLabels[fac] || fac;
                majorsList.appendChild(header);
                byFaculty[fac].forEach(major => {
                    const accColor = major.acc === 'Unggul' ? '#22c55e'
                        : major.acc === 'Baik Sekali' ? '#3b82f6'
                        : '#94a3b8';
                    const accBg = major.acc === 'Unggul' ? 'rgba(34,197,94,0.12)'
                        : major.acc === 'Baik Sekali' ? 'rgba(59,130,246,0.12)'
                        : 'rgba(148,163,184,0.1)';
                    const li = document.createElement('li');
                    li.className = 'clickable-major';
                    li.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:6px;list-style:none;padding:4px 0;';
                    li.innerHTML = `<span style="font-size:0.8rem">${major.jenjang === 'S3' ? '🎓' : major.jenjang === 'S2' ? '📜' : '📖'} ${major.name}</span><span style="flex-shrink:0;padding:1px 7px;border-radius:10px;font-size:0.7rem;font-weight:700;color:${accColor};background:${accBg};border:1px solid ${accColor}40">${major.acc}</span>`;
                    li.addEventListener('click', () => showMajorData(uni, major));
                    majorsList.appendChild(li);
                });
            });
        } else {
            // Format lama — tampil biasa
            uni.majors.forEach(major => {
                const li = document.createElement('li');
                li.className = 'clickable-major';
                li.innerHTML = `🎓 <b>${major.name}</b> <span style="float:right;padding:2px 6px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);border-radius:4px;font-size:0.8em">${major.acc}</span>`;
                li.addEventListener('click', () => showMajorData(uni, major));
                majorsList.appendChild(li);
            });
        }
    } else {
        majorsList.innerHTML = '<li style="color:var(--text-muted);">Data jurusan belum tersedia.</li>';
    }


    // Update Radar Chart
    updateRadarChart(uni);

    // Update Panel SDM (hanya tampil jika data tersedia)
    const sdmCard = document.getElementById('sdmCard');
    if (uni.sdm) {
        sdmCard.style.display = 'block';
        document.getElementById('sdmDosenTotal').textContent = uni.sdm.dosen_total || '-';
        document.getElementById('sdmDosenDoktor').textContent = uni.sdm.dosen_doktor || '-';
        document.getElementById('sdmTendikTotal').textContent = uni.sdm.tendik_total || '-';
        document.getElementById('sdmTendikS2').textContent = uni.sdm.tendik_s2 || '-';

        // Render bar chart jabatan fungsional
        const jabatan = uni.sdm.jabatan_fungsional || {};
        const jabatanLabels = {
            guru_besar: 'Guru Besar',
            lektor_kepala: 'Lektor Kepala',
            lektor: 'Lektor',
            asisten_ahli: 'Asisten Ahli',
            tenaga_pengajar: 'Tenaga Pengajar'
        };
        const maxVal = Math.max(...Object.values(jabatan), 1);
        const colors = ['#f59e0b','#3b82f6','#22c55e','#a78bfa','#94a3b8'];
        let barHtml = '<div style="display:flex; flex-direction:column; gap:6px;">';
        Object.entries(jabatanLabels).forEach(([key, label], i) => {
            const val = jabatan[key] || 0;
            const pct = Math.round((val / maxVal) * 100);
            barHtml += `
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.78rem; color:var(--text-muted); margin-bottom:2px;">
                <span>${label}</span><b style="color:var(--text-main);">${val}</b>
              </div>
              <div style="background:rgba(128,128,128,0.1); border-radius:4px; height:8px; overflow:hidden;">
                <div style="width:${pct}%; background:${colors[i]}; height:100%; border-radius:4px; transition:width 0.6s ease;"></div>
              </div>
            </div>`;
        });
        barHtml += '</div>';
        document.getElementById('sdmJabatanChart').innerHTML = barHtml;

        // Link SINTA
        const sintaLink = document.getElementById('sdmSintaLink');
        if (uni.sinta_id) {
            sintaLink.href = `https://sinta.kemdiktisaintek.go.id/affiliations/profile/${uni.sinta_id}`;
            sintaLink.style.display = 'inline-flex';
        } else {
            sintaLink.style.display = 'none';
        }
    } else {
        sdmCard.style.display = 'none';
    }
}

// 5. Radar Chart (Chart.js)
function updateRadarChart(targetUni) {
    const ctx = document.getElementById('radarChart').getContext('2d');
    const baseUni = universities.find(u => u.id === BASE_UNI_ID);
    
    // Normalize Data (Skala 1-100)
    const normalize = (val, max) => Math.min((val / max) * 100, 100);
    
    const maxStudents = 30000;
    const maxLecturers = 1000;
    const maxProfessors = 100;
    
    // Hitung score akreditasi
    const accToScore = (acc) => {
        if(acc === "Unggul") return 100;
        if(acc === "A") return 85;
        if(acc === "B") return 70;
        return 50;
    };

    const datasetTemplate = (uniObj, isBase) => ({
        label: uniObj.name,
        data: [
            normalize(uniObj.students, maxStudents),
            normalize(uniObj.lecturers, maxLecturers),
            normalize(uniObj.professors, maxProfessors),
            accToScore(uniObj.accreditation),
            uniObj.blu_status ? 100 : 50
        ],
        backgroundColor: isBase ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
        borderColor: isBase ? '#22c55e' : '#3b82f6',
        pointBackgroundColor: isBase ? '#22c55e' : '#3b82f6',
        borderWidth: 2
    });

    const data = {
        labels: ['Jml Mahasiswa', 'Jml Dosen', 'Guru Besar', 'Akreditasi', 'Progress BLU'],
        datasets: []
    };
    
    // Selalu tampilkan base (kampus utama) + target
    data.datasets.push(datasetTemplate(baseUni, true));
    if (targetUni.id !== BASE_UNI_ID) {
        data.datasets.push(datasetTemplate(targetUni, false));
    }

    if (radarChart) {
        radarChart.data = data;
        radarChart.update();
    } else {
        const themeColor = document.documentElement.getAttribute('data-theme') === 'dark' ? '#94a3b8' : '#64748b';
        radarChart = new Chart(ctx, {
            type: 'radar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(128,128,128,0.2)' },
                        grid: { color: 'rgba(128,128,128,0.2)' },
                        pointLabels: { color: themeColor, font: {family: 'Inter', size: 12} },
                        ticks: { display: false } // Sembunyikan angka default
                    }
                },
                plugins: {
                    legend: { labels: { color: themeColor, font: {family: 'Inter'} } }
                }
            }
        });
    }
}

// 6. Tema Terang/Gelap
function initThemeToggle() {
    const btn = document.getElementById('btnThemeToggle');
    btn.addEventListener('click', () => {
        const root = document.documentElement;
        const newTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', newTheme);
        
        // Memaksa chart untuk mengganti warna font
        if(radarChart) updateRadarChart(currentSelectedUni);
    });
}

// 7. Data Manager Modal
function initDataManager() {
    const modal = document.getElementById('dataModal');
    const btnOpen = document.getElementById('btnEditData');
    const btnCancel = document.getElementById('btnCancelEdit');
    const btnSave = document.getElementById('btnSaveEdit');
    const selectBox = document.getElementById('editUniSelect');
    
    btnOpen.addEventListener('click', () => {
        // Update list options
        selectBox.innerHTML = '';
        universities.forEach((u, i) => {
            const opt = document.createElement('option');
            opt.value = i; // array index
            opt.textContent = u.name;
            if(currentSelectedUni && u.id === currentSelectedUni.id) opt.selected = true;
            selectBox.appendChild(opt);
        });
        
        loadFormData();
        modal.classList.add('active');
    });
    
    btnCancel.addEventListener('click', () => modal.classList.remove('active'));
    
    selectBox.addEventListener('change', loadFormData);
    
    function loadFormData() {
        const index = selectBox.value;
        const uni = universities[index];
        document.getElementById('editStudents').value = uni.students;
        document.getElementById('editLecturers').value = uni.lecturers;
        document.getElementById('editProfessors').value = uni.professors || 0;
        document.getElementById('editAccreditation').value = uni.accreditation;
    }
    
    btnSave.addEventListener('click', () => {
        const index = selectBox.value;
        universities[index].students = parseInt(document.getElementById('editStudents').value, 10);
        universities[index].lecturers = parseInt(document.getElementById('editLecturers').value, 10);
        universities[index].professors = parseInt(document.getElementById('editProfessors').value, 10);
        universities[index].accreditation = document.getElementById('editAccreditation').value;
        
        modal.classList.remove('active');
        
        // Re-render UI elements
        renderMarkers();
        updateDashboard(universities[index]);
    });
}

// 8. Logika Modal Jurusan (Deep Dive)
function showMajorData(uni, major) {
    document.getElementById('mjrModalTitle').textContent = major.name;
    document.getElementById('mjrModalUni').textContent = uni.name;
    document.getElementById('mjrModalAcc').textContent = major.acc;
    
    // Siapkan link pencarian Google PDDikti otomatis
    const searchUrl = `https://www.google.com/search?q="${encodeURIComponent(uni.name)}"+"${encodeURIComponent(major.name)}"+akreditasi+site:pddikti.kemdikbud.go.id+OR+site:banpt.or.id`;
    document.getElementById('btnCheckPddikti').href = searchUrl;
    
    document.getElementById('majorModal').classList.add('active');
}

function initMajorModal() {
    document.getElementById('btnCloseMajorModal').addEventListener('click', () => {
        document.getElementById('majorModal').classList.remove('active');
    });
}

// Boot aplikasi
window.onload = () => {
    initMajorModal();
    loadData();
};
