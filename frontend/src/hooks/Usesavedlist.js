// src/hooks/Usesavedlist.js
import { useState, useEffect, useCallback } from "react";

const API_BASE  = "http://localhost:5000";
const getToken  = () => localStorage.getItem("token");

export function useSavedList() {
  // savedMap: { obat_id: saved_id } — untuk tahu obat mana sudah disimpan
  const [savedMap, setSavedMap] = useState({});

  // ── Ambil semua simpanan saat hook pertama kali dipakai ──────────
  useEffect(() => {
    const fetchSaved = async () => {
      const token = getToken();
      if (!token) return; // belum login, skip

      try {
        const res  = await fetch(`${API_BASE}/api/saved`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();

        // Buat map: { obat_id: saved_id }
        const map = {};
        data.forEach((item) => {
          const obatId = String(item.obat_id || item.id || "");
          if (obatId) map[obatId] = item.saved_id;
        });
        setSavedMap(map);
      } catch (err) {
        console.error("Gagal fetch saved:", err);
      }
    };

    fetchSaved();
  }, []);

  // ── Cek apakah obat dengan id tertentu sudah disimpan ───────────
  const isSaved = useCallback(
    (id) => String(id) in savedMap,
    [savedMap]
  );

  // ── Toggle simpan / hapus ────────────────────────────────────────
  const toggleSave = useCallback(async (obatData) => {
    const token  = getToken();
    if (!token) {
      alert("Silakan login terlebih dahulu.");
      return;
    }

    const obatId = String(obatData.id || obatData.obat_id || "");
    if (!obatId) return;

    // ── Sudah disimpan → hapus ───────────────────────────────────
    if (isSaved(obatId)) {
      const savedId = savedMap[obatId];
      try {
        const res = await fetch(`${API_BASE}/api/saved/${savedId}`, {
          method : "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Gagal hapus");

        // Update state lokal
        setSavedMap((prev) => {
          const next = { ...prev };
          delete next[obatId];
          return next;
        });
      } catch (err) {
        console.error("Gagal hapus simpanan:", err);
        alert("Gagal menghapus simpanan.");
      }

    // ── Belum disimpan → simpan ──────────────────────────────────
    } else {
      try {
        const res = await fetch(`${API_BASE}/api/saved`, {
          method : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization : `Bearer ${token}`,
          },
          body: JSON.stringify(obatData),
        });
        const data = await res.json();
        if (!res.ok && res.status !== 200) throw new Error("Gagal simpan");

        // Update state lokal dengan saved_id dari response
        setSavedMap((prev) => ({
          ...prev,
          [obatId]: data.saved_id,
        }));
      } catch (err) {
        console.error("Gagal simpan obat:", err);
        alert("Gagal menyimpan obat.");
      }
    }
  }, [isSaved, savedMap]);

  return { isSaved, toggleSave };
}