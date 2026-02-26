import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Signup.css";
import logo from "../assets/icon.png";
import bgSign from "../assets/bg-sign.png";

function Signup() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Password tidak sama!");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Signup berhasil!");
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        alert(data.message);
      }

    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan koneksi ke server");
    }
  };

  return (
    <div className="signup-container container-fluid">
      <div className="row vh-100">

        <div className="col-md-6 d-flex flex-column align-items-center justify-content-center signup-left">

          <div className="d-flex align-items-center justify-content-center mb-4">
            <img src={logo} alt="logo" width="50" className="me-2" />
            <h2 className="fw-bold m-0 text-primary">MedLink</h2>
          </div>

          <div className="signup-box text-center">

            <h4 className="signup-title fw-bold">
              SIGN UP
            </h4>

            <form onSubmit={handleSignup}>

              <input
                type="text"
                placeholder="USERNAME"
                className="form-control mb-3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

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

              <input
                type="password"
                placeholder="CONFIRM PASSWORD"
                className="form-control mb-3"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <button type="submit" className="btn signup-btn w-100 mb-3">
                SIGN UP
              </button>

            </form>

            <Link to="/login">
              <button className="btn btn-outline-dark w-100">
                ← Back to Login
              </button>
            </Link>

          </div>
        </div>

        <div
          className="col-md-6 signup-right d-none d-md-block"
          style={{ backgroundImage: `url(${bgSign})` }}
        ></div>

      </div>
    </div>
  );
}

export default Signup;