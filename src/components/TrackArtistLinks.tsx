import Link from "next/link";
import type { Track } from "@/lib/types";
import { trackArtistList } from "@/lib/track";
import styles from "./TrackArtistLinks.module.scss";

type Props = {
  track: Track;
  onNavigate?: () => void;
  className?: string;
};

export function TrackArtistLinks({ track, onNavigate, className }: Props) {
  const artists = trackArtistList(track);

  return (
    <span className={`${styles.wrap} ${className ?? ""}`}>
      {artists.map((a, i) => (
        <span key={a.slug} className={styles.item}>
          {i > 0 && <span className={styles.sep}>, </span>}
          <Link href={`/artists/${a.slug}`} className={styles.link} onClick={onNavigate}>
            {a.name}
          </Link>
        </span>
      ))}
    </span>
  );
}
