from app import db

class Obat(db.Model):
    __tablename__ = "data_obat_hasil_preprocessing_ver_4_3"

    id = db.Column(db.Integer, primary_key=True)
    nama_obat = db.Column(db.String(255))
    kategori_penyakit = db.Column(db.String(255))
    indikasi_clean = db.Column(db.Text)
    dosis_anak_clean = db.Column(db.Text)
    dosis_dewasa_clean = db.Column(db.Text)
    efeksamping = db.Column(db.Text)
    kontraindikasi_clean = db.Column(db.Text)
    komposisi_clean = db.Column(db.Text)
    jangka_waktu_clean = db.Column(db.Text)
    status_obat_label = db.Column(db.String(100))
    batasan_usia_min = db.Column(db.String(50))
    ket_hamil = db.Column(db.String(100))
    gambar = db.Column(db.String(255))