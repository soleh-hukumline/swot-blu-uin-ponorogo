#!/usr/bin/env python3
"""
fetch_sinta_quartiles.py
Ambil data Q1-Q4 dari SINTA untuk semua 16 PTKIN.
Jalankan dari Mac Anda: python3 fetch_sinta_quartiles.py
Output: sinta_data.js (siap digunakan)
"""

import urllib.request, json, re, time, sys

institutions = [
    ("uin-jakarta",     "UIN Syarif Hidayatullah Jakarta",          "UIN Jakarta",   "400",     "https://sinta.kemdiktisaintek.go.id/affiliations/profile/400"),
    ("uin-bandung",     "UIN Sunan Gunung Djati Bandung",           "UIN SGD",       "3511",    "https://sinta.kemdiktisaintek.go.id/affiliations/profile/3511"),
    ("uin-malang",      "UIN Maulana Malik Ibrahim Malang",         "UIN Malang",    "3513",    "https://sinta.kemdiktisaintek.go.id/affiliations/profile/3513"),
    ("uin-suka",        "UIN Sunan Kalijaga Yogyakarta",            "UIN SUKA",      "3512",    "https://sinta.kemdiktisaintek.go.id/affiliations/profile/3512"),
    ("uin-surabaya",    "UIN Sunan Ampel Surabaya",                 "UIN SA",        "3516",    "https://sinta.kemdiktisaintek.go.id/affiliations/profile/3516"),
    ("uin-walisongo",   "UIN Walisongo Semarang",                   "UIN Walisongo", "201",     "https://sinta.kemdiktisaintek.go.id/affiliations/profile/201"),
    ("uin-surakarta",   "UIN Raden Mas Said Surakarta",             "UIN Surakarta", "190",     "https://sinta.kemdiktisaintek.go.id/affiliations/profile/190"),
    ("uin-tulungagung", "UIN Sayyid Ali Rahmatullah Tulungagung",   "UIN SATU",      "3531",    "https://sinta.kemdiktisaintek.go.id/affiliations/profile/3531"),
    ("uin-cirebon",     "UIN Syekh Nurjati Cirebon",                "UIN Cirebon",   "8245003", "https://sinta.kemdiktisaintek.go.id/affiliations/profile/8245003"),
    ("uin-purwokerto",  "UIN Saizu Purwokerto",                     "UIN Saizu",     "184",     "https://sinta.kemdiktisaintek.go.id/affiliations/profile/184"),
    ("uin-jember",      "UIN Kiai Haji Achmad Siddiq Jember",       "UIN Jember",    "3557",    "https://sinta.kemdiktisaintek.go.id/affiliations/profile/3557"),
    ("uin-salatiga",    "UIN Salatiga",                             "UIN Salatiga",  "188",     "https://sinta.kemdiktisaintek.go.id/affiliations/profile/188"),
    ("iain-kudus",      "IAIN Kudus",                               "IAIN Kudus",    "185",     "https://sinta.kemdiktisaintek.go.id/affiliations/profile/185"),
    ("uin-ponorogo",    "UIN Kiai Ageng Muh. Besari Ponorogo",      "UIN Ponorogo",  "8245308", "https://sinta.kemdiktisaintek.go.id/affiliations/profile/8245308"),
    ("uin-madura",      "UIN Madura Pamekasan",                     "UIN Madura",    "8245246", "https://sinta.kemdiktisaintek.go.id/affiliations/profile/8245246"),
    ("iain-kediri",     "UIN Kediri",                               "UIN Kediri",    "8245302", "https://sinta.kemdiktisaintek.go.id/affiliations/profile/8245302"),
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
}

def extract_quartiles(html):
    """Ekstrak Q1-Q4 dari berbagai pola ECharts SINTA."""
    q = [None, None, None, None]  # Q1, Q2, Q3, Q4

    # Pola 1: {name:'Q1',value:NNN} atau {name:"Q1",value:NNN}
    for m in re.finditer(r"\{[^{}]*name\s*:\s*['\"]Q([1-4])['\"][^{}]*value\s*:\s*(\d+)", html):
        q[int(m.group(1))-1] = int(m.group(2))
    for m in re.finditer(r"\{[^{}]*value\s*:\s*(\d+)[^{}]*name\s*:\s*['\"]Q([1-4])['\"]", html):
        q[int(m.group(2))-1] = int(m.group(1))

    # Pola 2: ['Q1',NNN] array
    if not any(v is not None for v in q):
        for m in re.finditer(r"\[[\'\"]Q([1-4])[\'\"]\s*,\s*(\d+)\]", html):
            q[int(m.group(1))-1] = int(m.group(2))

    # Pola 3: Tooltip div — "Q1: NNN (XX%)" atau "Quartile Q1: NNN"
    for m in re.finditer(r"Q([1-4]):\s*(\d+)\s*[\(%]", html):
        idx = int(m.group(1))-1
        if q[idx] is None:
            q[idx] = int(m.group(2))

    # Pola 4: "Quartile\nQ1: NNN"
    for m in re.finditer(r"Quartile\s*<br>\s*Q([1-4]):\s*(\d+)", html):
        idx = int(m.group(1))-1
        if q[idx] is None:
            q[idx] = int(m.group(2))

    # Pola 5: cari angka di sekitar "quartile-pie" section
    qpie = re.search(r'quartile-pie.*?research-radar', html, re.DOTALL)
    if qpie and not any(v is not None for v in q):
        section = qpie.group()
        for m in re.finditer(r"Q([1-4])\D+(\d+)", section):
            idx = int(m.group(1))-1
            q[idx] = int(m.group(2))

    return q

def extract_stats(html):
    """Ekstrak angka Scopus docs, citations, GScholar, Garuda dari tabel."""
    stats = {}
    # Scopus Documents (dari tabel)
    m = re.search(r'Documents.*?(\d[\d.,]+).*?(\d[\d.,]+).*?(?:\d[\d.,]+\s+d-none\s+>)?.*?(\d[\d.,]+)', html, re.DOTALL)
    # Cari pola tabel stat-table
    tbl = re.search(r'stat-table.*?</table>', html, re.DOTALL)
    if tbl:
        nums = re.findall(r'(\d+(?:[.,]\d+)*)', tbl.group())
        # Format: Scopus, GScholar, WOS(d-none), Garuda — di setiap baris
        # Row 1: Documents
        # Row 2: Citation
        # Row 3: Cited Document
        # Row 4: CPR
        clean = [n.replace('.','').replace(',','.') for n in nums]
        # Cari angka dokumen scopus
        doc_match = re.search(r'Documents.*?text-warning[^>]*>(\d[\d.]*)</td>\s*<td[^>]*text-success[^>]*>(\d[\d.]*)', tbl.group(), re.DOTALL)
        if doc_match:
            stats['scopus_docs'] = int(doc_match.group(1).replace('.',''))
            stats['gscholar_docs'] = int(doc_match.group(2).replace('.',''))
        cite_match = re.search(r'Citation\D*?text-warning[^>]*>(\d[\d.]*)</td>\s*<td[^>]*text-success[^>]*>(\d[\d.]*)', tbl.group(), re.DOTALL)
        if cite_match:
            stats['scopus_citations'] = int(cite_match.group(1).replace('.',''))
            stats['gscholar_citations'] = int(cite_match.group(2).replace('.',''))
        garuda_match = re.search(r'Documents.*?text-danger[^>]*>(\d[\d.]*)<', tbl.group(), re.DOTALL)
        if garuda_match:
            stats['garuda_docs'] = int(garuda_match.group(1).replace('.',''))
        cpr_match = re.search(r'Citation Per Researchers.*?text-warning[^>]*>([\d,]+)<.*?text-success[^>]*>([\d,]+)<', tbl.group(), re.DOTALL)
        if cpr_match:
            stats['scopus_cpr'] = float(cpr_match.group(1).replace(',','.'))
            stats['gscholar_cpr'] = float(cpr_match.group(2).replace(',','.'))
    return stats

print("="*70)
print("SINTA Quartile Fetcher — UIN Ponorogo BLU Dashboard")
print("="*70)

all_data = []
for inst_id, name, short, sinta_id, url in institutions:
    print(f"\n→ {short} ({sinta_id})... ", end='', flush=True)
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read()
            # Handle gzip
            if resp.headers.get('Content-Encoding') == 'gzip':
                import gzip
                html = gzip.decompress(raw).decode('utf-8', errors='replace')
            else:
                html = raw.decode('utf-8', errors='replace')

        q = extract_quartiles(html)
        stats = extract_stats(html)

        result = {
            'id': inst_id,
            'name': name,
            'short': short,
            'sinta_id': sinta_id,
            'sinta_url': url,
            'q1': q[0] or 0,
            'q2': q[1] or 0,
            'q3': q[2] or 0,
            'q4': q[3] or 0,
            **stats
        }
        all_data.append(result)
        print(f"Q1={q[0]} Q2={q[1]} Q3={q[2]} Q4={q[3]} | docs={stats.get('scopus_docs','?')}")

    except Exception as e:
        print(f"GAGAL: {e}")
        all_data.append({
            'id': inst_id, 'name': name, 'short': short,
            'sinta_id': sinta_id, 'sinta_url': url,
            'q1': 0, 'q2': 0, 'q3': 0, 'q4': 0
        })
    time.sleep(1)  # Jeda 1 detik agar tidak diblokir

# Simpan output
out_path = 'sinta_quartiles_result.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(all_data, f, indent=2, ensure_ascii=False)

print(f"\n\n{'='*70}")
print(f"✅ Selesai! Hasil disimpan ke: {out_path}")
print(f"{'='*70}")
print("\nRingkasan data Q1-Q4:")
print(f"{'Institusi':<25} {'Q1':>6} {'Q2':>6} {'Q3':>6} {'Q4':>6}")
print("-"*50)
for d in all_data:
    print(f"{d['short']:<25} {d['q1']:>6} {d['q2']:>6} {d['q3']:>6} {d['q4']:>6}")

print("\nSelanjutnya: kirimkan isi file sinta_quartiles_result.json ke sini")
print("atau jalankan: cat sinta_quartiles_result.json")
