from flask import request, jsonify
from backend import db
from backend.model.saved_obat import SavedObat
from backend.utils.helpers import token_required
import json


# ── GET /api/saved → ambil semua simpanan milik user login ──────
@token_required
def api_get_saved(current_user):
    items = (
        SavedObat.query
        .filter_by(user_id=current_user.id)
        .order_by(SavedObat.created_at.desc())
        .all()
    )
    return jsonify([i.to_dict() for i in items]), 200


# ── POST /api/saved → simpan obat baru ──────────────────────────
@token_required
def api_save_obat(current_user):
    data    = request.get_json()
    obat_id = str(data.get("id") or data.get("obat_id") or "")

    if not obat_id:
        return jsonify({"message": "obat_id wajib ada"}), 400

    # Cegah simpan obat yang sama dua kali oleh user yang sama
    exists = SavedObat.query.filter_by(
        user_id=current_user.id,
        obat_id=obat_id
    ).first()
    if exists:
        return jsonify({"message": "Obat sudah disimpan", "saved_id": exists.id}), 200

    new_item = SavedObat(
        user_id   = current_user.id,
        obat_id   = obat_id,
        data_obat = json.dumps(data)
    )
    db.session.add(new_item)
    db.session.commit()

    return jsonify({"message": "Berhasil disimpan", "saved_id": new_item.id}), 201


# ── DELETE /api/saved/<id> → hapus satu simpanan ────────────────
@token_required
def api_delete_saved(current_user, saved_id):
    item = SavedObat.query.filter_by(
        id      = saved_id,
        user_id = current_user.id    # pastikan hanya bisa hapus milik sendiri
    ).first()

    if not item:
        return jsonify({"message": "Data tidak ditemukan"}), 404

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Berhasil dihapus"}), 200


# ── GET /api/saved/check → cek apakah obat sudah disimpan ───────
@token_required
def api_check_saved(current_user):
    obat_id = request.args.get("obat_id", "")
    item    = SavedObat.query.filter_by(
        user_id = current_user.id,
        obat_id = str(obat_id)
    ).first()
    return jsonify({
        "is_saved": item is not None,
        "saved_id": item.id if item else None
    }), 200