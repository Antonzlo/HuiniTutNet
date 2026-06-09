"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  HeartIcon,
  PlaylistIcon,
  PlayIcon,
  PauseIcon,
  UserIcon,
  MusicIcon,
} from "@/components/icons";
import { trackArtistNames } from "@/lib/track";
import type { Track } from "@/lib/types";
import styles from "./TrackContextMenu.module.scss";

type Props = {
  open: boolean;
  x: number;
  y: number;
  onClose: () => void;
  track: Track;
  fav: boolean;
  playing?: boolean;
  onPlay: () => void;
  onTogglePlay: () => void;
  onFavorite: () => void;
  onAddToQueue: () => void;
  onDelete: () => void;
  artistSlug?: string;
};

function MenuItem({
  icon,
  label,
  shortcut,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={`${styles.item} ${danger ? styles.danger : ""}`}
      role="menuitem"
      onClick={onClick}
    >
      <span className={styles.itemIcon}>{icon}</span>
      <span className={styles.itemLabel}>{label}</span>
      {shortcut && <kbd className={styles.shortcut}>{shortcut}</kbd>}
    </button>
  );
}

function MenuLink({
  icon,
  label,
  shortcut,
  href,
  onNavigate,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  href: string;
  onNavigate: () => void;
}) {
  return (
    <Link href={href} className={styles.item} role="menuitem" onClick={onNavigate}>
      <span className={styles.itemIcon}>{icon}</span>
      <span className={styles.itemLabel}>{label}</span>
      {shortcut && <kbd className={styles.shortcut}>{shortcut}</kbd>}
    </Link>
  );
}

export function TrackContextMenu({
  open,
  x,
  y,
  onClose,
  track,
  fav,
  playing,
  onPlay,
  onTogglePlay,
  onFavorite,
  onAddToQueue,
  onDelete,
  artistSlug,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const pad = 8;
    let left = x;
    let top = y;
    if (left + rect.width > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - rect.width - pad);
    }
    if (top + rect.height > window.innerHeight - pad) {
      top = Math.max(pad, window.innerHeight - rect.height - pad);
    }
    setPos({ left, top });
  }, [open, x, y]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "s" || e.key === "S") {
        onFavorite();
        onClose();
      }
      if (e.key === "q" || e.key === "Q") {
        onAddToQueue();
        onClose();
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, onFavorite, onAddToQueue]);

  if (!open || typeof document === "undefined") return null;

  async function share() {
    const text = `${track.title} — ${trackArtistNames(track)}`;
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
    } catch {
      /* ignore */
    }
    onClose();
  }

  return createPortal(
    <div
      className={styles.menu}
      ref={ref}
      role="menu"
      style={{ left: pos.left, top: pos.top }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <MenuItem
        icon={playing ? <PauseIcon size={18} tone="primary" /> : <PlayIcon size={18} tone="primary" />}
        label={playing ? "Пауза" : "Играть"}
        onClick={() => {
          if (playing) onTogglePlay();
          else onPlay();
          onClose();
        }}
      />
      <MenuItem
        icon={<HeartIcon filled={fav} size={18} />}
        label={fav ? "Убрать из любимых" : "Добавить в любимые"}
        shortcut="S"
        onClick={() => {
          onFavorite();
          onClose();
        }}
      />
      <MenuItem
        icon={<PlaylistIcon size={18} tone="muted" />}
        label="Добавить в очередь"
        shortcut="Q"
        onClick={() => {
          onAddToQueue();
          onClose();
        }}
      />
      <div className={styles.sep} role="separator" />
      {artistSlug && (
        <MenuLink
          icon={<UserIcon size={18} />}
          label="К исполнителю"
          shortcut="A"
          href={`/artists/${artistSlug}`}
          onNavigate={onClose}
        />
      )}
      <MenuLink
        icon={<MusicIcon size={18} />}
        label="Сведения о треке"
        href={`/tracks/${track.id}/edit`}
        onNavigate={onClose}
      />
      <div className={styles.sep} role="separator" />
      <MenuItem
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 16V4m0 0 4 4m-4-4-4 4M5 20h14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        label="Поделиться"
        onClick={() => void share()}
      />
      <div className={styles.sep} role="separator" />
      <MenuItem
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        label="Удалить"
        danger
        onClick={() => {
          onDelete();
          onClose();
        }}
      />
    </div>,
    document.body
  );
}
