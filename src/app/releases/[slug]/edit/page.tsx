"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, getApiBase, getToken, mediaUrl } from "@/lib/api";
import type { DbRelease, ReleaseType } from "@/lib/release";
import { decodeSlugParam, releaseApiPath, releaseTypeLabel } from "@/lib/release";
import { trackArtistNames } from "@/lib/track";
import type { Track } from "@/lib/types";
import page from "@/styles/page.module.scss";
import auth from "@/components/LoginScreen/LoginScreen.module.scss";
import { FormPageSkeleton } from "@/components/Skeleton";
import s from "./edit.module.scss";

const TYPES: ReleaseType[] = ["SINGLE", "EP", "ALBUM", "COMPILATION"];

type SearchHit = {
  id: string;
  title: string;
  album?: string | null;
  coverUrl?: string | null;
  artist: { name: string; slug: string };
  release?: { id: string; title: string; slug: string; type: string } | null;
};

export default function EditReleasePage() {
  const { slug } = useParams<{ slug: string }>();
  const [release, setRelease] = useState<DbRelease | null>(null);
  const [trackIds, setTrackIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ReleaseType>("ALBUM");
  const [year, setYear] = useState("");
  const [albumArtist, setAlbumArtist] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [err, setErr] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [tracksBusy, setTracksBusy] = useState(false);

  const slugKey = slug ? decodeSlugParam(slug) : "";

  const loadRelease = useCallback(() => {
    if (!slugKey) return;
    api<DbRelease>(releaseApiPath(slugKey), { auth: false })
      .then((r) => {
        setRelease(r);
        setTitle(r.title);
        setType(r.type);
        setYear(r.year ? String(r.year) : "");
        setAlbumArtist(r.albumArtist ?? "");
        setCoverPreview(r.coverUrl ? mediaUrl(r.coverUrl) : null);
        const sorted = [...(r.tracks ?? [])].sort(
          (a, b) => (a.trackNumber ?? 999) - (b.trackNumber ?? 999)
        );
        setTrackIds(sorted.map((t) => t.id));
      })
      .catch((e) => setErr(e.message));
  }, [slugKey]);

  useEffect(() => {
    loadRelease();
  }, [loadRelease]);

  useEffect(() => {
    if (!searchQ.trim() || !release) {
      setSearchHits([]);
      return;
    }
    const q = searchQ.trim();
    const timer = setTimeout(() => {
      api<SearchHit[]>(
        `/api/tracks/search?q=${encodeURIComponent(q)}&excludeReleaseId=${release.id}&limit=12`
      )
        .then((rows) => setSearchHits(rows.filter((t) => !trackIds.includes(t.id))))
        .catch(() => setSearchHits([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQ, release, trackIds]);

  const tracks = release?.tracks
    ? trackIds
        .map((id) => release.tracks!.find((t) => t.id === id))
        .filter((t): t is Track => Boolean(t))
    : [];

  async function saveMeta(e: React.FormEvent) {
    e.preventDefault();
    if (!release) return;
    setSaving(true);
    setErr("");
    try {
      await api(`/api/releases/${release.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: title.trim(),
          type,
          year: year.trim() ? Number(year) : null,
          albumArtist: albumArtist.trim() || null,
        }),
      });
      setStatus("Сохранено");
      loadRelease();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  async function saveTracks(ids: string[]) {
    if (!release) return;
    setTracksBusy(true);
    setErr("");
    try {
      await api(`/api/releases/${release.id}/tracks`, {
        method: "PUT",
        body: JSON.stringify({ trackIds: ids }),
      });
      setTrackIds(ids);
      setStatus("Треки обновлены");
      loadRelease();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Ошибка");
    } finally {
      setTracksBusy(false);
    }
  }

  async function addTrack(trackId: string) {
    if (!release || trackIds.includes(trackId)) return;
    await saveTracks([...trackIds, trackId]);
    setSearchQ("");
    setSearchHits([]);
  }

  async function removeTrack(trackId: string) {
    await saveTracks(trackIds.filter((id) => id !== trackId));
  }

  function moveTrack(trackId: string, dir: -1 | 1) {
    const idx = trackIds.indexOf(trackId);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= trackIds.length) return;
    const ids = [...trackIds];
    [ids[idx], ids[next]] = [ids[next]!, ids[idx]!];
    void saveTracks(ids);
  }

  async function onCoverChange(f: File | null) {
    if (!f || !release) return;
    const token = getToken();
    if (!token) return;
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch(
      `${getApiBase()}/api/releases/${release.id}/cover`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr((data as { error?: string }).error ?? "Не удалось загрузить обложку");
      return;
    }
    if (data.coverUrl) setCoverPreview(mediaUrl(data.coverUrl));
    setStatus("Обложка обновлена");
  }

  if (err && !release) return <div className={page.error}>{err}</div>;
  if (!release) return <FormPageSkeleton />;

  return (
    <div className={page.view}>
      <div className={page.hero}>
        <h1 className={page.heroTitle}>Редактировать релиз</h1>
        <p className={`${page.heroSub} ${s.heroSub}`}>{release.title}</p>
      </div>

      <div className={s.layout}>
        <form onSubmit={saveMeta} className={s.card}>
          <h2 className={s.sectionTitle}>Релиз</h2>
          <div className={s.coverRow}>
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverPreview} alt="" className={s.coverImg} />
            ) : (
              <div className={s.coverPlaceholder} />
            )}
            <label className={s.coverBtn}>
              Сменить обложку
              <input type="file" accept="image/*" hidden onChange={(e) => void onCoverChange(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <div className={s.field}>
            <label className={s.label}>Тип</label>
            <select className={s.select} value={type} onChange={(e) => setType(e.target.value as ReleaseType)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{releaseTypeLabel(t)}</option>
              ))}
            </select>
          </div>

          <div className={s.field}>
            <label className={s.label}>Название</label>
            <input className={s.input} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className={s.field}>
            <label className={s.label}>Год</label>
            <input className={s.input} value={year} onChange={(e) => setYear(e.target.value)} />
          </div>

          <div className={s.field}>
            <label className={s.label}>Album artist</label>
            <input className={s.input} value={albumArtist} onChange={(e) => setAlbumArtist(e.target.value)} />
          </div>

          <button type="submit" className={auth.loginBtn} disabled={saving}>
            {saving ? "Сохранение…" : "Сохранить релиз"}
          </button>
        </form>

        <section className={s.card}>
          <h2 className={s.sectionTitle}>Треки ({tracks.length})</h2>

          {tracks.length === 0 ? (
            <p className={s.empty}>Пока нет треков в этом релизе.</p>
          ) : (
            <div className={s.trackList}>
              {tracks.map((t, i) => (
                <div key={t.id} className={s.trackRow}>
                  <span className={s.trackNum}>{i + 1}</span>
                  {t.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(t.coverUrl)} alt="" className={s.trackThumb} />
                  ) : (
                    <div className={s.trackThumb} />
                  )}
                  <div className={s.trackMeta}>
                    <div className={s.trackTitle}>{t.title}</div>
                    <div className={s.trackSub}>{trackArtistNames(t)}</div>
                  </div>
                  <div className={s.trackActions}>
                    <button type="button" className={s.iconBtn} disabled={tracksBusy || i === 0} onClick={() => moveTrack(t.id, -1)} aria-label="Выше">↑</button>
                    <button type="button" className={s.iconBtn} disabled={tracksBusy || i === tracks.length - 1} onClick={() => moveTrack(t.id, 1)} aria-label="Ниже">↓</button>
                    <Link href={`/tracks/${t.id}/edit`} className={s.linkBtn}>Изменить</Link>
                    <button type="button" className={s.iconBtn} disabled={tracksBusy} onClick={() => void removeTrack(t.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={s.toolbar}>
            <Link href={`/upload?releaseId=${release.id}`} className={s.linkBtn}>
              + Загрузить новый трек
            </Link>
          </div>

          <div className={s.searchBox}>
            <label className={s.label}>Добавить ссылкой из других релизов</label>
            <input
              className={s.searchInput}
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Название трека, артист или альбом…"
            />
            {searchHits.length > 0 && (
              <div className={s.searchResults}>
                {searchHits.map((t) => (
                  <div key={t.id} className={s.searchItem}>
                    <div className={s.searchItemMeta}>
                      <div className={s.trackTitle}>{t.title}</div>
                      <div className={s.trackSub}>
                        {t.artist.name}
                        {t.release?.title ? ` · ${t.release.title}` : t.album ? ` · ${t.album}` : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={s.addBtn}
                      disabled={tracksBusy}
                      onClick={() => void addTrack(t.id)}
                    >
                      Добавить
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className={s.footer}>
          {err && <p className={s.statusErr}>{err}</p>}
          {status && <p className={s.statusOk}>{status}</p>}
          <Link href={`/releases/${slug}`} className={auth.cancelBtn}>Назад к релизу</Link>
        </div>
      </div>
    </div>
  );
}
