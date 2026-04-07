from backend.controller.auth_controller import (
    api_signup,
    api_login,
)
from backend.controller.obat_controller import (
    api_get_obat,
    api_gambar_bpom,
)
from backend.controller.rekomendasi_controller import (
    api_get_rekomendasi,
)
from backend.controller.saved_controller import (
    api_get_saved,
    api_save_obat,
    api_delete_saved,
    api_check_saved,
)


def register_routes(app):
    # ── Auth ──────────────────────────────────────────────────────
    app.add_url_rule('/signup',                   view_func=api_signup,          methods=['POST'])
    app.add_url_rule('/login',                    view_func=api_login,           methods=['POST'])

    # ── Obat ──────────────────────────────────────────────────────
    app.add_url_rule('/api/obat',                 view_func=api_get_obat,        methods=['GET'])
    app.add_url_rule('/api/gambar-bpom',          view_func=api_gambar_bpom,     methods=['GET'])

    # ── Rekomendasi ───────────────────────────────────────────────
    app.add_url_rule('/api/rekomendasi',          view_func=api_get_rekomendasi, methods=['POST'])

    # ── Saved Obat (BARU) ─────────────────────────────────────────
    app.add_url_rule('/api/saved',                view_func=api_get_saved,       methods=['GET'])
    app.add_url_rule('/api/saved',                view_func=api_save_obat,       methods=['POST'])
    app.add_url_rule('/api/saved/<int:saved_id>', view_func=api_delete_saved,    methods=['DELETE'])
    app.add_url_rule('/api/saved/check',          view_func=api_check_saved,     methods=['GET'])