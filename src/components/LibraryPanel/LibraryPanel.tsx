"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLibrary } from "@/context/LibraryContext";
import { useLibraryItems } from "@/context/LibraryItemsContext";
import {
  filterLibraryItems,
  searchLibraryItems,
  sortLibraryItems,
} from "@/lib/library";
import { LibraryIcon } from "@/components/icons";
import { LibraryCover } from "./LibraryCover";
import { LibraryHeader } from "./LibraryHeader";
import { LibraryContent } from "./LibraryContent";
import s from "./LibraryPanel.module.scss";

export function LibraryPanel() {
  const { mode, sidebarCollapsed, expand, filter, search, sort } = useLibrary();
  const { items, loading } = useLibraryItems();

  const visible = useMemo(
    () => sortLibraryItems(searchLibraryItems(filterLibraryItems(items, filter), search), sort),
    [items, filter, search, sort]
  );

  if (sidebarCollapsed) {
    return (
      <div className={`${s.panel} ${s.collapsedStrip}`}>
        <button
          type="button"
          className={s.stripBtn}
          onClick={expand}
          title="Открыть мою медиатеку"
          aria-label="Открыть мою медиатеку"
        >
          <LibraryIcon size={22} tone="primary" />
        </button>
        <Link href="/upload" className={s.stripBtn} title="Создать" aria-label="Создать">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </Link>
        <div className={s.stripList}>
          {!loading &&
            visible.slice(0, 32).map((item) => (
              <Link key={item.id} href={item.href} className={s.stripItem} title={item.title}>
                <LibraryCover item={item} size={48} />
              </Link>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${s.panel} ${mode === "fullscreen" ? s.panelFullscreen : ""}`}>
      <LibraryHeader />
      <div className={s.body}>
        <LibraryContent />
      </div>
    </div>
  );
}
