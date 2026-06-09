import styles from "./LyricsPlaceholder.module.scss";

type Props = {
  variant: "loading" | "missing";
};

export function LyricsPlaceholder({ variant }: Props) {
  const loading = variant === "loading";

  return (
    <div className={styles.wrap} aria-live="polite">
      <div className={styles.lines} aria-hidden>
        {[0.92, 0.78, 0.65, 0.5].map((w, i) => (
          <div
            key={i}
            className={`${styles.line} ${loading ? styles.shimmer : styles.muted}`}
            style={{ width: `${w * 100}%`, animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
      <div className={styles.message}>
        {loading ? (
          <>
            <span className={styles.dots} aria-hidden>
              <span />
              <span />
              <span />
            </span>
            <p className={styles.title}>Ищем текст</p>
            <p className={styles.hint}>LRCLIB и загруженные .lrc</p>
          </>
        ) : (
          <>
            <span className={styles.icon} aria-hidden>
              ♪
            </span>
            <p className={styles.title}>Текста пока нет</p>
            <p className={styles.hint}>Загрузи .lrc вместе с треком — или он появится из LRCLIB</p>
          </>
        )}
      </div>
    </div>
  );
}
