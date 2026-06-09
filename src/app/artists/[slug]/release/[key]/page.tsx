"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, mediaUrl } from "@/lib/api";
import type { Artist, Track } from "@/lib/types";
import { fmtCount, fmtTotalDurationDetailed, totalDurationSec } from "@/lib/track";
import { findRelease, groupReleases, releaseUrl } from "@/lib/release";
import { useCoverGradient } from "@/hooks/useCoverGradient";
import { HiuniTrackList } from "@/components/TrackList/HiuniTrackList";
import { ArtistAvatar } from "@/components/ArtistAvatar/ArtistAvatar";
import { PlayIcon, PauseIcon, ShuffleIcon, HeartIcon } from "@/components/icons";
import { useCollectionPlayback } from "@/hooks/useCollectionPlayback";
import { usePlayer } from "@/context/PlayerContext";
import { useSavedReleases } from "@/context/SavedReleasesContext";
import s from "./release.module.scss";

type ArtistDetail = Artist & { tracks: Track[] };

function shuffleTracks(list: Track[]): Track[] {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

export default function ReleasePage() {
  const { slug, key } = useParams<{ slug: string; key: string }>();
  const { isSaved, toggle: toggleSaved } = useSavedReleases();
  const { playTrack } = usePlayer();
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!slug) return;
    api<ArtistDetail>(`/api/artists/${slug}`, { auth: false })
      .then(setArtist)
      .catch((e) => setErr(e.message));
  }, [slug]);

  const releases = useMemo(() => (artist ? groupReleases(artist.tracks) : []), [artist]);

  const release = useMemo(() => {
    if (!key) return null;
    return findRelease(releases, key) ?? null;
  }, [releases, key]);

  const tracks = useMemo(() => {
    if (!release || !artist) return [];
    return release.tracks
      .slice()
      .sort((a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0))
      .map((t) => ({
        ...t,
        artist: t.artist?.id ? t.artist : { name: artist.name, slug: slug! },
      }));
  }, [release, artist, slug]);

  const otherReleases = useMemo(() => {
    if (!release) return [];
    return releases.filter((r) => r.key !== release.key).slice(0, 6);
  }, [releases, release]);

  const [playBump, setPlayBump] = useState<Record<string, number>>({});

  useEffect(() => {
    const onCounted = (e: Event) => {
      const id = (e as CustomEvent<{ trackId: string }>).detail?.trackId;
      if (!id) return;
      setPlayBump((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    };
    window.addEventListener("hiuni:play-counted", onCounted);
    return () => window.removeEventListener("hiuni:play-counted", onCounted);
  }, []);

  const totalPlays = useMemo(
    () =>
      tracks.reduce((sum, t) => sum + (t.playCount ?? 0) + (playBump[t.id] ?? 0), 0),
    [tracks, playBump]
  );

  const coverSrc = release?.coverUrl ? mediaUrl(release.coverUrl) : null;
  const { heroStyle } = useCoverGradient(coverSrc);
  const totalSec = totalDurationSec(tracks);
  const releaseKey = decodeURIComponent(key ?? "");
  const playContextId = slug ? `release:${slug}:${releaseKey}` : null;
  const { showPause, playCollection } = useCollectionPlayback(tracks, playContextId);
  const saved = slug ? isSaved(slug, releaseKey) : false;

  if (err) return <div className={s.error}>{err}</div>;
  if (!artist) return <div className={s.loading}>Загрузка…</div>;
  if (!release) return <div className={s.error}>Релиз не найден</div>;

  const typeLabel = release.isSingle ? "Сингл" : "Альбом";
  const trackWord =
    tracks.length === 1 ? "трек" : tracks.length < 5 ? "трека" : "треков";

  function playAll() {
    playCollection(tracks, 0);
  }

  function playShuffled() {
    const shuffled = shuffleTracks(tracks);
    if (!shuffled[0]) return;
    playTrack(shuffled[0], { queue: shuffled, contextId: playContextId });
  }

  return (
    <div className={s.page}>
      <div className={s.hero} style={heroStyle}>
        {coverSrc && (
          <div
            className={s.heroBg}
            style={{ backgroundImage: `url(${coverSrc})` }}
            aria-hidden
          />
        )}
        <div className={s.heroInner}>
          <div className={s.cover}>
            {release.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(release.coverUrl)} alt="" className={s.coverImg} />
            )}
          </div>
          <div className={s.meta}>
            <span className={s.badge}>{typeLabel}</span>
            <h1 className={s.title}>{release.title}</h1>
            <div className={s.artistRow}>
              <Link href={`/artists/${slug}`} className={s.artistChip}>
                <ArtistAvatar
                  name={artist.name}
                  avatarUrl={artist.avatarUrl}
                  imageUrl={artist.imageUrl}
                  className={s.artistAvatar}
                  imgClassName={s.artistAvatarImg}
                />
                <span>{artist.name}</span>
              </Link>
            </div>
            <div className={s.stats}>
              {release.year ? `${release.year} · ` : ""}
              {tracks.length} {trackWord}
              {totalSec > 0 && `, ${fmtTotalDurationDetailed(totalSec)}`}
              {totalPlays > 0 && ` · ${fmtCount(totalPlays)} прослушиваний`}
            </div>
          </div>
        </div>
      </div>

      <div className={s.toolbar}>
        <button
          type="button"
          className={s.playBtn}
          onClick={playAll}
          disabled={tracks.length === 0}
          aria-label="Играть"
        >
          {showPause ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
        </button>
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
          onClick={() => slug && void toggleSaved(slug, releaseKey)}
          aria-label={saved ? "Убрать из медиатеки" : "Сохранить в медиатеку"}
          aria-pressed={saved}
        >
          <HeartIcon filled={saved} size={22} />
        </button>
      </div>

      <div className={s.list}>
        <HiuniTrackList
          tracks={tracks}
          variant="artist"
          hideArtist
          playContextId={playContextId ?? undefined}
          emptyMessage="Нет треков"
        />
      </div>

      <footer className={s.footer}>
        <p className={s.copyright}>
          © {release.year ?? new Date().getFullYear()} {artist.name}
        </p>
        {release.year && (
          <p className={s.releaseDate}>
            Дата релиза: {release.year} г.
            {tracks[0]?.createdAt &&
              ` · загружен ${new Date(tracks[0].createdAt).toLocaleDateString("ru-RU")}`}
          </p>
        )}
      </footer>

      {otherReleases.length > 0 && (
        <section className={s.more}>
          <h2 className={s.moreTitle}>{artist.name}: другие релизы</h2>
          <div className={s.moreGrid}>
            {otherReleases.map((r) => (
              <Link key={r.key} href={releaseUrl(slug!, r)} className={s.moreCard}>
                <div className={s.moreCover}>
                  {r.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(r.coverUrl)} alt="" className={s.moreImg} />
                  ) : null}
                </div>
                <div className={s.moreName}>{r.title}</div>
                <div className={s.moreMeta}>
                  {r.year ? `${r.year} · ` : ""}
                  {r.isSingle ? "Сингл" : "Альбом"}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
