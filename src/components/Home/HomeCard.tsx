"use client";

import Link from "next/link";
import { mediaUrl } from "@/lib/api";
import type { HomeCard as HomeCardType } from "@/lib/home";
import { ArtistAvatar } from "@/components/ArtistAvatar/ArtistAvatar";
import { PlayIcon, PauseIcon } from "@/components/icons";
import { usePlayer } from "@/context/PlayerContext";
import { useIdsPlayback } from "@/hooks/useCollectionPlayback";
import { MixCover } from "./MixCover";
import { RadioCover } from "./RadioCover";
import s from "./home.module.scss";

type Props = {
  card: HomeCardType;
  onPlay?: (card: HomeCardType) => void;
};

export function HomeCard({ card, onPlay }: Props) {
  const { togglePlay } = usePlayer();
  const isCircle = card.shape === "circle";
  const playOnCard = Boolean(
    card.trackIds?.length && onPlay && card.kind !== "mix" && card.kind !== "radio"
  );
  const showPlayBtn = Boolean(card.trackIds?.length && onPlay);
  const { isActive, showPause } = useIdsPlayback(showPlayBtn ? card.trackIds : undefined);

  function handlePlay(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    if (!onPlay) return;
    if (isActive) togglePlay();
    else onPlay(card);
  }

  const cover = (
    <div className={`${s.coverWrap} ${isCircle ? s.coverWrapCircle : ""}`}>
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
      {showPlayBtn && (
        <span
          className={s.playOverlay}
          role={playOnCard ? undefined : "button"}
          aria-label={showPause ? `Пауза ${card.title}` : `Играть ${card.title}`}
          onClick={playOnCard ? undefined : handlePlay}
        >
          {showPause ? <PauseIcon size={18} tone="dark" /> : <PlayIcon size={18} tone="dark" />}
        </span>
      )}
    </div>
  );

  const meta = (
    <div>
      <div className={s.cardTitle}>{card.title}</div>
      <div className={s.cardSub}>{card.subtitle}</div>
    </div>
  );

  const cardClass = `${s.card} ${isCircle ? s.cardCircle : ""} ${isActive ? s.cardActive : ""}`;

  if (playOnCard) {
    return (
      <button type="button" className={cardClass} onClick={() => handlePlay()}>
        {cover}
        {meta}
      </button>
    );
  }

  return (
    <Link href={card.href} className={cardClass}>
      {cover}
      {meta}
    </Link>
  );
}
