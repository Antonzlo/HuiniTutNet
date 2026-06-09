"use client";

import { ReactNode } from "react";
import { Header } from "@/components/Header/Header";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { PlayerBar } from "@/components/PlayerBar/PlayerBar";
import { useLibrary } from "@/context/LibraryContext";
import styles from "./Layout.module.scss";

type Props = {
  children: ReactNode;
  onSearch?: (q: string) => void;
  searching?: boolean;
};

export function AppLayout({ children, onSearch, searching }: Props) {
  const { isFullscreen } = useLibrary();

  return (
    <div className={`${styles.app} ${isFullscreen ? styles.libraryFullscreen : ""}`}>
      <Sidebar />
      <div className={styles.mainColumn}>
        <div className={styles.contentShell}>
          <Header onSearch={onSearch} searching={searching} />
          <div className={styles.scroll}>{children}</div>
        </div>
        <div className={styles.playerSlot}>
          <PlayerBar />
        </div>
      </div>
    </div>
  );
}
