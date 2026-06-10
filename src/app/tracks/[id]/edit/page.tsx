"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, getApiBase, getToken, mediaUrl } from "@/lib/api";
import { ArtistNameInput } from "@/components/ArtistNameInput/ArtistNameInput";
import type { Track } from "@/lib/types";
import { trackArtistNames } from "@/lib/track";
import page from "@/styles/page.module.scss";
import { FormPageSkeleton } from "@/components/Skeleton";
import auth from "@/components/LoginScreen/LoginScreen.module.scss";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "#282828",
  borderRadius: 500,
  color: "#fff",
  marginBottom: 12,
};

type TrackDetail = Track & { uploadedBy?: { id: string } };

export default function EditTrackPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [track, setTrack] = useState<TrackDetail | null>(null);
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [album, setAlbum] = useState("");
  const [albumArtist, setAlbumArtist] = useState("");
  const [year, setYear] = useState("");
  const [genre, setGenre] = useState("");
  const [trackNumber, setTrackNumber] = useState("");
  const [description, setDescription] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [singleReleaseId, setSingleReleaseId] = useState<string | null>(null);
  const [singleQuery, setSingleQuery] = useState("");
  const [singleOptions, setSingleOptions] = useState<Array<{ id: string; title: string; slug: string; year?: number | null }>>([]);

  useEffect(() => {
    if (!id) return;
    api<TrackDetail>(`/api/tracks/${id}`, { auth: false })
      .then((t) => {
        setTrack(t);
        setTitle(t.title);
        setArtistName(trackArtistNames(t));
        setAlbum(t.album ?? "");
        setAlbumArtist(t.albumArtist ?? "");
        setYear(t.year ? String(t.year) : "");
        setGenre(t.genre ?? "");
        setTrackNumber(t.trackNumber ? String(t.trackNumber) : "");
        setDescription(t.description ?? "");
        setCoverPreview(t.coverUrl ? mediaUrl(t.coverUrl) : null);
        setSingleReleaseId(t.singleReleaseId ?? null);
        setSingleQuery(t.singleRelease?.title ?? "");
      })
      .catch((e) => setErr(e.message));
  }, [id]);

  useEffect(() => {
    if (!singleQuery.trim()) {
      setSingleOptions([]);
      return;
    }
    const q = singleQuery.trim();
    const timer = setTimeout(() => {
      api<Array<{ id: string; title: string; slug: string; year?: number | null }>>(
        `/api/releases/search?q=${encodeURIComponent(q)}&type=SINGLE&limit=10`,
        { auth: false }
      )
        .then(setSingleOptions)
        .catch(() => setSingleOptions([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [singleQuery]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setErr("");
    setStatus("");
    try {
      await api(`/api/tracks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: title.trim(),
          artistName: artistName.trim(),
          album: album.trim() || null,
          albumArtist: albumArtist.trim() || null,
          year: year.trim() ? Number(year) : null,
          genre: genre.trim() || null,
          trackNumber: trackNumber.trim() ? Number(trackNumber) : null,
          description: description.trim() || null,
          singleReleaseId: singleReleaseId || null,
        }),
      });
      setStatus("Сохранено");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!id || !track) return;
    if (!window.confirm(`Удалить «${track.title}»? (${trackArtistNames(track)})`)) return;
    setDeleting(true);
    setErr("");
    try {
      await api(`/api/tracks/${id}`, { method: "DELETE" });
      router.push("/");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Не удалось удалить");
      setDeleting(false);
    }
  }

  async function onCoverChange(f: File | null) {
    if (!f || !id) return;
    const token = getToken();
    if (!token) return;
    setErr("");
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch(`${getApiBase()}/api/tracks/${id}/cover`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr((data as { error?: string }).error ?? "Не удалось загрузить обложку");
      return;
    }
    if (data.coverUrl) {
      setCoverPreview(mediaUrl(data.coverUrl));
      setStatus("Обложка обновлена");
    }
  }

  if (err && !track) return <div className={page.error}>{err}</div>;
  if (!track) return <FormPageSkeleton />;

  return (
    <div className={page.view}>
      <div className={page.hero}>
        <h1 className={page.heroTitle}>Редактировать трек</h1>
        <p className={page.heroSub}>{track.fileName ?? track.title}</p>
      </div>

      <form onSubmit={save} className={auth.card} style={{ maxWidth: 640, margin: "0 auto 32px", alignItems: "stretch" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
          {coverPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPreview} alt="" style={{ width: 120, height: 120, borderRadius: 8, objectFit: "cover" }} />
          ) : (
            <div style={{ width: 120, height: 120, borderRadius: 8, background: "#282828" }} />
          )}
          <div>
            <label style={{ fontSize: 13, color: "#96FF55", cursor: "pointer", fontWeight: 600 }}>
              Сменить обложку
              <input type="file" accept="image/*" hidden onChange={(e) => void onCoverChange(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        </div>

        <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#a0a0a0", fontWeight: 700 }}>Артисты</label>
        <ArtistNameInput value={artistName} onChange={setArtistName} placeholder="Имена через запятую" />

        <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#a0a0a0", fontWeight: 700 }}>Название</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />

        <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#a0a0a0", fontWeight: 700 }}>Альбом</label>
        <input value={album} onChange={(e) => setAlbum(e.target.value)} style={inputStyle} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#a0a0a0", fontWeight: 700 }}>Год</label>
            <input value={year} onChange={(e) => setYear(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#a0a0a0", fontWeight: 700 }}>№ трека</label>
            <input value={trackNumber} onChange={(e) => setTrackNumber(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
          </div>
        </div>
        <div style={{ height: 12 }} />

        <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#a0a0a0", fontWeight: 700 }}>Жанр</label>
        <input value={genre} onChange={(e) => setGenre(e.target.value)} style={inputStyle} />

        <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#a0a0a0", fontWeight: 700 }}>Album artist</label>
        <input value={albumArtist} onChange={(e) => setAlbumArtist(e.target.value)} style={inputStyle} />

        <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#a0a0a0", fontWeight: 700 }}>Сингл-релиз</label>
        <input
          value={singleQuery}
          onChange={(e) => {
            setSingleQuery(e.target.value);
            setSingleReleaseId(null);
          }}
          placeholder="Поиск сингла…"
          style={inputStyle}
          list="single-release-options"
        />
        <datalist id="single-release-options">
          {singleOptions.map((r) => (
            <option key={r.id} value={r.title} />
          ))}
        </datalist>
        {singleOptions.length > 0 && !singleReleaseId && (
          <div style={{ marginBottom: 12 }}>
            {singleOptions.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setSingleReleaseId(r.id);
                  setSingleQuery(r.title);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  marginBottom: 4,
                  background: "#282828",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 13,
                }}
              >
                {r.title}{r.year ? ` (${r.year})` : ""}
              </button>
            ))}
          </div>
        )}
        {singleReleaseId && (
          <div style={{ marginBottom: 12, fontSize: 13, color: "#96FF55" }}>
            Выбран сингл ·{" "}
            <button
              type="button"
              onClick={() => {
                setSingleReleaseId(null);
                setSingleQuery("");
              }}
              style={{ color: "#f15e6c", background: "none", fontWeight: 600 }}
            >
              сбросить
            </button>
          </div>
        )}

        <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#a0a0a0", fontWeight: 700 }}>Описание</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, borderRadius: 12, resize: "vertical" }} />

        {err && <p className={auth.error}>{err}</p>}
        {status && <p className={auth.subtitle} style={{ color: "#96FF55" }}>{status}</p>}

        <button type="submit" className={auth.loginBtn} disabled={saving || deleting}>
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
        <Link href="/" className={auth.cancelBtn}>Назад</Link>

        <button
          type="button"
          onClick={() => void remove()}
          disabled={saving || deleting}
          style={{
            marginTop: 24,
            padding: "12px 24px",
            borderRadius: 500,
            fontWeight: 600,
            fontSize: 14,
            color: "#f15e6c",
            background: "rgba(241, 94, 108, 0.12)",
            width: "100%",
          }}
        >
          {deleting ? "Удаление…" : "Удалить трек"}
        </button>
      </form>
    </div>
  );
}
