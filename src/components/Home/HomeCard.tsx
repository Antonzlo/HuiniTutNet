"use client";

import Link from "next/link";
import { mediaUrl } from "@/lib/api";
import type { HomeCard as HomeCardType } from "@/lib/home";
import overlay from "@/components/ShelfPlayOverlay/ShelfPlayOverlay.module.scss";
import { ShelfPlayOverlay } from "@/components/ShelfPlayOverlay/ShelfPlayOverlay";
import { ArtistAvatar } from "@/components/ArtistAvatar/ArtistAvatar";
import { usePlayer } from "@/context/PlayerContext";
import { MixCover } from "./MixCover";
import { RadioCover } from "./RadioCover";
import s from "./home.module.scss";

type Props = {
  card: HomeCardType;
  onPlay?: (card: HomeCardType) => void;
};

function canPlayCard(card: HomeCardType, onPlay?: (card: HomeCardType) => void) {
  if (!onPlay) return false;
  if (card.trackIds?.length) return true;
  return card.kind === "artist" || card.kind === "mix" || card.kind === "radio";
}

export function HomeCard({ card, onPlay }: Props) {
  const { queueContextId } = usePlayer();
  const isCircle = card.shape === "circle";
  const canPlay = canPlayCard(card, onPlay);
  const isActive = canPlay && queueContextId === card.id;

  const cover = (
    <div
      className={`${s.coverWrap} ${overlay.coverWrap} ${isCircle ? `${s.coverWrapCircle} ${overlay.coverWrapRound}` : ""}`}
    >
      {(card.kind === "mix" || card.kind === "radio") && card.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl(card.imageUrl)} alt="" className={s.coverImg} />
      ) : card.kind === "mix" && card.cover?.type === "mix" ? (
        <MixCover cover={card.cover} />
      ) : card.kind === "radio" && card.cover?.type === "radio" ? (
        <RadioCover cover={card.cover} />
      ) : card.kind === "playlist" && card.id.includes("favorites") ? (
        <div className={`${s.coverFallback} ${s.quickThumbLiked}`}>♥</div>
      ) : isCircle ? (
        <ArtistAvatar
          name={card.title}
          imageUrl={card.imageUrl}
          className={s.coverImg}
          imgClassName={s.coverImg}
        />
      ) : card.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl(card.imageUrl)} alt="" className={s.coverImg} />
      ) : (
        <div className={s.coverFallback}>{card.title[0]?.toUpperCase() ?? "?"}</div>
      )}
      {canPlay && (
        <ShelfPlayOverlay
          trackIds={card.trackIds}
          onPlay={() => onPlay?.(card)}
          contextId={card.id}
          round={isCircle}
          forceVisible={isActive}
          aria-label={`Играть ${card.title}`}
        />
      )}
    </div>
  );

  const meta = (
    <div>
      <div className={s.cardTitle}>{card.title}</div>
      <div className={s.cardSub}>{card.subtitle}</div>
    </div>
  );

  return (
    <Link
      href={card.href}
      className={`${s.card} ${overlay.shelfCard} ${isCircle ? s.cardCircle : ""} ${isActive ? s.cardActive : ""}`}
    >
      {cover}
      {meta}
    </Link>
  );
}
