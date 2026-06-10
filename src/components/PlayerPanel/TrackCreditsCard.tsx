"use client";

import Link from "next/link";
import type { Track } from "@/lib/types";
import { ArtistFollowPill } from "./ArtistFollowPill";
import styles from "./panel.module.scss";

type Props = {
  track: Track;
  onShowAll?: () => void;
};

export function TrackCreditsCard({ track, onShowAll }: Props) {
  const artists = track.artists?.length
    ? track.artists.map((a) => a.artist)
    : [track.artist];

  const unique = artists.filter(
    (a, i, arr) => arr.findIndex((x) => x.slug === a.slug) === i
  );

  return (
    <section className={styles.card}>
      <div className={styles.cardHead}>
        <h3 className={styles.cardTitle}>Сведения</h3>
        {onShowAll && (
          <button type="button" className={styles.cardLink} onClick={onShowAll}>
            Показать все
          </button>
        )}
      </div>
      {unique.map((artist) => (
        <div key={artist.slug} className={styles.creditRow}>
          <div className={styles.creditMeta}>
            <Link href={`/artists/${artist.slug}`} className={styles.creditName}>
              {artist.name}
            </Link>
            <p className={styles.creditRole}>Основной исполнитель</p>
          </div>
          <ArtistFollowPill slug={artist.slug} />
        </div>
      ))}
      {track.album && (
        <div className={styles.creditRow}>
          <div className={styles.creditMeta}>
            <span className={styles.creditName}>{track.album}</span>
            <p className={styles.creditRole}>Альбом</p>
          </div>
        </div>
      )}
    </section>
  );
}
