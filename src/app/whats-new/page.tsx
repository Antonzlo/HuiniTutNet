"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, mediaUrl } from "@/lib/api";
import type { Track } from "@/lib/types";
import {
  FEED_SECTION_LABELS,
  fmtFeedDate,
  groupByFeedSection,
} from "@/lib/track";
import { useWhatsNew } from "@/context/WhatsNewContext";
import { usePlayer } from "@/context/PlayerContext";
import { PlayIdsButton } from "@/components/PlayIdsButton";
import { WhatsNewSkeleton } from "@/components/Skeleton";
import s from "./whats-new.module.scss";

type FeedItem = {
  id: string;
  type: "single" | "album";
  typeLabel?: string;
  title: string;
  artistName: string;
  artistSlug: string;
  coverUrl: string | null;
  href: string;
  sampleTrackId: string;
  trackIds: string[];
  publishedAt: string;
  isUnread: boolean;
};

export default function WhatsNewPage() {
  const { markSeen } = useWhatsNew();
  const { playTrack } = usePlayer();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ items: FeedItem[] }>("/api/whats-new")
      .then((r) => setItems(r.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    void markSeen();
  }, [markSeen]);

  const sections = useMemo(() => groupByFeedSection(items), [items]);

  async function playItem(item: FeedItem) {
    try {
      const ids = item.trackIds?.length ? item.trackIds : [item.sampleTrackId];
      const tracks = await Promise.all(ids.map((id) => api<Track>(`/api/tracks/${id}`)));
      tracks.sort((a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0));
      if (tracks.length) playTrack(tracks[0]!, { queue: tracks, contextId: item.id });
    } catch {
      /* ignore */
    }
  }

  function renderRow(item: FeedItem) {
    const typeLabel = item.typeLabel ?? (item.type === "single" ? "Сингл" : "Альбом");
    return (
      <div key={item.id} className={`${s.row} ${item.isUnread ? s.rowUnread : ""}`}>
        <Link href={item.href} className={s.coverLink}>
          <div className={s.cover}>
            {item.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(item.coverUrl)} alt="" />
            ) : null}
          </div>
        </Link>
        <div className={s.meta}>
          <Link href={item.href} className={s.title}>
            {item.title}
          </Link>
          <Link href={`/artists/${item.artistSlug}`} className={s.artist}>
            {item.artistName}
          </Link>
          <div className={s.sub}>
            {typeLabel} · {fmtFeedDate(item.publishedAt)}
          </div>
        </div>
        <PlayIdsButton
          trackIds={item.trackIds?.length ? item.trackIds : [item.sampleTrackId]}
          onPlay={() => void playItem(item)}
          className={s.playBtn}
          aria-label={`Играть ${item.title}`}
        />
      </div>
    );
  }

  if (loading) return <WhatsNewSkeleton />;

  return (
    <div className={s.page}>
      <div className={s.hero}>
        <h1 className={s.heading}>Что нового</h1>
        <p className={s.desc}>
          Новые синглы и альбомы на платформе — всё по порядку выхода.
        </p>
      </div>

      {items.length === 0 ? (
        <div className={s.empty}>
          <p>Пока ничего нового</p>
          <p className={s.emptyHint}>Когда появятся новые релизы, они будут здесь</p>
        </div>
      ) : (
        <div className={s.feed}>
          {sections.map((section) => (
            <section key={section.key} className={s.section}>
              <h2 className={s.sectionTitle}>{FEED_SECTION_LABELS[section.key]}</h2>
              {section.items.map(renderRow)}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
