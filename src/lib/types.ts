export type User = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  avatarUrl?: string | null;
  bio?: string | null;
};

export type Artist = {
  id: string;
  name: string;
  slug: string;
  bio?: string | null;
  isExternal: boolean;
  avatarUrl?: string | null;
  imageUrl?: string | null;
  _count?: { tracks: number };
};

export type Track = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  album?: string | null;
  albumArtist?: string | null;
  year?: number | null;
  genre?: string | null;
  trackNumber?: number | null;
  format: string;
  filePath: string;
  fileName?: string;
  fileSize: number;
  bitrate?: number | null;
  sampleRate?: number | null;
  bitsPerSample?: number | null;
  releaseId?: string | null;
  singleReleaseId?: string | null;
  singleRelease?: { id: string; title: string; slug: string; year?: number | null; type: string } | null;
  release?: { id: string; title: string; slug: string; type?: string } | null;
  durationSec?: number | null;
  playCount?: number;
  coverUrl?: string | null;
  lrcUrl?: string | null;
  published?: boolean;
  uploadedById?: string;
  isAd?: boolean;
  mimeType?: string;
  avgStars?: number | null;
  artist: { id?: string; name: string; slug: string };
  artists?: { artist: { id: string; name: string; slug: string } }[];
  uploadedBy?: { username: string; displayName: string };
  createdAt?: string;
  _count?: { favorites: number; ratings: number };
};

export type ReleaseType = "SINGLE" | "EP" | "ALBUM" | "COMPILATION";

export type InspectedAudio = {
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  year?: number;
  genre?: string;
  trackNumber?: number;
  durationSec?: number;
  bitrate?: number;
  sampleRate?: number;
  bitsPerSample?: number;
  coverPreview?: string;
  fileSize: number;
  format: string;
  fileName: string;
  hasTagTitle?: boolean;
  hasTagArtist?: boolean;
  suggestedTitle: string;
  suggestedArtist?: string;
  suggestedArtists?: string[];
};
