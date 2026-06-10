"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, mediaUrl } from "@/lib/api";
import type { MixPageData } from "@/lib/home";
import { fmtTotalDuration, totalDurationSec } from "@/lib/track";
import { HiuniTrackList } from "@/components/TrackList/HiuniTrackList";
import { RadioCover } from "@/components/Home/RadioCover";
import { PlaylistSaveButton } from "@/components/Home/PlaylistSaveButton";
import { PlayCollectionButton } from "@/components/PlayCollectionButton";
import { CollectionPageSkeleton } from "@/components/Skeleton";
import s from "../../mix/[id]/mix.module.scss";

export default function RadioPage() {
  const params = useParams<{ slug: string }>();
  const [data, setData] = useState<MixPageData | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<MixPageData>(`/api/radio/${params.slug}`)
      .then(setData)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) return <CollectionPageSkeleton variant="square" />;
  if (err || !data) return <p className={s.error}>{err || "Не найдено"}</p>;

  const tracks = data.tracks;
  const totalSec = totalDurationSec(tracks);

  return (
    <div className={s.page}>
      <div className={s.hero}>
        <div className={s.cover}>
          {data.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(data.coverImageUrl)} alt="" className={s.coverImg} />
          ) : (
            data.cover.type === "radio" && <RadioCover cover={data.cover} />
          )}
        </div>
        <div className={s.meta}>
          <span className={s.badge}>Радио</span>
          <h1 className={s.title}>{data.title}</h1>
          <p className={s.sub}>{data.subtitle}</p>
          <p className={s.stats}>
            {tracks.length} треков
            {totalSec > 0 && ` · ${fmtTotalDuration(totalSec)}`}
          </p>
        </div>
      </div>
      <div className={s.toolbar}>
        <PlayCollectionButton
          tracks={tracks}
          contextId={`radio:${params.slug}`}
          className={s.playBtn}
          iconTone="dark"
        />
        <PlaylistSaveButton
          kind="radio"
          itemKey={data.id}
          title={data.title}
          subtitle="Радио"
          coverUrl={data.coverImageUrl}
          className={s.saveBtn}
          activeClassName={s.saveBtnActive}
        />
      </div>
      <HiuniTrackList tracks={tracks} variant="playlist" playContextId={`radio:${params.slug}`} />
    </div>
  );
}
