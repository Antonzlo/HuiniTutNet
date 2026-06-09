"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HomeIcon } from "@/components/icons";
import { SearchInput } from "@/components/SearchInput";
import { UserMenu } from "@/components/UserMenu/UserMenu";
import { WhatsNewBell } from "./WhatsNewBell";
import styles from "./Header.module.scss";

type Props = {
  onSearch?: (q: string) => void;
  searching?: boolean;
};

function NavArrow({ direction }: { direction: "back" | "forward" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      {direction === "back" ? (
        <path d="M10.5 3.5L5.5 8l5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M5.5 3.5L10.5 8l-5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function Header({ onSearch, searching }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const showSearch = pathname === "/" && Boolean(onSearch);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.navBtns}>
          <button type="button" className={styles.navBtn} onClick={() => router.back()} aria-label="Назад">
            <NavArrow direction="back" />
          </button>
          <button type="button" className={styles.navBtn} onClick={() => router.forward()} aria-label="Вперёд">
            <NavArrow direction="forward" />
          </button>
        </div>
        <Link
          href="/"
          className={`${styles.homeBtn} ${pathname === "/" ? styles.homeActive : ""}`}
          aria-label="Главная"
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <HomeIcon size={22} tone={pathname === "/" ? "primary" : "muted"} />
        </Link>
      </div>
      <div className={styles.center}>
        {showSearch && (
          <SearchInput
            onSearch={onSearch!}
            placeholder="Что хочешь послушать?"
            searching={searching}
          />
        )}
      </div>
      <div className={styles.right}>
        <WhatsNewBell />
        <Link href="/invites" className={styles.headerLink}>
          + Пригласить
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}
