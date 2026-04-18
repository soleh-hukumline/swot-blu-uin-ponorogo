import json
import re
import time
import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

SERP_API_KEY = "9e77abd24bdea6ce2080a15cb24b58c16ab1ed2f7a90015f10b5f55ffd11b126"
DATA_JSON_FILE = "data.json"
DATA_JS_FILE = "data.js"

def serp_search(query):
    """Panggil SerpAPI Google Search dan kembalikan snippets."""
    params = {
        "engine": "google",
        "q": query,
        "api_key": SERP_API_KEY,
        "hl": "id",
        "gl": "id",
        "num": 10
    }
    try:
        r = requests.get("https://serpapi.com/search", params=params, verify=False, timeout=15)
        if r.status_code != 200:
            print(f"      [!] API Error {r.status_code}")
            return []
        results = r.json().get("organic_results", [])
        return results
    except Exception as e:
        print(f"      [!] Request gagal: {e}")
        return []

def extract_accreditation(text):
    """Ekstrak status akreditasi dari teks snippet."""
    raw = text.lower()
    if re.search(r'\bunggul\b', raw):        return "Unggul"
    if re.search(r'\bbaik sekali\b', raw):  return "Baik Sekali"
    if re.search(r'akreditasi\s*[:\-]?\s*a\b|peringkat\s*a\b', raw): return "A"
    if re.search(r'akreditasi\s*[:\-]?\s*b\b|peringkat\s*b\b', raw): return "B"
    if re.search(r'akreditasi\s*[:\-]?\s*c\b|peringkat\s*c\b', raw): return "C"
    return None

def extract_program_names(results, uni_name):
    """
    Parse snippet hasil pencarian PDDikti untuk mengekstrak nama-nama program studi.
    Mencari pola seperti 'S1 Hukum Ekonomi Syariah' atau 'Prodi Manajemen'
    """
    programs = set()
    keywords = ['s1', 's2', 's3', 'd3', 'd4', 'prodi', 'program studi', 'jurusan']
    
    for res in results:
        snippet = res.get("snippet", "") + " " + res.get("title", "")
        snippet_lower = snippet.lower()
        
        # Tangkap pola: "S1 Nama Prodi" atau "Program Studi Nama Prodi"
        matches = re.findall(
            r'(?:s1|s2|s3|d3|d4|prodi|program studi|jurusan)\s+([A-Z][^,;\n\.\(\)]{5,60})',
            snippet, re.IGNORECASE
        )
        for m in matches:
            name = m.strip().title()
            # Filter noise
            if len(name) > 5 and uni_name.lower() not in name.lower():
                programs.add(name)
        
        # Juga ambil dari title result yang menyebut nama prodi
        title = res.get("title", "")
        if any(k in title.lower() for k in keywords):
            clean = re.sub(r'\|.*', '', title).strip()
            if 5 < len(clean) < 70:
                programs.add(clean)
    
    return list(programs)

def fetch_all_programs(uni_name):
    """Cari semua program studi dari suatu kampus di PDDikti via SerpAPI."""
    print(f"   [1] Mencari daftar semua program studi...")
    query = f'site:pddikti.kemdikbud.go.id "{uni_name}" program studi daftar'
    results = serp_search(query)
    
    programs_from_pddikti = extract_program_names(results, uni_name)
    
    # Fallback: cari juga lewat query umum
    if len(programs_from_pddikti) < 3:
        query2 = f'daftar program studi "{uni_name}" jurusan fakultas akreditasi'
        results2 = serp_search(query2)
        programs_from_pddikti += extract_program_names(results2, uni_name)
    
    # Bersihkan duplikat
    seen = set()
    unique_programs = []
    for p in programs_from_pddikti:
        if p.lower() not in seen:
            seen.add(p.lower())
            unique_programs.append(p)
    
    print(f"   [1] Ditemukan {len(unique_programs)} program studi kandidat")
    return unique_programs[:20]  # Batasi maksimal 20 prodi per kampus

def fetch_accreditation_for_program(uni_name, prodi_name):
    """Cari akreditasi untuk satu program studi tertentu."""
    query = f'"{uni_name}" "{prodi_name}" akreditasi ban-pt pddikti'
    results = serp_search(query)
    combined_text = " ".join([r.get("snippet","") + r.get("title","") for r in results])
    return extract_accreditation(combined_text)

def fetch_institutional_data(uni_name):
    """Cari AIPT, mahasiswa, dosen, dan guru besar dari Google."""
    print(f"   [2] Mengekstrak data institusi...")
    query = f'"{uni_name}" akreditasi institusi mahasiswa dosen guru besar 2024'
    results = serp_search(query)
    combined = " ".join([r.get("snippet","") for r in results])
    
    aipt = extract_accreditation(combined)
    
    demographics = {}
    cleaned = combined.lower().replace('.','').replace(',','')
    m = re.search(r'(\d{4,6})\s*(?:orang\s*)?mahasiswa', cleaned)
    if m: demographics["students"] = int(m.group(1))
    m = re.search(r'(\d{3,5})\s*(?:orang\s*)?dosen', cleaned)
    if m: demographics["lecturers"] = int(m.group(1))
    m = re.search(r'(\d{1,3})\s*(?:orang\s*)?(?:guru besar|profesor)', cleaned)
    if m: demographics["professors"] = int(m.group(1))
    
    return aipt, demographics

def main():
    print("=" * 60)
    print(" 🔬 SerpApi Full Crawler - Semua Jurusan Semua Kampus")
    print("=" * 60)
    
    with open(DATA_JSON_FILE, 'r', encoding='utf-8') as f:
        universities = json.load(f)
    
    for index, uni in enumerate(universities):
        print(f"\n[{index+1}/{len(universities)}] ➜ {uni['name']}")
        
        # 1. Data institusi (AIPT + demografi)
        aipt, demographics = fetch_institutional_data(uni['name'])
        if aipt:
            universities[index]["accreditation"] = aipt
            print(f"       AIPT: {aipt}")
        if demographics.get("students", 0) > 1000:
            universities[index]["students"] = demographics["students"]
        if demographics.get("lecturers", 0) > 50:
            universities[index]["lecturers"] = demographics["lecturers"]
        if demographics.get("professors"):
            universities[index]["professors"] = demographics["professors"]
        
        # 2. Cari semua program studi dari PDDikti
        all_programs = fetch_all_programs(uni['name'])
        time.sleep(0.5)  # Rate limit protection
        
        # 3. Cari akreditasi per program studi
        print(f"   [3] Mengecek akreditasi per prodi...")
        majors_with_acc = []
        for prodi in all_programs:
            acc = fetch_accreditation_for_program(uni['name'], prodi)
            if acc:
                majors_with_acc.append({"name": prodi, "acc": acc})
                print(f"       ✓ {prodi}: {acc}")
            time.sleep(0.3)  # Rate limit protection
        
        if majors_with_acc:
            universities[index]["majors"] = majors_with_acc
            print(f"       Total prodi terakreditasi ditemukan: {len(majors_with_acc)}")
        else:
            print(f"       ⚠ Tidak ada akreditasi prodi ditemukan via API")
    
    # Simpan hasil
    with open(DATA_JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(universities, f, indent=2, ensure_ascii=False)
    with open(DATA_JS_FILE, 'w', encoding='utf-8') as f:
        f.write(f"const universitiesData = {json.dumps(universities, indent=2, ensure_ascii=False)};\n")
    
    print("\n" + "=" * 60)
    print(" ✅ Selesai! Semua data jurusan dan akreditasi diperbarui.")
    print("=" * 60)

if __name__ == "__main__":
    main()
