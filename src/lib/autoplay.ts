import { api } from "./api";
import type { Track } from "./types";

export async function fetchAutoplayTracks(seedId: string, excludeIds: string[]) {
  if (!seedId) return [];
  const exclude = excludeIds.join(",");
  try {
    const res = await api<{ tracks: Track[] }>(
      `/api/listening/autoplay?seed=${encodeURIComponent(seedId)}&exclude=${encodeURIComponent(exclude)}&limit=12`,
    );
    return res.tracks ?? [];
  } catch {
    return [];
  }
}
