import os
import math
import re


# ════════════════════════════════════════════════════
# STOPWORDS INDONESIA
# ════════════════════════════════════════════════════
STOPWORDS_ID = {
    "dan", "atau", "yang", "untuk", "dengan", "pada", "di", "ke", "dari",
    "ini", "itu", "adalah", "dalam", "tidak", "ada", "juga", "serta",
    "oleh", "karena", "akibat", "dapat", "bisa", "akan", "telah", "sudah",
    "saat", "bila", "jika", "maka", "agar", "seperti", "antara", "setelah",
    "sebelum", "namun", "tetapi", "tapi", "sehingga", "sebagai", "lebih",
    "sangat", "harus", "perlu", "secara", "terhadap", "selama",
    "pasien", "penderita", "obat", "dosis", "penggunaan", "digunakan",
}


# ════════════════════════════════════════════════════
# TOKENISASI
# ════════════════════════════════════════════════════
def tokenize(text):
    if not text:
        return []
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    tokens = [t for t in text.split() if len(t) > 1]
    return [t for t in tokens if t not in STOPWORDS_ID]


# ════════════════════════════════════════════════════
# TF-IDF
# ════════════════════════════════════════════════════
def hitung_tf(tokens):
    tf = {}
    total = len(tokens) if tokens else 1
    for t in tokens:
        tf[t] = tf.get(t, 0) + 1
    return {k: v / total for k, v in tf.items()}


def hitung_idf(semua_dokumen_tokens):
    N = len(semua_dokumen_tokens)
    idf = {}
    semua_kata = set(k for doc in semua_dokumen_tokens for k in doc)
    for kata in semua_kata:
        df = sum(1 for doc in semua_dokumen_tokens if kata in doc)
        idf[kata] = math.log((N + 1) / (df + 1)) + 1
    return idf


def hitung_tfidf_vector(tf, idf):
    return {k: tf.get(k, 0) * idf.get(k, 0) for k in idf}


# ════════════════════════════════════════════════════
# COSINE SIMILARITY
# ════════════════════════════════════════════════════
def cosine_similarity(vec_a, vec_b):
    semua_kata = set(vec_a) | set(vec_b)
    dot   = sum(vec_a.get(k, 0) * vec_b.get(k, 0) for k in semua_kata)
    mag_a = math.sqrt(sum(v ** 2 for v in vec_a.values()))
    mag_b = math.sqrt(sum(v ** 2 for v in vec_b.values()))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


# ════════════════════════════════════════════════════
# PRECISION, RECALL, F1 → SKOR AKHIR
# ════════════════════════════════════════════════════
def hitung_skor_relevansi(keluhan_tokens, indikasi_tokens, cosine_score):
    keluhan_set  = set(keluhan_tokens)
    indikasi_set = set(indikasi_tokens)

    if not keluhan_set:
        return 0.0

    tp        = len(keluhan_set & indikasi_set)
    precision = tp / len(indikasi_set) if indikasi_set else 0
    recall    = tp / len(keluhan_set)  if keluhan_set  else 0

    f1 = 0
    if precision + recall > 0:
        f1 = 2 * precision * recall / (precision + recall)

    skor_akhir = (0.65 * cosine_score) + (0.35 * f1)
    return round(skor_akhir, 4)


# ════════════════════════════════════════════════════
# GEJALA DARURAT
# ════════════════════════════════════════════════════
GEJALA_DARURAT = [
    "sesak nafas", "sesak napas", "nyeri dada", "dada terasa berat",
    "kehilangan kesadaran", "pingsan", "kejang", "stroke",
    "serangan jantung", "darah banyak", "pendarahan", "tidak sadarkan diri",
    "lumpuh", "sulit berbicara", "bibir biru", "muka biru",
    "muntah darah", "bab darah", "kepala sangat berat", "demam tinggi anak",
]

def cek_darurat(keluhan_text):
    keluhan_lower = keluhan_text.lower()
    for gejala in GEJALA_DARURAT:
        if gejala in keluhan_lower:
            return True
    return False


# ════════════════════════════════════════════════════
# FILTER KEAMANAN KEHAMILAN
#   A = aman terbukti
#   B = aman pada hewan              → AMAN
#   C = risiko tidak dikesampingkan  → BOLEH + peringatan
#   D = bukti risiko pada janin      → BLOKIR
#   X = kontraindikasi absolut       → BLOKIR
# ════════════════════════════════════════════════════
KET_HAMIL_BLOKIR     = {"d", "x"}
KET_HAMIL_PERINGATAN = {"c"}

def lolos_filter(obat, usia, jenis_kelamin, status_hamil, riwayat_penyakit):
    # ── Filter usia minimum ──
    if usia:
        batasan = (obat.batasan_usia_min or "").strip()
        if batasan and batasan != "-":
            try:
                batas_angka = int(''.join(filter(str.isdigit, batasan)))
                if int(usia) < batas_angka:
                    return False
            except:
                pass

    # ── Filter kehamilan (D dan X diblokir) ──
    if jenis_kelamin == "perempuan" and status_hamil == "hamil":
        ket = (obat.ket_hamil or "").strip().lower()
        if ket in KET_HAMIL_BLOKIR:
            return False

    # ── Filter riwayat penyakit / kontraindikasi ──
    if riwayat_penyakit:
        kontra = (obat.kontraindikasi_clean or "").lower()
        for penyakit in riwayat_penyakit.split(","):
            penyakit = penyakit.strip()
            if penyakit and penyakit in kontra:
                return False

    return True


def get_peringatan_hamil(obat, jenis_kelamin, status_hamil):
    if jenis_kelamin == "perempuan" and status_hamil == "hamil":
        ket = (obat.ket_hamil or "").strip().lower()
        if ket in KET_HAMIL_PERINGATAN:
            return "⚠️ Kategori C: Gunakan hanya jika manfaat lebih besar dari risiko. Konsultasikan dengan dokter."
    return None


# ════════════════════════════════════════════════════
# GAMBAR FALLBACK
# ════════════════════════════════════════════════════
FOLDER_GAMBAR = os.path.join(os.path.dirname(__file__), "..", "static", "images")

def get_gambar_fallback(nama_obat, gambar_db):
    if gambar_db:
        path = os.path.join(FOLDER_GAMBAR, gambar_db)
        if os.path.exists(path):
            return gambar_db

    nama_file_coba = [
        nama_obat.lower().replace(" ", "_") + ".jpg",
        nama_obat.lower().replace(" ", "_") + ".png",
        nama_obat.lower().replace(" ", "-") + ".jpg",
        nama_obat.lower().replace(" ", "") + ".jpg",
    ]
    for nama_file in nama_file_coba:
        path = os.path.join(FOLDER_GAMBAR, nama_file)
        if os.path.exists(path):
            return nama_file

    return None