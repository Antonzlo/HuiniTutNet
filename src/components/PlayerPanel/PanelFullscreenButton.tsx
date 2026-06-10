"use client";

import styles from "./panel.module.scss";

type Props = {
  expanded: boolean;
  onClick: () => void;
};

export function PanelFullscreenButton({ expanded, onClick }: Props) {
  return (
    <button
      type="button"
      className={`${styles.iconBtn} ${expanded ? styles.active : ""}`}
      onClick={onClick}
      title={expanded ? "Свернуть" : "На весь экран"}
      aria-label={expanded ? "Свернуть" : "На весь экран"}
    >
      {expanded ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M5 2H2v3M11 2h3v3M5 14H2v-3M11 14h3v-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M2 5V2h3M11 2h3v3M14 11v3h-3M5 14H2v-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
