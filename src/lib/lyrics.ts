import { api } from "./api";

export type LyricsSource = "upload" | "lrclib";

export type TrackLyrics = {
  source: LyricsSource;
  synced: boolean;
  lrc: string;
  authors: string;
};

export function fetchTrackLyrics(trackId: string): Promise<TrackLyrics> {
  return api<TrackLyrics>(`/api/tracks/${trackId}/lyrics`, { auth: false });
}

export function lyricsSourceLabel(source: LyricsSource): string {
  return source === "lrclib" ? "LRCLIB" : "HuiniTutNet";
}
