from backend import db
from datetime import datetime
import json


# ════════════════════════════════════════════════════
# MODEL SavedObat
#
# Tabel: saved_obat
# Kolom:
#   id         → primary key auto increment
#   user_id    → foreign key ke tabel user (siapa yang simpan)
#   obat_id    → id obat dari tabel data_obat
#   data_obat  → seluruh data obat disimpan sebagai JSON string
#                (supaya tidak perlu join ke tabel obat setiap kali)
#   created_at → waktu disimpan
# ════════════════════════════════════════════════════

class SavedObat(db.Model):
    __tablename__ = 'saved_obat'

    id         = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id    = db.Column(db.BigInteger, db.ForeignKey('user.id'), nullable=False)
    obat_id    = db.Column(db.String(100), nullable=False)
    data_obat  = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='saved_obats')

    def to_dict(self):
        try:
            obat = json.loads(self.data_obat)
        except Exception:
            obat = {}
        # saved_id dipakai frontend untuk tombol Hapus
        obat['saved_id'] = self.id
        return obat