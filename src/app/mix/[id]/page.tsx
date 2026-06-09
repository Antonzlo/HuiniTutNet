"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, mediaUrl } from "@/lib/api";
import type { MixPageData } from "@/lib/home";
import { fmtTotalDuration, totalDurationSec } from "@/lib/track";
import { HiuniTrackList } from "@/components/TrackList/HiuniTrackList";
import { MixCover } from "@/components/Home/MixCover";
import { RadioCover } from "@/components/Home/RadioCover";
import { PlaylistSaveButton } from "@/components/Home/PlaylistSaveButton";
import { PlayCollectionButton } from "@/components/PlayCollectionButton";
import s from "./mix.module.scss";

export default function MixPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<MixPageData | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const mixId = decodeURIComponent(params.id);

  useEffect(() => {
    api<MixPageData>(`/api/mix/${encodeURIComponent(mixId)}`)
      .then(setData)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [mixId]);

  if (loading) return <p className={s.empty}>Загрузка…</p>;
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
          ) : data.cover.type === "mix" ? (
            <MixCover cover={data.cover} />
          ) : (
            <RadioCover cover={data.cover} />
          )}
        </div>
        <div className={s.meta}>
          <span className={s.badge}>Подборка</span>
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
          contextId={`mix:${mixId}`}
          className={s.playBtn}
          iconTone="dark"
        />
        <PlaylistSaveButton
          kind="mix"
          itemKey={data.id}
          title={data.title}
          subtitle={data.subtitle}
          coverUrl={data.coverImageUrl}
          className={s.saveBtn}
          activeClassName={s.saveBtnActive}
        />
      </div>
      <HiuniTrackList tracks={tracks} variant="playlist" playContextId={`mix:${mixId}`} />
    </div>
  );
}
