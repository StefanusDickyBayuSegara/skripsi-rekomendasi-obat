import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useSavedList } from "../hooks/Usesavedlist";
import "./SearchMedicine.css";

function SearchMedicine() {
  const [search, setSearch]                     = useState("");
  const [submittedSearch, setSubmittedSearch]   = useState("");
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

  const handleSearch  = () => setSubmittedSearch(search.trim());
  const handleKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };

  const filteredMedicine = medicines.filter((item) =>
    item.name.toLowerCase().includes(submittedSearch.toLowerCase())
  );

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

  return (
    <div>
      <Navbar />

      {/* Toast */}
      {toastMsg && <div className="save-toast">{toastMsg}</div>}

      <div className="search-page container mt-4">
        <h4 className="fw-bold">Pencarian Obat</h4>

        <div className="search-bar mt-3 d-flex justify-content-center gap-2">
          <input
            type="text" placeholder="Masukan Nama Obat..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown} className="form-control"
            style={{ maxWidth: "350px" }}
          />
          <button className="btn btn-info text-white" onClick={handleSearch}>Cari</button>
        </div>

        <h5 className="mt-4 text-center">
          {submittedSearch
            ? `Hasil pencarian "${submittedSearch}" (${filteredMedicine.length} obat)`
            : `Semua Obat (${medicines.length} obat)`}
        </h5>

        {loading && <p className="text-center text-muted mt-4">Memuat data obat...</p>}

        {!loading && submittedSearch && filteredMedicine.length === 0 && (
          <div className="text-center mt-5">
            <p className="text-muted fs-5">😕 Obat "<strong>{submittedSearch}</strong>" tidak ditemukan.</p>
          </div>
        )}

        <div className="row mt-3">
          {filteredMedicine.map((item) => (
            <div className="col-lg-3 col-md-4 col-sm-6 mb-4" key={item.id}>
              <div className="card medicine-card h-100 shadow-sm">

                {/* ✅ ICON BOOKMARK */}
                <button
                  className={`bookmark-btn ${isSaved(item.id) ? "bookmark-active" : ""}`}
                  onClick={(e) => handleToggleSave(e, item)}
                  title={isSaved(item.id) ? "Hapus dari simpan" : "Simpan obat ini"}
                >
                  {isSaved(item.id) ? "🔖" : "🔖"}
                </button>

                <div className="text-center p-3">
                  <ObatImg src={item.image} name={item.name} height="100px" />
                </div>
                <div className="card-body text-center d-flex flex-column">
                  <h6 className="fw-bold">{item.name}</h6>
                  <small className="text-muted mb-2">{item.kategori}</small>
                  <button className="btn btn-info mt-auto text-white" onClick={() => setSelectedMedicine(item)}>
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
            {/* ✅ Tombol Simpan di Modal */}
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