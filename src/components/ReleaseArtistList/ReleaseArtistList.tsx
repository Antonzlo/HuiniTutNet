"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArtistAvatar } from "@/components/ArtistAvatar/ArtistAvatar";
import s from "./ReleaseArtistList.module.scss";

type Artist = {
  id: string;
  name: string;
  slug: string;
  avatarUrl?: string | null;
  imageUrl?: string | null;
};

type Props = {
  artists: Artist[];
  albumArtist?: string | null;
};

type MenuPos = {
  top: number;
  left: number;
  minWidth: number;
};

function ArtistChip({ artist }: { artist: Artist }) {
  return (
    <Link href={`/artists/${artist.slug}`} className={s.chip}>
      <ArtistAvatar
        name={artist.name}
        avatarUrl={artist.avatarUrl}
        imageUrl={artist.imageUrl}
        className={s.avatar}
        imgClassName={s.avatarImg}
      />
      <span>{artist.name}</span>
    </Link>
  );
}

export function ReleaseArtistList({ artists, albumArtist }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<MenuPos>({ top: 0, left: 0, minWidth: 200 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;

    const update = () => {
      const btn = btnRef.current;
      const panel = panelRef.current;
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const panelRect = panel?.getBoundingClientRect();
      const panelH = panelRect?.height ?? 280;
      const panelW = Math.max(200, rect.width);
      const pad = 8;
      const gap = 6;

      let top = rect.bottom + gap;
      let left = rect.left;

      if (top + panelH > window.innerHeight - pad) {
        top = Math.max(pad, rect.top - panelH - gap);
      }
      if (left + panelW > window.innerWidth - pad) {
        left = Math.max(pad, window.innerWidth - panelW - pad);
      }

      setPos({ top, left, minWidth: panelW });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, artists.length]);

  if (!artists.length) {
    if (!albumArtist) return null;
    return (
      <div className={s.row}>
        <span className={s.chipPlain}>{albumArtist}</span>
      </div>
    );
  }

  const visible = artists.slice(0, 2);
  const extra = artists.slice(2);

  const menu =
    open && mounted
      ? createPortal(
          <div
            ref={panelRef}
            className={s.dropdownFixed}
            style={{ top: pos.top, left: pos.left, minWidth: pos.minWidth }}
            role="menu"
            onMouseEnter={show}
            onMouseLeave={hide}
          >
            <div className={s.dropdownPanel}>
              {extra.map((a) => (
                <Link key={a.id} href={`/artists/${a.slug}`} className={s.dropdownItem} role="menuitem">
                  <ArtistAvatar
                    name={a.name}
                    avatarUrl={a.avatarUrl}
                    imageUrl={a.imageUrl}
                    className={s.dropdownAvatar}
                    imgClassName={s.avatarImg}
                  />
                  <span>{a.name}</span>
                </Link>
              ))}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className={s.row}>
      {visible.map((a) => (
        <ArtistChip key={a.id} artist={a} />
      ))}
      {extra.length > 0 && (
        <div className={`${s.more} ${open ? s.moreOpen : ""}`} onMouseEnter={show} onMouseLeave={hide}>
          <button
            ref={btnRef}
            type="button"
            className={s.moreBtn}
            aria-haspopup="true"
            aria-expanded={open}
          >
            +{extra.length}
          </button>
        </div>
      )}
      {menu}
    </div>
  );
}
