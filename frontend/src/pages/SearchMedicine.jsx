import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useSavedList } from "../hooks/Usesavedlist";
import "./SearchMedicine.css";

const BPOM_CONFIG = {
  "hijau" : { color: "#28a745", label: "Obat Bebas"          },
  "biru"  : { color: "#007bff", label: "Obat Bebas Terbatas" },
  "merah" : { color: "#dc3545", label: "Obat Keras"          },
  "obat bebas"         : { color: "#28a745", label: "Obat Bebas"          },
  "obat bebas terbatas": { color: "#007bff", label: "Obat Bebas Terbatas" },
  "obat keras"         : { color: "#dc3545", label: "Obat Keras"          },
  "narkotika"          : { color: "#343a40", label: "Narkotika"           },
  "psikotropika"       : { color: "#6f42c1", label: "Psikotropika"        },
};

function BpomBadge({ kategori }) {
  if (!kategori || kategori === "-" || kategori === "null") return null;
  const key = kategori.trim().toLowerCase();
  const cfg = BPOM_CONFIG[key] || { color: "#6c757d", label: kategori };
  const dotStyle = {
    backgroundColor : cfg.color,
    width           : "12px",
    height          : "12px",
    minWidth        : "12px",
    minHeight       : "12px",
    borderRadius    : "50%",
    display         : "inline-block",
    flexShrink      : 0,
  };
  return (
    <span
      className="bpom-badge"
      style={{ borderColor: cfg.color, color: cfg.color }}
      title={`Status BPOM: ${cfg.label}`}
    >
      <span style={dotStyle} />
      <span className="bpom-label">{cfg.label}</span>
    </span>
  );
}

function SearchMedicine() {
  const [search, setSearch]                     = useState("");
  const [submittedSearch, setSubmittedSearch]   = useState("");
  const [selectedKategori, setSelectedKategori] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [medicines, setMedicines]               = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [toastMsg, setToastMsg]                 = useState("");

  // ✅ BARU: state lightbox
  const [lightboxImg, setLightboxImg]           = useState(null); // { src, name }

  const { isSaved, toggleSave } = useSavedList();

  useEffect(() => {
    fetch("http://localhost:5000/api/obat")
      .then((res) => res.json())
      .then((data) => {
        const formattedData = data.map((item) => ({
          id            : item.id,
          name          : item.nama_obat           ?? "Tanpa Nama",
          kategoriObat  : item.kategori_obat       ?? "-",
          kategori      : item.kategori_penyakit   ?? "-",
          kategoriBpom  : item.kategori_bpom       ?? "-",
          indikasi      : item.indikasi_clean       ?? "-",
          dosisAnak     : item.dosis_anak_clean     ?? "-",
          dosis_dewasa  : item.dosis_dewasa_clean   ?? "-",
          efekSamping   : item.efeksamping          ?? "-",
          kontraIndikasi: item.kontraindikasi_clean ?? "-",
          komposisi     : item.komposisi_clean      ?? "-",
          jangkaWaktu   : item.jangka_waktu_clean   ?? "-",
          statusObat    : item.status_obat_label    ?? "-",
          gambar        : item.gambar,
          image         : item.gambar
            ? `http://localhost:5000/static/images/${item.gambar}`
            : null,
        }));
        const sample = formattedData.slice(0, 5).map(d => ({ nama: d.name, bpom: d.kategoriBpom }));
        console.log("🔍 Sample kategori_bpom:", sample);
        setMedicines(formattedData);
        setLoading(false);
      })
      .catch((err) => { console.log("Error fetch:", err); setLoading(false); });
  }, []);

  const daftarKategori = [...new Set(
    medicines.map((m) => m.kategoriObat).filter((k) => k && k !== "-")
  )].sort();

  const handleSearch  = () => setSubmittedSearch(search.trim());
  const handleKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };

  const filteredMedicine = medicines.filter((item) => {
    const cocokNama     = item.name.toLowerCase().includes(submittedSearch.toLowerCase());
    const cocokKategori = selectedKategori === "" || item.kategoriObat === selectedKategori;
    return cocokNama && cocokKategori;
  });

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

  const handleReset = () => {
    setSearch("");
    setSubmittedSearch("");
    setSelectedKategori("");
  };

  function ObatImg({ src, name }) {
    const [err, setErr] = useState(false);
    const inisial = (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

    if (!src || err) {
      return (
        <div style={{
          width: "100%", height: "100%",
          background: "linear-gradient(135deg, #53c5c9, #3fb2b6)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          color: "white", gap: "4px",
        }}>
          <span style={{ fontSize: "2rem", fontWeight: 700 }}>{inisial}</span>
          <span style={{ fontSize: "0.65rem", opacity: 0.9 }}>{name?.split(" ")[0]}</span>
        </div>
      );
    }
    return (
      <img
        src={src}
        alt={name}
        style={{
          width         : "100%",
          height        : "100%",
          objectFit     : "contain",
          objectPosition: "center",
          padding       : "4px",
        }}
        onError={() => setErr(true)}
      />
    );
  }

  const labelHasil = () => {
    if (submittedSearch && selectedKategori)
      return `Hasil "${submittedSearch}" · ${selectedKategori} (${filteredMedicine.length} obat)`;
    if (submittedSearch)
      return `Hasil pencarian "${submittedSearch}" (${filteredMedicine.length} obat)`;
    if (selectedKategori)
      return `${selectedKategori} (${filteredMedicine.length} obat)`;
    return `Semua Obat (${medicines.length} obat)`;
  };

  return (
    <div>
      <Navbar />

      {toastMsg && <div className="save-toast">{toastMsg}</div>}

      <div className="search-page container-fluid px-4 mt-4">
        <h4 className="fw-bold">Pencarian Obat</h4>

        {/* Search + Filter */}
        <div className="search-filter-wrap mt-3">
          <input
            type="text"
            placeholder="Cari nama obat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="form-control search-input"
          />
          <select
            className="form-select kategori-select"
            value={selectedKategori}
            onChange={(e) => setSelectedKategori(e.target.value)}
          >
            <option value="">Semua Jenis Obat</option>
            {daftarKategori.map((kat) => (
              <option key={kat} value={kat}>{kat}</option>
            ))}
          </select>
          <button className="btn btn-cari text-white px-4" onClick={handleSearch}>
            🔍 Cari
          </button>
          {(submittedSearch || selectedKategori) && (
            <button className="btn btn-reset px-3" onClick={handleReset}>
              ✕ Reset
            </button>
          )}
        </div>

        {selectedKategori && (
          <div className="mt-2">
            <span className="kategori-chip">
              💊 {selectedKategori}
              <button className="chip-close" onClick={() => setSelectedKategori("")}>✕</button>
            </span>
          </div>
        )}

        <h5 className="mt-3 result-label">{labelHasil()}</h5>

        {loading && <p className="text-center text-muted mt-4">Memuat data obat...</p>}

        {!loading && filteredMedicine.length === 0 && (submittedSearch || selectedKategori) && (
          <div className="text-center mt-5">
            <p className="text-muted fs-5">
              😕 Obat tidak ditemukan.
              <br />
              <small>Coba ubah kata kunci atau pilih jenis obat lain.</small>
            </p>
          </div>
        )}

        {/* Grid Card */}
        <div className="row mt-3 g-3">
          {filteredMedicine.map((item) => (
            <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6 col-6" key={item.id}>
              <div className="card medicine-card h-100 shadow-sm">

                <button
                  className={`bookmark-btn ${isSaved(item.id) ? "bookmark-active" : ""}`}
                  onClick={(e) => handleToggleSave(e, item)}
                  title={isSaved(item.id) ? "Hapus dari simpan" : "Simpan obat ini"}
                >
                  🔖
                </button>

                {/* ✅ DIUBAH: card-img-wrap bisa diklik untuk lightbox */}
                <div
                  className={`card-img-wrap ${item.image ? "card-img-clickable" : ""}`}
                  onClick={() => item.image && setLightboxImg({ src: item.image, name: item.name })}
                  title={item.image ? "🔍 Klik untuk perbesar gambar" : ""}
                >
                  <ObatImg src={item.image} name={item.name} />
                  {/* ✅ Ikon zoom muncul saat hover (hanya jika ada gambar) */}
                  {item.image && (
                    <div className="img-zoom-hint">🔍</div>
                  )}
                </div>

                <div className="card-body text-center d-flex flex-column p-2">
                  <h6 className="fw-bold medicine-name">{item.name}</h6>
                  <small className="text-muted mb-1">{item.kategori}</small>
                  {item.kategoriObat && item.kategoriObat !== "-" && (
                    <span
                      className="kategori-badge-card mb-1"
                      onClick={() => setSelectedKategori(item.kategoriObat)}
                      title={`Filter: ${item.kategoriObat}`}
                    >
                      💊 {item.kategoriObat}
                    </span>
                  )}
                  <div className="mb-2">
                    <BpomBadge kategori={item.kategoriBpom} />
                  </div>
                  <button
                    className="btn btn-info mt-auto text-white btn-sm"
                    onClick={() => setSelectedMedicine(item)}
                  >
                    Detail
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DETAIL */}
      {selectedMedicine && (
        <div className="modal-overlay" onClick={() => setSelectedMedicine(null)}>
          <div className="modal-content shadow" onClick={(e) => e.stopPropagation()}>
            <h5 className="modal-title">Detail Obat</h5>
            <div className="modal-image">
              {/* ✅ Gambar di modal juga bisa diklik untuk lightbox */}
              <div
                style={{
                  height    : "150px",
                  display   : "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor    : selectedMedicine.image ? "zoom-in" : "default",
                  position  : "relative",
                }}
                onClick={() =>
                  selectedMedicine.image &&
                  setLightboxImg({ src: selectedMedicine.image, name: selectedMedicine.name })
                }
                title={selectedMedicine.image ? "🔍 Klik untuk perbesar" : ""}
              >
                <ObatImg src={selectedMedicine.image} name={selectedMedicine.name} />
                {selectedMedicine.image && (
                  <div className="modal-img-zoom-hint">🔍 Perbesar</div>
                )}
              </div>
              <div className="mt-2">
                <BpomBadge kategori={selectedMedicine.kategoriBpom} />
              </div>
              <p className="text-muted small mt-1">Informasi Produk</p>
            </div>
            <div className="modal-detail-body text-start">
              {[
                { label: "Nama Obat",        value: selectedMedicine.name           },
                { label: "Jenis Obat",        value: selectedMedicine.kategoriObat   },
                { label: "Status BPOM",       value: selectedMedicine.kategoriBpom   },
                { label: "Komposisi",         value: selectedMedicine.komposisi      },
                { label: "Kategori Penyakit", value: selectedMedicine.kategori       },
                { label: "Indikasi",          value: selectedMedicine.indikasi       },
                { label: "Dosis Anak",        value: selectedMedicine.dosisAnak      },
                { label: "Dosis Dewasa",      value: selectedMedicine.dosis_dewasa   },
                { label: "Efek Samping",      value: selectedMedicine.efekSamping    },
                { label: "Kontra Indikasi",   value: selectedMedicine.kontraIndikasi },
                { label: "Jangka Waktu",      value: selectedMedicine.jangkaWaktu    },
                { label: "Status Obat",       value: selectedMedicine.statusObat     },
              ].map((row) => (
                <div className="detail-row" key={row.label}>
                  <span className="detail-label">{row.label}</span>
                  <span className="detail-value">{row.value || "-"}</span>
                </div>
              ))}
            </div>
            <div className="d-flex gap-2 mt-3">
              <button
                className={`btn flex-fill fw-semibold ${isSaved(selectedMedicine.id) ? "btn-simpan-active" : "btn-simpan"}`}
                onClick={(e) => handleToggleSave(e, selectedMedicine)}
              >
                {isSaved(selectedMedicine.id) ? "🔖 Tersimpan" : "🔖 Simpan"}
              </button>
              <button className="btn btn-info text-white flex-fill" onClick={() => setSelectedMedicine(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ BARU: LIGHTBOX MODAL */}
      {lightboxImg && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightboxImg(null)}
        >
          {/* Nama obat */}
          <p className="lightbox-title">{lightboxImg.name}</p>

          {/* Gambar */}
          <img
            src={lightboxImg.src}
            alt={lightboxImg.name}
            className="lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Tombol tutup */}
          <button
            className="lightbox-close-btn"
            onClick={() => setLightboxImg(null)}
          >
            ✕ Tutup
          </button>

          <p className="lightbox-hint">Klik di luar gambar untuk menutup</p>
        </div>
      )}
    </div>
  );
}

export default SearchMedicine;