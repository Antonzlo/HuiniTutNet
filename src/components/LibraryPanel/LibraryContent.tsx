"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useLibrary } from "@/context/LibraryContext";
import { useLibraryItems } from "@/context/LibraryItemsContext";
import { usePlayer } from "@/context/PlayerContext";
import {
  filterLibraryItems,
  fmtAddedAt,
  isLibraryItemActive,
  searchLibraryItems,
  sortLibraryItems,
  type LibraryItem,
} from "@/lib/library";
import { LibraryCover } from "./LibraryCover";
import s from "./LibraryPanel.module.scss";

function PlayingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className={s.pinIcon} aria-hidden>
      <path d="M9.5 2 8 3.5 4.5 2.5 2 5l2.5 2.5L3 9l3 3 1.5-1.5L9 14l2.5-2.5L8 9l1.5-1.5L12 5 9.5 2Z" />
    </svg>
  );
}

type ItemProps = {
  item: LibraryItem;
  active: boolean;
  showDate?: boolean;
};

function ListRow({ item, active, showDate }: ItemProps) {
  return (
    <Link href={item.href} className={`${s.row} ${active ? s.rowActive : ""}`}>
      <LibraryCover item={item} size={48} />
      <div className={s.rowText}>
        <div className={s.rowTitle}>{item.title}</div>
        <div className={s.rowSub}>
          {item.pinned && <PinIcon />}
          {item.subtitle}
        </div>
      </div>
      {active && (
        <span className={s.rowPlaying} aria-label="Сейчас играет">
          <PlayingIcon />
        </span>
      )}
      {showDate && <span className={s.rowDate}>{fmtAddedAt(item.addedAt)}</span>}
    </Link>
  );
}

function CompactRow({ item, active, showDate }: ItemProps) {
  const type = item.subtitle.split("•")[0]?.trim() ?? item.subtitle;
  return (
    <Link href={item.href} className={`${s.compactRow} ${active ? s.rowActive : ""}`}>
      <span className={s.compactTitle}>
        {item.pinned && <PinIcon />}
        {item.title}
      </span>
      <span className={s.compactDot}>•</span>
      <span className={s.compactType}>{type}</span>
      {active && <span className={s.rowPlaying}><PlayingIcon /></span>}
      {showDate && <span className={s.rowDate}>{fmtAddedAt(item.addedAt)}</span>}
    </Link>
  );
}

function GridCard({ item, active, large }: ItemProps & { large?: boolean }) {
  return (
    <Link href={item.href} className={`${s.gridCard} ${large ? s.gridCardLg : ""} ${active ? s.active : ""}`}>
      <div className={s.gridCoverWrap}>
        <LibraryCover item={item} className={large ? s.gridCoverLg : s.gridCover} />
        {active && (
          <span className={s.playingBadge} aria-label="Сейчас играет">
            <PlayingIcon />
          </span>
        )}
      </div>
      <div className={s.gridTitle}>{item.title}</div>
      <div className={s.gridSub}>{item.subtitle}</div>
    </Link>
  );
}

export function LibraryContent() {
  const pathname = usePathname();
  const { filter, search, sort, view, isFullscreen } = useLibrary();
  const { items, loading } = useLibraryItems();
  const { currentTrack } = usePlayer();

  const visible = useMemo(
    () => sortLibraryItems(searchLibraryItems(filterLibraryItems(items, filter), search), sort),
    [items, filter, search, sort]
  );

  const showDate = isFullscreen && (view === "list" || view === "compact");

  if (loading && items.length === 0) return <div className={s.listEmpty}>Загрузка…</div>;
  if (visible.length === 0) {
    return (
      <div className={s.listEmpty}>
        <p>Медиатека пуста</p>
        <p className={s.listEmptyHint}>Лайкай треки и подписывайся на артистов</p>
      </div>
    );
  }

  if (view === "grid" || view === "grid-lg") {
    return (
      <div className={`${s.grid} ${view === "grid-lg" ? s.gridLg : ""}`}>
        {visible.map((item) => (
          <GridCard
            key={item.id}
            item={item}
            active={isLibraryItemActive(item, pathname, currentTrack)}
            large={view === "grid-lg"}
          />
        ))}
      </div>
    );
  }

  if (view === "compact") {
    return (
      <div className={s.compactList}>
        {showDate && (
          <div className={s.tableHead}>
            <span>Название</span>
            <span>Дата добавления</span>
          </div>
        )}
        {visible.map((item) => (
          <CompactRow
            key={item.id}
            item={item}
            active={isLibraryItemActive(item, pathname, currentTrack)}
            showDate={showDate}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={s.list}>
      {showDate && (
        <div className={s.tableHead}>
          <span>Название</span>
          <span>Дата добавления</span>
        </div>
      )}
      {visible.map((item) => (
        <ListRow
          key={item.id}
          item={item}
          active={isLibraryItemActive(item, pathname, currentTrack)}
          showDate={showDate}
        />
      ))}
    </div>
  );
}
