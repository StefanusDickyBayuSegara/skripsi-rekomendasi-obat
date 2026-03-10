import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import "./SavedList.css";

function SavedList() {
  const [savedList, setSavedList]       = useState([]);
  const [search, setSearch]             = useState("");
  const [selectedObat, setSelectedObat] = useState(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("savedObat") || "[]");
    setSavedList(data);
  }, []);

  const handleHapus = (id) => {
    const updated = savedList.filter((item) => item.id !== id);
    setSavedList(updated);
    localStorage.setItem("savedObat", JSON.stringify(updated));
  };

  const filtered = savedList.filter((item) =>
    (item.nama_obat || item.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const get = (item, ...keys) => {
    for (const k of keys) { if (item[k] && item[k] !== "-") return item[k]; }
    return "-";
  };

  const getNamaObat  = (item) => get(item, "nama_obat", "name");
  const getKategori  = (item) => get(item, "kategori_penyakit", "kategori");
  const getKomposisi = (item) => get(item, "komposisi_clean", "komposisi");
  const getIndikasi  = (item) => get(item, "indikasi_clean", "indikasi");
  const getDosisAnak = (item) => get(item, "dosis_anak_clean", "dosisAnak");
  const getDosisD    = (item) => get(item, "dosis_dewasa_clean", "dosis_dewasa");
  const getEfek      = (item) => get(item, "efeksamping", "efekSamping");
  const getKontra    = (item) => get(item, "kontraindikasi_clean", "kontraIndikasi");
  const getJangka    = (item) => get(item, "jangka_waktu_clean", "jangkaWaktu");
  const getStatus    = (item) => get(item, "status_obat_label", "statusObat");
  const getGambar    = (item) => {
    if (item.image && item.image.startsWith("http")) return item.image;
    if (item.gambar) return `http://localhost:5000/static/images/${item.gambar}`;
    return null;
  };

  // ✅ Komponen gambar seragam dengan SearchMedicine
  function SavedImg({ src, name }) {
    const [err, setErr] = useState(false);
    const inisial = (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

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
        style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center", padding: "8px" }}
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
          <input
            type="text"
            className="savedlist-search"
            placeholder="Cari Obat yang di simpan"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        {savedList.length > 0 && (
          <p className="savedlist-desc">
            "Ini adalah obat-obatan yang telah Anda simpan. Anda dapat melihat
            detailnya atau menghapusnya kapan saja."
          </p>
        )}

        {savedList.length === 0 && (
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

        {savedList.length > 0 && filtered.length === 0 && (
          <div className="text-center mt-4">
            <p className="text-muted">
              😕 Obat "<strong>{search}</strong>" tidak ditemukan di daftar simpan.
            </p>
          </div>
        )}

        {/* Grid */}
        <div className="row g-3 mt-1">
          {filtered.map((item) => {
            const namaObat  = getNamaObat(item);
            const gambarSrc = getGambar(item);

            return (
              <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6 col-6" key={item.id}>
                <div className="card saved-card h-100 shadow-sm">

                  <div className="bookmark-icon saved">🔖</div>

                  {/* ✅ wrapper fixed height seragam */}
                  <div className="saved-image-wrap">
                    <SavedImg src={gambarSrc} name={namaObat} />
                  </div>

                  <div className="card-body p-2 d-flex flex-column text-center">
                    <p className="saved-name mb-1">{namaObat}</p>
                    <small className="saved-kategori fw-bold mb-2">{getKategori(item)}</small>

                    <div className="d-flex gap-2 mt-auto">
                      <button className="btn btn-detail flex-fill" onClick={() => setSelectedObat(item)}>
                        Detail
                      </button>
                      <button className="btn btn-hapus flex-fill" onClick={() => handleHapus(item.id)}>
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ════ MODAL DETAIL ════ */}
      {selectedObat && (
        <div className="modal-overlay" onClick={() => setSelectedObat(null)}>
          <div className="modal-box shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">Detail Obat</h5>
            </div>
            <div className="modal-body-custom">
              <div className="text-center mb-3">
                {/* ✅ modal image wrap fixed size */}
                <div className="modal-image-wrap mx-auto">
                  <SavedImg src={getGambar(selectedObat)} name={getNamaObat(selectedObat)} />
                </div>
                <p className="text-muted small mt-2">Informasi Produk</p>
              </div>
              <div className="modal-detail-body text-start">
                {[
                  { label: "Nama Obat",        value: getNamaObat(selectedObat)  },
                  { label: "Komposisi",         value: getKomposisi(selectedObat) },
                  { label: "Kategori Penyakit", value: getKategori(selectedObat)  },
                  { label: "Indikasi",          value: getIndikasi(selectedObat)  },
                  { label: "Dosis Anak",        value: getDosisAnak(selectedObat) },
                  { label: "Dosis Dewasa",      value: getDosisD(selectedObat)    },
                  { label: "Efek Samping",      value: getEfek(selectedObat)      },
                  { label: "Kontra Indikasi",   value: getKontra(selectedObat)    },
                  { label: "Jangka Waktu",      value: getJangka(selectedObat)    },
                  { label: "Status Obat",       value: getStatus(selectedObat)    },
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
                className="btn btn-hapus-modal"
                onClick={() => { handleHapus(selectedObat.id); setSelectedObat(null); }}
              >
                🗑️ Hapus dari Simpan
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

export default SavedList;