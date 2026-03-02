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

        skor             = hitung_skor_relevansi(keluhan_tokens, indikasi_tokens, cosine)
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

    # ── Sort: nama A→Z dulu, lalu skor + cosine descending ──
    kandidat.sort(key=lambda x: x["nama_obat"])
    kandidat.sort(key=lambda x: (x["skor"], x["cosine"]), reverse=True)

    return jsonify({
        "darurat": False,
        "top5"   : kandidat[:5],
        "hasil"  : kandidat[:20],
    }), 200