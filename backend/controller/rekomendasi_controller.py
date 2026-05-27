from flask import request, jsonify
from backend.model.obat import Obat
from backend.utils.helpers import (
    tokenize,
    hitung_tf, hitung_idf, hitung_tfidf_vector,
    cosine_similarity,
    hitung_skor_relevansi,
    cek_darurat,
    lolos_filter,
    get_peringatan_hamil,
    get_gambar_fallback,
)


# ════════════════════════════════════════════════════
# REKOMENDASI CONTROLLER
# ════════════════════════════════════════════════════

def api_get_rekomendasi():
    data = request.get_json()

    # ┌─────────────────────────────────────────────┐
    # │  TAHAP 1 — TERIMA INPUT DARI PENGGUNA       │
    # └─────────────────────────────────────────────┘
    keluhan          = data.get("keluhan", "")
    usia             = data.get("usia", None)
    jenis_kelamin    = data.get("jenis_kelamin", "laki-laki")
    status_hamil     = data.get("status_hamil", "tidak")
    riwayat_penyakit = data.get("riwayat_penyakit", "").lower()

    # ┌─────────────────────────────────────────────┐
    # │  TAHAP 2 — CEK GEJALA DARURAT               │
    # └─────────────────────────────────────────────┘
    if cek_darurat(keluhan):
        return jsonify({"darurat": True}), 200

    obat_list = Obat.query.all()
    if not obat_list:
        return jsonify({"darurat": False, "top5": [], "hasil": []}), 200

    # ┌─────────────────────────────────────────────┐
    # │  TAHAP 3 — TOKENISASI                       │
    # └─────────────────────────────────────────────┘
    keluhan_tokens        = tokenize(keluhan)
    semua_indikasi_tokens = [tokenize(o.indikasi_clean) for o in obat_list]

    # ┌─────────────────────────────────────────────┐
    # │  TAHAP 4 — HITUNG TF-IDF                    │
    # └─────────────────────────────────────────────┘
    idf         = hitung_idf(semua_indikasi_tokens)
    tf_keluhan  = hitung_tf(keluhan_tokens)
    vec_keluhan = hitung_tfidf_vector(tf_keluhan, idf)

    kandidat = []
    for i, obat in enumerate(obat_list):
        indikasi_tokens = semua_indikasi_tokens[i]
        tf_indikasi     = hitung_tf(indikasi_tokens)
        vec_indikasi    = hitung_tfidf_vector(tf_indikasi, idf)

        # ┌─────────────────────────────────────────┐
        # │  TAHAP 5 — COSINE SIMILARITY            │
        # │  Threshold 0.05 dipertahankan           │
        # │  berdasarkan hasil uji empirislebih bersih tanpa hasil kosong          │
        # └─────────────────────────────────────────┘
        cosine = cosine_similarity(vec_keluhan, vec_indikasi)

        if cosine < 0.05:
            continue

        # ┌─────────────────────────────────────────┐
        # │  TAHAP 5b — MINIMUM TOKEN MATCH         │
        # │  Solusi B: buang obat yang tidak ada    │
        # │  satupun kata keluhan yang cocok        │
        # │  dengan kata di indikasi obat           │
        # │                                         │
        # │  Tujuan: mencegah obat "kebetulan"      │
        # │  masuk top 5 karena overlap token       │
        # │  yang tidak relevan secara konteks      │
        # │  (contoh: laserin masuk keluhan mual)   │
        # │                                         │
        # │  tp = jumlah kata yang sama antara      │
        # │       token keluhan & token indikasi    │
        # │  Kalau tp < 1 → 0 kata cocok → buang   │
        # └─────────────────────────────────────────┘
        tp = len(set(keluhan_tokens) & set(indikasi_tokens))
        if tp < 1:
            continue

        # ┌─────────────────────────────────────────┐
        # │  TAHAP 6 — FILTER KEAMANAN (3 lapis)   │
        # └─────────────────────────────────────────┘
        if not lolos_filter(obat, usia, jenis_kelamin, status_hamil, riwayat_penyakit):
            continue

        # ┌─────────────────────────────────────────┐
        # │  TAHAP 7 — HITUNG SKOR AKHIR           │
        # │  Bobot 60/40 hasil uji empiris          │
        # └─────────────────────────────────────────┘
        skor             = hitung_skor_relevansi(keluhan_tokens, indikasi_tokens, cosine)
        peringatan_hamil = get_peringatan_hamil(obat, jenis_kelamin, status_hamil)
        gambar_final     = obat.gambar or get_gambar_fallback(obat.nama_obat, obat.gambar)

        kandidat.append({
            "id"                  : obat.id,
            "nama_obat"           : obat.nama_obat,
            "kategori_obat"       : obat.kategori_obat,
            "kategori_penyakit"   : obat.kategori_penyakit,
            "kategori_bpom"       : obat.kategori_bpom,
            "indikasi_clean"      : obat.indikasi_clean,
            "aturan_pemakaian"    : obat.aturan_pemakaian,     # ✅ BARU
            "interaksi_obat"      : obat.interaksi_obat,       # ✅ BARU
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
            "aturan_penjualan_online"  : obat.aturan_penjualan_online,   # ✅ BARU
            "label_peringatan_bpom"    : obat.label_peringatan_bpom,     # ✅ BARU
        })

    # ┌─────────────────────────────────────────────┐
    # │  TAHAP 8 — URUTKAN & KELUARKAN HASIL       │
    # │  Sort 1: nama A→Z (tiebreaker)             │
    # │  Sort 2: skor + cosine descending          │
    # └─────────────────────────────────────────────┘
    kandidat.sort(key=lambda x: x["nama_obat"])
    kandidat.sort(key=lambda x: (x["skor"], x["cosine"]), reverse=True)

    return jsonify({
        "darurat": False,
        "top5"   : kandidat[:5],
        "hasil"  : kandidat[:20],
    }), 200