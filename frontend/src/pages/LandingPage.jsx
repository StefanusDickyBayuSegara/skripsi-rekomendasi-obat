import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import pharmacy      from "../assets/cover-awal.jpg";
import medicineImage from "../assets/cover-about.png";
import "./LandingPage.css";

/* ─── Feedback helpers ─── */
const EMOJIS = ["😡", "😕", "🙂", "😄", "🤩"];

const getInitialFeedback = () => {
  const saved = localStorage.getItem("medlinkFeedback");
  return saved
    ? JSON.parse(saved)
    : [
        { text: "MedLink membantu saya menemukan obat yang tepat!", user: "Budi S.",    email: "@budis",    emoji: "🙂" },
        { text: "Aplikasinya sangat mudah digunakan dan akurat.",   user: "Sari W.",    email: "@sariw",    emoji: "😄" },
        { text: "Rekomendasi obatnya tepat sasaran. Keren!",        user: "Andi R.",    email: "@andir",    emoji: "🤩" },
        { text: "Sangat membantu saat tidak bisa ke dokter.",       user: "Dewi K.",    email: "@dewik",    emoji: "😄" },
      ];
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
function LandingPage() {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem("user"));

  /* animation */
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  /* feedback state */
  const [cards, setCards]               = useState(getInitialFeedback);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fbEmail, setFbEmail]           = useState("");
  const [fbMsg, setFbMsg]               = useState("");
  const [fbRating, setFbRating]         = useState(null);
  const [fbSuccess, setFbSuccess]       = useState(false);

  useEffect(() => {
    localStorage.setItem("medlinkFeedback", JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    const iv = setInterval(() => {
      setCurrentIndex(p => (p === cards.length - 1 ? 0 : p + 1));
    }, 4000);
    return () => clearInterval(iv);
  }, [cards.length]);

  const submitFeedback = () => {
    if (!fbEmail || !fbMsg || !fbRating) { alert("Lengkapi semua field!"); return; }
    const newCard = { text: fbMsg, user: fbEmail.split("@")[0], email: fbEmail, emoji: fbRating };
    setCards(prev => [...prev, newCard]);
    setFbEmail(""); setFbMsg(""); setFbRating(null);
    setFbSuccess(true);
    setTimeout(() => setFbSuccess(false), 2500);
  };

  /* ── data ── */
  const features = [
    {
      icon: "🔍",
      title: "Cari Obat",
      // DIUBAH: tambah penjelasan "(tanpa resep dokter)" setelah OTC
      desc: "Temukan informasi lengkap ratusan obat bebas (tanpa resep dokter) di Indonesia dengan mudah.",
      color: "#e8f8f8", border: "#53c5c9"
    },
    {
      icon: "🤖",
      // DIUBAH: judul asli terpotong & terlalu teknis → diganti lebih jelas
      title: "Rekomendasi Cerdas",
      desc: "Sistem otomatis mencocokkan gejala Anda dengan obat yang paling relevan.",
      color: "#fff8e8", border: "#f4a623"
    },
    {
      icon: "🛡️",
      title: "Filter Keamanan",
      // TETAP — sudah jelas
      desc: "Obat disaring berdasarkan usia, kehamilan, dan riwayat penyakit.",
      color: "#f0f8ee", border: "#5cb85c"
    },
    {
      icon: "🔖",
      title: "Daftar Simpan",
      // TETAP — sudah jelas
      desc: "Simpan obat favorit dan akses kapan saja tanpa mencari ulang.",
      color: "#f5f0ff", border: "#9b59b6"
    },
  ];

  const stats = [
    { num: "200", label: "Data Obat OTC"          },
    // DIUBAH: "CBF · Metode Utama" → tidak bermakna bagi orang awam
    { num: "Auto", label: "Pencocokan Gejala"       },
    { num: "100%", label: "Berbasis BPOM, Halodoc & K24" },
  ];

  const teknologi = [
    {
      icon: "🤖",
      // TETAP — seksi teknologi boleh tetap teknis
      title: "Content-Based Filtering",
      desc: "Pendekatan utama yang menganalisis kemiripan konten keluhan dengan profil obat."
    },
    {
      icon: "🧠",
      title: "Pembobotan Kata Kunci",
      // DIUBAH: penjelasan manfaat dulu, nama teknis dalam kurung
      desc: "Sistem mengenali kata kunci terpenting dari keluhan Anda dan memberinya bobot yang tepat. (TF-IDF)"
    },
    {
      icon: "📐",
      title: "Pencocokan Kemiripan",
      // DIUBAH: penjelasan manfaat dulu, nama teknis dalam kurung
      desc: "Keluhan Anda dicocokkan secara matematis dengan daftar indikasi obat untuk hasil terbaik. (Cosine Similarity)"
    },
    {
      icon: "🛡️",
      // TETAP
      title: "Safety Filter",
      desc: "Filter berlapis berdasarkan usia, status kehamilan, dan riwayat penyakit."
    },
  ];

  return (
    <div className="lp-page">
      <Navbar />

      {/* ══════════════════════════════════
          ① HERO / HOME
      ══════════════════════════════════ */}
      <section id="home" className={`lp-hero ${visible ? "lp-hero-visible" : ""}`}>
        <div className="lp-blob lp-blob1" /><div className="lp-blob lp-blob2" /><div className="lp-blob lp-blob3" />

        <div className="container">
          <div className="lp-hero-inner">

            {/* Teks */}
            <div className="lp-hero-text">
              {/* DIUBAH: badge lebih langsung ke manfaat, bukan nama sistem */}
              <div className="lp-badge"><span>🏥</span> Cari obat yang tepat untuk gejala Anda</div>
              <h1 className="lp-hero-title">
                Temukan Obat<br />
                <span className="lp-highlight">yang Tepat</span><br />
                untuk Anda
              </h1>
              {/* DIUBAH: hapus "Content-Based Filtering" dari kalimat hero */}
              <p className="lp-hero-desc">
                Ceritakan keluhan Anda, dan MedLink akan membantu menemukan obat yang
                paling cocok — mudah, aman, dan disesuaikan dengan kondisi kesehatan Anda.
              </p>
              <div className="lp-hero-actions">
                {user ? (
                  <>
                    <button className="lp-btn-primary" onClick={() => navigate("/recommendation")}>🔍 Cari Rekomendasi</button>
                    <button className="lp-btn-secondary" onClick={() => navigate("/search")}>Cari Obat</button>
                  </>
                ) : (
                  <>
                    <button className="lp-btn-primary" onClick={() => navigate("/login")}>Mulai Sekarang →</button>
                    <button className="lp-btn-secondary" onClick={() => { document.getElementById("about")?.scrollIntoView({ behavior: "smooth" }); }}>Pelajari Lebih</button>
                  </>
                )}
              </div>
              <div className="lp-stats-row">
                {/* DIUBAH: "CBF · Algoritma" → "Otomatis · Rekomendasi" */}
                {[["200","Obat OTC"], ["Otomatis","Rekomendasi"], ["100%","Gratis"]].map(([n, l], i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <div className="lp-stat-div" />}
                    <div className="lp-stat-item">
                      <span className="lp-stat-num">{n}</span>
                      <span className="lp-stat-lbl">{l}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Gambar */}
            <div className="lp-hero-imgwrap">
              <div className="lp-hero-imgbg" />
              <div style={{ position: "relative", zIndex: 1 }}>
                <img src={pharmacy} alt="pharmacy" className="lp-hero-img" />
                <div className="lp-float lp-float-top"><span className="lp-fi">✅</span><div><div className="lp-ft">Aman & Terpercaya</div><div className="lp-fs">Filter keamanan aktif</div></div></div>
                {/* DIUBAH: float bawah lebih mudah dipahami */}
                <div className="lp-float lp-float-bot"><span className="lp-fi">🤖</span><div><div className="lp-ft">Rekomendasi Otomatis</div><div className="lp-fs">Cocok dengan gejala Anda</div></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="lp-features">
        <div className="container">
          <div className="lp-sec-head">
            <h2 className="lp-sec-title">Kenapa MedLink?</h2>
            {/* DIUBAH: hapus istilah teknis dari subtitle seksi */}
            <p className="lp-sec-sub">Solusi pintar untuk menemukan obat bebas yang tepat dan aman sesuai keluhan Anda</p>
          </div>
          <div className="lp-feat-grid">
            {features.map((f, i) => (
              <div key={i} className="lp-feat-card" style={{ "--cbg": f.color, "--cborder": f.border, animationDelay: `${i * 0.1}s` }}>
                <div className="lp-feat-icon">{f.icon}</div>
                <h4 className="lp-feat-title">{f.title}</h4>
                <p className="lp-feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          ② ABOUT
      ══════════════════════════════════ */}
      <section id="about" className="lp-about">
        <div className="lp-ab-blob lp-ab-b1" /><div className="lp-ab-blob lp-ab-b2" />

        <div className="container">
          <div className="lp-ab-inner">

            <div className="lp-ab-text">
              <div className="lp-ab-badge">📋 Tentang Kami</div>
              <h1 className="lp-ab-title">Apa itu <span className="lp-ab-hl">MedLink</span>?</h1>

              {/* DIUBAH: paragraf 1 — lebih ramah orang awam */}
              <p className="lp-ab-desc">
                MedLink adalah aplikasi web yang membantu Anda menemukan
                <strong className="lp-ab-strong"> obat bebas (tanpa resep dokter)</strong> sesuai
                keluhan — tanpa harus paham istilah medis atau farmasi.
              </p>

              {/* DIUBAH: paragraf 2 — jelaskan manfaat dulu, bukan nama teknologi */}
              <p className="lp-ab-desc">
                Sistem kami membandingkan keluhan Anda dengan sekitar dua ratus data obat secara otomatis,
                sehingga hasil yang muncul benar-benar sesuai dengan gejala yang Anda rasakan —
                bukan sekadar pencarian kata kunci biasa.
              </p>

              {/* TETAP — paragraf 3 sudah jelas */}
              <p className="lp-ab-desc">
                Basis data mencakup nama obat, kategori penyakit, indikasi, dosis, efek samping,
                kontraindikasi, batasan usia, keamanan ibu hamil, serta status regulasi BPOM —
                memberikan rekomendasi yang <strong className="lp-ab-strong">aman, relevan, dan terpercaya</strong>.
              </p>
            </div>

            <div className="lp-ab-imgwrap">
              <div className="lp-ab-glow" />
              <img src={medicineImage} alt="About MedLink" className="lp-ab-img" />
              <div className="lp-ab-float lp-ab-ftop"><span className="lp-fi">🏥</span><div><div className="lp-ft">Aman & Terpercaya</div><div className="lp-fs">Data terverifikasi BPOM</div></div></div>
              <div className="lp-ab-float lp-ab-fbot"><span className="lp-fi">⚡</span><div><div className="lp-ft">Rekomendasi Instan</div><div className="lp-fs">Hasil dalam hitungan detik</div></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="lp-statsbar">
        <div className="container">
          <div className="lp-stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="lp-stats-card">
                <div className="lp-stats-num">{s.num}</div>
                <div className="lp-stats-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teknologi */}
      <section className="lp-tech">
        <div className="container">
          <div className="lp-sec-head">
            <h2 className="lp-sec-title">Teknologi di Balik MedLink</h2>
            {/* DIUBAH: subtitle lebih mudah dipahami */}
            <p className="lp-sec-sub">Cara kerja sistem rekomendasi MedLink secara sederhana</p>
          </div>
          <div className="lp-tech-grid">
            {teknologi.map((t, i) => (
              <div key={i} className="lp-tech-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="lp-tech-icon">{t.icon}</div>
                <h4 className="lp-tech-title">{t.title}</h4>
                <p className="lp-tech-desc">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Misi */}
      <section className="lp-mission">
        <div className="container">
          <div className="lp-mission-box">
            <div className="lp-mission-blob" />
            <div className="lp-mission-left">
              <div className="lp-ab-badge lp-badge-white">🎯 Misi Kami</div>
              <h2 className="lp-mission-title">Memudahkan<br />Akses Informasi<br />Obat untuk Semua</h2>
            </div>
            <div className="lp-mission-right">
              <p className="lp-mission-desc">
                MedLink hadir untuk menjembatani kesenjangan informasi antara pengguna awam dan
                dunia farmasi. Kami percaya setiap orang berhak mendapatkan informasi obat yang
                akurat dan disesuaikan kondisi kesehatannya.
              </p>
              <div className="lp-points">
                {[
                  "Informasi obat mudah diakses kapan saja",
                  // DIUBAH: hapus nama teknologi dari poin misi
                  "Rekomendasi otomatis berdasarkan gejala Anda",
                  "Data terstandar dan terverifikasi BPOM",
                  "Gratis untuk semua pengguna",
                ].map((p, i) => (
                  <div key={i} className="lp-point">
                    <span className="lp-point-check">✓</span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          ③ FEEDBACK
      ══════════════════════════════════ */}
      <section id="feedback" className="lp-feedback">
        <div className="container">

          <div className="lp-sec-head">
            <h2 className="lp-sec-title">Feedback</h2>
            <p className="lp-sec-sub">Bantu kami meningkatkan kualitas MedLink.</p>
          </div>

          {/* Form */}
          <div className="lp-fb-form">
            <div className="lp-fb-field">
              <label className="lp-fb-label">Email Anda <span style={{ color: "#e03333" }}>*</span></label>
              <input className="lp-fb-input" type="email" placeholder="user@gmail.com"
                value={fbEmail} onChange={e => setFbEmail(e.target.value)} />
            </div>
            <div className="lp-fb-field">
              <label className="lp-fb-label">Rating</label>
              <div className="lp-fb-emojis">
                {EMOJIS.map((em, i) => (
                  <span key={i} className={`lp-fb-emoji ${fbRating === em ? "lp-fb-emoji-active" : ""}`}
                    onClick={() => setFbRating(em)}>{em}</span>
                ))}
              </div>
            </div>
            <div className="lp-fb-field">
              <label className="lp-fb-label">Pesan <span style={{ color: "#e03333" }}>*</span></label>
              <textarea className="lp-fb-input lp-fb-textarea" rows={4}
                placeholder="Tulis feedback Anda di sini..."
                value={fbMsg} onChange={e => setFbMsg(e.target.value)} />
            </div>
            {fbSuccess && <div className="lp-fb-success">✅ Terima kasih atas feedback Anda!</div>}
            <button className="lp-fb-submit" onClick={submitFeedback}>Kirim Feedback</button>
          </div>

          {/* Slider */}
          <div className="lp-fb-slider-wrap">
            <h3 className="lp-fb-slider-title">Apa Kata Pengguna?</h3>
            <div className="lp-fb-slider">
              <button className="lp-fb-nav" onClick={() => setCurrentIndex(p => p === 0 ? cards.length - 1 : p - 1)}>‹</button>
              <div className="lp-fb-track-wrap">
                <div className="lp-fb-track" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                  {cards.map((c, i) => (
                    <div key={i} className="lp-fb-card">
                      <div className="lp-fb-card-emoji">{c.emoji}</div>
                      <p className="lp-fb-card-text">"{c.text}"</p>
                      <div className="lp-fb-card-user">
                        <div className="lp-fb-card-avatar">{(c.user[0] || "?").toUpperCase()}</div>
                        <div>
                          <div className="lp-fb-card-name">{c.user}</div>
                          <div className="lp-fb-card-email">{c.email}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="lp-fb-nav" onClick={() => setCurrentIndex(p => p === cards.length - 1 ? 0 : p + 1)}>›</button>
            </div>
            <div className="lp-fb-dots">
              {cards.map((_, i) => (
                <span key={i} className={`lp-fb-dot ${i === currentIndex ? "lp-fb-dot-active" : ""}`}
                  onClick={() => setCurrentIndex(i)} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FOOTER
      ══════════════════════════════════ */}
      <footer className="lp-footer">
        <div className="lp-footer-wave">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path fill="#0b1e3d" d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
          </svg>
        </div>
        <div className="lp-footer-body">
          <div className="container">
            <div className="lp-footer-grid">

              <div className="lp-footer-col">
                <h4 className="lp-footer-brand">MedLink</h4>
                {/* DIUBAH: deskripsi footer lebih mudah dipahami */}
                <p className="lp-footer-desc">
                  MedLink membantu Anda menemukan obat yang tepat berdasarkan gejala
                  secara cepat, aman, dan akurat — tanpa perlu paham istilah medis.
                </p>
                <div className="lp-footer-socials">
                  <span>📷</span><span>💬</span><span>🎵</span>
                </div>
              </div>

              <div className="lp-footer-col">
                <h5 className="lp-footer-heading">Fitur</h5>
                <ul className="lp-footer-list">
                  {["Pencarian Obat", "Rekomendasi Cerdas", "Filter Keamanan", "Daftar Simpan", "Informasi Obat"].map(f => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>

              <div className="lp-footer-col">
                <h5 className="lp-footer-heading">Navigasi</h5>
                <ul className="lp-footer-list">
                  {[["Home", "#home"], ["About", "#about"], ["Feedback", "#feedback"], ["Login", "/login"]].map(([l, h]) => (
                    <li key={l}>
                      <a href={h} className="lp-footer-link">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lp-footer-col">
                {/* TETAP — kolom algoritma di footer boleh tetap teknis */}
                <h5 className="lp-footer-heading">Algoritma</h5>
                <ul className="lp-footer-list">
                  {["Content-Based Filtering", "TF-IDF Weighting", "Cosine Similarity", "Safety Filter", "Precision & Recall"].map(a => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lp-footer-bottom">
              <p>© 2025 MedLink · Sistem Rekomendasi Obat OTC Indonesia</p>
              {/* DIUBAH: tagline bawah fokus ke manfaat, bukan nama teknologi */}
              <p style={{ opacity: 0.4, fontSize: "0.75rem" }}>Rekomendasi Cerdas · Aman · Gratis · Terverifikasi BPOM</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;