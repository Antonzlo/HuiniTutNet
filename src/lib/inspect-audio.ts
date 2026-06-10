import { parseBlob, selectCover } from "music-metadata";
import type { InspectedAudio } from "./types";

function splitArtists(artist?: string): string[] | undefined {
  if (!artist) return undefined;
  const parts = artist
    .split(/\s*[,;&]\s*|\s+feat\.?\s+|\s+ft\.?\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts : undefined;
}

export async function inspectAudio(file: File): Promise<InspectedAudio> {
  const meta = await parseBlob(file, { skipCovers: false, duration: true });
  const { common, format } = meta;

  let coverPreview: string | undefined;
  const picture = selectCover(common.picture);
  if (picture) {
    const blob = new Blob([picture.data.slice()], { type: picture.format });
    coverPreview = URL.createObjectURL(blob);
  }

  const stem = file.name.replace(/\.[^.]+$/, "").trim();

  return {
    title: common.title,
    artist: common.artist,
    album: common.album,
    albumArtist: common.albumartist,
    year: common.year,
    genre: common.genre?.[0],
    trackNumber: common.track?.no ?? undefined,
    durationSec: format.duration,
    bitrate: format.bitrate,
    sampleRate: format.sampleRate,
    bitsPerSample: format.bitsPerSample,
    coverPreview,
    fileSize: file.size,
    format: format.container ?? file.name.split(".").pop()?.toUpperCase() ?? "",
    fileName: file.name,
    hasTagTitle: Boolean(common.title),
    hasTagArtist: Boolean(common.artist),
    suggestedTitle: common.title ?? stem,
    suggestedArtist: common.artist,
    suggestedArtists: splitArtists(common.artist),
  };
}
