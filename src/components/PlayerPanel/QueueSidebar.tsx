"use client";

import { useState } from "react";
import { usePlayerPanel } from "@/context/PlayerPanelContext";
import { QueueContent } from "./QueueContent";
import styles from "./panel.module.scss";
import queueSidebarStyles from "./QueueSidebar.module.scss";

type Tab = "queue" | "recent";

export function QueueSidebar() {
  const { closeSidePanel } = usePlayerPanel();
  const [tab, setTab] = useState<Tab>("queue");

  return (
    <div className={queueSidebarStyles.root}>
      <header className={queueSidebarStyles.tabsHead}>
        <div className={queueSidebarStyles.tabs}>
          <button
            type="button"
            className={`${queueSidebarStyles.tab} ${tab === "queue" ? queueSidebarStyles.tabActive : ""}`}
            onClick={() => setTab("queue")}
          >
            Очередь
          </button>
          <button
            type="button"
            className={`${queueSidebarStyles.tab} ${tab === "recent" ? queueSidebarStyles.tabActive : ""}`}
            onClick={() => setTab("recent")}
          >
            Недавно
          </button>
        </div>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={closeSidePanel}
          aria-label="Закрыть"
        >
          <span className={queueSidebarStyles.closeX} aria-hidden>
            ×
          </span>
        </button>
      </header>

      <div className={queueSidebarStyles.scroll}>
        {tab === "queue" ? (
          <QueueContent />
        ) : (
          <p className={queueSidebarStyles.emptyRecent}>История появится позже</p>
        )}
      </div>
    </div>
  );
}
