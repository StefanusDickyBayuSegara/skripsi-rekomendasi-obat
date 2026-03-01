from flask import request, jsonify
from app import app, db
from app.model.user import User
from app.model.obat import Obat
import math
import re
import os

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
# HELPER: Tokenisasi + hapus stopwords
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
# FILTER KEAMANAN
#
# Kategori kehamilan (FDA/BPOM):
#   A = aman terbukti
#   B = aman pada hewan, belum cukup data manusia  → AMAN
#   C = risiko tidak dapat dikesampingkan          → BOLEH + peringatan
#   D = bukti risiko pada janin manusia            → BLOKIR
#   X = kontraindikasi absolut pada kehamilan      → BLOKIR
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
    """Return peringatan jika kategori C (risiko tidak dapat dikesampingkan)"""
    if jenis_kelamin == "perempuan" and status_hamil == "hamil":
        ket = (obat.ket_hamil or "").strip().lower()
        if ket in KET_HAMIL_PERINGATAN:
            return "⚠️ Kategori C: Gunakan hanya jika manfaat lebih besar dari risiko. Konsultasikan dengan dokter."
    return None


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
# HELPER: Cek gambar lokal + fallback
# ════════════════════════════════════════════════════
FOLDER_GAMBAR = os.path.join(os.path.dirname(__file__), "static", "images")

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


# ════════════════════════════════════════════════════
# ENDPOINT: Gambar fallback
# ════════════════════════════════════════════════════
@app.route("/api/gambar-bpom", methods=["GET"])
def get_gambar_bpom():
    nama = request.args.get("nama", "").strip()
    if not nama:
        return jsonify({"gambar": None}), 400

    nama_file = get_gambar_fallback(nama, None)

    if nama_file:
        return jsonify({
            "gambar"   : f"http://localhost:5000/static/images/{nama_file}",
            "sumber"   : "lokal",
            "nama_obat": nama,
        }), 200
    else:
        return jsonify({
            "gambar"   : None,
            "sumber"   : "tidak_ada",
            "nama_obat": nama,
        }), 200


# ════════════════════════════════════════════════════
# ENDPOINT: GET ALL OBAT
# ════════════════════════════════════════════════════
@app.route("/api/obat", methods=["GET"])
def get_obat():
    obat_list = Obat.query.all()
    result = []
    for obat in obat_list:
        result.append({
            "id"                  : obat.id,
            "nama_obat"           : obat.nama_obat,
            "kategori_penyakit"   : obat.kategori_penyakit,
            "indikasi_clean"      : obat.indikasi_clean,
            "dosis_anak_clean"    : obat.dosis_anak_clean,
            "dosis_dewasa_clean"  : obat.dosis_dewasa_clean,
            "efeksamping"         : obat.efeksamping,
            "kontraindikasi_clean": obat.kontraindikasi_clean,
            "komposisi_clean"     : obat.komposisi_clean,
            "jangka_waktu_clean"  : obat.jangka_waktu_clean,
            "status_obat_label"   : obat.status_obat_label,
            "batasan_usia_min"    : obat.batasan_usia_min,
            "ket_hamil"           : obat.ket_hamil,
            "gambar"              : obat.gambar,
        })
    return jsonify(result), 200


# ════════════════════════════════════════════════════
# ENDPOINT: REKOMENDASI UTAMA
# ════════════════════════════════════════════════════
@app.route("/api/rekomendasi", methods=["POST"])
def get_rekomendasi():
    data = request.get_json()

    keluhan          = data.get("keluhan", "")
    usia             = data.get("usia", None)
    jenis_kelamin    = data.get("jenis_kelamin", "laki-laki")
    status_hamil     = data.get("status_hamil", "tidak")
    riwayat_penyakit = data.get("riwayat_penyakit", "").lower()

    # ── Cek darurat dulu ──
    if cek_darurat(keluhan):
        return jsonify({"darurat": True}), 200

    obat_list = Obat.query.all()
    if not obat_list:
        return jsonify({"darurat": False, "top5": [], "hasil": []}), 200

    # ── Hitung TF-IDF ──
    keluhan_tokens        = tokenize(keluhan)
    semua_indikasi_tokens = [tokenize(o.indikasi_clean) for o in obat_list]
    idf                   = hitung_idf(semua_indikasi_tokens)
    tf_keluhan            = hitung_tf(keluhan_tokens)
    vec_keluhan           = hitung_tfidf_vector(tf_keluhan, idf)

    kandidat = []
    for i, obat in enumerate(obat_list):
        indikasi_tokens = semua_indikasi_tokens[i]
        tf_indikasi     = hitung_tf(indikasi_tokens)
        vec_indikasi    = hitung_tfidf_vector(tf_indikasi, idf)
        cosine          = cosine_similarity(vec_keluhan, vec_indikasi)

        if cosine < 0.01:
            continue

        if not lolos_filter(obat, usia, jenis_kelamin, status_hamil, riwayat_penyakit):
            continue

        skor = hitung_skor_relevansi(keluhan_tokens, indikasi_tokens, cosine)

        peringatan_hamil = get_peringatan_hamil(obat, jenis_kelamin, status_hamil)
        gambar_final     = get_gambar_fallback(obat.nama_obat, obat.gambar)

        kandidat.append({
            "id"                  : obat.id,
            "nama_obat"           : obat.nama_obat,
            "kategori_penyakit"   : obat.kategori_penyakit,
            "indikasi_clean"      : obat.indikasi_clean,
            "dosis_anak_clean"    : obat.dosis_anak_clean,
            "dosis_dewasa_clean"  : obat.dosis_dewasa_clean,
            "efeksamping"         : obat.efeksamping,
            "kontraindikasi_clean": obat.kontraindikasi_clean,
            "komposisi_clean"     : obat.komposisi_clean,
            "jangka_waktu_clean"  : obat.jangka_waktu_clean,
            "status_obat_label"   : obat.status_obat_label,
            "batasan_usia_min"    : obat.batasan_usia_min,
            "ket_hamil"           : obat.ket_hamil,
            "gambar"              : gambar_final,
            "skor"                : skor,
            "cosine"              : round(cosine, 4),
            "peringatan_hamil"    : peringatan_hamil,
        })

    # ════════════════════════════════════════════════
    # ✅ SORT dengan tie-breaker 3 level yang BENAR:
    #
    #   Masalah versi lama:
    #   - reverse=True pada nama_obat → urutan Z→A (terbalik!)
    #   - "pimacolin" menang atas "coparcetin" padahal harusnya sebaliknya
    #
    #   Solusi: pisahkan sort — skor & cosine descending dulu,
    #   lalu sort stabil kedua khusus nama ascending (A→Z)
    #
    #   Level 1: skor akhir          → DESCENDING (terbesar duluan)
    #   Level 2: cosine similarity   → DESCENDING (terbesar duluan)
    #   Level 3: nama obat           → ASCENDING  (A → Z, adil & konsisten)
    # ════════════════════════════════════════════════

    # Step 1: sort nama A→Z dulu (ascending) — sebagai tie-breaker terakhir
    kandidat.sort(key=lambda x: x["nama_obat"])

    # Step 2: sort skor + cosine descending — Python sort bersifat STABLE,
    # jadi urutan nama dari step 1 dipertahankan saat skor & cosine sama
    kandidat.sort(key=lambda x: (x["skor"], x["cosine"]), reverse=True)

    top5  = kandidat[:5]
    semua = kandidat[:20]

    return jsonify({
        "darurat": False,
        "top5"   : top5,
        "hasil"  : semua,
    }), 200


# ════════════════════════════════════════════════════
# AUTH
# ════════════════════════════════════════════════════
@app.route("/signup", methods=["POST"])
def signup():
    data     = request.get_json()
    name     = data.get("name")
    email    = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"message": "Semua field wajib diisi"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email sudah terdaftar"}), 400

    db.session.add(User(name=name, email=email, password=password))
    db.session.commit()
    return jsonify({"message": "Signup berhasil"}), 201


@app.route("/login", methods=["POST"])
def login():
    data     = request.get_json()
    email    = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email dan password wajib diisi"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "User tidak ditemukan"}), 404
    if user.password != password:
        return jsonify({"message": "Password salah"}), 401

    return jsonify({
        "message": "Login berhasil",
        "user"   : {"id": user.id, "name": user.name, "email": user.email}
    }), 200