
/* ============================================================
   DATA DEFINITIONS — Tarif BLU per PMK 126/2024
============================================================ */
const API_URL='/api/data';
let dirty=false;

// Custom tables storage (user-created categories)
let customTables={}; // {custom_akademik: [...], custom_penunjang: [...]}
try{
  const saved=localStorage.getItem('tarif_custom_tables');
  if(saved) customTables=JSON.parse(saved)||{};
}catch(e){}

const YEARS_HIST=['2020','2021','2022','2023','2024','2025'];
const YEARS_PROJ=['2026','2027','2028','2029'];
const ALL_YEARS=[...YEARS_HIST,...YEARS_PROJ];

// UKT Historis LENGKAP per Prodi per Kelompok per Tahun
// Sumber: UKT UIN PONOROGO 2013_2026.xls (Sheet 2020–2026)
// Format: ukt[tahun] = [I, II, III, IV, V, VI, VII, KIP]
// 2020–2025: 5 kel + KIP (VI-VII = 0), 2026: 7 kel + KIP (Usulan)
const PRODI_LIST=[
  // === Fakultas Syariah ===
  {nama:'Hukum Keluarga Islam',fak:'Syariah',ukt:{
    '2020':[400000,1300000,1400000,1550000,1800000,0,0,2400000],
    '2021':[400000,1300000,1400000,1550000,1800000,0,0,2400000],
    '2022':[400000,1560000,1680000,1860000,2160000,0,0,2400000],
    '2023':[400000,1560000,1850000,2050000,2350000,0,0,2400000],
    '2024':[400000,1560000,2000000,2500000,3000000,0,0,2400000],
    '2025':[400000,1560000,2000000,2500000,3000000,0,0,2400000],
    '2026':[400000,1560000,2000000,2500000,3000000,3250000,3500000,2400000]}},
  {nama:'Hukum Ekonomi Syariah',fak:'Syariah',ukt:{
    '2020':[400000,1250000,1350000,1500000,1700000,0,0,2400000],
    '2021':[400000,1250000,1350000,1500000,1700000,0,0,2400000],
    '2022':[400000,1375000,1480000,1650000,1870000,0,0,2400000],
    '2023':[400000,1375000,1480000,1650000,1870000,0,0,2400000],
    '2024':[400000,1375000,1600000,1800000,2000000,0,0,2400000],
    '2025':[400000,1375000,1600000,1800000,2000000,0,0,2400000],
    '2026':[400000,1375000,1600000,1800000,2000000,2400000,2600000,2400000]}},
  {nama:'Hukum Tata Negara',fak:'Syariah',ukt:{
    '2020':[400000,1200000,1300000,1450000,1650000,0,0,2400000],
    '2021':[400000,1200000,1300000,1450000,1650000,0,0,2400000],
    '2022':[400000,1320000,1430000,1600000,1800000,0,0,2400000],
    '2023':[400000,1320000,1430000,1600000,1800000,0,0,2400000],
    '2024':[400000,1430000,1750000,2100000,2400000,0,0,2400000],
    '2025':[400000,1430000,1750000,2100000,2400000,0,0,2400000],
    '2026':[400000,1430000,1750000,2100000,2400000,2700000,3000000,2400000]}},
  // === FTIK ===
  {nama:'Pendidikan Agama Islam',fak:'FTIK',ukt:{
    '2020':[400000,1400000,1600000,1800000,2100000,0,0,2400000],
    '2021':[400000,1400000,1600000,1800000,2100000,0,0,2400000],
    '2022':[400000,1750000,2000000,2250000,2625000,0,0,2400000],
    '2023':[400000,1750000,2300000,2600000,3000000,0,0,2400000],
    '2024':[400000,1800000,2400000,3000000,3500000,0,0,2400000],
    '2025':[400000,1800000,2400000,3000000,3500000,0,0,2400000],
    '2026':[400000,1800000,2400000,3000000,3500000,3800000,4000000,2400000]}},
  {nama:'Pendidikan Bahasa Arab',fak:'FTIK',ukt:{
    '2020':[400000,1300000,1400000,1550000,1750000,0,0,2400000],
    '2021':[400000,1300000,1400000,1550000,1750000,0,0,2400000],
    '2022':[400000,1375000,1480000,1650000,1870000,0,0,2400000],
    '2023':[400000,1375000,1480000,1650000,1870000,0,0,2400000],
    '2024':[400000,1430000,1750000,2100000,2400000,0,0,2400000],
    '2025':[400000,1430000,1750000,2100000,2400000,0,0,2400000],
    '2026':[400000,1430000,1750000,2100000,2400000,2700000,3000000,2400000]}},
  {nama:'PGMI',fak:'FTIK',ukt:{
    '2020':[400000,1300000,1400000,1550000,1800000,0,0,2400000],
    '2021':[400000,1300000,1400000,1550000,1800000,0,0,2400000],
    '2022':[400000,1560000,1680000,1860000,2160000,0,0,2400000],
    '2023':[400000,1560000,1850000,2050000,2350000,0,0,2400000],
    '2024':[400000,1560000,2000000,2500000,3000000,0,0,2400000],
    '2025':[400000,1560000,2000000,2500000,3000000,0,0,2400000],
    '2026':[400000,1560000,2000000,2500000,3000000,3500000,4000000,2400000]}},
  {nama:'Tadris Bahasa Inggris',fak:'FTIK',ukt:{
    '2020':[400000,1300000,1400000,1550000,1800000,0,0,2400000],
    '2021':[400000,1300000,1400000,1550000,1800000,0,0,2400000],
    '2022':[400000,1430000,1540000,1700000,1980000,0,0,2400000],
    '2023':[400000,1430000,1540000,1700000,1980000,0,0,2400000],
    '2024':[400000,1430000,1750000,2100000,2400000,0,0,2400000],
    '2025':[400000,1430000,1750000,2100000,2400000,0,0,2400000],
    '2026':[400000,1430000,1750000,2100000,2400000,2700000,3000000,2400000]}},
  {nama:'PIAUD',fak:'FTIK',ukt:{
    '2020':[400000,1300000,1400000,1550000,1800000,0,0,2400000],
    '2021':[400000,1300000,1400000,1550000,1800000,0,0,2400000],
    '2022':[400000,1430000,1540000,1700000,1980000,0,0,2400000],
    '2023':[400000,1430000,1540000,1700000,1980000,0,0,2400000],
    '2024':[400000,1430000,1750000,2100000,2400000,0,0,2400000],
    '2025':[400000,1430000,1750000,2100000,2400000,0,0,2400000],
    '2026':[400000,1430000,1750000,2100000,2400000,2700000,3000000,2400000]}},
  {nama:'Manajemen Pend. Islam',fak:'FTIK',ukt:{
    '2020':[400000,1300000,1400000,1550000,1800000,0,0,2400000],
    '2021':[400000,1300000,1400000,1550000,1800000,0,0,2400000],
    '2022':[400000,1430000,1540000,1700000,1980000,0,0,2400000],
    '2023':[400000,1430000,1700000,1850000,2200000,0,0,2400000],
    '2024':[400000,1500000,1900000,2400000,2800000,0,0,2400000],
    '2025':[400000,1500000,1900000,2400000,2800000,0,0,2400000],
    '2026':[400000,1500000,1900000,2400000,2800000,3200000,3600000,2400000]}},
  {nama:'Tadris IPA',fak:'FTIK',ukt:{
    '2020':[400000,1250000,1350000,1500000,1700000,0,0,2400000],
    '2021':[400000,1250000,1350000,1500000,1700000,0,0,2400000],
    '2022':[400000,1500000,1625000,1800000,2040000,0,0,2400000],
    '2023':[400000,1500000,1800000,2000000,2250000,0,0,2400000],
    '2024':[400000,1560000,2000000,2500000,3000000,0,0,2400000],
    '2025':[400000,1560000,2000000,2500000,3000000,0,0,2400000],
    '2026':[400000,1560000,2000000,2500000,3000000,3500000,4000000,2400000]}},
  {nama:'Tadris IPS',fak:'FTIK',ukt:{
    '2020':[400000,1250000,1350000,1500000,1700000,0,0,2400000],
    '2021':[400000,1250000,1350000,1500000,1700000,0,0,2400000],
    '2022':[400000,1375000,1480000,1650000,1870000,0,0,2400000],
    '2023':[400000,1375000,1480000,1650000,1870000,0,0,2400000],
    '2024':[400000,1430000,1750000,2100000,2100000,0,0,2400000],
    '2025':[400000,1430000,1750000,2100000,2100000,0,0,2400000],
    '2026':[400000,1430000,1750000,2100000,2400000,2700000,3000000,2400000]}},
  {nama:'Tadris Bahasa Indonesia',fak:'FTIK',ukt:{
    '2020':[0,0,0,0,0,0,0,0],'2021':[0,0,0,0,0,0,0,0],
    '2022':[400000,1200000,1300000,1450000,1650000,0,0,2400000],
    '2023':[400000,1200000,1300000,1450000,1650000,0,0,2400000],
    '2024':[400000,1375000,1600000,1800000,2000000,0,0,2400000],
    '2025':[400000,1375000,1600000,1800000,2000000,0,0,2400000],
    '2026':[400000,1375000,1600000,1800000,2000000,2500000,3000000,2400000]}},
  {nama:'Tadris Matematika',fak:'FTIK',ukt:{
    '2020':[0,0,0,0,0,0,0,0],'2021':[0,0,0,0,0,0,0,0],
    '2022':[400000,1200000,1300000,1450000,1650000,0,0,2400000],
    '2023':[400000,1200000,1300000,1450000,1650000,0,0,2400000],
    '2024':[400000,1375000,1600000,1800000,2000000,0,0,2400000],
    '2025':[400000,1375000,1600000,1800000,2000000,0,0,2400000],
    '2026':[400000,1375000,1600000,1800000,2000000,2500000,3000000,2400000]}},
  // === FUAD ===
  {nama:'Ilmu Al-Quran & Tafsir',fak:'FUAD',ukt:{
    '2020':[400000,1200000,1300000,1450000,1650000,0,0,2400000],
    '2021':[400000,1200000,1300000,1450000,1650000,0,0,2400000],
    '2022':[400000,1200000,1300000,1450000,1650000,0,0,2400000],
    '2023':[400000,1200000,1300000,1450000,1650000,0,0,2400000],
    '2024':[400000,1200000,1400000,1600000,1900000,0,0,2400000],
    '2025':[400000,1200000,1400000,1600000,1900000,0,0,2400000],
    '2026':[400000,1200000,1400000,1600000,1900000,2300000,2600000,2400000]}},
  {nama:'Komunikasi Penyiaran Islam',fak:'FUAD',ukt:{
    '2020':[400000,1250000,1350000,1500000,1750000,0,0,2400000],
    '2021':[400000,1250000,1350000,1500000,1750000,0,0,2400000],
    '2022':[400000,1375000,1480000,1650000,1870000,0,0,2400000],
    '2023':[400000,1375000,1550000,1750000,1950000,0,0,2400000],
    '2024':[400000,1430000,1750000,2100000,2400000,0,0,2400000],
    '2025':[400000,1430000,1750000,2100000,2400000,0,0,2400000],
    '2026':[400000,1430000,1750000,2100000,2400000,2700000,3000000,2400000]}},
  {nama:'Bimbingan Konseling Islam',fak:'FUAD',ukt:{
    '2020':[400000,1200000,1300000,1450000,1650000,0,0,2400000],
    '2021':[400000,1200000,1300000,1450000,1650000,0,0,2400000],
    '2022':[400000,1200000,1300000,1450000,1650000,0,0,2400000],
    '2023':[400000,1200000,1300000,1450000,1650000,0,0,2400000],
    '2024':[400000,1375000,1600000,1800000,2000000,0,0,2400000],
    '2025':[400000,1375000,1600000,1800000,2000000,0,0,2400000],
    '2026':[400000,1375000,1600000,1800000,2000000,2300000,2600000,2400000]}},
  {nama:'Sejarah Peradaban Islam',fak:'FUAD',ukt:{
    '2020':[0,0,0,0,0,0,0,0],'2021':[0,0,0,0,0,0,0,0],
    '2022':[400000,1000000,1100000,1200000,1400000,0,0,2400000],
    '2023':[400000,1000000,1100000,1200000,1400000,0,0,2400000],
    '2024':[400000,1000000,1200000,1400000,1500000,0,0,2400000],
    '2025':[400000,1000000,1200000,1400000,1500000,0,0,2400000],
    '2026':[400000,1000000,1200000,1400000,1500000,1600000,1700000,2400000]}},
  // === FEBI ===
  {nama:'Ekonomi Syariah',fak:'FEBI',ukt:{
    '2020':[400000,1400000,1600000,1800000,2100000,0,0,2400000],
    '2021':[400000,1400000,1600000,1800000,2100000,0,0,2400000],
    '2022':[400000,1750000,2000000,2250000,2625000,0,0,2400000],
    '2023':[400000,1750000,2300000,2600000,3000000,0,0,2400000],
    '2024':[400000,1800000,2400000,3000000,3500000,0,0,2400000],
    '2025':[400000,1800000,2400000,3000000,3500000,0,0,2400000],
    '2026':[400000,1800000,2400000,3000000,3500000,3750000,4000000,2400000]}},
  {nama:'Perbankan Syariah',fak:'FEBI',ukt:{
    '2020':[400000,1400000,1600000,1800000,2100000,0,0,2400000],
    '2021':[400000,1400000,1600000,1800000,2100000,0,0,2400000],
    '2022':[400000,1750000,2000000,2250000,2625000,0,0,2400000],
    '2023':[400000,1750000,2200000,2500000,2900000,0,0,2400000],
    '2024':[400000,1800000,2400000,3000000,3500000,0,0,2400000],
    '2025':[400000,1800000,2400000,3000000,3500000,0,0,2400000],
    '2026':[400000,1800000,2400000,3000000,3500000,3650000,3900000,2400000]}},
  {nama:'Manajemen Zakat & Wakaf',fak:'FEBI',ukt:{
    '2020':[400000,1000000,1100000,1200000,1400000,0,0,2400000],
    '2021':[400000,1000000,1100000,1200000,1400000,0,0,2400000],
    '2022':[400000,1000000,1100000,1200000,1400000,0,0,2400000],
    '2023':[400000,1000000,1100000,1200000,1400000,0,0,2400000],
    '2024':[400000,1000000,1200000,1400000,1500000,0,0,2400000],
    '2025':[400000,1000000,1200000,1400000,1500000,0,0,2400000],
    '2026':[400000,1000000,1200000,1400000,1500000,1600000,1700000,2400000]}},
  {nama:'Manajemen Bisnis Syariah',fak:'FEBI',ukt:{
    '2020':[0,0,0,0,0,0,0,0],'2021':[0,0,0,0,0,0,0,0],
    '2022':[0,0,0,0,0,0,0,0],'2023':[0,0,0,0,0,0,0,0],
    '2024':[400000,1500000,1800000,2200000,2500000,0,0,2400000],
    '2025':[400000,1500000,1800000,2200000,2500000,0,0,2400000],
    '2026':[400000,1500000,1800000,2200000,2500000,3250000,3750000,2400000]}},
  {nama:'Akuntansi Syariah',fak:'FEBI',ukt:{
    '2020':[0,0,0,0,0,0,0,0],'2021':[0,0,0,0,0,0,0,0],
    '2022':[0,0,0,0,0,0,0,0],'2023':[0,0,0,0,0,0,0,0],
    '2024':[400000,1500000,1800000,2200000,2500000,0,0,2400000],
    '2025':[400000,1500000,1800000,2200000,2500000,0,0,2400000],
    '2026':[400000,1500000,1800000,2200000,2500000,3000000,3500000,2400000]}},
];

// Pascasarjana (S2) — mulai T.A. 2024/2025
const PASCA_LIST=[
  {nama:'Ekonomi Syariah',ukt:5000000},
  {nama:'Manajemen Pendidikan Islam',ukt:5000000},
  {nama:'Pendidikan Bahasa Arab',ukt:3750000},
  {nama:'Hukum Keluarga Islam',ukt:5000000},
  {nama:'Pendidikan Agama Islam',ukt:5000000},
];

const UKT_YEARS=['2020','2021','2022','2023','2024','2025','2026'];
const KEL_LABELS=['I','II','III','IV','V','VI','VII','KIP'];

// Generate UKT rows — per prodi × per kelompok × per tahun
function generateUKTRows(){
  const rows=[];
  PRODI_LIST.forEach((p,i)=>{
    KEL_LABELS.forEach((kel,ki)=>{
      const row=[
        ki===0?String(i+1):'',
        ki===0?p.nama:'',
        'Kel '+kel
      ];
      UKT_YEARS.forEach(y=>{
        const v=p.ukt[y]?p.ukt[y][ki]:0;
        row.push(v?v.toLocaleString('id-ID'):(ki<5?'—':''));
      });
      rows.push(row);
    });
  });
  return rows;
}

// Table header & assign
const SECTIONS=[
  {
    id:'akademik', name:'Tarif Layanan Akademik', icon:'fa-graduation-cap', color:'#2563eb', bgColor:'#eff6ff',
    desc:'UKT, biaya pendidikan, seleksi masuk (Pasal 2 Ayat 1 PMK 126/2024)',
    cssClass:'u-akademik',
    tables:[
      {id:'tf-seleksi', title:'Tarif Seleksi Ujian Masuk', ref:'PMK 126 Ps.2(1)(a)',
        unitPengisi:'Sub Bag. Layanan Akademik', unitIcon:'fa-graduation-cap', unitColor:'#2563eb',
        headers:['No','Jenis Seleksi','Satuan',...ALL_YEARS,'Ceiling PMK'],
        rows:[
          ['1','SNBT/UTBK-SNBT','Rp/peserta',...ALL_YEARS.map(()=>'...'),''],
          ['2','SPAN-PTKIN (Jalur Prestasi)','Rp/peserta',...ALL_YEARS.map(()=>'...'),''],
          ['3','UM-PTKIN (Jalur Mandiri)','Rp/peserta',...ALL_YEARS.map(()=>'...'),''],
          ['4','Seleksi Pascasarjana','Rp/peserta',...ALL_YEARS.map(()=>'...'),''],
        ]},
      {id:'tf-ukt', title:'UKT per Program Studi — Kelompok I–VII + KIP (2020–2026)',
        ref:'KMA 1375/2025 + Usulan 2026',
        unitPengisi:'Biro AUAK (Keuangan + Akademik)', unitIcon:'fa-coins', unitColor:'#dc2626',
        headers:['No','Program Studi','Kel.',...UKT_YEARS.map((y,i)=>i===6?y+' (Usulan)':y)],
        rows:generateUKTRows()
      },
      {id:'tf-pasca', title:'Biaya Pendidikan Pascasarjana (S2) — T.A. 2024/2025', ref:'PMK 126 Ps.2(1)(c)',
        unitPengisi:'Pascasarjana', unitIcon:'fa-user-graduate', unitColor:'#d97706',
        headers:['No','Program','Jenjang','Satuan','UKT/smt (Rp)','Ceiling PMK',...YEARS_PROJ],
        rows:[
          ['1','Ekonomi Syariah','S2','Rp/smt','5.000.000','','...','...','...','...'],
          ['2','Manajemen Pendidikan Islam','S2','Rp/smt','5.000.000','','...','...','...','...'],
          ['3','Pendidikan Bahasa Arab','S2','Rp/smt','3.750.000','','...','...','...','...'],
          ['4','Hukum Keluarga Islam','S2','Rp/smt','5.000.000','','...','...','...','...'],
          ['5','Pendidikan Agama Islam','S2','Rp/smt','5.000.000','','...','...','...','...'],
        ]},
      {id:'tf-ipi', title:'Iuran Pengembangan Institusi', ref:'PMK 126 Ps.2(1)(d)',
        unitPengisi:'Biro AUAK — Keuangan', unitIcon:'fa-coins', unitColor:'#dc2626',
        headers:['No','Jenis Iuran','Satuan',...ALL_YEARS,'Ceiling PMK'],
        rows:[
          ['1','Iuran Pengembangan Institusi - Reguler','Rp/mhs',...ALL_YEARS.map(()=>'...'),''],
          ['2','Iuran Pengembangan Institusi - Non-Reguler','Rp/mhs',...ALL_YEARS.map(()=>'...'),''],
        ]},
    ]
  },
  {
    id:'penunjang', name:'Tarif Layanan Penunjang Akademik', icon:'fa-building', color:'#0891b2', bgColor:'#ecfeff',
    desc:'Fasilitas, sewa, layanan penunjang (Pasal 2 Ayat 2 PMK 126/2024)',
    cssClass:'u-umum',
    tables:[
      {id:'tf-asrama', title:'Tarif Asrama / Ma\'had Al-Jami\'ah', ref:'PMK 126 Ps.2(2)(a)',
        unitPengisi:'Sub Bag. TU & Perlengkapan', unitIcon:'fa-building', unitColor:'#0891b2',
        headers:['No','Jenis Layanan','Satuan',...ALL_YEARS,'Ceiling PMK'],
        rows:[
          ['1','Asrama Putra - Reguler','Rp/smt',...ALL_YEARS.map(()=>'...'),''],
          ['2','Asrama Putri - Reguler','Rp/smt',...ALL_YEARS.map(()=>'...'),''],
          ['3','Asrama VIP/Premium','Rp/smt',...ALL_YEARS.map(()=>'...'),''],
          ['4','Laundry & Kebersihan','Rp/smt',...ALL_YEARS.map(()=>'...'),''],
        ]},
      {id:'tf-perpus', title:'Tarif Layanan Perpustakaan', ref:'PMK 126 Ps.2(2)(b)',
        unitPengisi:'Perpustakaan', unitIcon:'fa-book', unitColor:'#9333ea',
        headers:['No','Jenis Layanan','Satuan',...ALL_YEARS,'Ceiling PMK'],
        rows:[
          ['1','Kartu Anggota Luar','Rp/tahun',...ALL_YEARS.map(()=>'...'),''],
          ['2','Denda Keterlambatan','Rp/hari',...ALL_YEARS.map(()=>'...'),''],
          ['3','Layanan Referensi Khusus','Rp/kali',...ALL_YEARS.map(()=>'...'),''],
        ]},
      {id:'tf-lab', title:'Tarif Laboratorium', ref:'PMK 126 Ps.2(2)(c)',
        unitPengisi:'Sub Bag. Layanan Akademik', unitIcon:'fa-flask', unitColor:'#2563eb',
        headers:['No','Jenis Lab','Satuan',...ALL_YEARS,'Ceiling PMK'],
        rows:[
          ['1','Lab Komputer/IT','Rp/smt',...ALL_YEARS.map(()=>'...'),''],
          ['2','Lab Bahasa','Rp/smt',...ALL_YEARS.map(()=>'...'),''],
          ['3','Lab Micro-Teaching','Rp/smt',...ALL_YEARS.map(()=>'...'),''],
          ['4','Lab Sains','Rp/smt',...ALL_YEARS.map(()=>'...'),''],
        ]},
      {id:'tf-sewa', title:'Tarif Sewa Gedung & Fasilitas', ref:'PMK 126 Ps.2(2)(d)',
        unitPengisi:'Sub Bag. TU & Perlengkapan', unitIcon:'fa-building', unitColor:'#0891b2',
        headers:['No','Fasilitas','Satuan',...ALL_YEARS,'Ceiling PMK'],
        rows:[
          ['1','Aula/Auditorium','Rp/hari',...ALL_YEARS.map(()=>'...'),''],
          ['2','Ruang Kelas','Rp/hari',...ALL_YEARS.map(()=>'...'),''],
          ['3','Lapangan Olahraga','Rp/hari',...ALL_YEARS.map(()=>'...'),''],
          ['4','Masjid/Mushola (acara eksternal)','Rp/hari',...ALL_YEARS.map(()=>'...'),''],
        ]},
      {id:'tf-it', title:'Tarif Layanan IT / UPT TIPD', ref:'PMK 126 Ps.2(2)(e)',
        unitPengisi:'UPT TIPD', unitIcon:'fa-server', unitColor:'#0284c7',
        headers:['No','Jenis Layanan','Satuan',...ALL_YEARS,'Ceiling PMK'],
        rows:[
          ['1','Hosting & Domain Website','Rp/tahun',...ALL_YEARS.map(()=>'...'),''],
          ['2','Email Institusi','Rp/akun/th',...ALL_YEARS.map(()=>'...'),''],
          ['3','Pembuatan Aplikasi','Rp/proyek',...ALL_YEARS.map(()=>'...'),''],
          ['4','Sertifikasi IT','Rp/peserta',...ALL_YEARS.map(()=>'...'),''],
        ]},
      {id:'tf-sertifikasi', title:'Tarif Sertifikasi & Pelatihan', ref:'PMK 126 Ps.2(2)(f)',
        unitPengisi:'LP2M', unitIcon:'fa-flask', unitColor:'#16a34a',
        headers:['No','Jenis Program','Satuan',...ALL_YEARS,'Ceiling PMK'],
        rows:[
          ['1','LSP-P1 Uji Kompetensi','Rp/peserta',...ALL_YEARS.map(()=>'...'),''],
          ['2','Pelatihan Profesional','Rp/peserta',...ALL_YEARS.map(()=>'...'),''],
          ['3','Diklat Bahasa Arab/Inggris','Rp/peserta',...ALL_YEARS.map(()=>'...'),''],
          ['4','Workshop & Seminar Berbayar','Rp/peserta',...ALL_YEARS.map(()=>'...'),''],
        ]},
      {id:'tf-kesehatan', title:'Tarif Klinik Kesehatan Kampus', ref:'PMK 126 Ps.2(2)(g)',
        unitPengisi:'Sub Bag. TU & Perlengkapan', unitIcon:'fa-heart-pulse', unitColor:'#0891b2',
        headers:['No','Jenis Layanan','Satuan',...ALL_YEARS,'Ceiling PMK'],
        rows:[
          ['1','Pemeriksaan Umum','Rp/kunjungan',...ALL_YEARS.map(()=>'...'),''],
          ['2','Rujukan & Surat Keterangan','Rp/surat',...ALL_YEARS.map(()=>'...'),''],
          ['3','Layanan Konseling','Rp/sesi',...ALL_YEARS.map(()=>'...'),''],
        ]},
      {id:'tf-karier', title:'Tarif Layanan Pusat Pengembangan Karir', ref:'PMK 126 Ps.2(2)(h)',
        unitPengisi:'LPM — Pusat Pengembangan Karir', unitIcon:'fa-briefcase', unitColor:'#7c3aed',
        headers:['No','Jenis Layanan','Satuan',...ALL_YEARS,'Ceiling PMK'],
        rows:[
          ['1','Tracer Study Kerjasama','Rp/batch',...ALL_YEARS.map(()=>'...'),''],
          ['2','Job Fair & Career Expo','Rp/booth',...ALL_YEARS.map(()=>'...'),''],
          ['3','Pelatihan Karier/Soft Skill','Rp/peserta',...ALL_YEARS.map(()=>'...'),''],
        ]},
    ]
  },
];



/* ============================================================
   UI RENDERING
============================================================ */
function renderSidebar(){
  const sb=document.getElementById('sidebar');
  let html=`
    <div class="sb-group-header"><i class="fa-solid fa-layer-group"></i> Kategori Tarif</div>
  `;
  SECTIONS.forEach((s,i)=>{
    html+=`<div class="sb-item ${s.cssClass} ${i===0?'active':''}" onclick="switchSection('${s.id}')" id="sb-${s.id}">
      <i class="fa-solid ${s.icon}"></i> ${s.name}
    </div>`;
  });
  // Compliance dashboard
  html+=`<div class="sb-item u-compliance" onclick="switchSection('compliance')" id="sb-compliance">
    <i class="fa-solid fa-chart-pie"></i> Compliance Dashboard
  </div>`;
  html+=`
    <div class="sb-progress-wrap">
      <div class="sb-progress-label"><i class="fa-solid fa-chart-simple"></i> Pengisian Data</div>
      <div class="sb-progress-bar"><div class="sb-progress-fill" id="progFill"></div></div>
      <div class="sb-progress-pct" id="progPct">0%</div>
    </div>
    <div class="sb-actions">
      <div class="user-label" id="userLabel"><i class="fa-solid fa-user"></i> Mode Pengisian Data</div>
      <button class="sb-btn primary" onclick="saveAll()"><i class="fa-solid fa-cloud-arrow-up"></i> Simpan ke Server</button>
      <button class="sb-btn export" onclick="exportCSV()"><i class="fa-solid fa-file-csv"></i> Export CSV</button>
      <button class="sb-btn secondary" onclick="if(confirm('Reset semua data tarif?'))resetAll()"><i class="fa-solid fa-rotate-left"></i> Reset</button>
    </div>
  `;
  sb.innerHTML=html;
}

function renderMain(){
  const main=document.getElementById('mainContent');
  let html='';
  SECTIONS.forEach((s,i)=>{
    html+=`<div class="section-block ${i===0?'active':''}" id="block-${s.id}">`;
    html+=`<div class="section-head" style="border-left:4px solid ${s.color}">
      <div class="section-icon" style="color:${s.color}"><i class="fa-solid ${s.icon}"></i></div>
      <div class="section-name">${s.name}</div>
      <div class="section-desc">${s.desc}</div>
      <div class="section-badge" style="background:${s.bgColor};color:${s.color}">
        <i class="fa-solid fa-scale-balanced"></i> PMK 126/PMK.05/2024
      </div>
    </div>`;
    s.tables.forEach(t=>{
      html+=renderTable(t,s);
    });
    // Render custom tables for this section
    const customKey='custom_'+s.id;
    (customTables[customKey]||[]).forEach((ct,ci)=>{
      html+=renderTable(ct,s,ci,customKey);
    });
    // Add category button
    html+=`<button class="add-category-btn" onclick="openAddModal('${s.id}')">
      <i class="fa-solid fa-plus"></i> Tambah Kategori Tarif Baru
    </button>`;
    html+=`</div>`;
  });
  // Compliance dashboard
  html+=renderComplianceDashboard();
  main.innerHTML=html;
}

function renderTable(t,section,customIdx,customKey){
  const isUKT=t.id==='tf-ukt';
  const isCustom=typeof customIdx==='number';
  let html=`<div class="tbl-card" id="card-${t.id}">
    <div class="tbl-card-head" style="border-left:3px solid ${section.color}">
      <i class="fa-solid ${t.icon||section.icon}" style="color:${section.color}"></i>
      <span class="tbl-card-title">${t.title}</span>`;
  html+=`<span class="tbl-card-ref">${t.ref}</span>`;
  if(isCustom){
    html+=`<button class="tbl-delete-btn" onclick="deleteCustomTable('${customKey}',${customIdx})" title="Hapus kategori ini">
      <i class="fa-solid fa-trash-can"></i> Hapus
    </button>`;
  }
  html+=`</div>`;
  if(t.unitPengisi){
    html+=`<div class="unit-badge-row">
      <span class="unit-badge" style="color:${t.unitColor||'var(--muted)'};border-color:${t.unitColor||'var(--border)'};background:${t.unitColor||'var(--muted)'}11">
        <i class="fa-solid ${t.unitIcon||'fa-user'}"></i> Pengisi: ${t.unitPengisi}
      </span>
    </div>`;
  }
  html+=`<div class="tbl-card-body">
    <table class="data-tbl" id="${t.id}"><thead><tr>`;
  t.headers.forEach((h,hi)=>{
    const isCeiling=h.includes('Ceiling');
    html+=`<th${isCeiling?' class="col-ceiling"':''}>${h}</th>`;
  });
  html+=`<th class="col-act"></th></tr></thead><tbody>`;
  t.rows.forEach((row,ri)=>{
    const isSection=row[0]===''&&row[1]===''&&row.length<=3;
    if(isSection){
      html+=`<tr class="section-row">${row.map(c=>`<td>${c}</td>`).join('')}<td></td></tr>`;
      return;
    }
    html+=`<tr>`;
    row.forEach((cell,ci)=>{
      const hdr=t.headers[ci]||'';
      const isCeiling=hdr.includes('Ceiling');
      const isStatus=hdr==='Status';
      const isNo=ci===0;
      const isLabel=ci===1||(isUKT&&ci<=2);
      const isUKTVal=isUKT&&ci===3; // current UKT value
      if(isStatus){
        html+=`<td style="text-align:center;padding:0.3rem"><span class="status-na"><i class="fa-solid fa-circle-minus"></i></span></td>`;
      } else if(isCeiling){
        html+=`<td class="ceiling-cell"><input class="cell-input ceiling-input" value="${cell}" placeholder="..." oninput="markDirty();updateCompliance()"/></td>`;
      } else if(isNo){
        html+=`<td><input class="cell-input cell-readonly" value="${cell}" readonly tabindex="-1"/></td>`;
      } else if(isLabel){
        html+=`<td><input class="cell-input cell-label" value="${cell}" ${isUKT?'readonly tabindex="-1"':''} oninput="markDirty()"/></td>`;
      } else if(isUKTVal){
        html+=`<td><input class="cell-input cell-readonly" value="${cell}" readonly tabindex="-1"/></td>`;
      } else {
        html+=`<td><input class="cell-input" value="${cell}" oninput="markDirty();updateCompliance()" placeholder="..."/></td>`;
      }
    });
    html+=`<td class="col-act"><button class="row-del" onclick="deleteRow(this)" title="Hapus baris"><i class="fa-solid fa-trash-can"></i></button></td>`;
    html+=`</tr>`;
  });
  html+=`</tbody></table>`;
  if(!isUKT){
    const colCount=t.headers.length;
    html+=`<button class="add-row-btn" onclick="addRow('${t.id}',${colCount})"><i class="fa-solid fa-plus"></i> Tambah Baris</button>`;
  }
  html+=`</div></div>`;
  return html;
}

function renderComplianceDashboard(){
  return `<div class="section-block" id="block-compliance">
    <div class="section-head" style="border-left:4px solid #059669">
      <div class="section-icon" style="color:#059669"><i class="fa-solid fa-chart-pie"></i></div>
      <div class="section-name">Compliance Dashboard</div>
      <div class="section-desc">Validasi tarif aktual vs ceiling PMK 126/2024. Status otomatis berubah saat data terisi.</div>
      <div class="section-badge" style="background:#ecfdf5;color:#059669">
        <i class="fa-solid fa-shield-halved"></i> Auto-Validasi Real-time
      </div>
    </div>
    <div class="compliance-grid" id="compGrid">
      <div class="comp-card">
        <div class="comp-icon status-ok"><i class="fa-solid fa-circle-check"></i></div>
        <div class="comp-count" id="comp-ok">0</div>
        <div class="comp-label">Compliant</div>
        <div class="comp-pct status-ok" id="comp-ok-pct">0%</div>
      </div>
      <div class="comp-card">
        <div class="comp-icon status-warn"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <div class="comp-count" id="comp-warn">0</div>
        <div class="comp-label">Mendekati Ceiling (&gt;80%)</div>
        <div class="comp-pct status-warn" id="comp-warn-pct">0%</div>
      </div>
      <div class="comp-card">
        <div class="comp-icon status-err"><i class="fa-solid fa-circle-xmark"></i></div>
        <div class="comp-count" id="comp-err">0</div>
        <div class="comp-label">Melebihi Ceiling</div>
        <div class="comp-pct status-err" id="comp-err-pct">0%</div>
      </div>
      <div class="comp-card">
        <div class="comp-icon status-na"><i class="fa-solid fa-circle-minus"></i></div>
        <div class="comp-count" id="comp-na">0</div>
        <div class="comp-label">Belum Diisi / Tanpa Ceiling</div>
        <div class="comp-pct status-na" id="comp-na-pct">0%</div>
      </div>
    </div>
    <div class="tbl-card">
      <div class="tbl-card-head" style="border-left:3px solid #059669">
        <i class="fa-solid fa-bullseye" style="color:#059669"></i>
        <span class="tbl-card-title">Target Penetapan Tarif — RSB 2025-2029</span>
        <span class="tbl-card-ref">Lampiran II RSB</span>
      </div>
      <div class="tbl-card-body">
        <div style="display:flex;align-items:center;gap:1rem;padding:0.5rem">
          <div style="flex:1">
            <div class="target-label"><span>Jenis tarif ditetapkan</span><span id="target-count">0 / 10</span></div>
            <div class="progress-track"><div class="progress-fill" id="target-fill" style="width:0%;background:linear-gradient(90deg,#059669,#10b981)"></div></div>
          </div>
        </div>
        <table class="data-tbl" id="tbl-compliance-detail" style="margin-top:0.5rem">
          <thead><tr><th>No</th><th>Jenis Tarif</th><th>Tarif Terbaru (Rp)</th><th>Ceiling PMK (Rp)</th><th>Rasio</th><th>Status</th></tr></thead>
          <tbody id="compliance-tbody"></tbody>
        </table>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   CUSTOM TABLE MANAGEMENT
============================================================ */
function openAddModal(sectionId){
  document.getElementById('modal-section').value=sectionId;
  document.getElementById('modal-title').value='';
  document.getElementById('modal-unit').value='';
  document.getElementById('modal-ref').value='PMK 126 (custom)';
  document.getElementById('modal-icon').value='fa-file-invoice';
  document.getElementById('addModal').classList.add('show');
  setTimeout(()=>document.getElementById('modal-title').focus(),100);
}
function closeAddModal(){
  document.getElementById('addModal').classList.remove('show');
}

function createCustomTable(){
  const sectionId=document.getElementById('modal-section').value;
  const title=document.getElementById('modal-title').value.trim();
  const unit=document.getElementById('modal-unit').value.trim();
  const ref=document.getElementById('modal-ref').value.trim();
  const icon=document.getElementById('modal-icon').value;

  if(!title){showToast('<i class="fa-solid fa-circle-exclamation"></i> Nama kategori harus diisi');return;}

  const customKey='custom_'+sectionId;
  if(!customTables[customKey]) customTables[customKey]=[];

  const section=SECTIONS.find(s=>s.id===sectionId);
  const newTable={
    id:'tf-custom-'+Date.now(),
    title:title,
    ref:ref||'Custom',
    icon:icon,
    unitPengisi:unit||'Belum ditentukan',
    unitIcon:icon,
    unitColor:section?section.color:'#64748b',
    headers:['No','Jenis Layanan','Satuan',...ALL_YEARS,'Ceiling PMK'],
    rows:[
      ['1','','Rp/...',...ALL_YEARS.map(()=>''),''],
      ['2','','Rp/...',...ALL_YEARS.map(()=>''),''],
      ['3','','Rp/...',...ALL_YEARS.map(()=>''),''],
    ]
  };

  customTables[customKey].push(newTable);
  saveCustomTables();
  closeAddModal();

  // Re-render
  renderSidebar();
  renderMain();
  switchSection(sectionId);
  showToast(`<i class="fa-solid fa-circle-check"></i> Kategori "${title}" ditambahkan`);
  markDirty();
}

function deleteCustomTable(customKey,idx){
  const tbl=customTables[customKey]?.[idx];
  if(!tbl)return;
  if(!confirm(`Hapus kategori "${tbl.title}"? Data di dalamnya akan hilang.`))return;
  customTables[customKey].splice(idx,1);
  saveCustomTables();
  const sectionId=customKey.replace('custom_','');
  renderSidebar();
  renderMain();
  switchSection(sectionId);
  showToast(`<i class="fa-solid fa-trash-can"></i> Kategori "${tbl.title}" dihapus`);
  markDirty();
}

function saveCustomTables(){
  localStorage.setItem('tarif_custom_tables',JSON.stringify(customTables));
}

/* ============================================================
   NAVIGATION
============================================================ */
function switchSection(id){
  document.querySelectorAll('.section-block').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach(i=>i.classList.remove('active'));
  const block=document.getElementById('block-'+id);
  const sbItem=document.getElementById('sb-'+id);
  if(block)block.classList.add('active');
  if(sbItem)sbItem.classList.add('active');
  if(id==='compliance')updateCompliance();
}

/* ============================================================
   ROW MANAGEMENT
============================================================ */
function addRow(tblId,colCount){
  const tbl=document.getElementById(tblId);
  if(!tbl)return;
  const tbody=tbl.querySelector('tbody');
  const rows=[...tbody.querySelectorAll('tr:not(.section-row)')];
  const nextNo=rows.length+1;
  const tr=document.createElement('tr');
  let html='';
  for(let i=0;i<colCount;i++){
    const hdr=tbl.querySelectorAll('thead th')[i]?.textContent||'';
    const isCeiling=hdr.includes('Ceiling');
    if(i===0) html+=`<td><input class="cell-input cell-readonly" value="${nextNo}" readonly tabindex="-1"/></td>`;
    else if(i===1) html+=`<td><input class="cell-input cell-label" value="" oninput="markDirty()" placeholder="Nama tarif..."/></td>`;
    else if(isCeiling) html+=`<td class="ceiling-cell"><input class="cell-input ceiling-input" value="" placeholder="..." oninput="markDirty();updateCompliance()"/></td>`;
    else html+=`<td><input class="cell-input" value="" oninput="markDirty();updateCompliance()" placeholder="..."/></td>`;
  }
  html+=`<td class="col-act"><button class="row-del" onclick="deleteRow(this)" title="Hapus baris"><i class="fa-solid fa-trash-can"></i></button></td>`;
  tr.innerHTML=html;
  tbody.appendChild(tr);
  tr.querySelector('.cell-label')?.focus();
  markDirty();
}

function deleteRow(btn){
  const tr=btn.closest('tr');
  const tbody=tr.closest('tbody');
  const rows=[...tbody.querySelectorAll('tr:not(.section-row)')];
  if(rows.length<=1){showToast('<i class="fa-solid fa-circle-info"></i> Minimal 1 baris data');return;}
  tr.remove();
  // Renumber
  let n=1;
  tbody.querySelectorAll('tr:not(.section-row)').forEach(r=>{
    const noInput=r.querySelector('.cell-readonly');
    if(noInput&&noInput.value)noInput.value=n++;
  });
  markDirty();
}

/* ============================================================
   COMPLIANCE VALIDATION
============================================================ */
function updateCompliance(){
  let ok=0,warn=0,err=0,na=0,total=0,tariffSet=0;
  const details=[];

  SECTIONS.forEach(s=>{
    const allTables=[...s.tables];
    const customKey='custom_'+s.id;
    (customTables[customKey]||[]).forEach(ct=>allTables.push(ct));
    allTables.forEach(t=>{
      if(t.id==='tf-ukt')return; // UKT handled separately
      const tbl=document.getElementById(t.id);
      if(!tbl)return;
      tbl.querySelectorAll('tbody tr:not(.section-row)').forEach(tr=>{
        const inputs=[...tr.querySelectorAll('.cell-input')];
        const labelInput=inputs.find(i=>i.classList.contains('cell-label'));
        const ceilingInput=inputs.find(i=>i.classList.contains('ceiling-input'));
        const label=labelInput?labelInput.value.trim():'';
        if(!label)return;
        total++;

        // Get latest year value (2025 baseline or latest filled)
        let latestVal=0;
        const dataInputs=inputs.filter(i=>!i.classList.contains('cell-readonly')&&!i.classList.contains('cell-label')&&!i.classList.contains('ceiling-input'));
        for(let idx=dataInputs.length-1;idx>=0;idx--){
          const v=parseFloat(dataInputs[idx].value.replace(/[^0-9.-]/g,''));
          if(!isNaN(v)&&v>0){latestVal=v;break;}
        }
        const ceilingVal=ceilingInput?parseFloat(ceilingInput.value.replace(/[^0-9.-]/g,'')):0;

        let status='na',statusIcon='fa-circle-minus',statusClass='status-na',ratio='-';
        if(latestVal>0)tariffSet++;

        if(latestVal>0&&ceilingVal>0){
          const r=latestVal/ceilingVal;
          ratio=(r*100).toFixed(1)+'%';
          if(r<=0.8){status='ok';statusIcon='fa-circle-check';statusClass='status-ok';ok++;}
          else if(r<=1.0){status='warn';statusIcon='fa-triangle-exclamation';statusClass='status-warn';warn++;}
          else{status='err';statusIcon='fa-circle-xmark';statusClass='status-err';err++;}
        } else {na++;}

        // Update status cell in table
        const statusCell=tr.querySelector('td:last-of-type')?.previousElementSibling;
        // skip — status column only in UKT

        details.push({label,latest:latestVal,ceiling:ceilingVal,ratio,status,statusIcon,statusClass});
      });
    });
  });

  // Update dashboard cards
  const setEl=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  setEl('comp-ok',ok);setEl('comp-warn',warn);setEl('comp-err',err);setEl('comp-na',na);
  const pct=v=>total>0?Math.round(v/total*100)+'%':'0%';
  setEl('comp-ok-pct',pct(ok));setEl('comp-warn-pct',pct(warn));setEl('comp-err-pct',pct(err));setEl('comp-na-pct',pct(na));

  // Target progress
  setEl('target-count',tariffSet+' / 10');
  const fill=document.getElementById('target-fill');
  if(fill)fill.style.width=Math.min(tariffSet/10*100,100)+'%';

  // Detail table
  const tbody=document.getElementById('compliance-tbody');
  if(tbody){
    tbody.innerHTML=details.map((d,i)=>`<tr>
      <td style="padding:0.3rem 0.5rem;text-align:center">${i+1}</td>
      <td style="padding:0.3rem 0.5rem;font-weight:500">${d.label}</td>
      <td style="padding:0.3rem 0.5rem;text-align:right">${d.latest?d.latest.toLocaleString('id-ID'):'-'}</td>
      <td style="padding:0.3rem 0.5rem;text-align:right">${d.ceiling?d.ceiling.toLocaleString('id-ID'):'-'}</td>
      <td style="padding:0.3rem 0.5rem;text-align:center;font-weight:600">${d.ratio}</td>
      <td style="padding:0.3rem 0.5rem;text-align:center"><span class="${d.statusClass}"><i class="fa-solid ${d.statusIcon}"></i></span></td>
    </tr>`).join('');
  }

  updateProgress();
}

/* ============================================================
   PROGRESS
============================================================ */
function updateProgress(){
  let filled=0,total=0;
  SECTIONS.forEach(s=>{
    s.tables.forEach(t=>{
      const tbl=document.getElementById(t.id);
      if(!tbl)return;
      tbl.querySelectorAll('tbody tr:not(.section-row) .cell-input:not(.cell-readonly):not(.cell-label)').forEach(inp=>{
        total++;
        const v=inp.value.trim();
        if(v&&v!=='...'&&v!=='\u2014')filled++;
      });
    });
  });
  const pct=total>0?Math.round(filled/total*100):0;
  const fill=document.getElementById('progFill');
  const pctEl=document.getElementById('progPct');
  if(fill)fill.style.width=pct+'%';
  if(pctEl)pctEl.textContent=pct+'%';
}

/* ============================================================
   SAVE / LOAD / RESET
============================================================ */
let _autoSaveTimer=null;
function markDirty(){
  dirty=true;
  // Auto-save after 3 seconds of inactivity
  clearTimeout(_autoSaveTimer);
  _autoSaveTimer=setTimeout(()=>{
    if(dirty)saveAll(true); // silent=true
  },3000);
}

function showToast(msg){
  const t=document.getElementById('toast');
  t.innerHTML=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3000);
}

async function saveAll(silent=false){
  // Collect all table data (built-in + custom)
  const allData={};
  const collectTable=(t)=>{
    const tbl=document.getElementById(t.id);
    if(!tbl)return;
    const rows=[];
    tbl.querySelectorAll('tbody tr').forEach(tr=>{
      if(tr.classList.contains('section-row'))return;
      const cells=[];
      tr.querySelectorAll('.cell-input').forEach(inp=>cells.push(inp.value));
      rows.push(cells);
    });
    allData[t.id]={title:t.title,ref:t.ref,unitPengisi:t.unitPengisi||'',rows};
  };
  SECTIONS.forEach(s=>{
    s.tables.forEach(collectTable);
    const customKey='custom_'+s.id;
    (customTables[customKey]||[]).forEach(collectTable);
  });

  // Save to localStorage
  localStorage.setItem('tarif_blu_data',JSON.stringify({timestamp:new Date().toISOString(),tables:allData}));

  // Save to API
  let cloudSaved=false;
  try{
    const promises=SECTIONS.map(s=>{
      const sectionData={};
      s.tables.forEach(t=>{if(allData[t.id])sectionData[t.id]=allData[t.id];});
      const customKey='custom_'+s.id;
      (customTables[customKey]||[]).forEach(t=>{if(allData[t.id])sectionData[t.id]=allData[t.id];});
      return fetch(API_URL,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({unitId:'tarif-'+s.id,tables:sectionData,customTables:customTables[customKey]||[]})
      });
    });
    await Promise.all(promises);
    cloudSaved=true;
  }catch(e){console.warn('API save failed, localStorage only:',e);}

  dirty=false;
  if(!silent) showToast(`<i class="fa-solid fa-circle-check"></i> Data tarif disimpan${cloudSaved?' ke server':' (lokal)'}`);
  updateProgress();
  updateCompliance();
}

async function loadData(){
  // Try API first
  try{
    const res=await fetch(API_URL);
    if(res.ok){
      const json=await res.json();
      if(json&&json.ok&&json.data){
        const allData={};
        Object.keys(json.data).forEach(key=>{
          if(key.startsWith('tarif-')&&json.data[key]&&json.data[key].tables){
            Object.assign(allData,json.data[key].tables);
          }
        });
        if(Object.keys(allData).length>0){
          applyData(allData);
          return;
        }
      }
    }
  }catch(e){console.warn('API load failed, trying localStorage:',e);}

  // Fallback to localStorage — and auto-push to server if server was empty
  try{
    const raw=localStorage.getItem('tarif_blu_data');
    if(raw){
      const parsed=JSON.parse(raw);
      if(parsed&&parsed.tables){
        applyData(parsed.tables);
      }
    }
  }catch(e){console.warn('localStorage load failed:',e);}
}

function applyData(tables){
  Object.keys(tables).forEach(tblId=>{
    const tbl=document.getElementById(tblId);
    if(!tbl||!tables[tblId].rows)return;
    const tbody=tbl.querySelector('tbody');
    const existingRows=[...tbody.querySelectorAll('tr:not(.section-row)')];
    const savedRows=tables[tblId].rows;

    savedRows.forEach((rowData,ri)=>{
      let tr=existingRows[ri];
      // Don't create new rows from KV — only apply to existing template rows
      if(!tr) return;
      const inputs=[...tr.querySelectorAll('.cell-input')];
      rowData.forEach((val,ci)=>{
        if(!inputs[ci])return;
        const saved=(val||'').trim();
        const current=(inputs[ci].value||'').trim();
        // Don't overwrite pre-filled template data with empty/junk KV
        const templateHasData=current && current!=='0' && current!=='...' && current!=='—' && /\d/.test(current) && current.length>1;
        const kvHasData=saved && saved!=='0' && saved!=='...' && saved!=='—' && /\d/.test(saved) && saved.length>1;
        if(templateHasData && !kvHasData) return;
        if(!saved || saved==='...' || saved==='—' || saved==='0'){
          if(!current || current==='...' || current==='—') inputs[ci].value=val;
          return;
        }
        inputs[ci].value=val;
      });
    });
  });
  updateProgress();
  updateCompliance();
}

function resetAll(){
  SECTIONS.forEach(s=>{
    s.tables.forEach(t=>{
      const tbl=document.getElementById(t.id);
      if(!tbl)return;
      tbl.querySelectorAll('tbody tr:not(.section-row) .cell-input:not(.cell-readonly):not(.cell-label)').forEach(inp=>{
        if(!inp.classList.contains('ceiling-input'))inp.value='...';
        else inp.value='';
      });
    });
  });
  localStorage.removeItem('tarif_blu_data');
  dirty=false;
  updateProgress();
  updateCompliance();
  showToast('<i class="fa-solid fa-rotate-left"></i> Data tarif di-reset');
}

function exportCSV(){
  saveAll();
  let csv='Kategori,Tabel,'+['No','Nama','Satuan',...ALL_YEARS,'Ceiling PMK'].join(',')+'\n';
  SECTIONS.forEach(s=>{
    s.tables.forEach(t=>{
      if(t.id==='tf-ukt')return; // UKT separate
      const tbl=document.getElementById(t.id);
      if(!tbl)return;
      tbl.querySelectorAll('tbody tr:not(.section-row)').forEach(tr=>{
        const cells=['"'+s.name+'"','"'+t.title+'"'];
        tr.querySelectorAll('.cell-input').forEach(inp=>cells.push('"'+(inp.value||'')+'"'));
        csv+=cells.join(',')+'\n';
      });
    });
  });
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='tarif_blu_uin_ponorogo_'+new Date().toISOString().slice(0,10)+'.csv';
  a.click();
  showToast('<i class="fa-solid fa-file-csv"></i> CSV exported!');
}

/* ============================================================
   THEME
============================================================ */
function toggleTheme(){
  const html=document.documentElement;
  const current=html.getAttribute('data-theme');
  const next=current==='dark'?'light':'dark';
  html.setAttribute('data-theme',next);
  localStorage.setItem('tarif_theme',next);
  const icon=document.getElementById('theme-icon');
  if(icon)icon.className=next==='dark'?'fa-solid fa-moon':'fa-solid fa-sun';
}

/* ============================================================
   INIT
============================================================ */
// Apply saved theme
const savedTheme=localStorage.getItem('tarif_theme');
if(savedTheme){
  document.documentElement.setAttribute('data-theme',savedTheme);
}
const thIcon=document.getElementById('theme-icon');
if(thIcon)thIcon.className=document.documentElement.getAttribute('data-theme')==='dark'?'fa-solid fa-moon':'fa-solid fa-sun';

// Role-based nav detection via Cloudflare Access
(async function detectRole(){
  let email='';
  try{
    const res=await fetch('/cdn-cgi/access/get-identity');
    if(res.ok){const id=await res.json();email=(id.email||'').toLowerCase();}
  }catch(e){}
  // Fallback: check localStorage
  if(!email){
    try{const c=JSON.parse(localStorage.getItem('rsb_ai_config')||'{}');if(c.apiKey)email='wahid@uinponorogo.ac.id';}catch(e){}
  }
  const isAdmin=email==='wahid@uinponorogo.ac.id';
  const isStaff=!isAdmin && email.endsWith('@uinponorogo.ac.id');
  if(isAdmin){
    document.getElementById('adminNav').style.display='flex';
    document.getElementById('userLabel').innerHTML='<i class="fa-solid fa-shield-halved"></i> Admin: '+email;
  } else if(isStaff){
    document.getElementById('staffNav').style.display='flex';
    document.getElementById('userLabel').innerHTML='<i class="fa-solid fa-user"></i> '+email;
  }
})();

// Beforeunload
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});

// Render & load
try{
  renderSidebar();
  renderMain();
  loadData().then(()=>{updateProgress();updateCompliance();}).catch(e=>console.warn('loadData error:',e));
}catch(e){console.error('Render error:',e);document.getElementById('mainContent').innerHTML='<div style="padding:2rem;color:red">Error: '+e.message+'</div>';}
