export type LrcLine = {
  time: number;
  text: string;
  pause?: boolean;
  gapSec?: number;
  pauseStart?: number;
  pauseEnd?: number;
  intro?: boolean;
};

const INTRO_PAUSE_SEC = 3;

export function parseLrc(raw: string): LrcLine[] {
  const lines: LrcLine[] = [];
  const timeRe = /\[(\d+):(\d+(?:\.\d+)?)\]/g;

  for (const row of raw.split(/\r?\n/)) {
    const trimmed = row.trim();
    if (!trimmed) continue;

    const times: number[] = [];
    let m: RegExpExecArray | null;
    timeRe.lastIndex = 0;
    while ((m = timeRe.exec(trimmed)) !== null) {
      times.push(Number(m[1]) * 60 + Number(m[2]));
    }

    const text = trimmed.replace(/\[[^\]]+\]/g, "").trim();
    if (/^(ar|ti|al|by|offset):/i.test(text)) continue;
    if (!text || times.length === 0) continue;

    for (const time of times) {
      lines.push({ time, text });
    }
  }

  const sorted = lines.sort((a, b) => a.time - b.time);
  return insertIntroPause(mergeBrokenLines(sorted));
}

function insertIntroPause(lines: LrcLine[]): LrcLine[] {
  if (!lines.length || lines[0].pause) return lines;
  const first = lines[0];
  if (first.time < INTRO_PAUSE_SEC) return lines;

  return [
    {
      time: 0,
      text: "",
      pause: true,
      intro: true,
      gapSec: first.time,
      pauseStart: 0,
      pauseEnd: first.time,
    },
    ...lines,
  ];
}

function mergeBrokenLines(lines: LrcLine[]): LrcLine[] {
  const out: LrcLine[] = [];

  for (const line of lines) {
    const prev = out[out.length - 1];
    if (!prev || prev.pause || line.pause) {
      out.push({ ...line });
      continue;
    }

    const gap = line.time - prev.time;
    const hyphenJoin = prev.text.endsWith("-");
    const quickContinue =
      gap < 1.5 &&
      /^[а-яёa-z("(«]/.test(line.text) &&
      !/[.!?…]$/.test(prev.text);

    if (hyphenJoin) {
      prev.text = prev.text.slice(0, -1) + line.text;
      continue;
    }
    if (quickContinue) {
      prev.text = `${prev.text} ${line.text}`;
      continue;
    }

    out.push({ ...line });
  }

  return out;
}

export function parsePlainLyrics(raw: string): LrcLine[] {
  return raw
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((text, i) => ({ time: i, text }));
}

function nextLyricTime(lines: LrcLine[], from: number): number | null {
  for (let i = from + 1; i < lines.length; i++) {
    if (!lines[i].pause) return lines[i].time;
  }
  return null;
}

export function activeLrcIndex(lines: LrcLine[], time: number, synced = true): number {
  if (!synced || !lines.length) return -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].pause) continue;
    if (time + 0.08 < lines[i].time) break;
    const next = nextLyricTime(lines, i);
    if (next == null || time + 0.08 < next) return i;
  }

  return -1;
}

export function activeIntroPauseIndex(lines: LrcLine[], time: number): number {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.intro || line.pauseStart == null || line.pauseEnd == null) continue;
    if (time >= line.pauseStart && time < line.pauseEnd - 0.05) return i;
  }
  return -1;
}

export function nextLyricIndex(lines: LrcLine[], from: number): number {
  for (let i = from + 1; i < lines.length; i++) {
    if (!lines[i].pause) return i;
  }
  return -1;
}

export function pauseSecondsLeft(line: LrcLine, time: number): number {
  if (!line.pauseEnd) return 0;
  return Math.max(1, Math.ceil(line.pauseEnd - time));
}

export function lastLyricIndex(lines: LrcLine[]): number {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i].pause) return i;
  }
  return -1;
}
