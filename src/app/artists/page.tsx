"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Artist } from "@/lib/types";
import { ArtistAvatar } from "@/components/ArtistAvatar/ArtistAvatar";
import { ListPageSkeleton } from "@/components/Skeleton";
import page from "@/styles/page.module.scss";

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [name, setName] = useState("");
  const [isExternal, setIsExternal] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api<Artist[]>("/api/artists", { auth: false })
      .then(setArtists)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await api("/api/artists", { method: "POST", body: JSON.stringify({ name, isExternal }) });
      setName("");
      load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Ошибка");
    }
  }

  if (loading && artists.length === 0) return <ListPageSkeleton rows={8} />;

  return (
    <div className={page.view}>
      <div className={page.hero}>
        <h1 className={page.heroTitle}>Артисты</h1>
        <p className={page.heroSub}>Свои и внешние исполнители в библиотеке.</p>
      </div>

      <form onSubmit={create} className={page.panel}>
        <h3 className={page.panelTitle}>Добавить артиста</h3>
        <input
          className={page.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Имя артиста"
          required
        />
        <label className={page.label}>
          <input type="checkbox" checked={isExternal} onChange={(e) => setIsExternal(e.target.checked)} />
          Внешний артист
        </label>
        {err && <div className={page.error}>{err}</div>}
        <button type="submit" className={page.btn}>
          Создать
        </button>
      </form>

      <div className={page.artistList}>
        {artists.map((a) => (
          <Link key={a.id} href={`/artists/${a.slug}`} className={page.artistRow}>
            <ArtistAvatar
              name={a.name}
              avatarUrl={a.avatarUrl}
              imageUrl={a.imageUrl}
              className={page.artistRowAvatar}
              imgClassName={page.artistRowAvatarImg}
            />
            <div>
              <div className={page.artistRowName}>{a.name}</div>
              <div className={page.artistRowMeta}>
                {a.isExternal ? "Внешний" : "Свой"} · {a._count?.tracks ?? 0} треков
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
