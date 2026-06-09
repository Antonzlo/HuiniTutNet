"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Artist } from "@/lib/types";
import styles from "./ArtistNameInput.module.scss";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function currentSegment(value: string, cursor: number) {
  const head = value.slice(0, cursor);
  const sep = Math.max(head.lastIndexOf(","), head.lastIndexOf("&"));
  const start = sep >= 0 ? sep + 1 : 0;
  return {
    query: head.slice(start).trim(),
    start,
    end: cursor,
  };
}

export function ArtistNameInput({ value, onChange, placeholder }: Props) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<Artist[]>("/api/artists", { auth: false })
      .then(setArtists)
      .catch(() => {});
  }, []);

  const segment = useMemo(() => currentSegment(value, cursor), [value, cursor]);

  const suggestions = useMemo(() => {
    const q = segment.query.toLowerCase();
    if (!q) return [];
    return artists
      .filter((a) => a.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [artists, segment.query]);

  useEffect(() => {
    setActiveIdx(0);
  }, [segment.query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function applySuggestion(name: string) {
    const before = value.slice(0, segment.start);
    const after = value.slice(segment.end);
    const prefix = before.trimEnd();
    const joiner = prefix.length > 0 && !prefix.endsWith(",") ? ", " : "";
    const next = `${prefix}${joiner}${name}${after.startsWith(",") ? "" : ""}${after}`;
    onChange(next.replace(/^,\s*/, ""));
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && suggestions[activeIdx]) {
      e.preventDefault();
      applySuggestion(suggestions[activeIdx].name);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && segment.query.length > 0 && suggestions.length > 0;

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <input
        className={styles.input}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setCursor(e.target.selectionStart ?? e.target.value.length);
          setOpen(true);
        }}
        onFocus={(e) => {
          setCursor(e.target.selectionStart ?? value.length);
          setOpen(true);
        }}
        onClick={(e) => setCursor(e.currentTarget.selectionStart ?? value.length)}
        onKeyUp={(e) => setCursor(e.currentTarget.selectionStart ?? value.length)}
        onKeyDown={onKeyDown}
        autoComplete="off"
      />
      {showList && (
        <div className={styles.suggestions} role="listbox">
          {suggestions.map((a, i) => (
            <button
              key={a.id}
              type="button"
              role="option"
              className={`${styles.item} ${i === activeIdx ? styles.active : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                applySuggestion(a.name);
              }}
            >
              {a.name}
            </button>
          ))}
        </div>
      )}
      <p className={styles.hint}>Несколько артистов — через запятую: C418, Protostar</p>
    </div>
  );
}
