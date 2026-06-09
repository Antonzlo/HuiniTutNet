"use client";

type Props = {
  value: number;
  onChange?: (stars: number) => void;
  size?: number;
};

export function StarRating({ value, onChange, size = 22 }: Props) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }} role={onChange ? "group" : undefined}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n} звёзд`}
          style={{
            background: "none",
            border: "none",
            cursor: onChange ? "pointer" : "default",
            fontSize: size,
            color: n <= value ? "#96FF55" : "#4a4a4a",
            padding: 0,
            lineHeight: 1,
          }}
        >
          ★
        </button>
      ))}
    </span>
  );
}
