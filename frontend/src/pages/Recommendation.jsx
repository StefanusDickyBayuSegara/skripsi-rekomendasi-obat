import React, { useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import { useSavedList } from "../hooks/Usesavedlist";
import "./Recommendation.css";

// ════════════════════════════════════════════════════
// Komponen gambar dengan placeholder
// ════════════════════════════════════════════════════
function ObatImage({ gambar, namaObat, height = "80px" }) {
  const [imgError, setImgError] = useState(false);
  const inisial = (namaObat || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const px = parseInt(height);

  if (!gambar || imgError) {
    return (
      <div style={{
        width: height, height, margin: "0 auto",
        background: "linear-gradient(135deg, #53c5c9, #3fb2b6)",
        borderRadius: "12px", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", color: "white", gap: "2px",
      }}>
        <span style={{ fontSize: px * 0.35 + "px", fontWeight: 700 }}>{inisial}</span>
        <span style={{ fontSize: px * 0.13 + "px", opacity: 0.85, textAlign: "center", padding: "0 4px" }}>
          {namaObat?.split(" ")[0]}
        </span>
      </div>
    );
  }

  return (
    <img
      src={`http://localhost:5000/static/images/${gambar}`}
      alt={namaObat}
      style={{ height, objectFit: "contain" }}
      onError={() => setImgError(true)}
      className="img-fluid"
    />
  );
}

// ════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════
function Recommendation() {
  const [showProfilModal, setShowProfilModal] = useState(false);
  const [profil, setProfil] = useState({
    usia: "",
    jenis_kelamin: "laki-laki",
    status_hamil: "tidak",
    riwayat_penyakit: "",
  });
  const [profilTersimpan, setProfilTersimpan] = useState(false);
  const [keluhan, setKeluhan]       = useState("");
  const [loading, setLoading]       = useState(false);
  const [sudahCari, setSudahCari]   = useState(false);
  const [isDarurat, setIsDarurat]   = useState(false);
  const [hasilObat, setHasilObat]   = useState([]);
  const [selectedObat, setSelectedObat] = useState(null);
  const [toastMsg, setToastMsg]     = useState("");

  const { isSaved, toggleSave } = useSavedList();

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2200);
  };

  const handleToggleSave = (e, item) => {
    e.stopPropagation();
    const sudahSimpan = isSaved(item.id);
    toggleSave(item);
    showToast(sudahSimpan ? "Dihapus dari daftar simpan" : "✅ Berhasil disimpan!");
  };

  const handleSimpanProfil = () => {
    if (!profil.usia) { alert("Usia wajib diisi!"); return; }
    setProfilTersimpan(true);
    setShowProfilModal(false);
  };

  const handleCari = () => {
    if (!keluhan.trim()) { alert("Masukkan keluhan terlebih dahulu!"); return; }
    if (!profilTersimpan) {
      alert("Mohon isi data profil terlebih dahulu!");
      setShowProfilModal(true);
      return;
    }

    setLoading(true);
    setSudahCari(true);
    setIsDarurat(false);
    setHasilObat([]);

    fetch("http://localhost:5000/api/rekomendasi", {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({
        keluhan          : keluhan,
        usia             : profil.usia,
        jenis_kelamin    : profil.jenis_kelamin,
        status_hamil     : profil.jenis_kelamin === "perempuan" ? profil.status_hamil : "tidak",
        riwayat_penyakit : profil.riwayat_penyakit,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.darurat) setIsDarurat(true);
        else setHasilObat(data.hasil || []);
        setLoading(false);
      })
      .catch((err) => { console.log("Error:", err); setLoading(false); });
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleCari(); };

  return (
    <div className="recommendation-page">
      <Navbar />

      {/* Toast */}
      {toastMsg && <div className="save-toast">{toastMsg}</div>}

      <div className="container mt-4 pb-5">
        <h4 className="page-title mb-4">Cari Rekomendasi Obat Anda</h4>

        {/* ════ Card Profil ════ */}
        <div className="card profile-card shadow-sm mb-4">
          <div className="card-body">
            <h6 className="fw-bold mb-3">Masukan Data Pengguna</h6>
            {profilTersimpan ? (
              <div className="profil-summary">
                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <small className="text-muted">Usia</small>
                    <p className="mb-0 fw-semibold">{profil.usia} tahun</p>
                  </div>
                  <div className="col-6">
                    <small className="text-muted">Jenis Kelamin</small>
                    <p className="mb-0 fw-semibold" style={{ textTransform: "capitalize" }}>
                      {profil.jenis_kelamin}
                    </p>
                  </div>
                  {profil.jenis_kelamin === "perempuan" && (
                    <div className="col-6">
                      <small className="text-muted">Status</small>
                      <p className="mb-0 fw-semibold">
                        {profil.status_hamil === "hamil" ? "🤰 Hamil" : "Tidak Hamil"}
                      </p>
                    </div>
                  )}
                  {profil.riwayat_penyakit && (
                    <div className="col-12">
                      <small className="text-muted">Riwayat Penyakit</small>
                      <p className="mb-0 fw-semibold">{profil.riwayat_penyakit}</p>
                    </div>
                  )}
                </div>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowProfilModal(true)}>
                  ✏️ Edit Profil
                </button>
              </div>
            ) : (
              <button className="btn btn-outline-dark profile-btn" onClick={() => setShowProfilModal(true)}>
                👤 Profil
              </button>
            )}
          </div>
        </div>

        {/* ════ Search Bar ════ */}
        <div className="d-flex gap-2 mb-4">
          <input
            type="text" className="form-control search-input"
            placeholder="Masukan keluhan atau gejala sakit..."
            value={keluhan} onChange={(e) => setKeluhan(e.target.value)} onKeyDown={handleKeyDown}
          />
          <button className="btn text-white px-4 search-btn" onClick={handleCari} disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm" /> : "🔍 Cari"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center mt-4">
            <div className="spinner-border text-info" role="status" />
            <p className="mt-2 text-muted">Sedang memproses TF-IDF & Cosine Similarity...</p>
          </div>
        )}

        {/* Alert Darurat */}
        {!loading && isDarurat && (
          <div className="alert-darurat">
            <div className="darurat-icon">🚨</div>
            <h5 className="darurat-title">Gejala Darurat Terdeteksi!</h5>
            <p className="darurat-desc">
              Berdasarkan keluhan yang Anda masukkan, gejala Anda terindikasi
              sebagai kondisi darurat medis. Pengobatan mandiri tidak disarankan.
            </p>
            <div className="darurat-action">
              <span className="darurat-badge">🏥 Segera hubungi dokter atau pergi ke IGD terdekat!</span>
            </div>
            <button className="btn btn-outline-danger mt-3 btn-sm"
              onClick={() => { setIsDarurat(false); setSudahCari(false); setKeluhan(""); }}>
              ← Kembali
            </button>
          </div>
        )}

        {/* Hasil Obat */}
        {!loading && !isDarurat && (
          <>
            {sudahCari && (
              <h5 className="fw-bold mb-3">
                {hasilObat.length > 0
                  ? `Hasil Rekomendasi (${hasilObat.length} obat ditemukan)`
                  : "Hasil Obat Anda"}
              </h5>
            )}

            {sudahCari && hasilObat.length === 0 && (
              <div className="alert alert-warning text-center mt-3">
                😕 Tidak ada obat yang cocok dengan keluhan dan profil Anda.
                <br /><small className="text-muted">Coba masukkan keluhan yang lebih spesifik.</small>
              </div>
            )}

            <div className="row g-3">
              {hasilObat.map((item, index) => (
                <div className="col-lg-2 col-md-3 col-sm-4 col-6" key={item.id}>
                  <div className="card medicine-card h-100 text-center shadow-sm">

                    <div className="rank-badge">#{index + 1}</div>

                    {/* ✅ ICON BOOKMARK */}
                    <button
                      className={`bookmark-btn ${isSaved(item.id) ? "bookmark-active" : ""}`}
                      onClick={(e) => handleToggleSave(e, item)}
                      title={isSaved(item.id) ? "Hapus dari simpan" : "Simpan obat ini"}
                    >
                      🔖
                    </button>

                    <div className="medicine-image-wrap p-2">
                      <ObatImage gambar={item.gambar} namaObat={item.nama_obat} height="80px" />
                    </div>

                    <div className="card-body p-2 d-flex flex-column">
                      <p className="medicine-name mb-1">{item.nama_obat}</p>
                      <small className="text-muted mb-1">{item.kategori_penyakit || "-"}</small>
                      <div className="skor-badge mb-2">Skor: {(item.skor * 100).toFixed(1)}%</div>
                      <button
                        className="btn btn-info btn-sm text-white mt-auto detail-btn"
                        onClick={() => setSelectedObat(item)}
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ════ MODAL PROFIL ════ */}
      {showProfilModal && (
        <div className="modal-overlay" onClick={() => setShowProfilModal(false)}>
          <div className="modal-box shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">📋 Data Pengguna</h5>
            </div>
            <div className="modal-body-custom">
              <div className="mb-3">
                <label className="form-label fw-semibold">Usia <span className="text-danger">*</span></label>
                <input type="number" className="form-control" placeholder="Masukan usia Anda (tahun)"
                  value={profil.usia} min={1} max={120}
                  onChange={(e) => setProfil({ ...profil, usia: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Jenis Kelamin</label>
                <div className="d-flex gap-3">
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="jenisKelamin"
                      id="lakiLaki" value="laki-laki" checked={profil.jenis_kelamin === "laki-laki"}
                      onChange={(e) => setProfil({ ...profil, jenis_kelamin: e.target.value, status_hamil: "tidak" })} />
                    <label className="form-check-label" htmlFor="lakiLaki">👨 Laki-laki</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="jenisKelamin"
                      id="perempuan" value="perempuan" checked={profil.jenis_kelamin === "perempuan"}
                      onChange={(e) => setProfil({ ...profil, jenis_kelamin: e.target.value })} />
                    <label className="form-check-label" htmlFor="perempuan">👩 Perempuan</label>
                  </div>
                </div>
              </div>
              {profil.jenis_kelamin === "perempuan" && (
                <div className="mb-3 status-hamil-box">
                  <label className="form-label fw-semibold">Status Kehamilan</label>
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="statusHamil"
                        id="tidakHamil" value="tidak" checked={profil.status_hamil === "tidak"}
                        onChange={(e) => setProfil({ ...profil, status_hamil: e.target.value })} />
                      <label className="form-check-label" htmlFor="tidakHamil">Tidak Hamil</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="statusHamil"
                        id="hamil" value="hamil" checked={profil.status_hamil === "hamil"}
                        onChange={(e) => setProfil({ ...profil, status_hamil: e.target.value })} />
                      <label className="form-check-label" htmlFor="hamil">🤰 Hamil</label>
                    </div>
                  </div>
                </div>
              )}
              <div className="mb-1">
                <label className="form-label fw-semibold">Riwayat Penyakit</label>
                <input type="text" className="form-control"
                  placeholder="Contoh: diabetes, hipertensi... (opsional)"
                  value={profil.riwayat_penyakit}
                  onChange={(e) => setProfil({ ...profil, riwayat_penyakit: e.target.value })} />
                <small className="text-muted">Obat berbahaya untuk riwayat penyakit Anda akan disaring otomatis.</small>
              </div>
            </div>
            <div className="modal-footer-custom">
              <button className="btn btn-secondary" onClick={() => setShowProfilModal(false)}>Batal</button>
              <button className="btn btn-info text-white" onClick={handleSimpanProfil}>💾 Simpan Profil</button>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL DETAIL OBAT ════ */}
      {selectedObat && (
        <div className="modal-overlay" onClick={() => setSelectedObat(null)}>
          <div className="modal-box shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">Detail Obat</h5>
            </div>
            <div className="modal-body-custom">
              <div className="text-center mb-3">
                <div className="modal-image-wrap mx-auto">
                  <ObatImage gambar={selectedObat.gambar} namaObat={selectedObat.nama_obat} height="120px" />
                </div>
                <p className="text-muted small mt-2">Informasi Produk</p>
              </div>
              <div className="text-center mb-3">
                <span className="badge bg-info text-white px-3 py-2" style={{ fontSize: "0.85rem" }}>
                  Skor Relevansi: {(selectedObat.skor * 100).toFixed(1)}%
                  &nbsp;|&nbsp;
                  Cosine: {(selectedObat.cosine * 100).toFixed(1)}%
                </span>
              </div>
              <div className="modal-detail-body text-start">
                {[
                  { label: "Nama Obat",        value: selectedObat.nama_obat            },
                  { label: "Komposisi",         value: selectedObat.komposisi_clean      },
                  { label: "Kategori Penyakit", value: selectedObat.kategori_penyakit    },
                  { label: "Indikasi",          value: selectedObat.indikasi_clean       },
                  { label: "Dosis Anak",        value: selectedObat.dosis_anak_clean     },
                  { label: "Dosis Dewasa",      value: selectedObat.dosis_dewasa_clean   },
                  { label: "Efek Samping",      value: selectedObat.efeksamping          },
                  { label: "Kontra Indikasi",   value: selectedObat.kontraindikasi_clean },
                  { label: "Jangka Waktu",      value: selectedObat.jangka_waktu_clean   },
                  { label: "Status Obat",       value: selectedObat.status_obat_label    },
                ].map((row) => (
                  <div className="detail-row" key={row.label}>
                    <span className="detail-label">{row.label}</span>
                    <span className="detail-value">{row.value || "-"}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer-custom">
              {/* ✅ Tombol Simpan di Modal */}
              <button
                className={`btn fw-semibold ${isSaved(selectedObat.id) ? "btn-simpan-active" : "btn-simpan"}`}
                onClick={(e) => handleToggleSave(e, selectedObat)}
              >
                {isSaved(selectedObat.id) ? "🔖 Tersimpan" : "🔖 Simpan"}
              </button>
              <button className="btn btn-info text-white" onClick={() => setSelectedObat(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Recommendation;