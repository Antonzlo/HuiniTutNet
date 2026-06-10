"use client";

import { usePlayerPanel } from "@/context/PlayerPanelContext";
import { NowPlayingPanel } from "./NowPlayingPanel";
import { QueueSidebar } from "./QueueSidebar";
import styles from "./panel.module.scss";

export function PlayerSidePanel() {
  const { sidePanel, sideOpen, panelFullscreen } = usePlayerPanel();

  if (!sideOpen || !sidePanel) return null;

  return (
    <aside
      className={`${styles.shell} ${panelFullscreen ? styles.shellFullscreen : ""}`}
      aria-label={sidePanel === "queue" ? "Очередь" : "Сейчас играет"}
    >
      {sidePanel === "queue" ? <QueueSidebar /> : <NowPlayingPanel />}
    </aside>
  );
}
