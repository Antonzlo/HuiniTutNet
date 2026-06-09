"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  LogoutIcon,
  UserIcon,
  DownloadIcon,
  InviteIcon,
  AdsIcon,
} from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import styles from "./UserMenu.module.scss";

const NAV_ITEMS = [
  { href: "/upload", icon: DownloadIcon, label: "Загрузить" },
  { href: "/invites", icon: InviteIcon, label: "Инвайты" },
  { href: "/ads", icon: AdsIcon, label: "Реклама" },
] as const;

export function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false), open);

  function close() {
    setOpen(false);
  }

  function handleLogout() {
    logout();
    setOpen(false);
    router.push("/login");
  }

  if (!isAuthenticated || !user) {
    return (
      <div className={styles.guest}>
        <span>Гость</span>
        <Link href="/login" className={styles.loginBtn}>
          Войти
        </Link>
      </div>
    );
  }

  const initial = user.displayName?.[0]?.toUpperCase() ?? user.username[0]?.toUpperCase() ?? "?";

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.open : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className={styles.avatar}>{initial}</span>
        <span className={styles.meta}>
          <span className={styles.name}>{user.displayName}</span>
          <span className={styles.status}>
            <span className={styles.statusDot} aria-hidden />
            В сети
          </span>
        </span>
        <span className={styles.chevron}>
          <ChevronDownIcon size={20} />
        </span>
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.menuHeader}>
            <strong style={{ fontFamily: "var(--font-nunito)" }}>@{user.username}</strong>
            <div className={styles.menuEmail}>{user.email}</div>
            {user.role === "ADMIN" && <span className={styles.badge}>Админ</span>}
          </div>
          <button type="button" className={styles.menuItem} role="menuitem" onClick={close}>
            <UserIcon size={20} tone="primary" />
            {user.displayName}
          </button>
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className={styles.menuItem} role="menuitem" onClick={close}>
              <Icon size={20} tone="muted" />
              {label}
            </Link>
          ))}
          <button
            type="button"
            className={`${styles.menuItem} ${styles.logout}`}
            role="menuitem"
            onClick={handleLogout}
          >
            <LogoutIcon size={20} tone="accent" />
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
