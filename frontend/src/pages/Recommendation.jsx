import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { useSavedList } from "../hooks/Usesavedlist";
import "./Recommendation.css";

// ════════════════════════════════════════════════════
// Komponen gambar — seragam dengan SearchMedicine
// ════════════════════════════════════════════════════
function ObatImage({ gambar, namaObat }) {
  const [imgError, setImgError] = useState(false);
  const inisial = (namaObat || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  // ✅ Cek berbagai kemungkinan nilai gambar
  const gambarValid = gambar && gambar !== "null" && gambar !== "undefined" && gambar !== "-";

  if (!gambarValid || imgError) {
    return (
      <div style={{
        width: "100%", height: "100%",
        background: "linear-gradient(135deg, #53c5c9, #3fb2b6)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        color: "white", gap: "4px",
      }}>
        <span style={{ fontSize: "1.8rem", fontWeight: 700 }}>{inisial}</span>
        <span style={{ fontSize: "0.62rem", opacity: 0.9 }}>{namaObat?.split(" ")[0]}</span>
      </div>
    );
  }

  // ✅ Jika sudah URL lengkap pakai langsung, jika tidak tambah base URL
  const imgSrc = gambar.startsWith("http")
    ? gambar
    : `http://localhost:5000/static/images/${gambar}`;

  return (
    <img
      src={imgSrc}
      alt={namaObat}
      style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center", padding: "4px" }}
      onError={() => setImgError(true)}
    />
  );
}

// ════════════════════════════════════════════════════
// Badge BPOM — sama persis dengan SearchMedicine
// ════════════════════════════════════════════════════
const BPOM_CONFIG = {
  "hijau"              : { color: "#28a745", label: "Obat Bebas"          },
  "biru"               : { color: "#007bff", label: "Obat Bebas Terbatas" },
  "merah"              : { color: "#dc3545", label: "Obat Keras"          },
  "obat bebas"         : { color: "#28a745", label: "Obat Bebas"          },
  "obat bebas terbatas": { color: "#007bff", label: "Obat Bebas Terbatas" },
  "obat keras"         : { color: "#dc3545", label: "Obat Keras"          },
  "narkotika"          : { color: "#343a40", label: "Narkotika"           },
  "psikotropika"       : { color: "#6f42c1", label: "Psikotropika"        },
};

function BpomBadge({ kategori }) {
  if (!kategori || kategori === "-" || kategori === "null") return null;
  const cfg = BPOM_CONFIG[kategori.trim().toLowerCase()] || { color: "#6c757d", label: kategori };
  const dotStyle = {
    backgroundColor: cfg.color,
    width: "10px", height: "10px",
    minWidth: "10px", minHeight: "10px",
    borderRadius: "50%", display: "inline-block", flexShrink: 0,
  };
  return (
    <span className="bpom-badge" style={{ borderColor: cfg.color, color: cfg.color }}>
      <span style={dotStyle} />
      <span className="bpom-label">{cfg.label}</span>
    </span>
  );
}

// ════════════════════════════════════════════════════
// Komponen Card Obat — tampilan mirip SearchMedicine
// ════════════════════════════════════════════════════
function ObatCard({ item, index, isSaved, onToggleSave, onDetail, isTop5 = false }) {
  return (
    <div className={`card medicine-card h-100 shadow-sm ${isTop5 ? "top5-card" : ""}`}>

      {/* ── Badge rank / crown ── */}
      {isTop5 && (
        <div className="top5-crown">
          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
        </div>
      )}
      {!isTop5 && <div className="rank-badge">#{index + 1}</div>}

      {/* ── Bookmark ── */}
      <button
        className={`bookmark-btn ${isSaved(item.id) ? "bookmark-active" : ""}`}
        onClick={(e) => onToggleSave(e, item)}
        title={isSaved(item.id) ? "Hapus dari simpan" : "Simpan obat ini"}
      >
        🔖
      </button>

      {/* ── Gambar — sama dengan SearchMedicine ── */}
      <div className="medicine-image-wrap">
        <ObatImage gambar={item.gambar} namaObat={item.nama_obat} />
      </div>

      {/* ── Body card ── */}
      <div className="card-body text-center d-flex flex-column p-2">
        <h6 className="medicine-name mb-1">{item.nama_obat}</h6>

        <small className="text-muted mb-1">{item.kategori_penyakit || "-"}</small>

        {/* Badge kategori obat — sama dengan SearchMedicine */}
        {item.kategori_obat && item.kategori_obat !== "-" && (
          <span className="kategori-badge-card mb-1">
            💊 {item.kategori_obat}
          </span>
        )}

        {/* Badge BPOM — sama dengan SearchMedicine */}
        <div className="mb-1">
          <BpomBadge kategori={item.kategori_bpom} />
        </div>

        {/* Peringatan hamil — tetap ada, khusus rekomendasi */}
        {item.peringatan_hamil && (
          <div style={{
            fontSize: "0.63rem", color: "#b45309", background: "#fffbeb",
            border: "1px solid #fcd34d", borderRadius: "6px",
            padding: "3px 5px", marginBottom: "4px", textAlign: "left", lineHeight: "1.3",
          }}>
            {item.peringatan_hamil}
          </div>
        )}

        {/* Skor relevansi — khusus rekomendasi */}
        <div className={`skor-badge mb-2 ${isTop5 ? "skor-badge-top5" : ""}`}>
          Skor: {(item.skor * 100).toFixed(1)}%
        </div>

        <button
          className="btn btn-info btn-sm text-white mt-auto detail-btn"
          onClick={() => onDetail(item)}
        >
          Detail
        </button>
      </div>
    </div>
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
  const [keluhan, setKeluhan]           = useState("");
  const [loading, setLoading]           = useState(false);
  const [sudahCari, setSudahCari]       = useState(false);
  const [isDarurat, setIsDarurat]       = useState(false);
  const [top5Obat, setTop5Obat]         = useState([]);
  const [hasilObat, setHasilObat]       = useState([]);
  const [selectedObat, setSelectedObat] = useState(null);
  const [toastMsg, setToastMsg]         = useState("");
  const [showLainnya, setShowLainnya]   = useState(false);

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
    setTop5Obat([]);
    setHasilObat([]);
    setShowLainnya(false);

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
        if (data.darurat) {
          setIsDarurat(true);
        } else {
          setTop5Obat(data.top5 || []);
          setHasilObat(data.hasil || []);
        }
        setLoading(false);
      })
      .catch((err) => { console.log("Error:", err); setLoading(false); });
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleCari(); };

  const hasilLainnya = hasilObat.slice(5);

  return (
    <div className="recommendation-page">
      <Navbar />

      {toastMsg && <div className="save-toast">{toastMsg}</div>}

      <div className="container-fluid px-4 mt-4 pb-5">
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

        {loading && (
          <div className="text-center mt-4">
            <div className="spinner-border text-info" role="status" />
            <p className="mt-2 text-muted">Sedang memproses TF-IDF & Cosine Similarity...</p>
          </div>
        )}

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

        {!loading && !isDarurat && sudahCari && (
          <>
            {hasilObat.length === 0 ? (
              <div className="alert alert-warning text-center mt-3">
                😕 Tidak ada obat yang cocok dengan keluhan dan profil Anda.
                <br /><small className="text-muted">Coba masukkan keluhan yang lebih spesifik.</small>
              </div>
            ) : (
              <>
                {top5Obat.length > 0 && (
                  <div className="mb-4">
                    <div className="top5-header mb-3">
                      <span className="top5-title">🏆 Top 5 Rekomendasi Terbaik</span>
                      <span className="top5-subtitle">Diurutkan berdasarkan skor TF-IDF + Cosine Similarity tertinggi</span>
                    </div>
                    <div className="row g-3">
                      {top5Obat.map((item, index) => (
                        <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6 col-6" key={item.id}>
                          <ObatCard
                            item={item} index={index}
                            isSaved={isSaved} onToggleSave={handleToggleSave}
                            onDetail={setSelectedObat} isTop5={true}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hasilLainnya.length > 0 && (
                  <div className="lainnya-section">
                    <button className="btn-lainnya-toggle" onClick={() => setShowLainnya(!showLainnya)}>
                      <span className="lainnya-toggle-label">
                        📋 Rekomendasi Lainnya ({hasilLainnya.length} obat)
                      </span>
                      <span className={`lainnya-arrow ${showLainnya ? "arrow-up" : ""}`}>▼</span>
                    </button>

                    {showLainnya && (
                      <div className="lainnya-content">
                        <div className="row g-3">
                          {hasilLainnya.map((item, index) => (
                            <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6 col-6" key={item.id}>
                              <ObatCard
                                item={item} index={index + 5}
                                isSaved={isSaved} onToggleSave={handleToggleSave}
                                onDetail={setSelectedObat} isTop5={false}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="text-center mt-4">
                          <button className="btn-lainnya-tutup" onClick={() => setShowLainnya(false)}>
                            ▲ Sembunyikan
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
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
                {/* ✅ wrapper fixed height untuk modal */}
                <div className="modal-image-wrap mx-auto" style={{ width: "160px", height: "160px" }}>
                  <ObatImage gambar={selectedObat.gambar} namaObat={selectedObat.nama_obat} />
                </div>
                {/* ✅ Badge BPOM di modal — sama dgn SearchMedicine */}
                <div className="mt-2">
                  <BpomBadge kategori={selectedObat.kategori_bpom} />
                </div>
                <p className="text-muted small mt-1">Informasi Produk</p>
              </div>
              <div className="text-center mb-3">
                <span className="badge bg-info text-white px-3 py-2" style={{ fontSize: "0.85rem" }}>
                  Skor Relevansi: {(selectedObat.skor * 100).toFixed(1)}%
                  &nbsp;|&nbsp;
                  Cosine: {(selectedObat.cosine * 100).toFixed(1)}%
                </span>
              </div>

              {selectedObat.peringatan_hamil && (
                <div style={{
                  padding: "10px 14px", borderRadius: "10px", fontSize: "0.85rem",
                  background: "#fffbeb", color: "#92400e",
                  border: "1px solid #fcd34d", marginBottom: "12px",
                }}>
                  {selectedObat.peringatan_hamil}
                </div>
              )}

              <div className="modal-detail-body text-start">
                {[
                  { label: "Nama Obat",        value: selectedObat.nama_obat            },
                  { label: "Jenis Obat",        value: selectedObat.kategori_obat        },
                  { label: "Status BPOM",       value: selectedObat.kategori_bpom        },
                  { label: "Komposisi",         value: selectedObat.komposisi_clean      },
                  { label: "Kategori Penyakit", value: selectedObat.kategori_penyakit    },
                  { label: "Indikasi",          value: selectedObat.indikasi_clean       },
                  { label: "Dosis Anak",        value: selectedObat.dosis_anak_clean     },
                  { label: "Dosis Dewasa",      value: selectedObat.dosis_dewasa_clean   },
                  { label: "Efek Samping",      value: selectedObat.efeksamping          },
                  { label: "Kontra Indikasi",   value: selectedObat.kontraindikasi_clean },
                  { label: "Jangka Waktu",      value: selectedObat.jangka_waktu_clean   },
                  { label: "Status Obat",       value: selectedObat.status_obat_label    },
                  { label: "Kat. Kehamilan",    value: selectedObat.ket_hamil            },
                ].map((row) => (
                  <div className="detail-row" key={row.label}>
                    <span className="detail-label">{row.label}</span>
                    <span className="detail-value">{row.value || "-"}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer-custom">
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