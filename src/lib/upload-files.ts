const AUDIO_EXT = new Set(["flac", "mp3", "wav", "ogg", "aac", "m4a"]);

export function fileBaseName(name: string): string {
  return name.replace(/\.[^.]+$/, "").trim();
}

export function isAudioFile(f: File): boolean {
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
  if (AUDIO_EXT.has(ext)) return true;
  return f.type.startsWith("audio/");
}

export function isLrcFile(f: File): boolean {
  const ext = f.name.split(".").pop()?.toLowerCase();
  return ext === "lrc" || (f.type === "text/plain" && ext === "lrc");
}

export function pairLrcWithAudio(audioFiles: File[], lrcFiles: File[]): Map<File, File | null> {
  const lrcByBase = new Map<string, File>();
  for (const lrc of lrcFiles) {
    lrcByBase.set(fileBaseName(lrc.name).toLowerCase(), lrc);
  }

  const map = new Map<File, File | null>();
  for (const audio of audioFiles) {
    const key = fileBaseName(audio.name).toLowerCase();
    map.set(audio, lrcByBase.get(key) ?? null);
  }
  return map;
}

export function splitUploadFiles(files: File[]): { audio: File[]; lrc: File[] } {
  const audio: File[] = [];
  const lrc: File[] = [];
  for (const f of files) {
    if (isLrcFile(f)) lrc.push(f);
    else if (isAudioFile(f)) audio.push(f);
  }
  return { audio, lrc };
}
