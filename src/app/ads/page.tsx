"use client";

import { useEffect, useState } from "react";
import { api, getToken, mediaUrl } from "@/lib/api";
import page from "@/styles/page.module.scss";
import { FormPageSkeleton } from "@/components/Skeleton";
import auth from "@/components/LoginScreen/LoginScreen.module.scss";

const MAX_MB = 100;

type MyAd = {
  id: string;
  title: string;
  filePath: string;
  mimeType: string;
  weekStart: string;
};

function fmtSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export default function AdsPage() {
  const [mine, setMine] = useState<MyAd | null | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");

  function loadMine() {
    api<MyAd | null>("/api/ads/me")
      .then(setMine)
      .catch(() => setMine(null));
  }

  useEffect(() => {
    loadMine();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setOk("");
    setProgress("");

    if (!title.trim()) {
      setErr("Укажи заголовок");
      return;
    }
    if (!file) {
      setErr("Выбери файл");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setErr(`Файл ${fmtSize(file.size)} — максимум ${MAX_MB} МБ`);
      return;
    }

    const token = getToken();
    if (!token) {
      setErr("Войди в аккаунт");
      return;
    }

    setLoading(true);
    setProgress(`Отправка ${fmtSize(file.size)}…`);

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("file", file);

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 600_000);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ads/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : res.status === 409
              ? "На эту неделю уже выложено"
              : `Ошибка ${res.status}`;
        setErr(data.nextWeek ? `${msg} · с ${new Date(data.nextWeek).toLocaleDateString("ru")}` : msg);
        return;
      }
      setMine(data as MyAd);
      setOk(`Реклама «${data.title}» опубликована`);
      setTitle("");
      setFile(null);
    } catch (ex) {
      if (ex instanceof Error && ex.name === "AbortError") {
        setErr("Слишком долго — файл тяжёлый или сервер не отвечает");
      } else {
        setErr("Не достучались до backend (:4000). Он запущен?");
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setProgress("");
    }
  }

  if (mine === undefined) return <FormPageSkeleton />;

  return (
    <div className={page.view}>
      <div className={page.hero}>
        <h1 className={page.heroTitle}>Реклама недели</h1>
        <p className={page.heroSub}>
          Раз в неделю — одна реклама на главной. Картинка, MP3, WAV, MP4 (до {MAX_MB} МБ).
        </p>
      </div>

      {mine && (
        <div className={page.banner} style={{ margin: "0 20px 16px" }}>
          <strong>Твоя реклама на эту неделю:</strong> {mine.title}
          {(mine.mimeType.startsWith("audio/") || mine.filePath.endsWith(".wav")) && (
            <audio controls style={{ width: "100%", marginTop: 12 }} src={mediaUrl(mine.filePath)} />
          )}
          {mine.mimeType.startsWith("image/") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(mine.filePath)} alt={mine.title} style={{ maxWidth: "100%", marginTop: 12, borderRadius: 8 }} />
          )}
          {mine.mimeType.startsWith("video/") && (
            <video controls style={{ width: "100%", marginTop: 12 }} src={mediaUrl(mine.filePath)} />
          )}
        </div>
      )}

      {!mine && mine !== undefined && (
        <form onSubmit={submit} className={auth.card} style={{ maxWidth: 480, margin: "20px auto", alignItems: "stretch" }}>
          <h2 className={auth.title} style={{ fontSize: 20, marginBottom: 8 }}>
            Реклама недели
          </h2>
          <label style={{ fontSize: 13, color: "#a0a0a0", fontWeight: 700, marginBottom: 6, alignSelf: "flex-start" }}>
            Заголовок *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Текст рекламы"
            style={{
              width: "100%",
              padding: 10,
              background: "#282828",
              borderRadius: 500,
              color: "#fff",
              marginBottom: 12,
            }}
          />
          <label style={{ fontSize: 13, color: "#a0a0a0", fontWeight: 700, marginBottom: 6, alignSelf: "flex-start" }}>
            Файл * (JPG, PNG, GIF, MP3, WAV, MP4)
          </label>
          <input
            type="file"
            accept="image/*,audio/*,video/mp4,video/webm,.mp3,.wav"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
            style={{ marginBottom: 8, color: "#ccc", width: "100%" }}
          />
          {file && (
            <p style={{ fontSize: 12, color: "#979797", marginBottom: 12, alignSelf: "flex-start" }}>
              {file.name} · {fmtSize(file.size)}
            </p>
          )}
          {progress && <p className={auth.subtitle}>{progress}</p>}
          {err && <p className={auth.error}>{err}</p>}
          {ok && <p style={{ color: "#96FF55", marginBottom: 12, fontSize: 13 }}>{ok}</p>}
          <button type="submit" className={auth.loginBtn} disabled={loading || !file || !title.trim()}>
            {loading ? "Загрузка…" : "Выложить"}
          </button>
        </form>
      )}

      {mine === undefined && <p className={page.banner}>Проверяем…</p>}
    </div>
  );
}
