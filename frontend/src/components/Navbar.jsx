import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/icon.png";

const menuItemStyle = {
  width:"100%", padding:"10px 16px", background:"none", border:"none",
  textAlign:"left", cursor:"pointer", fontSize:"0.92rem", color:"#333",
  display:"flex", alignItems:"center", gap:"10px", transition:"background 0.15s",
};

function Navbar() {
  const navigate     = useNavigate();
  const location     = useLocation();
  const fileInputRef = useRef(null);
  const dropdownRef  = useRef(null);

  const [user, setUser]                   = useState(JSON.parse(localStorage.getItem("user")));
  const [showDropdown, setShowDropdown]   = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm]           = useState({
    name : user?.name  || "",
    email: user?.email || "",
    foto : user?.foto  || null,
  });
  const [editMsg, setEditMsg] = useState("");

  // Tutup dropdown klik luar
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleOpenEdit = () => {
    setEditForm({ name: user?.name || "", email: user?.email || "", foto: user?.foto || null });
    setEditMsg("");
    setShowDropdown(false);
    setShowEditModal(true);
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setEditMsg("❌ Ukuran foto maksimal 2MB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setEditForm(prev => ({ ...prev, foto: ev.target.result })); setEditMsg(""); };
    reader.readAsDataURL(file);
  };

  const handleHapusFoto = () => {
    setEditForm(prev => ({ ...prev, foto: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveEdit = () => {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setEditMsg("❌ Nama dan email tidak boleh kosong."); return;
    }
    const updatedUser = { ...user, name: editForm.name.trim(), email: editForm.email.trim(), foto: editForm.foto };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setEditMsg("✅ Profil berhasil diperbarui!");
    setTimeout(() => setShowEditModal(false), 1100);
  };

  const getInisial = (name) => {
    if (!name) return "?";
    return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  };

  // ── Scroll ke section (untuk landing page) ──
  const scrollTo = (id) => {
    // Kalau sudah di halaman "/" langsung scroll
    if (location.pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      // Kalau di halaman lain, navigate ke "/" dulu lalu scroll
      navigate("/");
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  };

  function Avatar({ foto, name, size = 36 }) {
    if (foto) return (
      <img src={foto} alt="profil"
        style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover",
          flexShrink:0, border:"2px solid #e0f7f8" }} />
    );
    return (
      <div style={{
        width:size, height:size, borderRadius:"50%", flexShrink:0,
        background:"linear-gradient(135deg,#53c5c9,#3fb2b6)",
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"white", fontWeight:700, fontSize:size*0.33+"px",
      }}>
        {getInisial(name)}
      </div>
    );
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-light px-5 shadow-sm">

        {/* Logo */}
        <NavLink className="navbar-brand d-flex align-items-center gap-2" to="/">
          <img src={logo} alt="logo" style={{ width:"40px", height:"40px" }} />
          <span className="fw-bold fs-3 text-primary">MedLink</span>
        </NavLink>

        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto align-items-center" style={{ gap:"4px" }}>

            {/* ══ Belum login — scroll links ══ */}
            {!user && (
              <>
                {[
                  { label:"Home",     id:"home"     },
                  { label:"About",    id:"about"    },
                  { label:"Feedback", id:"feedback" },
                ].map(({ label, id }) => (
                  <li className="nav-item" key={id}>
                    <button
                      onClick={() => scrollTo(id)}
                      style={{
                        background:"none", border:"none", cursor:"pointer",
                        fontSize:"1.25rem", fontWeight:500, padding:"8px 16px",
                        color:"#333", transition:"color 0.2s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color="#53c5c9"}
                      onMouseLeave={e => e.currentTarget.style.color="#333"}
                    >
                      {label}
                    </button>
                  </li>
                ))}
                <li className="nav-item d-flex align-items-center gap-1" style={{ paddingLeft:"6px" }}>
                  <span style={{ fontSize:"1.1rem" }}>👤</span>
                  <NavLink to="/login" className="nav-link" style={{ fontSize:"1.25rem", fontWeight:500 }}>
                    Login
                  </NavLink>
                </li>
              </>
            )}

            {/* ══ Sudah login ══ */}
            {user && (
              <>
                {[
                  { to:"/search",         label:"Search Medicine" },
                  { to:"/recommendation", label:"Recommendation"  },
                  { to:"/saved",          label:"Saved List"      },
                ].map(({ to, label }) => (
                  <li className="nav-item" key={to}>
                    <NavLink
                      to={to}
                      className={({ isActive }) => "nav-link" + (isActive ? " fw-bold" : "")}
                      style={({ isActive }) => ({
                        fontSize:"1.25rem", fontWeight: isActive ? 700 : 500,
                        padding:"8px 18px",
                        color: isActive ? "#53c5c9" : "#333",
                        letterSpacing:"0.01em",
                      })}
                    >
                      {label}
                    </NavLink>
                  </li>
                ))}

                {/* Dropdown Profil */}
                <li className="nav-item" style={{ position:"relative", marginLeft:"10px" }} ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(v => !v)}
                    style={{
                      display:"flex", alignItems:"center", gap:"8px",
                      padding:"5px 12px 5px 5px",
                      border:"2px solid #dee2e6", borderRadius:"30px",
                      background:"white", cursor:"pointer", transition:"border-color 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor="#53c5c9"}
                    onMouseLeave={e => e.currentTarget.style.borderColor="#dee2e6"}
                  >
                    <Avatar foto={user.foto} name={user.name} size={36} />
                    <span style={{ fontSize:"1.05rem", fontWeight:600, maxWidth:"130px",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"#333" }}>
                      {user.name?.split(" ")[0] || user.email}
                    </span>
                    <span style={{ fontSize:"0.65rem", color:"#999", display:"inline-block",
                      transition:"transform 0.2s",
                      transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                  </button>

                  {showDropdown && (
                    <div style={{
                      position:"absolute", top:"calc(100% + 10px)", right:0,
                      background:"white", borderRadius:"16px",
                      boxShadow:"0 10px 40px rgba(0,0,0,0.14)",
                      minWidth:"230px", zIndex:9999,
                      border:"1px solid #eee", overflow:"hidden",
                      animation:"dropFade 0.18s ease",
                    }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"12px",
                        padding:"14px 16px", background:"#f8f9fa", borderBottom:"1px solid #eee" }}>
                        <Avatar foto={user.foto} name={user.name} size={42} />
                        <div style={{ overflow:"hidden" }}>
                          <div style={{ fontWeight:700, fontSize:"0.95rem", color:"#222",
                            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {user.name || "Pengguna"}
                          </div>
                          <div style={{ fontSize:"0.75rem", color:"#888",
                            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <div style={{ padding:"6px 0" }}>
                        <button style={menuItemStyle}
                          onMouseEnter={e => e.currentTarget.style.background="#f0fafb"}
                          onMouseLeave={e => e.currentTarget.style.background="none"}
                          onClick={handleOpenEdit}>
                          <span>✏️</span> Edit Profil
                        </button>
                        <div style={{ height:"1px", background:"#f0f0f0", margin:"4px 0" }} />
                        <button style={{ ...menuItemStyle, color:"#e03333" }}
                          onMouseEnter={e => e.currentTarget.style.background="#fff5f5"}
                          onMouseLeave={e => e.currentTarget.style.background="none"}
                          onClick={handleLogout}>
                          <span>🚪</span> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>

      <div style={{ height:"6px", background:"black" }} />

      {/* ════ MODAL EDIT PROFIL ════ */}
      {showEditModal && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.45)",
          display:"flex", justifyContent:"center", alignItems:"center", zIndex:10000,
        }} onClick={() => setShowEditModal(false)}>
          <div style={{
            background:"white", borderRadius:"22px", width:"440px", maxWidth:"95vw",
            overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.2)",
            animation:"dropFade 0.2s ease",
          }} onClick={e => e.stopPropagation()}>

            <div style={{ background:"#53c5c9", padding:"16px 24px" }}>
              <h5 style={{ color:"white", margin:0, fontWeight:700, fontSize:"1rem" }}>✏️ Edit Profil</h5>
            </div>

            <div style={{ padding:"24px" }}>
              {/* Avatar + upload */}
              <div style={{ textAlign:"center", marginBottom:"22px" }}>
                <div style={{ position:"relative", display:"inline-block" }}>
                  <Avatar foto={editForm.foto} name={editForm.name || user?.name} size={88} />
                  <button onClick={() => fileInputRef.current?.click()} title="Ganti foto"
                    style={{
                      position:"absolute", bottom:2, right:2, width:"30px", height:"30px",
                      borderRadius:"50%", background:"#53c5c9", border:"2.5px solid white",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      cursor:"pointer", fontSize:"0.78rem", boxShadow:"0 2px 8px rgba(0,0,0,0.15)",
                    }}>📷</button>
                </div>
                <div style={{ marginTop:"10px", display:"flex", gap:"14px", justifyContent:"center" }}>
                  <button onClick={() => fileInputRef.current?.click()}
                    style={{ background:"none", border:"none", color:"#53c5c9", fontSize:"0.85rem", cursor:"pointer", fontWeight:600, padding:0 }}>
                    📷 Ganti Foto
                  </button>
                  {editForm.foto && (
                    <button onClick={handleHapusFoto}
                      style={{ background:"none", border:"none", color:"#e03333", fontSize:"0.85rem", cursor:"pointer", fontWeight:600, padding:0 }}>
                      🗑️ Hapus Foto
                    </button>
                  )}
                </div>
                <p style={{ fontSize:"0.73rem", color:"#bbb", marginTop:"5px", marginBottom:0 }}>Format JPG / PNG · Maks. 2MB</p>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                  style={{ display:"none" }} onChange={handleFotoChange} />
              </div>

              {/* Nama */}
              <div style={{ marginBottom:"14px" }}>
                <label style={{ fontWeight:600, fontSize:"0.9rem", display:"block", marginBottom:"6px" }}>Nama Lengkap</label>
                <input type="text" className="form-control" placeholder="Masukan nama lengkap"
                  value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>

              {/* Email */}
              <div style={{ marginBottom:"14px" }}>
                <label style={{ fontWeight:600, fontSize:"0.9rem", display:"block", marginBottom:"6px" }}>Email</label>
                <input type="email" className="form-control" placeholder="Masukan email"
                  value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </div>

              {editMsg && (
                <div style={{
                  padding:"10px 14px", borderRadius:"10px", fontSize:"0.88rem",
                  background: editMsg.startsWith("✅") ? "#f0fafb" : "#fff5f5",
                  color: editMsg.startsWith("✅") ? "#2a9d8f" : "#cc0000",
                  border: `1px solid ${editMsg.startsWith("✅") ? "#b2ebef" : "#ffcccc"}`,
                }}>{editMsg}</div>
              )}
            </div>

            <div style={{ padding:"14px 24px", borderTop:"1px solid #eee", display:"flex", gap:"10px", justifyContent:"flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Batal</button>
              <button className="btn btn-info text-white fw-semibold" onClick={handleSaveEdit}>💾 Simpan</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dropFade {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </>
  );
}

export default Navbar;