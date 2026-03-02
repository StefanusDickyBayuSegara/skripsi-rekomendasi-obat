"""
TEST API BPOM — Jalankan file ini di terminal kamu:
    python test_api_bpom.py

Script ini akan mencoba beberapa endpoint API BPOM
dan menampilkan mana yang berhasil + struktur datanya.
"""

import requests
import json

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
    "Origin": "https://cekbpom.pom.go.id",
    "Referer": "https://cekbpom.pom.go.id/",
}

NAMA_OBAT = "paracetamol"

# ══════════════════════════════════════════════════════
# Daftar endpoint yang akan dicoba
# ══════════════════════════════════════════════════════
endpoints = [
    {
        "label": "API BPOM v1 - search produk",
        "url": f"https://api-cekbpom.pom.go.id/api/produk?keyword={NAMA_OBAT}&page=1&limit=5",
    },
    {
        "label": "API BPOM v2 - search",
        "url": f"https://api-cekbpom.pom.go.id/search?keyword={NAMA_OBAT}",
    },
    {
        "label": "BPOM cekbpom JSON endpoint",
        "url": f"https://cekbpom.pom.go.id/index.php/home/produk/9/word/{NAMA_OBAT}",
        "extra_headers": {"X-Requested-With": "XMLHttpRequest"}
    },
    {
        "label": "BPOM API publik obat",
        "url": f"https://api-cekbpom.pom.go.id/api/obat?nama={NAMA_OBAT}",
    },
]

print("=" * 60)
print("TEST API BPOM")
print("=" * 60)

for ep in endpoints:
    print(f"\n[TEST] {ep['label']}")
    print(f"URL  : {ep['url']}")
    try:
        h = {**HEADERS, **ep.get("extra_headers", {})}
        res = requests.get(ep["url"], headers=h, timeout=8)
        print(f"Status : {res.status_code}")
        print(f"Content-Type: {res.headers.get('Content-Type', '-')}")

        # Coba parse JSON
        try:
            data = res.json()
            print(f"Response JSON (preview):")
            print(json.dumps(data, indent=2, ensure_ascii=False)[:500])
        except:
            # Bukan JSON, cek HTML
            print(f"Bukan JSON. HTML snippet:")
            print(res.text[:300])

    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR — tidak bisa akses URL ini")
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT — server tidak respond dalam 8 detik")
    except Exception as e:
        print(f"❌ ERROR: {type(e).__name__}: {e}")

print("\n" + "=" * 60)
print("SELESAI")
print("=" * 60)