import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";
import logo from "../assets/icon.png";
import bgImage from "../assets/bg-login.png";

function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:5000/login", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Login berhasil!");

        // ── BARU: simpan token JWT untuk keperluan SavedList ──────
        localStorage.setItem("token",   data.token);
        localStorage.setItem("user_id", String(data.user.id));
        localStorage.setItem("name",    data.user.name);

        // ── Simpan user seperti sebelumnya (tidak diubah) ─────────
        const savedProfile = JSON.parse(
          localStorage.getItem(`profile_${data.user.email}`)
        );
        const finalUser = savedProfile
          ? { ...data.user, name: savedProfile.name, foto: savedProfile.foto }
          : data.user;
        localStorage.setItem("user", JSON.stringify(finalUser));

        window.location.href = "/recommendation";
      } else {
        alert(data.message || "Login gagal");
      }
    } catch (error) {
      console.error(error);
      alert("Gagal koneksi ke server");
    }
  };

  return (
    <div className="login-container container-fluid">
      <div className="row vh-100">

        <div
          className="col-md-6 login-left d-none d-md-block"
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>

        <div className="col-md-6 d-flex flex-column align-items-center justify-content-center login-right">
          <div className="d-flex align-items-center justify-content-center mb-4">
            <img src={logo} alt="logo" width="50" className="me-2" />
            <h2 className="fw-bold m-0 text-primary">MedLink</h2>
          </div>

          <div className="login-box text-center">
            <h4 className="login-title text-dark fw-bold">LOGIN</h4>

            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="EMAIL"
                className="form-control mb-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="PASSWORD"
                className="form-control mb-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit" className="btn login-btn w-100 mb-3">
                LOGIN
              </button>
            </form>

            <Link to="/feedback">
              <button className="btn btn-outline-dark w-100 mb-3">
                ← Back to Feedback
              </button>
            </Link>

            <p className="signup-text">
              <Link to="/signup">SIGN UP</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;