import type { Track } from "@/lib/types";

export function queueContextLabel(
  contextId: string | null,
  track: Track | null | undefined
): string {
  if (!contextId) return track?.album ?? "Сейчас играет";
  if (contextId === "favorites") return "Избранное";
  if (contextId.startsWith("radio:")) {
    const slug = contextId.slice(6);
    return track?.artist?.name ? `${track.artist.name}: радио` : `${slug}: радио`;
  }
  if (contextId.startsWith("mix:")) return track?.album ?? "Микс";
  if (contextId.startsWith("artist:")) return track?.artist?.name ?? "Исполнитель";
  if (contextId.startsWith("release:")) return track?.album ?? "Релиз";
  if (contextId.startsWith("library:")) return "Медиатека";
  return track?.album ?? "Сейчас играет";
}
