from flask import request, jsonify
from backend.model.obat import Obat
from backend.utils.helpers import get_gambar_fallback


# ════════════════════════════════════════════════════
# OBAT CONTROLLER
# ════════════════════════════════════════════════════

def api_get_obat():
    obat_list = Obat.query.all()
    result = []
    for obat in obat_list:
        result.append({
            "id"                  : obat.id,
            "nama_obat"           : obat.nama_obat,
            "kategori_obat"       : obat.kategori_obat,
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
            "kategori_bpom"       : obat.kategori_bpom,      # ✅ DITAMBAHKAN
        })
    return jsonify(result), 200


def api_gambar_bpom():
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