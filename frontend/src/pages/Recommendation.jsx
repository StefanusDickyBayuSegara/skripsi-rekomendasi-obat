// Recommendation.jsx — UPDATED VERSION
// ✅ UPDATE:
//   - Tambah persentase relevansi (%) di setiap kartu obat
//   - Progress bar warna berdasarkan skor
//   - StarBadge digabung dengan persentase
//   - Semua logika skor dari helpers.py (cosine + F1) tetap di backend

import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useSavedList } from "../hooks/Usesavedlist";
import "./Recommendation.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const RIWAYAT_OPTIONS = [
  { value: "gangguan hati",   label: "🫀 Gangguan Hati",       count: 101 },
  { value: "gagal jantung",   label: "💔 Gagal Jantung",       count: 65  },
  { value: "hipertensi",      label: "❤️ Hipertensi",           count: 56  },
  { value: "diabetes",        label: "🩸 Diabetes",             count: 55  },
  { value: "gangguan ginjal", label: "🫘 Gangguan Ginjal",      count: 34  },
  { value: "hipotiroid",      label: "🦋 Gangguan Tiroid",      count: 10  },
  { value: "asma",            label: "💨 Asma",                 count: 8   },
  { value: "tukak lambung",   label: "🫃 Tukak Lambung / Maag", count: 5   },
];

// ════════════════════════════════════════════════════
// HELPER: skor → label, warna, dan persen
// ════════════════════════════════════════════════════
function getSkorInfo(skor) {
  const persen = Math.round(skor * 100);
  if (skor >= 0.75) return { label: "Sangat Relevan", stars: 5, color: "#28a745", trackColor: "#d4edda", persen };
  if (skor >= 0.55) return { label: "Relevan",        stars: 4, color: "#53c5c9", trackColor: "#e0f7f8", persen };
  if (skor >= 0.35) return { label: "Cukup Relevan",  stars: 3, color: "#f0a500", trackColor: "#fff3cd", persen };
  return               { label: "Kurang Relevan",  stars: 2, color: "#aaa",    trackColor: "#f0f0f0", persen };
}

// ── Badge bintang (untuk modal detail) ──
function StarBadge({ skor }) {
  const { label, stars, color } = getSkorInfo(skor);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      background: "#f8f9fa", border: `1px solid ${color}33`,
      borderRadius: "8px", padding: "3px 8px",
    }}>
      <span style={{ color, fontSize: "0.7rem", letterSpacing: "1px" }}>
        {"★".repeat(stars)}{"☆".repeat(5 - stars)}
      </span>
      <span style={{ fontSize: "0.68rem", fontWeight: 600, color }}>{label}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════
// KOMPONEN BARU: Persentase Relevansi (progress bar)
// ════════════════════════════════════════════════════
function RelevansiBadge({ skor }) {
  const { label, color, trackColor, persen, stars } = getSkorInfo(skor);

  return (
    <div className="relevansi-wrap">
      {/* Baris atas: bintang + label + angka persen */}
      <div className="relevansi-top">
        <span className="relevansi-stars" style={{ color }}>
          {"★".repeat(stars)}{"☆".repeat(5 - stars)}
        </span>
        <span className="relevansi-label" style={{ color }}>{label}</span>
        <span className="relevansi-persen" style={{ color }}>{persen}%</span>
      </div>

      {/* Progress bar */}
      <div className="relevansi-track" style={{ background: trackColor }}>
        <div
          className="relevansi-fill"
          style={{
            width: `${persen}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

function ObatImage({ gambar, namaObat }) {
  const [imgError, setImgError] = useState(false);
  const inisial = (namaObat || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
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

  const imgSrc = gambar.startsWith("http")
    ? gambar
    : `${API_BASE}/static/images/${gambar}`;

  return (
    <img src={imgSrc} alt={namaObat}
      style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center", padding: "4px" }}
      onError={() => setImgError(true)}
    />
  );
}

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
    <span className="bpom-badge" style={{ borderColor: cfg.color, color: cfg.color }}>
      <span style={{
        backgroundColor: cfg.color, width: "10px", height: "10px",
        minWidth: "10px", minHeight: "10px", borderRadius: "50%",
        display: "inline-block", flexShrink: 0,
      }} />
      <span className="bpom-label">{cfg.label}</span>
    </span>
  );
}

function ObatCard({ item, index, isSaved, onToggleSave, onDetail, isTop5 = false, onLightbox }) {
  const gambarValid = item.gambar && item.gambar !== "null" && item.gambar !== "undefined" && item.gambar !== "-";
  const imgSrc = gambarValid
    ? (item.gambar.startsWith("http") ? item.gambar : `${API_BASE}/static/images/${item.gambar}`)
    : null;

  return (
    <div className={`card medicine-card h-100 shadow-sm ${isTop5 ? "top5-card" : ""}`}>
      {isTop5 ? (
        <div className="top5-crown">
          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
        </div>
      ) : (
        <div className="rank-badge">#{index + 1}</div>
      )}

      <button className={`bookmark-btn ${isSaved(item.id) ? "bookmark-active" : ""}`}
        onClick={(e) => onToggleSave(e, item)}
        title={isSaved(item.id) ? "Hapus dari simpan" : "Simpan obat ini"}>
        🔖
      </button>

      <div
        className={`medicine-image-wrap ${imgSrc ? "rec-img-clickable" : ""}`}
        onClick={() => imgSrc && onLightbox({ src: imgSrc, name: item.nama_obat })}
        title={imgSrc ? "🔍 Klik untuk perbesar gambar" : ""}
      >
        <ObatImage gambar={item.gambar} namaObat={item.nama_obat} />
        {imgSrc && <div className="rec-img-zoom-hint">🔍</div>}
      </div>

      <div className="card-body text-center d-flex flex-column p-2">
        <h6 className="medicine-name mb-1">{item.nama_obat}</h6>
        <small className="text-muted mb-1">{item.kategori_penyakit || "-"}</small>
        {item.kategori_obat && item.kategori_obat !== "-" && (
          <span className="kategori-badge-card mb-1">💊 {item.kategori_obat}</span>
        )}
        <div className="mb-1"><BpomBadge kategori={item.kategori_bpom} /></div>
        {item.peringatan_hamil && (
          <div style={{
            fontSize: "0.63rem", color: "#b45309", background: "#fffbeb",
            border: "1px solid #fcd34d", borderRadius: "6px",
            padding: "3px 5px", marginBottom: "4px", textAlign: "left", lineHeight: "1.3",
          }}>{item.peringatan_hamil}</div>
        )}

        {/* ✅ BARU: Tampilkan persentase relevansi */}
        <div className="mb-2 mt-auto">
          <RelevansiBadge skor={item.skor} />
        </div>

        <button className="btn btn-info btn-sm text-white detail-btn"
          onClick={() => onDetail(item)}>Detail</button>
      </div>
    </div>
  );
}

function DisclaimerMedis() {
  return (
    <div className="disclaimer-medis">
      <span className="disclaimer-icon">⚕️</span>
      <p className="disclaimer-text">
        <strong>Perhatian:</strong> Rekomendasi ini hanya sebagai referensi informasi.
        Selalu konsultasikan dengan <strong>apoteker atau dokter</strong> sebelum
        mengonsumsi obat. Jangan mengganti resep dokter tanpa anjuran medis.
      </p>
    </div>
  );
}

function TipsKeluhan() {
  const [open, setOpen] = useState(true);

  const TIPS = [
    {
      label: "Nama gejala spesifik",
      why: "Sistem mencocokkan kata per kata dengan indikasi obat di database — semakin spesifik, semakin tepat hasilnya",
      contoh: (
        <>
          Contoh yang baik: <em>nyeri ulu hati</em>, <em>mual</em>, <em>perut kembung</em>, <em>batuk berdahak</em>
          <br />
          <span className="tips-hindari">✕ Hindari kata umum seperti "tidak enak badan" atau "badan tidak fit"</span>
        </>
      ),
    },
    {
      label: "Sebutkan lokasi yang tepat",
      why: "Lokasi gejala membantu sistem menemukan obat yang paling sesuai dengan kondisi Anda",
      contoh: (
        <>
          Contoh: <em>sakit kepala</em>, <em>hidung tersumbat</em>, <em>tenggorokan gatal</em>,{" "}
          <em>nyeri ulu hati</em>, <em>perut bawah</em>
          <br />
          <span className="tips-hindari">✕ Hindari: "sakit di sini" atau "nyeri di bagian atas"</span>
        </>
      ),
    },
    {
      label: "Tambahkan gejala penyerta",
      why: "Setiap gejala tambahan menambah kata yang cocok di database, sehingga skor relevansi semakin tinggi",
      contoh: (
        <>
          Contoh: <em>demam</em>, <em>bersin-bersin</em>, <em>pilek</em>, <em>mual</em>,{" "}
          <em>perut kembung</em>, <em>diare cair</em>, <em>dahak kental</em>
          <br />
          <span className="tips-hindari">✕ Jangan hanya tulis 1 gejala saja, hasilnya kurang akurat</span>
        </>
      ),
    },
    {
      label: "Jelaskan intensitas & durasinya",
      why: "Kata seperti 'ringan', 'sedang', 'berat', atau 'kental' juga ada dalam indikasi obat di database",
      contoh: (
        <>
          Contoh: <em>nyeri ringan</em>, <em>demam tinggi</em>, <em>batuk kering</em>,{" "}
          <em>dahak kental</em>, <em>diare cair</em>
          <br />
          <span className="tips-hindari">✕ Hindari: "agak sakit" atau "lumayan parah" — tidak terbaca sistem</span>
        </>
      ),
    },
  ];

  const CONTOH_KASUS = [
    { 
      label: "Maag / Lambung", 
      teks: "nyeri ulu hati asam lambung mual perut kembung rasa perih lambung setelah makan" 
    },
    { 
      label: "Flu & Pilek",    
      teks: "flu demam sakit kepala hidung sumbat bersin pilek batuk dahak badan meriang" 
    },
    { 
      label: "Diare",          
      teks: "diare buang air besar cair mencret perut melilit mual lemas" 
    },
    { 
      label: "Batuk Berdahak", 
      teks: "batuk berdahak dahak kental tenggorokan gatal batuk kering lega saluran napas" 
    },
    { 
      label: "Demam & Nyeri",  
      teks: "demam tinggi nyeri ringan sedang sakit kepala otot badan panas tidak enak" 
    },
    { 
      label: "Sakit Kepala",   
      teks: "sakit kepala pusing berat nyeri ringan rasa tidak nyaman seluruh kepala demam" 
    },
  ];

  const KATA_DARURAT = [
    "sesak nafas", "nyeri dada", "tidak sadarkan diri",
    "muntah darah", "kejang", "lumpuh", "bibir biru", "pingsan",
  ];

  return (
    <div className="tips-keluhan-box">
      <button className="tips-keluhan-header" onClick={() => setOpen(!open)}>
        <div className="tips-keluhan-header-left">
          <span className="tips-keluhan-icon">💡</span>
          <div>
            <div className="tips-keluhan-title">Tips menulis keluhan agar hasil makin tepat</div>
            <div className="tips-keluhan-subtitle">
              Sistem membaca tiap kata — makin banyak kata cocok, makin relevan hasilnya
            </div>
          </div>
        </div>
        <span className={`tips-keluhan-arrow ${open ? "arrow-up" : ""}`}>▼</span>
      </button>

      {open && (
        <div className="tips-keluhan-body">
          <p className="tips-section-label">4 hal yang sebaiknya disebutkan</p>
          <div className="tips-keluhan-grid">
            {TIPS.map((tip) => (
              <div className="tips-keluhan-item" key={tip.label}>
                <div className="tips-keluhan-item-label"><span className="tips-dot" />{tip.label}</div>
                <div className="tips-keluhan-item-why">{tip.why}</div>
                <div className="tips-keluhan-item-contoh">{tip.contoh}</div>
              </div>
            ))}
          </div>

          <p className="tips-section-label">Keluhan singkat vs lengkap</p>
          <div className="tips-compare-grid">
            <div className="tips-compare-bad">
              <div className="tips-compare-head">✕ Terlalu singkat</div>
              <div className="tips-compare-text">
                <em>"Batuk"</em><br />
                <span>Hanya 1 kata — sistem tidak bisa membedakan apakah batuk berdahak, batuk kering, atau batuk karena alergi.</span>
              </div>
            </div>
            <div className="tips-compare-good">
              <div className="tips-compare-head">✓ Lengkap & tepat</div>
              <div className="tips-compare-text">
                <em>"Batuk berdahak dahak kental tenggorokan gatal demam sakit kepala hidung tersumbat"</em><br />
                <span>7+ kata kunci cocok → skor tinggi, rekomendasi obat jauh lebih relevan dan akurat.</span>
              </div>
            </div>
          </div>

          <p className="tips-section-label">Contoh keluhan per kondisi</p>
          <div className="tips-keluhan-grid tips-keluhan-grid-3">
            {CONTOH_KASUS.map((k) => (
              <div className="tips-keluhan-item" key={k.label}>
                <div className="tips-keluhan-item-label"><span className="tips-dot" />{k.label}</div>
                <div className="tips-keluhan-item-contoh"><em>{k.teks}</em></div>
              </div>
            ))}
          </div>

          <div className="tips-darurat-warning">
            <div className="tips-darurat-head">
              ⚠️ Hindari kata ini jika tidak darurat — sistem akan langsung arahkan ke IGD
            </div>
            <div className="tips-darurat-list">
              {KATA_DARURAT.map((k) => (
                <span key={k} className="tips-darurat-chip">{k}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Recommendation() {
  const [showProfilModal, setShowProfilModal] = useState(false);
  const [profil, setProfil] = useState({
    usia: "",
    jenis_kelamin: "laki-laki",
    status_hamil: "tidak",
    riwayat_penyakit: [],
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
  const [lightboxImg, setLightboxImg]   = useState(null);

  const { isSaved, toggleSave } = useSavedList();

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key !== "Escape") return;
      if (lightboxImg)     { setLightboxImg(null);   return; }
      if (selectedObat)    { setSelectedObat(null);  return; }
      if (showProfilModal) { setShowProfilModal(false); }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [lightboxImg, selectedObat, showProfilModal]);

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 2200); };

  const handleToggleSave = (e, item) => {
    e.stopPropagation();
    const sudahSimpan = isSaved(item.id);
    toggleSave(item);
    showToast(sudahSimpan ? "Dihapus dari daftar simpan" : "✅ Berhasil disimpan!");
  };

  const toggleRiwayat = (value) => {
    const arr = profil.riwayat_penyakit;
    setProfil({
      ...profil,
      riwayat_penyakit: arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value],
    });
  };

  const handleSimpanProfil = () => {
    if (!profil.usia) { alert("Usia wajib diisi!"); return; }
    setProfilTersimpan(true);
    setShowProfilModal(false);
  };

  const handleCari = () => {
    if (!keluhan.trim()) { alert("Masukkan keluhan terlebih dahulu!"); return; }
    if (!profilTersimpan) { setShowProfilModal(true); return; }

    setLoading(true); setSudahCari(true); setIsDarurat(false);
    setTop5Obat([]); setHasilObat([]); setShowLainnya(false);

    fetch(`${API_BASE}/api/rekomendasi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keluhan,
        usia             : profil.usia,
        jenis_kelamin    : profil.jenis_kelamin,
        status_hamil     : profil.jenis_kelamin === "perempuan" ? profil.status_hamil : "tidak",
        riwayat_penyakit : profil.riwayat_penyakit.join(","),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.darurat) { setIsDarurat(true); }
        else { setTop5Obat(data.top5 || []); setHasilObat(data.hasil || []); }
        setLoading(false);
      })
      .catch((err) => { console.log("Error:", err); setLoading(false); });
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleCari(); };
  const hasilLainnya = hasilObat.slice(5);

  const getImgSrc = (item) => {
    if (!item) return null;
    const gambar = item.gambar;
    if (!gambar || gambar === "null" || gambar === "undefined" || gambar === "-") return null;
    return gambar.startsWith("http") ? gambar : `${API_BASE}/static/images/${gambar}`;
  };

  return (
    <div className="recommendation-page" translate="no">
      <Navbar />
      {toastMsg && <div className="save-toast">{toastMsg}</div>}

      <div className="container-fluid px-4 mt-4 pb-5">
        <h4 className="page-title mb-4">Cari Rekomendasi Obat Anda</h4>

        {/* ════ Card Profil ════ */}
        <div className={`card profile-card shadow-sm mb-4 ${!profilTersimpan ? "profile-card-empty" : ""}`}>
          <div className="card-body">
            <div className="d-flex align-items-center gap-2 mb-3">
              <h6 className="fw-bold mb-0">Data Pengguna</h6>
              {!profilTersimpan
                ? <span className="profil-status-badge profil-status-empty">⚠️ Wajib diisi</span>
                : <span className="profil-status-badge profil-status-ok">✅ Tersimpan</span>
              }
            </div>

            {profilTersimpan ? (
              <div className="profil-summary">
                <div className="row g-2 mb-2">
                  <div key="col-usia" className="col-6">
                    <small className="text-muted">Usia</small>
                    <p className="mb-0 fw-semibold">{profil.usia} tahun</p>
                  </div>
                  <div key="col-jk" className="col-6">
                    <small className="text-muted">Jenis Kelamin</small>
                    <p className="mb-0 fw-semibold" style={{ textTransform: "capitalize" }}>{profil.jenis_kelamin}</p>
                  </div>
                  {profil.jenis_kelamin === "perempuan" && (
                    <div key="col-hamil" className="col-6">
                      <small className="text-muted">Status</small>
                      <p className="mb-0 fw-semibold">{profil.status_hamil === "hamil" ? "🤰 Hamil" : "Tidak Hamil"}</p>
                    </div>
                  )}
                  <div key="col-riwayat" className="col-12">
                    {profil.riwayat_penyakit.length > 0 ? (
                      <>
                        <small className="text-muted">Riwayat Penyakit</small>
                        <div className="d-flex flex-wrap gap-1 mt-1">
                          {profil.riwayat_penyakit.map((v) => {
                            const opt = RIWAYAT_OPTIONS.find((o) => o.value === v);
                            return <span key={v} className="riwayat-summary-chip">{opt ? opt.label : v}</span>;
                          })}
                        </div>
                      </>
                    ) : (
                      <>
                        <small className="text-muted">Riwayat Penyakit</small>
                        <p className="mb-0" style={{ fontSize: "0.82rem", color: "#888" }}>
                          Tidak ada — semua obat ditampilkan
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowProfilModal(true)}>
                  ✏️ Edit Profil
                </button>
              </div>
            ) : (
              <div className="profil-empty-state">
                <p className="profil-empty-desc">
                  Isi data Anda agar sistem dapat menyaring obat yang aman sesuai kondisi kesehatan Anda.
                </p>
                <button className="btn btn-isi-profil" onClick={() => setShowProfilModal(true)}>
                  👤 Isi Data Sekarang
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ════ Search Bar ════ */}
        <div className="search-wrap-outer mb-1">
          <div className={`d-flex gap-2 ${!profilTersimpan ? "search-disabled" : ""}`}>
            <input type="text" className="form-control search-input"
              placeholder="Masukan keluhan atau gejala sakit..."
              value={keluhan}
              onChange={(e) => setKeluhan(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!profilTersimpan}
            />
            <button className="btn text-white px-4 search-btn" onClick={handleCari} disabled={loading || !profilTersimpan}>
              {loading ? <span className="spinner-border spinner-border-sm" /> : "🔍 Cari"}
            </button>
          </div>
          {!profilTersimpan && (
            <p className="search-locked-hint">
              🔒 Isi data pengguna terlebih dahulu untuk mengaktifkan pencarian.
            </p>
          )}
        </div>

        {profilTersimpan && <TipsKeluhan />}

        {loading && (
          <div className="text-center mt-4">
            <div className="spinner-border text-info" role="status" />
            <p className="mt-2 text-muted">Sedang mencari obat yang paling cocok untuk Anda...</p>
          </div>
        )}

        {!loading && isDarurat && (
          <div className="alert-darurat">
            <div className="darurat-icon">🚨</div>
            <h5 className="darurat-title">Gejala Darurat Terdeteksi!</h5>
            <p className="darurat-desc">Berdasarkan keluhan yang Anda masukkan, gejala Anda terindikasi sebagai kondisi darurat medis. Pengobatan mandiri tidak disarankan.</p>
            <div className="darurat-action">
              <span className="darurat-badge">🏥 Segera hubungi dokter atau pergi ke IGD terdekat!</span>
            </div>
            <button className="btn btn-outline-danger mt-3 btn-sm"
              onClick={() => { setIsDarurat(false); setSudahCari(false); setKeluhan(""); }}>← Kembali</button>
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
                <DisclaimerMedis />

                {top5Obat.length > 0 && (
                  <div className="mb-4">
                    <div className="top5-header mb-3">
                      <span className="top5-title">🏆 Top 5 Rekomendasi Terbaik</span>
                      <span className="top5-subtitle">Diurutkan berdasarkan tingkat kesesuaian dengan keluhan Anda</span>
                    </div>
                    <div className="row g-3">
                      {top5Obat.map((item, index) => (
                        <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6 col-6" key={item.id}>
                          <ObatCard item={item} index={index} isSaved={isSaved}
                            onToggleSave={handleToggleSave} onDetail={setSelectedObat}
                            isTop5={true} onLightbox={setLightboxImg} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hasilLainnya.length > 0 && (
                  <div className="lainnya-section">
                    <button className="btn-lainnya-toggle" onClick={() => setShowLainnya(!showLainnya)}>
                      <span className="lainnya-toggle-label">📋 Rekomendasi Lainnya ({hasilLainnya.length} obat)</span>
                      <span className={`lainnya-arrow ${showLainnya ? "arrow-up" : ""}`}>▼</span>
                    </button>
                    {showLainnya && (
                      <div className="lainnya-content">
                        <div className="row g-3">
                          {hasilLainnya.map((item, index) => (
                            <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6 col-6" key={item.id}>
                              <ObatCard item={item} index={index + 5} isSaved={isSaved}
                                onToggleSave={handleToggleSave} onDetail={setSelectedObat}
                                isTop5={false} onLightbox={setLightboxImg} />
                            </div>
                          ))}
                        </div>
                        <div className="text-center mt-4">
                          <button className="btn-lainnya-tutup" onClick={() => setShowLainnya(false)}>▲ Sembunyikan</button>
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
          <div className="modal-box shadow-lg" onClick={(e) => e.stopPropagation()} translate="no">
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

              <div key={`hamil-section-${profil.jenis_kelamin}`}>
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
              </div>

              <div className="mb-1">
                <div className="riwayat-label-row">
                  <label className="form-label fw-semibold mb-0">Riwayat Penyakit</label>
                  <span className="riwayat-opsional-badge">Opsional</span>
                </div>
                <p className="riwayat-hint">
                  Pilih kondisi yang Anda miliki — obat berbahaya akan disaring otomatis.{" "}
                  <strong>Tidak tahu atau tidak punya? Biarkan kosong saja.</strong>
                </p>
                <div className="riwayat-grid">
                  {RIWAYAT_OPTIONS.map(({ value, label, count }) => {
                    const isChecked = profil.riwayat_penyakit.includes(value);
                    return (
                      <button key={value} type="button"
                        className={`riwayat-chip ${isChecked ? "riwayat-chip-active" : ""}`}
                        onClick={() => toggleRiwayat(value)}
                        title={`Memfilter ${count} obat yang dikontraindikasikan`}>
                        {isChecked && <span className="riwayat-check">✓ </span>}
                        {label}
                        <span className="riwayat-count">{count}</span>
                      </button>
                    );
                  })}
                </div>

                <div key={`riwayat-info-${profil.riwayat_penyakit.length > 0}`}>
                  {profil.riwayat_penyakit.length > 0 ? (
                    <div className="riwayat-selected-info">
                      <span>✅ Dipilih: </span>
                      <span style={{ fontWeight: 600 }}>
                        {profil.riwayat_penyakit.map((v) => {
                          const opt = RIWAYAT_OPTIONS.find((o) => o.value === v);
                          return opt ? opt.label : v;
                        }).join(", ")}
                      </span>
                      <button type="button" className="riwayat-clear-btn"
                        onClick={() => setProfil({ ...profil, riwayat_penyakit: [] })}>
                        Hapus semua
                      </button>
                    </div>
                  ) : (
                    <div className="riwayat-info-box">
                      💡 <strong>Tidak tahu riwayat penyakit Anda?</strong>{" "}
                      Biarkan kosong — sistem tetap memberikan rekomendasi terbaik tanpa penyaringan tambahan.
                    </div>
                  )}
                </div>

                <small className="text-muted">
                  Angka pada setiap kondisi menunjukkan jumlah obat yang akan disaring.
                </small>
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
          <div className="modal-box shadow-lg" onClick={(e) => e.stopPropagation()} translate="no">
            <div className="modal-header-custom">
              <h5 className="modal-title-custom">Detail Obat</h5>
            </div>
            <div className="modal-body-custom">
              <div className="text-center mb-3">
                <div
                  className="modal-image-wrap mx-auto"
                  style={{
                    width: "160px", height: "160px",
                    cursor: getImgSrc(selectedObat) ? "zoom-in" : "default",
                    position: "relative",
                  }}
                  onClick={() => {
                    const src = getImgSrc(selectedObat);
                    if (src) setLightboxImg({ src, name: selectedObat.nama_obat });
                  }}
                  title={getImgSrc(selectedObat) ? "🔍 Klik untuk perbesar" : ""}
                >
                  <ObatImage gambar={selectedObat.gambar} namaObat={selectedObat.nama_obat} />
                  {getImgSrc(selectedObat) && (
                    <div className="modal-img-zoom-hint">🔍 Perbesar</div>
                  )}
                </div>
                <div className="mt-2"><BpomBadge kategori={selectedObat.kategori_bpom} /></div>
                <p className="text-muted small mt-1">Informasi Produk</p>
              </div>

              {/* ✅ Tampilkan persentase + bintang di modal detail juga */}
              <div className="text-center mb-3">
                <StarBadge skor={selectedObat.skor} />
                <div className="mt-2 px-2">
                  <RelevansiBadge skor={selectedObat.skor} />
                </div>
              </div>

              {selectedObat.peringatan_hamil && (
                <div style={{
                  padding: "10px 14px", borderRadius: "10px", fontSize: "0.85rem",
                  background: "#fffbeb", color: "#92400e",
                  border: "1px solid #fcd34d", marginBottom: "12px",
                }}>{selectedObat.peringatan_hamil}</div>
              )}

              <div className="modal-detail-body text-start">
                {[
                  { label: "Nama Obat",        value: selectedObat.nama_obat            },
                  { label: "Jenis Obat",        value: selectedObat.kategori_obat        },
                  { label: "Status BPOM",       value: selectedObat.kategori_bpom        },
                  { label: "Komposisi",         value: selectedObat.komposisi_clean      },
                  { label: "Kategori Penyakit", value: selectedObat.kategori_penyakit    },
                  { label: "Indikasi",          value: selectedObat.indikasi_clean       },
                  { label: "Aturan Pemakaian", value: selectedObat.aturan_pemakaian     }, // ✅ BARU
                  { label: "Interaksi Obat", value: selectedObat.interaksi_obat },  //
                  { label: "Aturan Penjualan Online", value: selectedObat.aturan_penjualan_online }, // ✅ BARU
                  { label: "Label Peringatan BPOM",   value: selectedObat.label_peringatan_bpom }, // ✅ BARU
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

              <div className="disclaimer-modal mt-3">
                ⚕️ Konsultasikan dengan apoteker atau dokter sebelum mengonsumsi obat ini.
              </div>
            </div>
            <div className="modal-footer-custom">
              <button
                className={`btn fw-semibold ${isSaved(selectedObat.id) ? "btn-simpan-active" : "btn-simpan"}`}
                onClick={(e) => handleToggleSave(e, selectedObat)}>
                {isSaved(selectedObat.id) ? "🔖 Tersimpan" : "🔖 Simpan"}
              </button>
              <button className="btn btn-info text-white" onClick={() => setSelectedObat(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* ════ LIGHTBOX ════ */}
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

export default Recommendation;