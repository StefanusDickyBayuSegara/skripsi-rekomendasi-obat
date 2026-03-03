import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useSavedList } from "../hooks/Usesavedlist";
import "./SearchMedicine.css";

function SearchMedicine() {
  const [search, setSearch]                     = useState("");
  const [submittedSearch, setSubmittedSearch]   = useState("");
  const [selectedKategori, setSelectedKategori] = useState(""); // filter kategori_obat
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [medicines, setMedicines]               = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [toastMsg, setToastMsg]                 = useState("");

  const { isSaved, toggleSave } = useSavedList();

  useEffect(() => {
    fetch("http://localhost:5000/api/obat")
      .then((res) => res.json())
      .then((data) => {
        const formattedData = data.map((item) => ({
          id            : item.id,
          name          : item.nama_obat           ?? "Tanpa Nama",
          // ✅ kategori_obat untuk filter jenis obat (tablet, sirup, dll)
          kategoriObat  : item.kategori_obat       ?? "-",
          // kategori_penyakit tetap untuk info penyakit di card & modal
          kategori      : item.kategori_penyakit   ?? "-",
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
        setMedicines(formattedData);
        setLoading(false);
      })
      .catch((err) => { console.log("Error fetch:", err); setLoading(false); });
  }, []);

  // ✅ Daftar kategori_obat unik dari data
  const daftarKategori = [...new Set(
    medicines.map((m) => m.kategoriObat).filter((k) => k && k !== "-")
  )].sort();

  const handleSearch  = () => setSubmittedSearch(search.trim());
  const handleKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };

  // ✅ Filter by nama DAN kategori_obat
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

  function ObatImg({ src, name, height = "100px" }) {
    const [err, setErr] = useState(false);
    const inisial = (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    const px = parseInt(height);
    if (!src || err) {
      return (
        <div style={{
          width: height, height, margin: "0 auto",
          background: "linear-gradient(135deg, #53c5c9, #3fb2b6)",
          borderRadius: "12px", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", color: "white", gap: "2px",
        }}>
          <span style={{ fontSize: px * 0.35 + "px", fontWeight: 700 }}>{inisial}</span>
          <span style={{ fontSize: px * 0.13 + "px", opacity: 0.85 }}>{name?.split(" ")[0]}</span>
        </div>
      );
    }
    return <img src={src} alt={name} className="img-fluid"
      style={{ height, objectFit: "contain" }} onError={() => setErr(true)} />;
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

        {/* ════ Search + Filter ════ */}
        <div className="search-filter-wrap mt-3">
          <input
            type="text"
            placeholder="Cari nama obat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="form-control search-input"
          />

          {/* ✅ Dropdown pakai kategori_obat */}
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

        {/* Chip filter aktif */}
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

                <div className="text-center p-3">
                  <ObatImg src={item.image} name={item.name} height="100px" />
                </div>
                <div className="card-body text-center d-flex flex-column p-2">
                  <h6 className="fw-bold medicine-name">{item.name}</h6>

                  {/* Kategori penyakit — info saja */}
                  <small className="text-muted mb-1">{item.kategori}</small>

                  {/* ✅ Kategori obat — klikable untuk filter */}
                  {item.kategoriObat && item.kategoriObat !== "-" && (
                    <span
                      className="kategori-badge-card mb-2"
                      onClick={() => setSelectedKategori(item.kategoriObat)}
                      title={`Filter: ${item.kategoriObat}`}
                    >
                      💊 {item.kategoriObat}
                    </span>
                  )}

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
              <ObatImg src={selectedMedicine.image} name={selectedMedicine.name} height="120px" />
              <p className="text-muted small mt-2">Informasi Produk</p>
            </div>
            <div className="modal-detail-body text-start">
              {[
                { label: "Nama Obat",        value: selectedMedicine.name           },
                { label: "Jenis Obat",        value: selectedMedicine.kategoriObat   }, // ✅ tambah
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
    </div>
  );
}

export default SearchMedicine;