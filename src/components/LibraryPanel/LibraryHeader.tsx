"use client";

import { useLibrary } from "@/context/LibraryContext";
import { SearchIcon } from "@/components/icons";
import { SORT_LABELS } from "@/lib/library";
import { LibraryCreateMenu } from "./LibraryCreateMenu";
import { LibrarySortMenu } from "./LibrarySortMenu";
import s from "./LibraryPanel.module.scss";

const FILTERS = [
  { id: "playlist" as const, label: "Плейлисты" },
  { id: "album" as const, label: "Альбомы" },
  { id: "artist" as const, label: "Исполнители" },
];

function CollapseLibraryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="8" height="18" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14 8h7M14 12h5M14 16h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function LibraryHeader({ strip }: { strip?: boolean }) {
  const {
    filter,
    setFilter,
    search,
    setSearch,
    sort,
    showSearch,
    setShowSearch,
    createOpen,
    setCreateOpen,
    sortOpen,
    setSortOpen,
    openFullscreen,
    closeFullscreen,
    toggleCollapse,
    expand,
    isFullscreen,
    mode,
  } = useLibrary();

  if (strip) return null;

  return (
    <div className={s.headerWrap}>
      <div className={s.header}>
        <button
          type="button"
          className={s.headerTitle}
          onClick={mode === "collapsed" ? expand : toggleCollapse}
          title={mode === "collapsed" ? "Открыть мою медиатеку" : "Закрыть мою медиатеку"}
          aria-label={mode === "collapsed" ? "Открыть мою медиатеку" : "Закрыть мою медиатеку"}
        >
          <CollapseLibraryIcon />
          <span>Моя медиатека</span>
        </button>
        <div className={s.headerActions}>
          <div className={s.createWrap}>
            <button
              type="button"
              className={`${s.createBtn} ${createOpen ? s.createBtnOpen : ""}`}
              onClick={() => {
                setCreateOpen(!createOpen);
                setSortOpen(false);
              }}
            >
              {createOpen ? (
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
                  <path d="M4 4l8 8M12 4 4 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
              <span>Создать</span>
            </button>
            <LibraryCreateMenu />
          </div>
          <button
            type="button"
            className={s.iconAction}
            onClick={isFullscreen ? closeFullscreen : openFullscreen}
            title={isFullscreen ? "Свернуть медиатеку" : "Открыть мою медиатеку"}
            aria-label={isFullscreen ? "Свернуть медиатеку" : "Открыть мою медиатеку"}
          >
            {isFullscreen ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M5 2H2v3M11 2h3v3M5 14H2v-3M11 14h3v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2 5V2h3M11 2h3v3M14 11v3h-3M5 14H2v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className={s.chips}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`${s.chip} ${filter === f.id ? s.chipActive : ""}`}
            onClick={() => setFilter(filter === f.id ? "all" : f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={s.toolbar}>
        <button
          type="button"
          className={s.searchToggle}
          onClick={() => setShowSearch(!showSearch)}
          aria-label="Поиск в медиатеке"
        >
          <SearchIcon size={18} tone={showSearch ? "primary" : "muted"} />
        </button>
        {showSearch ? (
          <input
            className={s.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Искать в медиатеке"
            autoFocus
          />
        ) : (
          <span className={s.searchPlaceholder}>Искать в медиатеке</span>
        )}
        <div className={s.sortWrap}>
          <button
            type="button"
            className={s.sortBtn}
            onClick={() => {
              setSortOpen(!sortOpen);
              setCreateOpen(false);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <path d="M2 4h12M2 8h8M2 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
            {SORT_LABELS[sort]}
          </button>
          <LibrarySortMenu />
        </div>
      </div>
    </div>
  );
}
