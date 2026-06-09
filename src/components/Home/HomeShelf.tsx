"use client";

import Link from "next/link";
import type { HomeCard as HomeCardType, HomeSection } from "@/lib/home";
import { HomeCard } from "./HomeCard";
import s from "./home.module.scss";

type Props = {
  section: HomeSection;
  onPlay?: (card: HomeCardType) => void;
};

export function HomeShelf({ section, onPlay }: Props) {
  return (
    <section className={s.shelf}>
      <div className={s.shelfHead}>
        <h2 className={s.shelfTitle}>{section.title}</h2>
        {section.showAllHref && (
          <Link href={section.showAllHref} className={s.shelfMore}>
            Показать все
          </Link>
        )}
      </div>
      <div className={s.shelfTrack}>
        {section.items.map((card) => (
          <HomeCard key={card.id} card={card} onPlay={onPlay} />
        ))}
      </div>
    </section>
  );
}
