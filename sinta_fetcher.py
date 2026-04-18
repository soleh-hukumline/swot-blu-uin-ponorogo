"""
SINTA Research Analytics Fetcher - Final Version
Mengambil data metrik penelitian dari SINTA untuk 16 PTKIN
"""

import requests
import json
import re
import time
from requests.packages.urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
}

INSTITUTIONS = [
    {"id": "uin-ponorogo",   "name": "UIN Kiai Ageng Muh. Besari Ponorogo", "short": "UIN Ponorogo",  "sinta_id": "8245308"},
    {"id": "uin-jakarta",    "name": "UIN Syarif Hidayatullah Jakarta",       "short": "UIN Jakarta",   "sinta_id": "400"},
    {"id": "uin-suka",       "name": "UIN Sunan Kalijaga Yogyakarta",         "short": "UIN SUKA",      "sinta_id": "3512"},
    {"id": "uin-bandung",    "name": "UIN Sunan Gunung Djati Bandung",        "short": "UIN SGD",       "sinta_id": "3511"},
    {"id": "uin-malang",     "name": "UIN Maulana Malik Ibrahim Malang",      "short": "UIN Malang",    "sinta_id": "3513"},
    {"id": "uin-surabaya",   "name": "UIN Sunan Ampel Surabaya",              "short": "UIN SA",        "sinta_id": "3516"},
    {"id": "uin-walisongo",  "name": "UIN Walisongo Semarang",                "short": "UIN Walisongo", "sinta_id": "201"},
    {"id": "uin-surakarta",  "name": "UIN Raden Mas Said Surakarta",          "short": "UIN Surakarta", "sinta_id": "190"},
    {"id": "uin-tulungagung","name": "UIN Sayyid Ali Rahmatullah Tulungagung","short": "UIN SATU",      "sinta_id": "3531"},
    {"id": "uin-purwokerto", "name": "UIN Saizu Purwokerto",                  "short": "UIN Saizu",     "sinta_id": "184"},
    {"id": "uin-cirebon",    "name": "UIN Syekh Nurjati Cirebon",             "short": "UIN Cirebon",   "sinta_id": "8245003"},
    {"id": "uin-jember",     "name": "UIN Kiai Haji Achmad Siddiq Jember",   "short": "UIN Jember",    "sinta_id": "3557"},
    {"id": "iain-kudus",     "name": "IAIN Kudus",                            "short": "IAIN Kudus",    "sinta_id": "185"},
    {"id": "uin-madura",     "name": "UIN Madura Pamekasan",                  "short": "UIN Madura",    "sinta_id": "8245246"},
    {"id": "uin-salatiga",   "name": "UIN Salatiga",                          "short": "UIN Salatiga",  "sinta_id": "188"},
    {"id": "iain-kediri",    "name": "UIN Kediri",                            "short": "UIN Kediri",    "sinta_id": "8245302"},
]

def parse_num(text):
    if not text: return 0
    c = str(text).strip().replace(' ','').replace('\r','').replace('\n','')
    # Format: 3.617 (titik = ribuan) atau 26.100
    c = c.replace('.','').replace(',','.')
    try: return int(float(c))
    except: return 0

def parse_float(text):
    if not text: return 0.0
    c = str(text).strip().replace('\r','').replace('\n','').replace(' ','').replace('.','').replace(',','.')
    try: return round(float(c), 2)
    except: return 0.0

def fetch_metrics(sinta_id):
    url = f"https://sinta.kemdiktisaintek.go.id/affiliations/profile/{sinta_id}/?view=matrics"
    try:
        r = requests.get(url, headers=HEADERS, timeout=20, verify=False)
        html = r.text
    except Exception as e:
        print(f"      [!] Error: {e}")
        return {}

    # text-warning = kolom Scopus, text-success = kolom GScholar
    # Format: Documents, Citations, Cited Documents, CPR
    warning_vals = re.findall(r'class="text-warning">([\d\.,]+)', html)  # Scopus
    success_vals = re.findall(r'class="text-success">([\d\.,]+)', html)  # GScholar
    garuda_vals  = re.findall(r'class="text-info">([\d\.,]+)', html)     # Garuda

    def get(lst, idx):
        return lst[idx] if idx < len(lst) else '0'

    metrics = {
        "scopus_docs":         parse_num(get(warning_vals, 0)),
        "scopus_citations":    parse_num(get(warning_vals, 1)),
        "scopus_cited_docs":   parse_num(get(warning_vals, 2)),
        "scopus_cpr":          parse_float(get(warning_vals, 3)),
        "gscholar_docs":       parse_num(get(success_vals, 0)),
        "gscholar_citations":  parse_num(get(success_vals, 1)),
        "gscholar_cited_docs": parse_num(get(success_vals, 2)),
        "gscholar_cpr":        parse_float(get(success_vals, 3)),
        "garuda_docs":         parse_num(get(garuda_vals, 0)),
        "garuda_citations":    parse_num(get(garuda_vals, 1)),
        "garuda_cited_docs":   parse_num(get(garuda_vals, 2)),
    }

    # Quartile dari Documents Quartile table
    # Cari angka setelah Q1, Q2, Q3, Q4
    qmatches = re.findall(r'Documents Quartile.*?Q1.*?(\d+).*?Q2.*?(\d+).*?Q3.*?(\d+).*?Q4.*?(\d+)', html, re.DOTALL)
    if qmatches:
        metrics["q1"] = parse_num(qmatches[0][0])
        metrics["q2"] = parse_num(qmatches[0][1])
        metrics["q3"] = parse_num(qmatches[0][2])
        metrics["q4"] = parse_num(qmatches[0][3])
    else:
        # fallback: cari semua td setelah Q1/Q2/Q3/Q4
        q_block = re.search(r'Documents Quartile(.*?)(?:Scopus Analysis|$)', html, re.DOTALL)
        if q_block:
            nums = re.findall(r'<td[^>]*>(\d+)</td>', q_block.group(1))
            metrics["q1"] = parse_num(nums[0]) if len(nums) > 0 else 0
            metrics["q2"] = parse_num(nums[1]) if len(nums) > 1 else 0
            metrics["q3"] = parse_num(nums[2]) if len(nums) > 2 else 0
            metrics["q4"] = parse_num(nums[3]) if len(nums) > 3 else 0
        else:
            metrics["q1"] = metrics["q2"] = metrics["q3"] = metrics["q4"] = 0

    return metrics

def fetch_counts(sinta_id):
    """Ambil total penelitian & abdimas."""
    counts = {"researches": 0, "community_services": 0}
    for view, key in [("researches", "researches"), ("services", "community_services")]:
        try:
            url = f"https://sinta.kemdiktisaintek.go.id/affiliations/profile/{sinta_id}/?view={view}"
            r = requests.get(url, headers=HEADERS, timeout=20, verify=False)
            # Cari "Showing X to Y of Z results"
            m = re.search(r'of\s+([\d,\.]+)\s+results', r.text, re.IGNORECASE)
            if not m:
                m = re.search(r'Total[^<]*?:\s*([\d,\.]+)', r.text, re.IGNORECASE)
            if not m:
                # Count list items
                items = re.findall(r'<div class="list-group-item', r.text)
                counts[key] = len(items)
            else:
                counts[key] = parse_num(m.group(1))
        except:
            pass
        time.sleep(0.5)
    return counts

def main():
    print("=" * 65)
    print(" 🔬 SINTA Fetcher — 16 PTKIN Indonesia")
    print("=" * 65)

    results = []
    for inst in INSTITUTIONS:
        print(f"\n[{INSTITUTIONS.index(inst)+1}/{len(INSTITUTIONS)}] → {inst['short']}")
        
        m = fetch_metrics(inst["sinta_id"])
        print(f"    Scopus: {m.get('scopus_docs',0):,} docs | {m.get('scopus_citations',0):,} cited | CPR: {m.get('scopus_cpr',0)}")
        print(f"    GScholar: {m.get('gscholar_docs',0):,} docs | CPR: {m.get('gscholar_cpr',0)}")
        print(f"    Garuda: {m.get('garuda_docs',0):,} docs")
        print(f"    Q1:{m.get('q1',0)}  Q2:{m.get('q2',0)}  Q3:{m.get('q3',0)}  Q4:{m.get('q4',0)}")
        time.sleep(1)

        c = fetch_counts(inst["sinta_id"])
        print(f"    Penelitian: {c['researches']} | Abdimas: {c['community_services']}")

        results.append({
            "id": inst["id"],
            "name": inst["name"],
            "short": inst["short"],
            "sinta_id": inst["sinta_id"],
            "sinta_url": f"https://sinta.kemdiktisaintek.go.id/affiliations/profile/{inst['sinta_id']}",
            **m,
            **c,
        })
        time.sleep(1.5)

    # Simpan output
    with open("sinta_data.js", "w", encoding="utf-8") as f:
        f.write(f"const sintaData = {json.dumps(results, indent=2, ensure_ascii=False)};\n")
    with open("sinta_data.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 65)
    print(f" ✅ Selesai! {len(results)} institusi berhasil didata di sinta_data.js")
    print("=" * 65)

if __name__ == "__main__":
    main()
