"use client";

import { ReactNode } from "react";
import { Header } from "@/components/Header/Header";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { PlayerBar } from "@/components/PlayerBar/PlayerBar";
import { PlayerSidePanel } from "@/components/PlayerPanel/PlayerSidePanel";
import { useLibrary } from "@/context/LibraryContext";
import { usePlayerPanel } from "@/context/PlayerPanelContext";
import styles from "./Layout.module.scss";

type Props = {
  children: ReactNode;
  onSearch?: (q: string) => void;
  searching?: boolean;
};

export function AppLayout({ children, onSearch, searching }: Props) {
  const { isFullscreen } = useLibrary();
  const { panelFullscreen } = usePlayerPanel();

  return (
    <div
      className={`${styles.app} ${isFullscreen ? styles.libraryFullscreen : ""} ${panelFullscreen ? styles.playerPanelFullscreen : ""}`}
    >
      <div className={styles.workspace}>
        <Sidebar />
        <div className={styles.mainColumn}>
          <div className={styles.contentShell}>
            <Header onSearch={onSearch} searching={searching} />
            <div className={styles.scroll}>{children}</div>
          </div>
        </div>
        <PlayerSidePanel />
      </div>
      <div className={styles.playerSlot}>
        <PlayerBar />
      </div>
    </div>
  );
}
