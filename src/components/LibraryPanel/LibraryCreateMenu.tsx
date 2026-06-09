"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useLibrary } from "@/context/LibraryContext";
import s from "./LibraryPanel.module.scss";

const ITEMS = [
  {
    href: "/upload",
    title: "Загрузить трек",
    desc: "Добавь аудио в библиотеку HiuniTut.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V5h-6V3H8v2H4v2h4v10.55A4 4 0 1 0 16 17V7h-2v10.55A2 2 0 1 1 12 15V7h2V5h-2V3z" />
      </svg>
    ),
  },
  {
    href: "/artists",
    title: "Добавить артиста",
    desc: "Создай страницу исполнителя.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4Z" />
      </svg>
    ),
  },
];

export function LibraryCreateMenu() {
  const { createOpen, setCreateOpen } = useLibrary();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!createOpen) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setCreateOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [createOpen, setCreateOpen]);

  if (!createOpen) return null;

  return (
    <div className={s.createMenu} ref={ref}>
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={s.createItem}
          onClick={() => setCreateOpen(false)}
        >
          <span className={s.createIcon}>{item.icon}</span>
          <span>
            <span className={s.createTitle}>{item.title}</span>
            <span className={s.createDesc}>{item.desc}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
