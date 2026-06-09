"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon } from "@/components/icons";
import { useWhatsNew } from "@/context/WhatsNewContext";
import styles from "./Header.module.scss";

export function WhatsNewBell() {
  const pathname = usePathname();
  const { hasUnread } = useWhatsNew();
  const active = pathname === "/whats-new";

  return (
    <Link
      href="/whats-new"
      className={`${styles.bellBtn} ${active ? styles.bellActive : ""}`}
      aria-label="Что нового"
      title="Что нового"
    >
      <BellIcon size={20} tone={active ? "primary" : "muted"} />
      {hasUnread && <span className={styles.bellDot} aria-hidden />}
    </Link>
  );
}
