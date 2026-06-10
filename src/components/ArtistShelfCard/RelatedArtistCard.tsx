"use client";

import Link from "next/link";
import overlay from "@/components/ShelfPlayOverlay/ShelfPlayOverlay.module.scss";
import { ShelfPlayOverlay } from "@/components/ShelfPlayOverlay/ShelfPlayOverlay";
import { ArtistAvatar } from "@/components/ArtistAvatar/ArtistAvatar";
import { useArtistPlay } from "@/hooks/useArtistPlay";
import type { Artist } from "@/lib/types";
import s from "./ArtistShelfCard.module.scss";

type Props = {
  artist: Artist;
};

export function RelatedArtistCard({ artist }: Props) {
  const { play, contextId } = useArtistPlay(artist.slug);

  return (
    <Link href={`/artists/${artist.slug}`} className={`${s.card} ${overlay.shelfCard}`}>
      <div className={`${s.avatarWrap} ${overlay.coverWrap} ${overlay.coverWrapRound}`}>
        <ArtistAvatar
          name={artist.name}
          avatarUrl={artist.avatarUrl}
          imageUrl={artist.imageUrl}
          className={s.avatar}
          imgClassName={s.avatarImg}
        />
        <ShelfPlayOverlay
          onPlay={play}
          contextId={contextId}
          round
          aria-label={`Играть ${artist.name}`}
        />
      </div>
      <div className={s.name}>{artist.name}</div>
      <div className={s.type}>Исполнитель</div>
    </Link>
  );
}
