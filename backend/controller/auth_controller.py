import jwt
import datetime
from flask import request, jsonify, current_app
from backend import db
from backend.model.user import User


# ════════════════════════════════════════════════════
# AUTH CONTROLLER
# ════════════════════════════════════════════════════

def api_signup():
    data     = request.get_json()
    name     = data.get("name")
    email    = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"message": "Semua field wajib diisi"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email sudah terdaftar"}), 400

    db.session.add(User(name=name, email=email, password=password))
    db.session.commit()
    return jsonify({"message": "Signup berhasil"}), 201


def api_login():
    data     = request.get_json()
    email    = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email dan password wajib diisi"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "User tidak ditemukan"}), 404
    if user.password != password:
        return jsonify({"message": "Password salah"}), 401

    # ── Buat JWT token ──────────────────────────────────────────
    # Token berisi user_id dan expired 7 hari
    # SECRET_KEY dari config Flask dipakai untuk tanda tangan token
    token = jwt.encode(
        {
            "user_id": user.id,
            "exp"    : datetime.datetime.utcnow() + datetime.timedelta(days=7)
        },
        current_app.config["SECRET_KEY"],
        algorithm="HS256"
    )

    return jsonify({
        "message": "Login berhasil",
        "token"  : token,          # ← token dikirim ke frontend
        "user"   : {
            "id"   : user.id,
            "name" : user.name,
            "email": user.email
        }
    }), 200