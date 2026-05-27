// SavedList.jsx
// ✅ PERBAIKAN:
//   1. BPOM Badge ditambahkan di modal detail
//   2. Field Status BPOM ditambahkan di baris detail
//   3. Escape key menutup modal / lightbox
//   4. API_BASE dari env variable
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import "./SavedList.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const getToken = () => localStorage.getItem("token");

// ════════════════════════════════════════════════════════════
// ✅ BARU: Badge BPOM (konsisten dengan halaman lain)
// ════════════════════════════════════════════════════════════
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
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      fontSize: "0.7rem", fontWeight: 700,
      padding: "3px 10px 3px 6px", borderRadius: "20px",
      border: `1.5px solid ${cfg.color}`, color: cfg.color,
      background: "white", whiteSpace: "nowrap",
    }}>
      <span style={{
        backgroundColor: cfg.color, width: "10px", height: "10px",
        minWidth: "10px", borderRadius: "50%", display: "inline-block",
      }} />
      {cfg.label}
    </span>
  );
}

// ════════════════════════════════════════════════════════════
// ✅ BARU: Disclaimer medis mini
// ════════════════════════════════════════════════════════════
function DisclaimerMini() {
  return (
    <div style={{
      background: "#f0fafb", border: "1px solid #b2ebef",
      borderRadius: "10px", padding: "8px 12px",
      fontSize: "0.78rem", color: "#555", lineHeight: "1.5",
      marginTop: "12px",
    }}>
      ⚕️ Informasi ini hanya sebagai referensi. Konsultasikan dengan apoteker atau dokter sebelum mengonsumsi obat.
    </div>
  );
}

function SavedList() {
  const [savedList, setSavedList]       = useState([]);
  const [search, setSearch]             = useState("");
  const [selectedObat, setSelectedObat] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [lightboxImg, setLightboxImg]   = useState(null);

  // ── Ambil data dari API ──────────────────────────────────
  useEffect(() => {
    const fetchSaved = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/saved`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Gagal mengambil data");
        }
        const data = await res.json();
        setSavedList(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Tidak dapat memuat daftar simpan.");
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, []);

  // ✅ BARU: Escape key menutup modal / lightbox
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key !== "Escape") return;
      if (lightboxImg)  { setLightboxImg(null);  return; }
      if (selectedObat) { setSelectedObat(null); }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [lightboxImg, selectedObat]);

  // ── Hapus dari API ───────────────────────────────────────
  const handleHapus = async (savedId) => {
    try {
      const res = await fetch(`${API_BASE}/api/saved/${savedId}`, {
        method : "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Gagal menghapus");
      setSavedList((prev) => prev.filter((item) => item.saved_id !== savedId));
      if (selectedObat && selectedObat.saved_id === savedId) setSelectedObat(null);
    } catch {
      alert("Gagal menghapus. Coba lagi.");
    }
  };

  // ── Helper field ─────────────────────────────────────────
  const get = (item, ...keys) => {
    for (const k of keys) { if (item[k] && item[k] !== "-") return item[k]; }
    return "-";
  };
  const getNamaObat    = (item) => get(item, "nama_obat", "name");
  const getKategori    = (item) => get(item, "kategori_penyakit", "kategori");
  const getKategoriBpom= (item) => get(item, "kategori_bpom", "kategoriBpom");  // ✅ BARU
  const getKategoriObat= (item) => get(item, "kategori_obat", "kategoriObat");  // ✅ BARU
  const getKomposisi   = (item) => get(item, "komposisi_clean", "komposisi");
  const getIndikasi    = (item) => get(item, "indikasi_clean", "indikasi");
  const getDosisAnak   = (item) => get(item, "dosis_anak_clean", "dosisAnak");
  const getDosisD      = (item) => get(item, "dosis_dewasa_clean", "dosis_dewasa");
  const getEfek        = (item) => get(item, "efeksamping", "efekSamping");
  const getKontra      = (item) => get(item, "kontraindikasi_clean", "kontraIndikasi");
  const getJangka      = (item) => get(item, "jangka_waktu_clean", "jangkaWaktu");
  const getAturan              = (item) => get(item, "aturan_pemakaian",        "aturanPemakaian");
  const getInteraksi           = (item) => get(item, "interaksi_obat",          "interaksiObat");
  const getAturanJualOnline    = (item) => get(item, "aturan_penjualan_online",  "aturanJualOnline");
  const getLabelPeringatanBpom = (item) => get(item, "label_peringatan_bpom",   "labelPeringatanBpom");
  const getStatus      = (item) => get(item, "status_obat_label", "statusObat");
  const getGambar      = (item) => {
    if (item.image && item.image.startsWith("http")) return item.image;
    if (item.gambar) return `${API_BASE}/static/images/${item.gambar}`;
    return null;
  };

  const filtered = savedList.filter((item) =>
    getNamaObat(item).toLowerCase().includes(search.toLowerCase())
  );

  // ── Komponen gambar ──────────────────────────────────────
  function SavedImg({ src, name, clickable = false }) {
    const [err, setErr] = useState(false);
    const inisial = (name || "?")
      .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

    if (!src || err) {
      return (
        <div className="saved-placeholder">
          <span className="placeholder-inisial">{inisial}</span>
          <span className="placeholder-nama">{name?.split(" ")[0]}</span>
        </div>
      );
    }
    return (
      <img
        src={src}
        alt={name}
        onClick={clickable ? () => setLightboxImg({ src, name }) : undefined}
        style={{
          cursor       : clickable ? "zoom-in" : "default",
          width        : "100%",
          height       : "100%",
          objectFit    : "contain",
          objectPosition: "center",
          padding      : "8px",
        }}
        onError={() => setErr(true)}
      />
    );
  }

  return (
    <div className="savedlist-page">
      <Navbar />
      <div className="container-fluid px-4 mt-4 pb-5">
        <h4 className="savedlist-title">Daftar Simpan</h4>

        {/* Search */}
        <div className="savedlist-search-wrap mb-3">
          <span className="search-icon">🔍</span>
          <input type="text" className="savedlist-search"
            placeholder="Cari obat yang disimpan"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        {loading && (
          <div className="text-center mt-5">
            <div className="spinner-border text-info" role="status" />
            <p className="mt-2 text-muted">Memuat daftar simpan...</p>
          </div>
        )}

        {!loading && error && (
          <div className="alert alert-warning mt-3">⚠️ {error}</div>
        )}

        {!loading && !error && savedList.length > 0 && (
          <p className="savedlist-desc">
            "Ini adalah obat-obatan yang telah Anda simpan. Anda dapat melihat
            detailnya atau menghapusnya kapan saja."
          </p>
        )}

        {!loading && !error && savedList.length === 0 && (
          <div className="savedlist-empty">
            <div className="empty-icon">🔖</div>
            <h5>Belum ada obat yang disimpan</h5>
            <p className="text-muted">
              Simpan obat dari menu <strong>Search Medicine</strong> atau{" "}
              <strong>Recommendation</strong> dengan menekan icon{" "}
              <span style={{ color: "#53c5c9" }}>🔖</span>
            </p>
          </div>
        )}

        {!loading && savedList.length > 0 && filtered.length === 0 && (
          <div className="text-center mt-4">
            <p className="text-muted">
              😕 Obat "<strong>{search}</strong>" tidak ditemukan di daftar simpan.
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && (
          <div className="row g-3 mt-1">
            {filtered.map((item) => (
              <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6 col-6" key={item.saved_id}>
                <div className="card saved-card h-100 shadow-sm">
                  <div className="bookmark-icon saved">🔖</div>
                  <div className="saved-image-wrap">
                    <SavedImg src={getGambar(item)} name={getNamaObat(item)} clickable={true} />
                  </div>
                  <div className="card-body p-2 d-flex flex-column text-center">
                    <p className="saved-name mb-1">{getNamaObat(item)}</p>
                    <small className="saved-kategori fw-bold mb-1">{getKategori(item)}</small>
                    {/* ✅ BARU: BPOM badge di card */}
                    <div className="mb-2">
                      <BpomBadge kategori={getKategoriBpom(item)} />
                    </div>
                    <div className="d-flex gap-2 mt-auto">
                      <button className="btn btn-detail flex-fill"
                        onClick={() => setSelectedObat(item)}>Detail</button>
                      <button className="btn btn-hapus flex-fill"
                        onClick={() => handleHapus(item.saved_id)}>Hapus</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DETAIL */}
      {selectedObat && (
        <div className="modal-overlay" onClick={() => setSelectedObat(null)}>
          <div className="modal-box shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">Detail Obat</h5>
            </div>
            <div className="modal-body-custom">
              <div className="text-center mb-3">
                <div className="modal-image-wrap mx-auto" style={{ position: "relative" }}>
                  <SavedImg
                    src={getGambar(selectedObat)}
                    name={getNamaObat(selectedObat)}
                    clickable={!!getGambar(selectedObat)}
                  />
                </div>
                {/* ✅ BARU: BPOM Badge di modal */}
                <div className="mt-2">
                  <BpomBadge kategori={getKategoriBpom(selectedObat)} />
                </div>
                <p className="text-muted small mt-2">Informasi Produk</p>
              </div>

              <div className="modal-detail-body text-start">
                {[
                  { label: "Nama Obat",        value: getNamaObat(selectedObat)     },
                  { label: "Jenis Obat",        value: getKategoriObat(selectedObat) }, // ✅ BARU
                  { label: "Status BPOM",       value: getKategoriBpom(selectedObat) }, // ✅ BARU
                  { label: "Komposisi",         value: getKomposisi(selectedObat)    },
                  { label: "Kategori Penyakit", value: getKategori(selectedObat)     },
                  { label: "Indikasi",          value: getIndikasi(selectedObat)     },
                  { label: "Aturan Pemakaian", value: getAturan(selectedObat)       }, // ✅ BARU
                  { label: "Interaksi Obat",    value: getInteraksi(selectedObat)    }, // ✅ BARU
                  { label: "Aturan Jual Online", value: getAturanJualOnline(selectedObat) }, // ✅ BARU
                  { label: "Label Peringatan BPOM", value: getLabelPeringatanBpom(selectedObat) }, // ✅ BARU
                  { label: "Dosis Anak",        value: getDosisAnak(selectedObat)    },
                  { label: "Dosis Dewasa",      value: getDosisD(selectedObat)       },
                  { label: "Efek Samping",      value: getEfek(selectedObat)         },
                  { label: "Kontra Indikasi",   value: getKontra(selectedObat)       },
                  { label: "Jangka Waktu",      value: getJangka(selectedObat)       },
                  { label: "Status Obat",       value: getStatus(selectedObat)       },
                ].map((row) => (
                  <div className="detail-row" key={row.label}>
                    <span className="detail-label">{row.label}</span>
                    <span className="detail-value">{row.value || "-"}</span>
                  </div>
                ))}
              </div>

              {/* ✅ BARU: Disclaimer di modal */}
              <DisclaimerMini />
            </div>

            <div className="modal-footer-custom">
              <button className="btn btn-hapus-modal"
                onClick={() => handleHapus(selectedObat.saved_id)}>
                🗑️ Hapus dari Simpan
              </button>
              <button className="btn btn-info text-white"
                onClick={() => setSelectedObat(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightboxImg && (
        <div className="lightbox-overlay" onClick={() => setLightboxImg(null)}>
          <p className="lightbox-title">{lightboxImg.name}</p>
          <img src={lightboxImg.src} alt={lightboxImg.name}
            className="lightbox-img" onClick={(e) => e.stopPropagation()} />
          <button className="lightbox-close-btn" onClick={() => setLightboxImg(null)}>
            ✕ Tutup
          </button>
          <p className="lightbox-hint">Klik di luar gambar untuk menutup</p>
        </div>
      )}
    </div>
  );
}

export default SavedList;