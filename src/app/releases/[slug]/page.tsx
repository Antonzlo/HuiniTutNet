"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, formatApiError, mediaUrl } from "@/lib/api";
import { fetchCached, getCached } from "@/lib/queryCache";
import type { DbRelease } from "@/lib/release";
import { fmtTotalDurationDetailed, totalDurationSec } from "@/lib/track";
import { decodeSlugParam, formatQuality, releaseApiPath, releaseShelfCover } from "@/lib/release";
import { useCoverGradient } from "@/hooks/useCoverGradient";
import { HiuniTrackList } from "@/components/TrackList/HiuniTrackList";
import { ReleaseArtistList } from "@/components/ReleaseArtistList/ReleaseArtistList";
import { PlayCollectionButton } from "@/components/PlayCollectionButton";
import { ShuffleIcon, HeartIcon } from "@/components/icons";
import { useSavedReleases } from "@/context/SavedReleasesContext";
import { usePlayer } from "@/context/PlayerContext";
import { CollectionPageSkeleton } from "@/components/Skeleton";
import s from "../../artists/[slug]/release/[key]/release.module.scss";

function shuffleTracks<T>(list: T[]): T[] {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

export default function CanonicalReleasePage() {
  const { slug } = useParams<{ slug: string }>();
  const { playTrack } = usePlayer();
  const { isSavedBySlug, toggleBySlug } = useSavedReleases();
  const [release, setRelease] = useState<DbRelease | null>(null);
  const [err, setErr] = useState("");

  const slugKey = slug ? decodeSlugParam(slug) : "";

  useLayoutEffect(() => {
    if (!slugKey) return;
    const cached = getCached<DbRelease>(`release:${slugKey}`, 30 * 60_000);
    if (cached) setRelease(cached);
  }, [slugKey]);

  useEffect(() => {
    if (!slugKey) return;
    setErr("");

    fetchCached(
      `release:${slugKey}`,
      30 * 60_000,
      () => api<DbRelease>(releaseApiPath(slugKey), { auth: false }),
      { revalidate: Boolean(getCached(`release:${slugKey}`, 30 * 60_000)) }
    )
      .then(setRelease)
      .catch((e) => {
        if (!getCached(`release:${slugKey}`, 30 * 60_000)) {
          setErr(formatApiError(e, "Не удалось загрузить релиз"));
        }
      });
  }, [slugKey]);

  const tracks = useMemo(() => release?.tracks ?? [], [release]);
  const coverPath = useMemo(() => {
    if (!release) return null;
    if (release.coverUrl) return release.coverUrl;
    return releaseShelfCover({
      key: release.slug,
      title: release.title,
      year: release.year,
      tracks,
      isSingle: release.type === "SINGLE",
      type: release.type,
    });
  }, [release, tracks]);
  const coverSrc = coverPath ? mediaUrl(coverPath, { w: 512 }) : null;
  const { heroStyle } = useCoverGradient(coverSrc);
  const totalSec = totalDurationSec(tracks);
  const saved = slug ? isSavedBySlug(slug) : false;
  const playContextId = release ? `release:${release.slug}` : null;

  if (err) return <div className={s.error}>{err}</div>;
  if (!release) return <CollectionPageSkeleton variant="square" />;

  const trackWord =
    tracks.length === 1 ? "трек" : tracks.length < 5 ? "трека" : "треков";
  const formats = [...new Set(tracks.map((t) => formatQuality(t)))];

  function playShuffled() {
    const q = shuffleTracks(tracks);
    if (q[0]) playTrack(q[0], { queue: q, contextId: playContextId });
  }

  return (
    <div className={s.page}>
      <div className={s.hero} style={heroStyle}>
        {coverSrc && (
          <div className={s.heroBg} style={{ backgroundImage: `url(${coverSrc})` }} aria-hidden />
        )}
        <div className={s.heroInner}>
          <div className={s.cover}>
            {coverSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverSrc} alt="" className={s.coverImg} />
            )}
          </div>
          <div className={s.meta}>
            <span className={s.badge}>{release.typeLabel}</span>
            <h1 className={s.title}>{release.title}</h1>
            <ReleaseArtistList
              artists={release.artists ?? []}
              albumArtist={release.albumArtist}
            />
            <div className={s.stats}>
              {release.year && <span>{release.year}</span>}
              <span>
                {tracks.length} {trackWord}
                {totalSec > 0 && `, ${fmtTotalDurationDetailed(totalSec)}`}
              </span>
              {formats.length > 0 && (
                <span className={s.formatBadges}>
                  {formats.map((f) => (
                    <span key={f} className={s.formatBadge}>
                      {f}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={s.toolbar}>
        <PlayCollectionButton tracks={tracks} contextId={playContextId} className={s.playBtn} />
        <button
          type="button"
          className={s.iconBtn}
          onClick={playShuffled}
          disabled={tracks.length < 2}
          aria-label="Случайный порядок"
        >
          <ShuffleIcon tone="primary" size={22} />
        </button>
        <button
          type="button"
          className={`${s.saveBtn} ${saved ? s.saveBtnActive : ""}`}
          onClick={() => slug && void toggleBySlug(slug)}
          aria-label={saved ? "Убрать из медиатеки" : "Сохранить в медиатеку"}
          aria-pressed={saved}
        >
          <HeartIcon filled={saved} size={22} />
        </button>
        <Link href={`/releases/${slug}/edit`} className={s.editLink}>
          Редактировать релиз
        </Link>
      </div>

      <div className={s.list}>
        <HiuniTrackList
          tracks={tracks}
          variant="artist"
          hideArtist={release.type !== "COMPILATION"}
          playContextId={playContextId ?? undefined}
          contextReleaseSlug={release.slug}
          showSingleLinks
          emptyMessage="Нет треков"
        />
      </div>
    </div>
  );
}
