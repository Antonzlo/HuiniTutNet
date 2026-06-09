"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HiuniLogo } from "@/components/icons";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import auth from "@/components/LoginScreen/LoginScreen.module.scss";

export default function LoginPage() {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      const res = await api<{ user: User; token: string }>("/api/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ login, password }),
      });
      authLogin(res.token, res.user);
      router.push("/");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Ошибка входа");
    }
  }

  return (
    <div className={auth.screen}>
      <form onSubmit={submit} className={auth.card}>
        <div className={auth.logo}>
          <HiuniLogo size={56} />
        </div>
        <p className={auth.subtitle}>Музыка для своих</p>
        <div className={auth.warning}>Только по инвайту. Нет аккаунта — регистрация.</div>
        {err && <p className={auth.error}>{err}</p>}
        <label className={auth.field}>
          <span className={auth.fieldLabel}>Email или username</span>
          <input
            className={auth.fieldInput}
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
          />
        </label>
        <label className={auth.field}>
          <span className={auth.fieldLabel}>Пароль</span>
          <input
            type="password"
            className={auth.fieldInput}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" className={auth.loginBtn}>
          Войти
        </button>
        <Link href="/register" className={auth.cancelBtn}>
          Регистрация по инвайту
        </Link>
      </form>
    </div>
  );
}
