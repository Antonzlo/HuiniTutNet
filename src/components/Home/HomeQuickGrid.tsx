"use client";

import Link from "next/link";
import { mediaUrl } from "@/lib/api";
import type { HomeCard } from "@/lib/home";
import s from "./home.module.scss";

type Props = {
  items: HomeCard[];
};

export function HomeQuickGrid({ items }: Props) {
  return (
    <div className={s.quickGrid}>
      {items.map((item) => (
        <Link key={item.id} href={item.href} className={s.quickCard}>
          <div
            className={[
              s.quickThumb,
              item.kind === "playlist" ? s.quickThumbLiked : "",
              item.subtitle === "Исполнитель" ? s.quickThumbRound : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {item.kind === "playlist" ? (
              "♥"
            ) : item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(item.imageUrl)} alt="" />
            ) : (
              item.title[0]?.toUpperCase() ?? "?"
            )}
          </div>
          <span className={s.quickTitle}>{item.title}</span>
        </Link>
      ))}
    </div>
  );
}
