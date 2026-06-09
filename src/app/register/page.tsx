"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { HiuniLogo } from "@/components/icons";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import auth from "@/components/LoginScreen/LoginScreen.module.scss";

export default function RegisterPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const [inviteCode, setInviteCode] = useState(params.get("invite") ?? "");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [inviteOk, setInviteOk] = useState<boolean | null>(null);
  const [err, setErr] = useState("");

  const inputStyle = {
    display: "block" as const,
    width: "100%",
    marginTop: 6,
    padding: "10px 12px",
    background: "#2d2d2d",
    borderRadius: 8,
    border: "1px solid #3a3a3a",
    color: "#fff",
  };

  useEffect(() => {
    if (!inviteCode || inviteCode.length < 6) return;
    api<{ valid: boolean }>(`/api/invites/validate/${inviteCode}`, { auth: false })
      .then((r) => setInviteOk(r.valid))
      .catch(() => setInviteOk(false));
  }, [inviteCode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      const res = await api<{ user: User; token: string }>("/api/auth/register", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ inviteCode, email, username, displayName, password }),
      });
      authLogin(res.token, res.user);
      router.push("/");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Ошибка регистрации");
    }
  }

  return (
    <div className={auth.screen}>
      <form onSubmit={submit} className={auth.card}>
        <div className={auth.logo}>
          <HiuniLogo size={56} />
        </div>
        <h1 className={auth.title}>Регистрация</h1>
        <p className={auth.subtitle}>Только по временной ссылке</p>
        {err && <p className={auth.error}>{err}</p>}
        <label className={auth.checklistLabel} style={{ width: "100%", marginBottom: 8 }}>
          Код инвайта
          <input className={auth.checklistDesc} style={inputStyle} value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required />
          {inviteOk === true && <span style={{ color: "#96FF55" }}> ✓</span>}
          {inviteOk === false && <span style={{ color: "#ff4444" }}> недействителен</span>}
        </label>
        <label className={auth.checklistLabel} style={{ width: "100%", marginBottom: 8 }}>
          Email
          <input type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className={auth.checklistLabel} style={{ width: "100%", marginBottom: 8 }}>
          Username
          <input style={inputStyle} value={username} onChange={(e) => setUsername(e.target.value)} required pattern="[a-zA-Z0-9_]+" />
        </label>
        <label className={auth.checklistLabel} style={{ width: "100%", marginBottom: 8 }}>
          Имя
          <input style={inputStyle} value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </label>
        <label className={auth.checklistLabel} style={{ width: "100%", marginBottom: 16 }}>
          Пароль
          <input type="password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </label>
        <button type="submit" className={auth.loginBtn}>
          Создать аккаунт
        </button>
        <Link href="/login" className={auth.cancelBtn} style={{ marginTop: 12 }}>
          Уже есть аккаунт
        </Link>
      </form>
    </div>
  );
}
