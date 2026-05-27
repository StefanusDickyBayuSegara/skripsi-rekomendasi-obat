// src/hooks/Usesavedlist.js
// ════════════════════════════════════════════════════════════
// PERUBAHAN dari versi sebelumnya:
//
//  [BUG FIX 1] body POST sekarang hanya kirim { obat_id }, bukan
//              seluruh objek obatData yang besar.
//
//  [BUG FIX 2] Kondisi cek res.ok saat POST diperbaiki —
//              dari: if (!res.ok && res.status !== 200)   ← SALAH
//              jadi: if (!res.ok)                         ← BENAR
//
//  [BUG FIX 3] Race condition dihilangkan — toggleSave tidak lagi
//              bergantung pada fungsi isSaved sebagai dependency.
//              Cek simpan langsung baca savedMap via ref di dalam fungsi.
//
//  [PENINGKATAN 1] Optimistic update — UI langsung berubah saat
//              user klik, baru kirim ke API. Rollback otomatis
//              kalau API gagal. Pengalaman terasa jauh lebih cepat.
//
//  [PENINGKATAN 2] pendingIds — mencegah double-click request.
//              Tombol bookmark dikunci saat request sedang berjalan.
//
//  [PENINGKATAN 3] API_BASE dari env variable — tidak lagi hardcode
//              localhost:5000. Siap untuk production.
//
//  [TAMBAHAN 1] Export savedCount — untuk tampilkan jumlah simpanan
//              di navbar atau badge ikon.
//
//  [TAMBAHAN 2] Export refetch — halaman SavedList bisa force-reload
//              data dari API kapan saja.
// ════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from "react";

// ✅ [PENINGKATAN 3] Pakai env variable, fallback ke localhost
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const getToken = () => localStorage.getItem("token");

export function useSavedList() {
  // savedMap: { "obat_id": saved_id } — lookup O(1), lebih cepat dari array
  const [savedMap, setSavedMap]     = useState({});

  // ✅ [PENINGKATAN 2] Set id obat yang sedang diproses — cegah double click
  const [pendingIds, setPendingIds] = useState(new Set());

  // Ref untuk savedMap agar bisa dibaca di dalam callback tanpa tambah dependency
  // ✅ [BUG FIX 3] Solusi race condition
  const savedMapRef = useRef(savedMap);
  useEffect(() => { savedMapRef.current = savedMap; }, [savedMap]);

  // ════════════════════════════════════════════════════════
  // Fungsi fetch data dari API
  // ════════════════════════════════════════════════════════
  const fetchSaved = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/saved`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = await res.json();

      // Bangun map: { "obat_id": saved_id }
      const map = {};
      (Array.isArray(data) ? data : []).forEach((item) => {
        const obatId = String(item.obat_id || item.id || "");
        if (obatId) map[obatId] = item.saved_id;
      });
      setSavedMap(map);
    } catch (err) {
      console.error("Gagal fetch saved:", err);
    }
  }, []);

  // ── Load saat hook pertama dipakai ──────────────────────
  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  // ════════════════════════════════════════════════════════
  // isSaved — cek apakah obat sudah disimpan
  // ════════════════════════════════════════════════════════
  const isSaved = useCallback(
    (id) => String(id) in savedMap,
    [savedMap]
  );

  // ════════════════════════════════════════════════════════
  // isPending — cek apakah obat sedang diproses (untuk disable tombol)
  // ════════════════════════════════════════════════════════
  const isPending = useCallback(
    (id) => pendingIds.has(String(id)),
    [pendingIds]
  );

  // ════════════════════════════════════════════════════════
  // toggleSave — simpan atau hapus obat
  // ════════════════════════════════════════════════════════
  const toggleSave = useCallback(async (obatData) => {
    const token = getToken();
    if (!token) {
      alert("Silakan login terlebih dahulu.");
      return;
    }

    const obatId = String(obatData.id || obatData.obat_id || "");
    if (!obatId) return;

    // Cegah double-click
    if (pendingIds.has(obatId)) return;

    // ✅ [BUG FIX 3] Baca dari ref, bukan dari isSaved (hindari stale closure)
    const currentMap    = savedMapRef.current;
    const sudahDisimpan = obatId in currentMap;
    const savedId       = currentMap[obatId];

    // Tandai sedang diproses
    setPendingIds((prev) => new Set([...prev, obatId]));

    if (sudahDisimpan) {
      // ════ HAPUS ════

      // ✅ [PENINGKATAN 1] Optimistic update: hapus dari UI dulu
      setSavedMap((prev) => {
        const next = { ...prev };
        delete next[obatId];
        return next;
      });

      try {
        const res = await fetch(`${API_BASE}/api/saved/${savedId}`, {
          method : "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        // ✅ [BUG FIX 2] Kondisi cek yang benar
        if (!res.ok) throw new Error(`Gagal hapus: ${res.status}`);

      } catch (err) {
        console.error("Gagal hapus simpanan:", err);
        // Rollback: kembalikan ke savedMap jika API gagal
        setSavedMap((prev) => ({ ...prev, [obatId]: savedId }));
        alert("Gagal menghapus simpanan. Coba lagi.");
      }

    } else {
      // ════ SIMPAN ════

      // ✅ [PENINGKATAN 1] Optimistic update: tambah ke UI dulu (saved_id sementara -1)
      setSavedMap((prev) => ({ ...prev, [obatId]: -1 }));

      try {
        // ✅ [BUG FIX 1] Hanya kirim obat_id, bukan seluruh objek obatData
        const res = await fetch(`${API_BASE}/api/saved`, {
          method : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization : `Bearer ${token}`,
          },
          body: JSON.stringify({ obat_id: Number(obatId) }),
        });

        // ✅ [BUG FIX 2] Kondisi cek yang benar — hapus && res.status !== 200
        if (!res.ok) throw new Error(`Gagal simpan: ${res.status}`);

        const data = await res.json();

        // Update saved_id dengan nilai asli dari server
        setSavedMap((prev) => ({
          ...prev,
          [obatId]: data.saved_id ?? data.id ?? -1,
        }));

      } catch (err) {
        console.error("Gagal simpan obat:", err);
        // Rollback: hapus dari UI jika API gagal
        setSavedMap((prev) => {
          const next = { ...prev };
          delete next[obatId];
          return next;
        });
        alert("Gagal menyimpan obat. Coba lagi.");
      }
    }

    // Selesai diproses — hapus dari pending
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(obatId);
      return next;
    });

  // ✅ [BUG FIX 3] Tidak pakai isSaved di dependency — pakai savedMapRef
  }, [pendingIds]);

  // ════════════════════════════════════════════════════════
  // Return nilai yang diekspos ke komponen
  // ════════════════════════════════════════════════════════
  return {
    isSaved,
    isPending,                              // ✅ [TAMBAHAN] disable tombol saat loading
    toggleSave,
    savedCount: Object.keys(savedMap).length, // ✅ [TAMBAHAN] jumlah obat tersimpan
    refetch: fetchSaved,                    // ✅ [TAMBAHAN] force reload dari API
  };
}