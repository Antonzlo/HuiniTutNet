"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, formatApiError, getApiBase, getToken, mediaUrl } from "@/lib/api";
import type { DbRelease, ReleaseType } from "@/lib/release";
import { decodeSlugParam, releaseApiPath, releaseTypeLabel } from "@/lib/release";
import { trackArtistNames } from "@/lib/track";
import type { Track } from "@/lib/types";
import { ArtistNameInput } from "@/components/ArtistNameInput/ArtistNameInput";
import page from "@/styles/page.module.scss";
import auth from "@/components/LoginScreen/LoginScreen.module.scss";
import { FormPageSkeleton } from "@/components/Skeleton";
import s from "./edit.module.scss";
import u from "@/app/upload/upload.module.scss";

const TYPES: ReleaseType[] = ["SINGLE", "EP", "ALBUM", "COMPILATION"];

type SearchHit = {
  id: string;
  title: string;
  album?: string | null;
  coverUrl?: string | null;
  artist: { name: string; slug: string };
  release?: { id: string; title: string; slug: string; type: string } | null;
};

type TrackDraft = {
  title: string;
  artistName: string;
  year: string;
  genre: string;
  trackNumber: string;
  useAlbumCover: boolean;
};

function draftFromTrack(t: Track): TrackDraft {
  return {
    title: t.title,
    artistName: trackArtistNames(t),
    year: t.year ? String(t.year) : "",
    genre: t.genre ?? "",
    trackNumber: t.trackNumber ? String(t.trackNumber) : "",
    useAlbumCover: Boolean(t.useAlbumCover),
  };
}

function trackThumbSrc(t: Track, albumCover: string | null) {
  if (t.useAlbumCover && albumCover) return albumCover;
  if (t.coverUrl) return mediaUrl(t.coverUrl, { original: true });
  return null;
}

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, TrackDraft>>({});
  const [savingTrackId, setSavingTrackId] = useState<string | null>(null);

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
        setCoverPreview(r.coverUrl ? mediaUrl(r.coverUrl, { original: true }) : null);
        const sorted = [...(r.tracks ?? [])].sort(
          (a, b) => (a.trackNumber ?? 999) - (b.trackNumber ?? 999)
        );
        setTrackIds(sorted.map((t) => t.id));
        const nextDrafts: Record<string, TrackDraft> = {};
        for (const t of sorted) nextDrafts[t.id] = draftFromTrack(t);
        setDrafts(nextDrafts);
      })
      .catch((e) => setErr(formatApiError(e, "Не удалось загрузить релиз")));
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

  function patchDraft(id: string, patch: Partial<TrackDraft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id]!, ...patch } }));
  }

  function toggleExpand(trackId: string) {
    const t = tracks.find((x) => x.id === trackId);
    if (!t) return;
    if (expandedId === trackId) {
      setExpandedId(null);
      return;
    }
    setDrafts((prev) => ({ ...prev, [trackId]: draftFromTrack(t) }));
    setExpandedId(trackId);
  }

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

  async function saveTrackDraft(trackId: string) {
    if (!release) return;
    const draft = drafts[trackId];
    if (!draft) return;
    setSavingTrackId(trackId);
    setErr("");
    try {
      await api(`/api/releases/${release.id}/tracks/meta`, {
        method: "PATCH",
        body: JSON.stringify({
          tracks: [
            {
              id: trackId,
              title: draft.title.trim(),
              artistName: draft.artistName.trim(),
              year: draft.year.trim() ? Number(draft.year) : null,
              genre: draft.genre.trim() || null,
              trackNumber: draft.trackNumber.trim() ? Number(draft.trackNumber) : null,
              useAlbumCover: draft.useAlbumCover,
            },
          ],
        }),
      });
      setStatus("Трек сохранён");
      setExpandedId(null);
      loadRelease();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Ошибка");
    } finally {
      setSavingTrackId(null);
    }
  }

  async function addTrack(trackId: string) {
    if (!release || trackIds.includes(trackId)) return;
    await saveTracks([...trackIds, trackId]);
    setSearchQ("");
    setSearchHits([]);
  }

  async function removeTrack(trackId: string) {
    if (expandedId === trackId) setExpandedId(null);
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

  async function onCoverChange(f: File | null, mode: "album" | "all") {
    if (!f || !release) return;
    if (
      mode === "all" &&
      !window.confirm("Загрузить обложку и включить «как у альбома» у всех треков релиза?")
    ) {
      return;
    }
    const token = getToken();
    if (!token) return;
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch(
      `${getApiBase()}/api/releases/${release.id}/cover?mode=${mode}`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr((data as { error?: string }).error ?? "Не удалось загрузить обложку");
      return;
    }
    if (data.coverUrl) setCoverPreview(mediaUrl(data.coverUrl, { original: true }));
    setStatus(mode === "all" ? "Обложка альбома + все треки" : "Обложка альбома обновлена");
    loadRelease();
  }

  async function onTrackCoverChange(trackId: string, f: File | null) {
    if (!f) return;
    const token = getToken();
    if (!token) return;
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch(`${getApiBase()}/api/tracks/${trackId}/cover`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr((data as { error?: string }).error ?? "Не удалось загрузить обложку трека");
      return;
    }
    patchDraft(trackId, { useAlbumCover: false });
    setStatus("Обложка трека обновлена");
    loadRelease();
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
            <div className={s.coverActions}>
              <label className={s.coverBtn}>
                Сменить обложку альбома
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => void onCoverChange(e.target.files?.[0] ?? null, "album")}
                />
              </label>
              <label className={s.coverBtnSecondary}>
                Сменить обложку для всех
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => void onCoverChange(e.target.files?.[0] ?? null, "all")}
                />
              </label>
            </div>
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
            <div className={u.queue}>
              {tracks.map((t, i) => {
                const draft = drafts[t.id] ?? draftFromTrack(t);
                const expanded = expandedId === t.id;
                const thumb = trackThumbSrc(
                  { ...t, useAlbumCover: draft.useAlbumCover },
                  coverPreview
                );
                return (
                  <div key={t.id} className={u.row}>
                    <div
                      className={`${s.trackHead} ${expanded ? s.trackHeadExpanded : ""}`}
                      onClick={() => toggleExpand(t.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleExpand(t.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-expanded={expanded}
                    >
                      <div className={s.trackLead}>
                        <span className={s.trackNum}>{i + 1}</span>
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className={s.trackThumb} />
                        ) : (
                          <div className={s.trackThumb} />
                        )}
                      </div>
                      <div className={s.trackMeta}>
                        <div className={s.trackTitle}>{draft.title || t.title}</div>
                        <div className={s.trackSub}>{draft.artistName || trackArtistNames(t)}</div>
                      </div>
                      <div className={s.trackActions} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={s.iconBtn}
                          disabled={tracksBusy || i === 0}
                          onClick={() => moveTrack(t.id, -1)}
                          aria-label="Выше"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className={s.iconBtn}
                          disabled={tracksBusy || i === tracks.length - 1}
                          onClick={() => moveTrack(t.id, 1)}
                          aria-label="Ниже"
                        >
                          ↓
                        </button>
                        <span className={s.expandHint} aria-hidden>
                          {expanded ? "▲" : "▼"}
                        </span>
                        <button
                          type="button"
                          className={s.iconBtn}
                          disabled={tracksBusy}
                          onClick={() => void removeTrack(t.id)}
                          aria-label="Убрать с релиза"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className={u.body} onClick={(e) => e.stopPropagation()}>
                        <div className={u.bodyField}>
                          <span className={u.fieldLabel}>Артисты</span>
                          <ArtistNameInput
                            value={draft.artistName}
                            onChange={(v) => patchDraft(t.id, { artistName: v })}
                            inputClassName={u.bodyArtistInput}
                          />
                        </div>
                        <div className={u.bodyField}>
                          <span className={u.fieldLabel}>Название</span>
                          <input
                            className={u.input}
                            value={draft.title}
                            onChange={(e) => patchDraft(t.id, { title: e.target.value })}
                          />
                        </div>
                        <div className={u.grid2}>
                          <div className={u.bodyField}>
                            <span className={u.fieldLabel}>Год</span>
                            <input
                              className={u.input}
                              value={draft.year}
                              onChange={(e) => patchDraft(t.id, { year: e.target.value })}
                            />
                          </div>
                          <div className={u.bodyField}>
                            <span className={u.fieldLabel}>№ трека</span>
                            <input
                              className={u.input}
                              value={draft.trackNumber}
                              onChange={(e) => patchDraft(t.id, { trackNumber: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className={u.bodyField}>
                          <span className={u.fieldLabel}>Жанр</span>
                          <input
                            className={u.input}
                            value={draft.genre}
                            onChange={(e) => patchDraft(t.id, { genre: e.target.value })}
                          />
                        </div>

                        <label className={s.checkRow}>
                          <input
                            type="checkbox"
                            checked={draft.useAlbumCover}
                            onChange={(e) => patchDraft(t.id, { useAlbumCover: e.target.checked })}
                          />
                          Обложка как у альбома
                        </label>

                        <div className={s.trackCoverRow}>
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumb} alt="" className={u.thumb} />
                          ) : (
                            <div className={u.thumb} />
                          )}
                          <label className={s.coverBtn}>
                            Своя обложка
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={(e) => void onTrackCoverChange(t.id, e.target.files?.[0] ?? null)}
                            />
                          </label>
                        </div>

                        <button
                          type="button"
                          className={auth.loginBtn}
                          disabled={savingTrackId === t.id}
                          onClick={() => void saveTrackDraft(t.id)}
                        >
                          {savingTrackId === t.id ? "Сохранение…" : "Сохранить трек"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
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
