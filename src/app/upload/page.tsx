"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, getApiBase, getToken } from "@/lib/api";
import { inspectAudio } from "@/lib/inspect-audio";
import { SpectrogramViewer } from "@/components/SpectrogramViewer/SpectrogramViewer";
import type { DbRelease } from "@/lib/release";
import { canonicalReleaseUrl, releaseTypeLabel } from "@/lib/release";
import { ArtistNameInput } from "@/components/ArtistNameInput/ArtistNameInput";
import type { InspectedAudio, ReleaseType } from "@/lib/types";
import { runPool } from "@/lib/async-pool";
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
  const ss = Math.floor(sec % 60);
  return `${m}:${ss.toString().padStart(2, "0")}`;
}

function fmtBitrate(bps?: number) {
  if (!bps) return undefined;
  return `${Math.round(bps / 1000)} kbps`;
}

function fmtFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function fmtAudioInfo(item: QueueItem) {
  if (!item.inspect) return "";
  const parts = [];
  if (item.inspect.bitrate) parts.push(fmtBitrate(item.inspect.bitrate));
  if (item.inspect.bitsPerSample) parts.push(`${item.inspect.bitsPerSample}bit`);
  if (item.inspect.sampleRate) parts.push(`${item.inspect.sampleRate / 1000}kHz`);
  parts.push(fmtFileSize(item.inspect.fileSize));
  return parts.join(" · ");
}

function buildEdit(inspect: InspectedAudio, audio: File): QueueEdit {
  const stem = audio.name.replace(/\.[^.]+$/, "");
  const artists =
    inspect.suggestedArtists?.join(", ") ||
    inspect.suggestedArtist ||
    inspect.artist ||
    "";
  return {
    title: inspect.title ?? inspect.suggestedTitle ?? stem,
    artistName: artists,
    album: inspect.album ?? "",
    albumArtist: inspect.albumArtist ?? "",
    year: inspect.year ? String(inspect.year) : "",
    genre: inspect.genre ?? "",
    trackNumber: inspect.trackNumber ? String(inspect.trackNumber) : "",
    description: "",
  };
}

const RELEASE_TYPES: ReleaseType[] = ["SINGLE", "EP", "ALBUM", "COMPILATION"];

type BatchPublish = {
  releaseType: ReleaseType;
  releaseTitle: string;
  year: string;
  albumArtist: string;
};

function guessBatchPublish(items: QueueItem[]): BatchPublish {
  const ready = items.filter((q) => q.status === "ready");
  const albums = [...new Set(ready.map((q) => q.edit.album.trim()).filter(Boolean))];
  const years = [...new Set(ready.map((q) => q.edit.year.trim()).filter(Boolean))];
  const albumArtists = [...new Set(ready.map((q) => q.edit.albumArtist.trim()).filter(Boolean))];
  const count = ready.length;
  let releaseType: ReleaseType = "ALBUM";
  if (count === 1) releaseType = "SINGLE";
  else if (count <= 6) releaseType = "EP";

  const releaseTitle =
    albums.length === 1
      ? albums[0]!
      : count === 1
        ? ready[0]!.edit.title.trim()
        : "";

  return {
    releaseType,
    releaseTitle,
    year: years.length === 1 ? years[0]! : "",
    albumArtist: albumArtists.length === 1 ? albumArtists[0]! : "",
  };
}

function statusBadge(item: QueueItem) {
  switch (item.status) {
    case "inspecting":
      return <span className={`${s.badge} ${s.badgeBusy}`}>читаем…</span>;
    case "uploading":
      return <span className={`${s.badge} ${s.badgeBusy}`}>загрузка…</span>;
    case "done":
      return <span className={`${s.badge} ${s.badgeDone}`}>✓</span>;
    case "error":
      return <span className={`${s.badge} ${s.badgeError}`}>ошибка</span>;
    case "ready":
      return (
        <span className={`${s.badge} ${s.badgeReady}`}>
          {item.expanded ? "свернуть" : "редактировать"}
        </span>
      );
    default:
      return <span className={`${s.badge} ${s.badgeBusy}`}>ожидание</span>;
  }
}

export default function UploadPage() {
  const searchParams = useSearchParams();
  const releaseId = searchParams.get("releaseId")?.trim() ?? "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const [targetRelease, setTargetRelease] = useState<DbRelease | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [err, setErr] = useState("");
  const [summary, setSummary] = useState("");
  const [spectrogramFile, setSpectrogramFile] = useState<File | null>(null);
  const [publish, setPublish] = useState<BatchPublish>({
    releaseType: "ALBUM",
    releaseTitle: "",
    year: "",
    albumArtist: "",
  });

  useEffect(() => {
    if (!releaseId) {
      setTargetRelease(null);
      return;
    }
    api<DbRelease>(`/api/releases/${releaseId}`, { auth: false })
      .then((r) => {
        setTargetRelease(r);
        setPublish({
          releaseType: r.type,
          releaseTitle: r.title,
          year: r.year ? String(r.year) : "",
          albumArtist: r.albumArtist ?? "",
        });
      })
      .catch(() => setErr("Не удалось загрузить релиз"));
  }, [releaseId]);

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
    patchItem(item.id, { status: "inspecting" });
    try {
      const inspect = await inspectAudio(item.audio);
      const edit = buildEdit(inspect, item.audio);
      if (targetRelease) {
        edit.album = targetRelease.title;
        edit.albumArtist = targetRelease.albumArtist ?? edit.albumArtist;
        if (targetRelease.year) edit.year = String(targetRelease.year);
      }
      patchItem(item.id, { status: "ready", inspect, edit, error: undefined });
      return inspect;
    } catch {
      patchItem(item.id, { status: "error", error: "Не удалось прочитать метаданные" });
      return null;
    }
  }

  async function processFiles(fileList: File[]) {
    if (!fileList.length) return;
    setErr("");
    if (queue.every((q) => q.status === "done")) setSummary("");

    const { audio, lrc } = splitUploadFiles(fileList);
    if (audio.length === 0) {
      setErr("Добавь хотя бы один аудиофайл");
      return;
    }

    const paired = pairLrcWithAudio(audio, lrc);
    const base = Date.now();
    const items: QueueItem[] = audio.map((a, i) => ({
      id: `${base}-${i}`,
      audio: a,
      lrc: paired.get(a) ?? null,
      inspect: null,
      edit: emptyEdit(),
      expanded: false,
      status: "pending" as const,
    }));

    setQueue((prev) => [...prev.filter((q) => q.status !== "done"), ...items]);
    setBusy(true);
    await runPool(items, 4, async (item) => {
      await inspectOne(item);
    });
    setBusy(false);
  }

  function onDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragDepth.current += 1;
    setDragOver(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragOver(false);
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    void processFiles([...e.dataTransfer.files]);
  }

  useEffect(() => {
    if (targetRelease) return;
    const ready = queue.filter((q) => q.status === "ready");
    if (ready.length === 0) return;
    setPublish((prev) => (prev.releaseTitle ? prev : guessBatchPublish(queue)));
  }, [queue, targetRelease]);

  useEffect(() => {
    if (!targetRelease) return;
    setQueue((prev) =>
      prev.map((q) =>
        q.status === "ready"
          ? {
              ...q,
              edit: {
                ...q.edit,
                album: targetRelease.title,
                albumArtist: targetRelease.albumArtist ?? q.edit.albumArtist,
                year: targetRelease.year ? String(targetRelease.year) : q.edit.year,
              },
            }
          : q
      )
    );
  }, [targetRelease]);

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
    fd.append("releaseType", publish.releaseType);
    const releaseTitle =
      publish.releaseTitle.trim() ||
      edit.album.trim() ||
      (publish.releaseType === "SINGLE" ? edit.title.trim() : "");
    if (releaseTitle) fd.append("releaseTitle", releaseTitle);
    const batchYear = publish.year.trim() || edit.year.trim();
    if (batchYear) fd.append("year", batchYear);
    const batchAlbumArtist = publish.albumArtist.trim() || edit.albumArtist.trim();
    if (batchAlbumArtist) fd.append("albumArtist", batchAlbumArtist);
    if (targetRelease) fd.append("releaseId", targetRelease.id);

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 600_000);

    try {
      const res = await fetch(`${getApiBase()}/api/tracks/upload`, {
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
  const activeQueue = queue.filter((q) => q.status !== "done");

  return (
    <>
    <div className={page.view}>
      <div className={page.hero}>
        <h1 className={page.heroTitle}>
          {targetRelease ? "Добавить трек в релиз" : "Загрузить"}
        </h1>
        <p className={`${page.heroSub} ${s.heroSub}`}>
          {targetRelease ? (
            <>
              Релиз: <strong>{targetRelease.title}</strong> ({releaseTypeLabel(targetRelease.type)})
              {" · "}
              <Link href={`/releases/${targetRelease.slug}/edit`} className={s.link}>
                вернуться к редактированию
              </Link>
            </>
          ) : (
            "Перетащи аудио и .lrc сюда или выбери файлы — метаданные можно поправить перед публикацией."
          )}
        </p>
      </div>

      <div className={s.layout}>
        <aside className={s.card}>
          <h2 className={s.sectionTitle}>Файлы</h2>

          <div
            className={`${s.dropzone} ${dragOver ? s.dropzoneActive : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
          >
            <span className={s.dropzoneIcon}>↑</span>
            <span className={s.dropzoneTitle}>
              {dragOver ? "Отпусти файлы" : "Перетащи сюда"}
            </span>
            <span className={s.dropzoneSub}>
              FLAC, MP3, WAV, OGG, AAC, M4A и .lrc
              <br />
              или нажми, чтобы выбрать
            </span>
          </div>

          <input
            ref={fileInputRef}
            className={s.hiddenInput}
            type="file"
            multiple
            accept=".flac,.mp3,.wav,.ogg,.aac,.m4a,.lrc,audio/*,text/plain"
            onChange={(e) => {
              void processFiles(e.target.files ? [...e.target.files] : []);
              e.target.value = "";
            }}
          />

          <p className={s.dropzoneHint}>
            ID3-теги важнее имени файла. Имя используется только если в тегах нет артиста или названия.
          </p>

          {readyCount > 0 && !targetRelease && (
            <div className={s.publish}>
              <h2 className={s.sectionTitle}>Публикация</h2>
              <div className={s.publishGrid}>
                <div className={s.field}>
                  <span className={s.fieldLabel}>Тип релиза</span>
                  <select
                    className={s.select}
                    value={publish.releaseType}
                    onChange={(e) =>
                      setPublish((p) => ({ ...p, releaseType: e.target.value as ReleaseType }))
                    }
                  >
                    {RELEASE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {releaseTypeLabel(t)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={s.field}>
                  <span className={s.fieldLabel}>Год релиза</span>
                  <input
                    className={s.input}
                    value={publish.year}
                    onChange={(e) => setPublish((p) => ({ ...p, year: e.target.value }))}
                  />
                </div>
              </div>
              <div className={s.field}>
                <span className={s.fieldLabel}>Название релиза</span>
                <input
                  className={s.input}
                  value={publish.releaseTitle}
                  onChange={(e) => setPublish((p) => ({ ...p, releaseTitle: e.target.value }))}
                  placeholder={
                    publish.releaseType === "SINGLE" ? "Название сингла" : "Название альбома / сборника"
                  }
                />
              </div>
              {(publish.releaseType === "COMPILATION" || publish.albumArtist) && (
                <div className={s.field}>
                  <span className={s.fieldLabel}>Album artist (VA)</span>
                  <input
                    className={s.input}
                    value={publish.albumArtist}
                    onChange={(e) => setPublish((p) => ({ ...p, albumArtist: e.target.value }))}
                    placeholder="Various Artists"
                  />
                </div>
              )}
            </div>
          )}

          {readyCount > 0 && targetRelease && (
            <div className={s.targetBanner}>
              Треки будут добавлены в «{targetRelease.title}». Настройки релиза — на странице{" "}
              <Link href={`/releases/${targetRelease.slug}/edit`} className={s.link}>
                редактирования
              </Link>
              .
            </div>
          )}

          {activeQueue.length > 0 && (
            <div className={s.actions}>
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
          )}
        </aside>

        <div className={s.main}>
          {activeQueue.length === 0 ? (
            <div className={s.mainEmpty}>
              {busy
                ? "Читаем метаданные…"
                : "Очередь пуста — перетащи файлы в зону слева или выбери их на диске."}
            </div>
          ) : (
            <>
              <div className={s.queueHeader}>
                <span className={s.queueCount}>Очередь ({activeQueue.length})</span>
              </div>
              <div className={s.queue}>
                {activeQueue.map((item) => (
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
                        {item.inspect && (
                          <div className={s.sub}>
                            {fmtAudioInfo(item)}
                          </div>
                        )}
                        {item.error && <div className={s.error}>{item.error}</div>}
                      </div>
                      <div className={s.side}>
                        {item.lrc ? (
                          <span className={`${s.badge} ${s.badgeLrc}`}>LRC</span>
                        ) : null}
                        {item.status === "ready" && (
                          <button
                            type="button"
                            className={s.spectroBtn}
                            onClick={(e) => { e.stopPropagation(); setSpectrogramFile(item.audio); }}
                            title="Открыть спектрограмму"
                          >
                            спектр
                          </button>
                        )}
                        <div style={{ marginTop: 4 }}>{statusBadge(item)}</div>
                      </div>
                    </div>

                    {item.expanded && item.status === "ready" && (
                      <div className={s.body} onClick={(e) => e.stopPropagation()}>
                        <div className={s.bodyField}>
                          <span className={s.fieldLabel}>Артисты</span>
                          <ArtistNameInput
                            value={item.edit.artistName}
                            onChange={(v) => patchEdit(item.id, { artistName: v })}
                            placeholder="5opka, илюха реп"
                            inputClassName={s.bodyArtistInput}
                          />
                        </div>
                        <div className={s.bodyField}>
                          <span className={s.fieldLabel}>Название</span>
                          <input
                            className={s.input}
                            value={item.edit.title}
                            onChange={(e) => patchEdit(item.id, { title: e.target.value })}
                          />
                        </div>
                        <div className={s.bodyField}>
                          <span className={s.fieldLabel}>Альбом</span>
                          <input
                            className={s.input}
                            value={item.edit.album}
                            onChange={(e) => patchEdit(item.id, { album: e.target.value })}
                          />
                        </div>
                        <div className={s.grid2}>
                          <div className={s.bodyField}>
                            <span className={s.fieldLabel}>Год</span>
                            <input
                              className={s.input}
                              value={item.edit.year}
                              onChange={(e) => patchEdit(item.id, { year: e.target.value })}
                            />
                          </div>
                          <div className={s.bodyField}>
                            <span className={s.fieldLabel}>№ трека</span>
                            <input
                              className={s.input}
                              value={item.edit.trackNumber}
                              onChange={(e) => patchEdit(item.id, { trackNumber: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className={s.bodyField}>
                          <span className={s.fieldLabel}>Жанр</span>
                          <input
                            className={s.input}
                            value={item.edit.genre}
                            onChange={(e) => patchEdit(item.id, { genre: e.target.value })}
                          />
                        </div>
                        <div className={s.bodyField}>
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
            </>
          )}
        </div>

        <div className={s.footer}>
          {err && <p className={s.statusErr}>{err}</p>}
          {summary && (
            <p className={s.statusOk}>
              {summary}
              {targetRelease && summary.startsWith("Загружено") && (
                <>
                  {" "}
                  <Link href={canonicalReleaseUrl(targetRelease.slug)} className={s.link}>
                    Открыть релиз
                  </Link>
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </div>

    {spectrogramFile && (
      <SpectrogramViewer
        file={spectrogramFile}
        onClose={() => setSpectrogramFile(null)}
      />
    )}
    </>
  );
}
