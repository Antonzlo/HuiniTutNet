"use client";

import { useEffect, useRef } from "react";
import { useLibrary } from "@/context/LibraryContext";
import { SORT_LABELS, type LibrarySort, type LibraryView } from "@/lib/library";
import s from "./LibraryPanel.module.scss";

const SORTS: LibrarySort[] = ["recent", "added", "name", "creator"];
const VIEWS: { id: LibraryView; label: string }[] = [
  { id: "list", label: "Список" },
  { id: "compact", label: "Компактный" },
  { id: "grid", label: "Сетка" },
  { id: "grid-lg", label: "Крупная сетка" },
];

function ViewIcon({ view }: { view: LibraryView }) {
  if (view === "compact") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <path d="M2 4h12M2 8h8M2 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  if (view === "list") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <circle cx="3" cy="4" r="1" fill="currentColor" />
        <circle cx="3" cy="8" r="1" fill="currentColor" />
        <circle cx="3" cy="12" r="1" fill="currentColor" />
        <path d="M6 4h8M6 8h8M6 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (view === "grid") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={3 + (i % 2) * 6} cy={3 + Math.floor(i / 2) * 6} r="1.2" fill="currentColor" />
        ))}
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor" />
    </svg>
  );
}

export function LibrarySortMenu() {
  const { sortOpen, setSortOpen, sort, setSort, view, setView } = useLibrary();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sortOpen) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setSortOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [sortOpen, setSortOpen]);

  if (!sortOpen) return null;

  return (
    <div className={s.sortMenu} ref={ref}>
      <div className={s.sortMenuTitle}>Сортировка</div>
      {SORTS.map((id) => (
        <button
          key={id}
          type="button"
          className={`${s.sortMenuItem} ${sort === id ? s.sortMenuActive : ""}`}
          onClick={() => {
            setSort(id);
            setSortOpen(false);
          }}
        >
          {SORT_LABELS[id]}
          {sort === id && (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            </svg>
          )}
        </button>
      ))}
      <div className={s.sortMenuDivider} />
      <div className={s.sortMenuTitle}>Формат библиотеки</div>
      <div className={s.viewRow}>
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`${s.viewBtn} ${view === v.id ? s.viewBtnActive : ""}`}
            title={v.label}
            onClick={() => setView(v.id)}
          >
            <ViewIcon view={v.id} />
          </button>
        ))}
      </div>
    </div>
  );
}
