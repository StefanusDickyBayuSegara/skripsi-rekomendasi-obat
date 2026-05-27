"""
==============================================================
 TEST VALIDASI REKOMENDASI - TF-IDF + COSINE SIMILARITY
 Uji kecocokan sistem dengan perhitungan manual Excel skripsi
==============================================================

Cara run:
    pip install pandas tabulate colorama
    python test_validasi_rekomendasi.py
    python test_validasi_rekomendasi.py --csv /path/ke/data_obat.csv
    python test_validasi_rekomendasi.py --verbose

Rumus SAMA PERSIS dengan Excel skripsi:
  TF     = biner (1/0)
  IDF    = log10(N / DF),  N = jumlah obat dalam corpus
  TF-IDF = TF x IDF
  Cosine = (A.B) / (||A|| x ||B||)
  Skor   = 0.60 x Cosine + 0.40 x F1

Perbedaan mode:
  Test 1 (VALIDASI EXCEL) : corpus = 5 obat saja, N=5, threshold=0.0
  Test 2-4 (SISTEM PENUH) : corpus = semua 201 obat, N=201, threshold=0.05
==============================================================
"""

import math, sys, argparse
import pandas as pd

try:
    from tabulate import tabulate
    HAS_TABULATE = True
except ImportError:
    HAS_TABULATE = False

try:
    from colorama import init, Fore, Style
    init(autoreset=True)
    HAS_COLOR = True
except ImportError:
    HAS_COLOR = False

def green(s):  return (Fore.GREEN  + str(s) + Style.RESET_ALL) if HAS_COLOR else str(s)
def red(s):    return (Fore.RED    + str(s) + Style.RESET_ALL) if HAS_COLOR else str(s)
def yellow(s): return (Fore.YELLOW + str(s) + Style.RESET_ALL) if HAS_COLOR else str(s)
def cyan(s):   return (Fore.CYAN   + str(s) + Style.RESET_ALL) if HAS_COLOR else str(s)
def bold(s):   return (Style.BRIGHT + str(s) + Style.RESET_ALL) if HAS_COLOR else str(s)

# ─────────────────────────────────────────────────────────────
# RUMUS INTI
# ─────────────────────────────────────────────────────────────
def tf_biner(tokens, semua_term):
    s = set(tokens)
    return {t: (1 if t in s else 0) for t in semua_term}

def hitung_idf(obat_token_lists, semua_term):
    """IDF = log10(N/DF), N = jumlah dokumen obat saja."""
    N = len(obat_token_lists)
    idf = {}
    for t in semua_term:
        df = sum(1 for toks in obat_token_lists if t in set(toks))
        idf[t] = math.log10(N / df) if df > 0 else 0.0
    return idf

def tfidf_vector(tf, idf, semua_term):
    return {t: tf[t] * idf[t] for t in semua_term}

def cosine_similarity(vec_a, vec_b, semua_term):
    """Kembalikan (dot, mag_a, mag_b, cosine)."""
    dot   = sum(vec_a[t] * vec_b[t] for t in semua_term)
    mag_a = math.sqrt(sum(vec_a[t] ** 2 for t in semua_term))
    mag_b = math.sqrt(sum(vec_b[t] ** 2 for t in semua_term))
    denom = mag_a * mag_b
    return dot, mag_a, mag_b, (dot / denom if denom > 0 else 0.0)

def hitung_f1(keluhan_tokens, indikasi_tokens):
    kel, ind = set(keluhan_tokens), set(indikasi_tokens)
    if not kel: return 0.0, 0.0, 0.0
    tp = len(kel & ind)
    p  = tp / len(ind) if ind else 0.0
    r  = tp / len(kel)
    f1 = (2 * p * r / (p + r)) if (p + r) > 0 else 0.0
    return p, r, f1

def hitung_skor(cosine, f1):
    return round(0.60 * cosine + 0.40 * f1, 4)

# ─────────────────────────────────────────────────────────────
# MESIN REKOMENDASI
# ─────────────────────────────────────────────────────────────
def rekomendasi(keluhan, df_subset, threshold=0.0, verbose=False):
    keluhan_tokens = keluhan.lower().split()

    semua_ind_tokens = []
    for _, row in df_subset.iterrows():
        ind = str(row["indikasi_clean"]) if pd.notna(row["indikasi_clean"]) else ""
        semua_ind_tokens.append(ind.split())

    semua_term = sorted(
        set(keluhan_tokens) | {t for toks in semua_ind_tokens for t in toks}
    )

    idf     = hitung_idf(semua_ind_tokens, semua_term)
    tf_q    = tf_biner(keluhan_tokens, semua_term)
    tfidf_q = tfidf_vector(tf_q, idf, semua_term)

    if verbose:
        _cetak_idf(keluhan_tokens, semua_term, idf)

    hasil = []
    for i, (_, row) in enumerate(df_subset.iterrows()):
        ind_toks = semua_ind_tokens[i]
        tf_d     = tf_biner(ind_toks, semua_term)
        tfidf_d  = tfidf_vector(tf_d, idf, semua_term)
        dot, mag_q, mag_d, cosine = cosine_similarity(tfidf_q, tfidf_d, semua_term)
        _, _, f1 = hitung_f1(keluhan_tokens, ind_toks)
        skor = hitung_skor(cosine, f1)
        if cosine < threshold:
            continue
        hasil.append({
            "nama_obat"     : row["nama_obat"],
            "indikasi_clean": row["indikasi_clean"],
            "dot"           : round(dot, 10),
            "mag_q"         : round(mag_q, 10),
            "mag_d"         : round(mag_d, 10),
            "cosine"        : round(cosine, 10),
            "f1"            : round(f1, 4),
            "skor"          : skor,
        })

    hasil.sort(key=lambda x: x["nama_obat"])
    hasil.sort(key=lambda x: (x["skor"], x["cosine"]), reverse=True)
    return hasil

# ─────────────────────────────────────────────────────────────
# PRINT HELPERS
# ─────────────────────────────────────────────────────────────
def _tbl(rows, headers):
    if HAS_TABULATE:
        print(tabulate(rows, headers=headers, tablefmt="rounded_outline"))
    else:
        widths = [max(len(str(h)), *(len(str(r[i])) for r in rows)) + 2
                  for i, h in enumerate(headers)]
        print("  ".join(str(h).ljust(widths[i]) for i, h in enumerate(headers)))
        print("  ".join("-" * w for w in widths))
        for r in rows:
            print("  ".join(str(r[i]).ljust(widths[i]) for i in range(len(r))))

def _cetak_top(hasil, n=5):
    print("\n" + bold("── Top Hasil Rekomendasi ────────────────────────────────"))
    rows = [[f"#{i}", h["nama_obat"], f"{h['cosine']:.6f}", f"{h['f1']:.4f}", f"{h['skor']:.4f}"]
            for i, h in enumerate(hasil[:n], 1)]
    _tbl(rows, ["No", "Nama Obat", "Cosine", "F1", "Skor Akhir"])

def _cetak_idf(keluhan_tokens, semua_term, idf):
    print("\n" + cyan(bold("── Detail IDF (hanya term yang relevan) ────────────────")))
    rows = [[t, "Ya" if t in set(keluhan_tokens) else "-", f"{idf[t]:.10f}"]
            for t in semua_term]
    _tbl(rows, ["Term", "Ada di Keluhan?", "IDF = log10(N/DF)"])

# ─────────────────────────────────────────────────────────────
# VALIDASI vs NILAI EXCEL
# ─────────────────────────────────────────────────────────────
def validasi_excel(hasil, expected, tolerance=0.0001):
    print("\n" + bold("=" * 65))
    print(bold("  VALIDASI SISTEM vs EXCEL MANUAL"))
    print(bold("=" * 65))

    semua_ok = True
    rows = []
    for nama, cosine_excel in expected.items():
        match = next(
            (h for h in hasil
             if nama.lower().replace(" ","") in h["nama_obat"].lower().replace(" ","")),
            None
        )
        if match is None:
            status, cos_str, sel_str = red("TIDAK ADA di sistem"), "-", "-"
            semua_ok = False
        else:
            cos_str = f"{match['cosine']:.8f}"
            selisih = abs(match["cosine"] - cosine_excel)
            sel_str = f"{selisih:.8f}"
            if cosine_excel > 1.0:
                status = yellow(f"Excel={cosine_excel:.4f} > 1 (formula error Excel)")
            elif selisih < tolerance:
                status = green("IDENTIK")
            else:
                status = red(f"BEDA  delta={selisih:.6f}")
                semua_ok = False
        rows.append([nama, cos_str, f"{cosine_excel:.8f}", sel_str, status])

    _tbl(rows, ["Obat", "Sistem", "Excel", "Selisih", "Status"])
    print()
    if semua_ok:
        print(green(bold("  SEMUA NILAI COCOK - Sistem tervalidasi!")))
    else:
        print(yellow(bold("  Ada ketidakcocokan - periksa detail di atas.")))
    return semua_ok

# ─────────────────────────────────────────────────────────────
# TEST CASES
# ─────────────────────────────────────────────────────────────
TEST_CASES = [
    {
        # ── VALIDASI UTAMA: replikasi persis Excel ──────────
        # Excel hanya pakai 5 obat ini sebagai corpus (N=5)
        # IDF dihitung dari 5 dokumen itu saja, bukan 201
        "nama"      : "Test 1 - Validasi Excel (N=5, corpus terbatas)",
        "keluhan"   : "bersin hidung sumbat alergi debu",
        "obat_excel": ["rhinos junior", "rhinos neo", "hufagripp pilek", "dicom", "nalgestan"],
        "expected_cosine": {
            "Rhinos Junior"  : 0.0689926740,
            "Rhinos Neo"     : 0.0000000000,
            "Hufagripp Pilek": 0.0689926740,
            # Nilai BENAR sistem = 1.0; nilai Excel 1.0137 adalah formula error
            "Dicom"          : 1.0000000000,
            "Nalgestan"      : 0.0689926740,
        },
        "tolerance" : 0.0001,
        "threshold" : 0.0,   # threshold=0 agar Rhinos Neo (cosine=0) tetap masuk
    },
    {
        # ── SISTEM PENUH: 201 obat, keluhan alergi debu ────
        "nama"      : "Test 2 - Sistem penuh (N=201) | Keluhan: alergi debu",
        "keluhan"   : "bersin hidung sumbat alergi debu",
        "obat_excel": None,
        "expected_cosine": None,
        "threshold" : 0.05,
    },
    {
        # ── SISTEM PENUH: keluhan maag ──────────────────────
        "nama"      : "Test 3 - Sistem penuh (N=201) | Keluhan: maag",
        "keluhan"   : "mual nyeri lambung asam lambung",
        "obat_excel": None,
        "expected_cosine": None,
        "threshold" : 0.05,
    },
    {
        # ── SISTEM PENUH: keluhan demam batuk ───────────────
        "nama"      : "Test 4 - Sistem penuh (N=201) | Keluhan: demam batuk",
        "keluhan"   : "demam batuk pilek sakit kepala",
        "obat_excel": None,
        "expected_cosine": None,
        "threshold" : 0.05,
    },
]

# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Test validasi rekomendasi obat OTC")
    parser.add_argument(
        "--csv",
        default="data_obat_hasil_preprocessing_ver_4_3__7_.csv",
        help="Path ke file CSV data obat"
    )
    parser.add_argument("--topn",    type=int, default=5)
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    print(bold(f"\n{'=' * 65}"))
    print(bold("  TEST VALIDASI REKOMENDASI OBAT OTC"))
    print(bold("  Rumus: TF-biner x log10(N/DF) -> Cosine + 60/40 F1"))
    print(bold(f"{'=' * 65}"))
    print(f"  File CSV : {args.csv}")
    print(f"  Top-N    : {args.topn}")

    try:
        df_semua = pd.read_csv(args.csv)
    except FileNotFoundError:
        print(red(f"\n[ERROR] File tidak ditemukan: {args.csv}"))
        print("  Gunakan: python test_validasi_rekomendasi.py --csv /path/ke/file.csv")
        sys.exit(1)

    print(f"  Total obat: {len(df_semua)} baris\n")

    total_pass = total_test = 0

    for tc in TEST_CASES:
        print("\n" + bold("=" * 65))
        print(bold(f"  {tc['nama']}"))
        print(bold("=" * 65))
        print(f"  Keluhan : {cyan(tc['keluhan'])}")

        if tc["obat_excel"]:
            mask = df_semua["nama_obat"].str.lower().isin(
                [o.lower() for o in tc["obat_excel"]]
            )
            df_sub = df_semua[mask].reset_index(drop=True)
            print(f"  Corpus  : {len(df_sub)} obat (mode validasi Excel)")
        else:
            df_sub = df_semua.reset_index(drop=True)
            print(f"  Corpus  : {len(df_sub)} obat (mode sistem penuh)")

        hasil = rekomendasi(tc["keluhan"], df_sub,
                            threshold=tc.get("threshold", 0.05),
                            verbose=args.verbose)
        _cetak_top(hasil, args.topn)

        if tc.get("expected_cosine"):
            total_test += 1
            ok = validasi_excel(hasil, tc["expected_cosine"], tc.get("tolerance", 0.0001))
            if ok: total_pass += 1
        else:
            print(cyan("\n  (Tidak ada nilai Excel pembanding - hasil sistem saja)"))

    if total_test > 0:
        print("\n" + bold("=" * 65))
        print(bold("  RINGKASAN VALIDASI AKHIR"))
        print(bold("=" * 65))
        icon = green("LULUS") if total_pass == total_test else red("GAGAL")
        print(f"  [{icon}]  {total_pass} / {total_test} test case lulus validasi Excel\n")
        if total_pass == total_test:
            print(green(bold("  Sistem TERVALIDASI - perhitungan cocok dengan Excel!")))
        else:
            print(yellow("  Ada perbedaan. Periksa detail di atas."))
    print()

if __name__ == "__main__":
    main()