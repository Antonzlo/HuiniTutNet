"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import page from "@/styles/page.module.scss";

type Invite = {
  id: string;
  code: string;
  maxUses: number;
  usesCount: number;
  expiresAt: string | null;
  revokedAt: string | null;
  url?: string;
};

export default function InvitesPage() {
  const [links, setLinks] = useState<Invite[]>([]);
  const [maxUses, setMaxUses] = useState(1);
  const [hours, setHours] = useState(48);
  const [err, setErr] = useState("");

  function load() {
    api<Invite[]>("/api/invites").then(setLinks).catch((e) => setErr(e.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/api/invites", { method: "POST", body: JSON.stringify({ maxUses, expiresInHours: hours }) });
      load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Ошибка");
    }
  }

  async function revoke(id: string) {
    await api(`/api/invites/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className={page.view}>
      <div className={page.hero}>
        <h1 className={page.heroTitle}>Приглашения</h1>
        <p className={page.heroSub}>Временные ссылки для друзей.</p>
      </div>

      <form onSubmit={create} className={page.panel}>
        <h3 className={page.panelTitle}>Новый инвайт</h3>
        <input type="number" min={1} max={50} value={maxUses} onChange={(e) => setMaxUses(Number(e.target.value))} className={page.input} placeholder="Макс. использований" />
        <input type="number" min={1} max={720} value={hours} onChange={(e) => setHours(Number(e.target.value))} className={page.input} placeholder="Часов до истечения" />
        {err && <div className={page.error}>{err}</div>}
        <button type="submit" className={page.btn}>
          Создать
        </button>
      </form>

      <div className={page.artistList}>
        {links.map((l) => {
          const url = l.url ?? `${typeof window !== "undefined" ? window.location.origin : ""}/register?invite=${l.code}`;
          return (
            <div key={l.id} className={page.banner} style={{ marginBottom: 8 }}>
              <code>{l.code}</code>
              <p style={{ fontSize: 12, color: "#a7a7a7", margin: "6px 0" }}>
                {l.usesCount}/{l.maxUses}
              </p>
              <button type="button" className={page.btnGhost} onClick={() => navigator.clipboard.writeText(url)}>
                Копировать
              </button>
              {!l.revokedAt && (
                <button type="button" className={page.btnGhost} style={{ color: "#f15e6c", marginLeft: 8 }} onClick={() => revoke(l.id)}>
                  Отозвать
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
