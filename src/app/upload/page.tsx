"use client";

import { useState } from "react";
import { getToken } from "@/lib/api";
import { ArtistNameInput } from "@/components/ArtistNameInput/ArtistNameInput";
import type { InspectedAudio } from "@/lib/types";
import { pairLrcWithAudio, splitUploadFiles } from "@/lib/upload-files";
import page from "@/styles/page.module.scss";
import auth from "@/components/LoginScreen/LoginScreen.module.scss";
import s from "./upload.module.scss";

type QueueEdit = {
  title: string;
  artistName: string;
  album: string;
  albumArtist: string;
  year: string;
  genre: string;
  trackNumber: string;
  description: string;
};

type QueueItem = {
  id: string;
  audio: File;
  lrc: File | null;
  inspect: InspectedAudio | null;
  edit: QueueEdit;
  expanded: boolean;
  status: "pending" | "inspecting" | "ready" | "uploading" | "done" | "error";
  error?: string;
};

const emptyEdit = (): QueueEdit => ({
  title: "",
  artistName: "",
  album: "",
  albumArtist: "",
  year: "",
  genre: "",
  trackNumber: "",
  description: "",
});

function formatApiError(data: unknown): string {
  if (!data || typeof data !== "object") return "Ошибка загрузки";
  const d = data as { error?: unknown };
  if (typeof d.error === "string") return d.error;
  if (d.error && typeof d.error === "object") return "Проверь поля формы";
  return "Ошибка загрузки";
}

function fmtDuration(sec?: number) {
  if (!sec || !Number.isFinite(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function buildEdit(inspect: InspectedAudio, audio: File): QueueEdit {
  const artists =
    inspect.suggestedArtists?.join(", ") ||
    inspect.suggestedArtist ||
    inspect.artist ||
    "";
  return {
    title: inspect.suggestedTitle || inspect.title || audio.name.replace(/\.[^.]+$/, ""),
    artistName: artists,
    album: inspect.album ?? "",
    albumArtist: inspect.albumArtist ?? "",
    year: inspect.year ? String(inspect.year) : "",
    genre: inspect.genre ?? "",
    trackNumber: inspect.trackNumber ? String(inspect.trackNumber) : "",
    description: "",
  };
}

export default function UploadPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [summary, setSummary] = useState("");

  function patchItem(id: string, patch: Partial<QueueItem>) {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function patchEdit(id: string, patch: Partial<QueueEdit>) {
    setQueue((prev) =>
      prev.map((q) => (q.id === id ? { ...q, edit: { ...q.edit, ...patch } } : q))
    );
  }

  function toggleExpanded(id: string) {
    setQueue((prev) =>
      prev.map((q) => (q.id === id ? { ...q, expanded: !q.expanded } : q))
    );
  }

  async function inspectOne(item: QueueItem): Promise<InspectedAudio | null> {
    const token = getToken();
    if (!token) return null;

    patchItem(item.id, { status: "inspecting" });
    const fd = new FormData();
    fd.append("file", item.audio);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/inspect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        patchItem(item.id, { status: "error", error: formatApiError(data) });
        return null;
      }
      const inspect = data as InspectedAudio;
      patchItem(item.id, {
        status: "ready",
        inspect,
        edit: buildEdit(inspect, item.audio),
        error: undefined,
      });
      return inspect;
    } catch {
      patchItem(item.id, { status: "error", error: "Не удалось прочитать метаданные" });
      return null;
    }
  }

  async function onFilesChange(fileList: FileList | null) {
    if (!fileList?.length) return;
    setErr("");
    setSummary("");

    const files = [...fileList];
    const { audio, lrc } = splitUploadFiles(files);
    if (audio.length === 0) {
      setErr("Выбери хотя бы один аудиофайл");
      return;
    }

    const paired = pairLrcWithAudio(audio, lrc);
    const items: QueueItem[] = audio.map((a, i) => ({
      id: `${Date.now()}-${i}`,
      audio: a,
      lrc: paired.get(a) ?? null,
      inspect: null,
      edit: emptyEdit(),
      expanded: false,
      status: "pending" as const,
    }));

    setQueue(items);
    setBusy(true);
    for (const item of items) {
      await inspectOne(item);
    }
    setBusy(false);
  }

  async function uploadOne(item: QueueItem): Promise<boolean> {
    const token = getToken();
    if (!token) {
      patchItem(item.id, { status: "error", error: "Войди в аккаунт" });
      return false;
    }

    patchItem(item.id, { status: "uploading" });
    const { edit } = item;
    const fd = new FormData();
    fd.append("file", item.audio);
    if (item.lrc) fd.append("lrc", item.lrc);
    if (edit.title.trim()) fd.append("title", edit.title.trim());
    if (edit.artistName.trim()) fd.append("artistName", edit.artistName.trim());
    if (edit.album.trim()) fd.append("album", edit.album.trim());
    if (edit.albumArtist.trim()) fd.append("albumArtist", edit.albumArtist.trim());
    if (edit.year.trim()) fd.append("year", edit.year.trim());
    if (edit.genre.trim()) fd.append("genre", edit.genre.trim());
    if (edit.trackNumber.trim()) fd.append("trackNumber", edit.trackNumber.trim());
    if (edit.description.trim()) fd.append("description", edit.description.trim());

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 600_000);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        patchItem(item.id, { status: "error", error: formatApiError(data) });
        return false;
      }
      patchItem(item.id, { status: "done", expanded: false });
      return true;
    } catch (e) {
      clearTimeout(timer);
      const msg =
        e instanceof Error && e.name === "AbortError"
          ? "Таймаут загрузки"
          : "Сервер недоступен";
      patchItem(item.id, { status: "error", error: msg });
      return false;
    }
  }

  async function uploadAll() {
    setErr("");
    setSummary("");
    const token = getToken();
    if (!token) {
      setErr("Войди в аккаунт");
      return;
    }

    const ready = queue.filter((q) => q.status === "ready");
    if (ready.length === 0) {
      setErr("Нет готовых файлов для загрузки");
      return;
    }

    setBusy(true);
    let ok = 0;
    for (const item of ready) {
      if (await uploadOne(item)) ok++;
    }
    setBusy(false);
    setSummary(`Загружено ${ok} из ${ready.length}`);
  }

  function clearDone() {
    setQueue((prev) => prev.filter((q) => q.status !== "done"));
    setSummary("");
  }

  const readyCount = queue.filter((q) => q.status === "ready").length;
  const doneCount = queue.filter((q) => q.status === "done").length;

  return (
    <div className={page.view}>
      <div className={page.hero}>
        <h1 className={page.heroTitle}>Загрузить</h1>
        <p className={page.heroSub}>
          Выбери треки и .lrc — нажми на строку, чтобы отредактировать метаданные перед загрузкой.
        </p>
      </div>

      <div className={auth.card} style={{ maxWidth: 720, margin: "0 auto 32px", alignItems: "stretch" }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#a0a0a0", fontWeight: 700 }}>
          Файлы *
        </label>
        <input
          id="track-files"
          type="file"
          multiple
          accept=".flac,.mp3,.wav,.ogg,.aac,.m4a,.lrc,audio/*,text/plain"
          onChange={(e) => void onFilesChange(e.target.files)}
          style={{ marginBottom: 16, color: "#ccc", width: "100%" }}
        />

        {queue.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                className={auth.loginBtn}
                disabled={busy || readyCount === 0}
                onClick={() => void uploadAll()}
              >
                Загрузить все ({readyCount})
              </button>
              {doneCount > 0 && (
                <button type="button" className={page.btnGhost} onClick={clearDone}>
                  Убрать загруженные
                </button>
              )}
            </div>

            <div className={s.queue}>
              {queue.map((item) => (
                <div key={item.id} className={s.row}>
                  <div
                    className={`${s.head} ${item.expanded ? s.headExpanded : ""}`}
                    onClick={() => item.status === "ready" && toggleExpanded(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (item.status === "ready") toggleExpanded(item.id);
                      }
                    }}
                    role="button"
                    tabIndex={item.status === "ready" ? 0 : -1}
                  >
                    {item.inspect?.coverPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.inspect.coverPreview} alt="" className={s.thumb} />
                    ) : (
                      <div className={s.thumb} />
                    )}
                    <div className={s.meta}>
                      <div className={s.title}>{item.edit.title || item.audio.name}</div>
                      <div className={s.sub}>
                        {item.edit.artistName || "—"} · {item.audio.name}
                        {item.inspect && ` · ${fmtDuration(item.inspect.durationSec)}`}
                      </div>
                      {item.error && <div className={s.error}>{item.error}</div>}
                    </div>
                    <div className={s.side}>
                      {item.lrc ? <span className={s.lrc}>LRC</span> : <span>—</span>}
                      <div className={s.status}>
                        {item.status === "inspecting" && "читаем…"}
                        {item.status === "uploading" && "загрузка…"}
                        {item.status === "done" && "✓"}
                        {item.status === "ready" && (item.expanded ? "свернуть" : "редактировать")}
                        {item.status === "error" && "ошибка"}
                        {item.status === "pending" && "ожидание"}
                      </div>
                    </div>
                  </div>

                  {item.expanded && item.status === "ready" && (
                    <div className={s.body} onClick={(e) => e.stopPropagation()}>
                      <div>
                        <span className={s.fieldLabel}>Артисты</span>
                        <ArtistNameInput
                          value={item.edit.artistName}
                          onChange={(v) => patchEdit(item.id, { artistName: v })}
                          placeholder="5opka, илюха реп"
                        />
                      </div>
                      <div>
                        <span className={s.fieldLabel}>Название</span>
                        <input
                          className={s.input}
                          value={item.edit.title}
                          onChange={(e) => patchEdit(item.id, { title: e.target.value })}
                        />
                      </div>
                      <div>
                        <span className={s.fieldLabel}>Альбом</span>
                        <input
                          className={s.input}
                          value={item.edit.album}
                          onChange={(e) => patchEdit(item.id, { album: e.target.value })}
                        />
                      </div>
                      <div className={s.grid2}>
                        <div>
                          <span className={s.fieldLabel}>Год</span>
                          <input
                            className={s.input}
                            value={item.edit.year}
                            onChange={(e) => patchEdit(item.id, { year: e.target.value })}
                          />
                        </div>
                        <div>
                          <span className={s.fieldLabel}>№ трека</span>
                          <input
                            className={s.input}
                            value={item.edit.trackNumber}
                            onChange={(e) => patchEdit(item.id, { trackNumber: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <span className={s.fieldLabel}>Жанр</span>
                        <input
                          className={s.input}
                          value={item.edit.genre}
                          onChange={(e) => patchEdit(item.id, { genre: e.target.value })}
                        />
                      </div>
                      <div>
                        <span className={s.fieldLabel}>Описание</span>
                        <textarea
                          className={s.textarea}
                          value={item.edit.description}
                          onChange={(e) => patchEdit(item.id, { description: e.target.value })}
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontSize: 12, color: "#6a6a6a", marginBottom: 12 }}>
          В имени файла «Артист1 & Артист2 — Трек» оба артиста подставятся автоматически.
        </p>

        {err && <p className={auth.error}>{err}</p>}
        {summary && (
          <p className={auth.subtitle} style={{ color: summary.startsWith("Загружено") ? "#96FF55" : undefined }}>
            {summary}
          </p>
        )}
      </div>
    </div>
  );
}
