// src/hooks/useSavedList.js
import { useState, useEffect } from "react";

export function useSavedList() {
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("savedObat") || "[]");
    setSavedIds(new Set(data.map((item) => item.id)));
  }, []);

  const isSaved = (id) => savedIds.has(id);

  const toggleSave = (obatData) => {
    const current = JSON.parse(localStorage.getItem("savedObat") || "[]");
    if (isSaved(obatData.id)) {
      const updated = current.filter((item) => item.id !== obatData.id);
      localStorage.setItem("savedObat", JSON.stringify(updated));
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(obatData.id);
        return next;
      });
    } else {
      const updated = [...current, obatData];
      localStorage.setItem("savedObat", JSON.stringify(updated));
      setSavedIds((prev) => new Set([...prev, obatData.id]));
    }
  };

  return { isSaved, toggleSave };
}