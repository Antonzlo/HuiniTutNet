import type { CSSProperties } from "react";
import s from "./Skeleton.module.scss";

type Props = {
  className?: string;
  style?: CSSProperties;
  round?: boolean;
  pill?: boolean;
};

export function Skeleton({ className, style, round, pill }: Props) {
  return (
    <span
      className={[s.bone, s.shimmer, round && s.round, pill && s.pill, className]
        .filter(Boolean)
        .join(" ")}
      style={style}
      aria-hidden
    />
  );
}
