"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import styles from "./panel.module.scss";

type Props = {
  slug: string;
};

export function ArtistFollowPill({ slug }: Props) {
  const { isAuthenticated } = useAuth();
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    api<{ following: boolean }>(`/api/artists/${slug}/following`)
      .then((r) => setFollowing(r.following))
      .catch(() => {});
  }, [slug, isAuthenticated]);

  async function toggle() {
    if (!isAuthenticated) return;
    try {
      if (following) {
        await api(`/api/artists/${slug}/follow`, { method: "DELETE" });
        setFollowing(false);
      } else {
        await api(`/api/artists/${slug}/follow`, { method: "POST" });
        setFollowing(true);
        window.dispatchEvent(new CustomEvent("hiuni:home-invalidate"));
      }
    } catch {
      /* ignore */
    }
  }

  if (!isAuthenticated) return null;

  return (
    <button
      type="button"
      className={`${styles.followPill} ${following ? styles.followPillActive : ""}`}
      onClick={() => void toggle()}
    >
      {following ? "Подписка оформлена" : "Подписаться"}
    </button>
  );
}
