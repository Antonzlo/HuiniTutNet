import type { Track } from "@/lib/types";

export type WeeklyAd = {
  id: string;
  title: string;
  filePath: string;
  mimeType: string;
  user: { displayName: string; username?: string };
};

export const ADS_ENABLED = false;
export const AD_INTERVAL_SEC = 120;

export function adToTrack(ad: WeeklyAd): Track {
  return {
    id: `ad-${ad.id}`,
    title: ad.title,
    slug: "ad",
    format: "ad",
    filePath: ad.filePath,
    fileSize: 0,
    isAd: true,
    mimeType: ad.mimeType,
    artist: {
      name: `Реклама · ${ad.user.displayName}`,
      slug: "ad",
    },
  };
}

export function pickRandomAd(ads: WeeklyAd[]): WeeklyAd | null {
  if (ads.length === 0) return null;
  return ads[Math.floor(Math.random() * ads.length)];
}
