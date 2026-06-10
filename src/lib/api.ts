const DEFAULT_API = "http://localhost:3526";
const DEFAULT_MEDIA = "https://huini.maks1mio.su";

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function defaultPort(protocol: string) {
  return protocol === "https:" ? "443" : "80";
}

export function getApiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API;
  if (typeof window === "undefined") return env;

  try {
    const { hostname, origin, port, protocol } = window.location;
    const envUrl = new URL(env);
    const envHost = envUrl.hostname;

    if (isLocalHost(envHost) && !isLocalHost(hostname)) return origin;

    if (envHost === hostname) {
      if (envUrl.protocol !== protocol) return origin;
      const envPort = envUrl.port || defaultPort(envUrl.protocol);
      const pagePort = port || defaultPort(protocol);
      if (envPort === pagePort) return origin;
    }
  } catch {
    /* invalid env URL */
  }
  return env;
}

export function getMediaBase(): string {
  const remote = process.env.NEXT_PUBLIC_MEDIA_URL?.replace(/\/$/, "");
  if (remote) return remote;
  const apiEnv = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API;
  if (apiEnv.includes("localhost") || apiEnv.includes("127.0.0.1")) {
    return DEFAULT_MEDIA;
  }
  if (typeof window !== "undefined" && isLocalHost(window.location.hostname)) {
    return DEFAULT_MEDIA;
  }
  return getApiBase();
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hiunitut_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("hiunitut_token", token);
  else localStorage.removeItem("hiunitut_token");
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function formatApiError(err: unknown, fallback = "Ошибка запроса"): string {
  if (err instanceof ApiError) {
    if (err.status === 404) return "Не найдено";
    if (err.status >= 500) return "Ошибка сервера — попробуй позже";
    return err.message || fallback;
  }
  if (err instanceof TypeError) return "Сервер недоступен";
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export async function api<T>(
  path: string,
  opts: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const headers = new Headers(opts.headers);
  if (opts.body != null && !(opts.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (opts.auth !== false) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${getApiBase()}${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { error?: string }).error ?? res.statusText;
    throw new ApiError(typeof msg === "string" ? msg : res.statusText, res.status);
  }
  return data as T;
}

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;
const THUMB_SIZES = new Set([64, 128, 256, 384, 512]);

export function mediaUrl(filePath: string, opts?: { w?: number; original?: boolean }) {
  const clean = filePath.replace(/^\//, "");
  const base = getMediaBase();
  const thumbsOn = process.env.NEXT_PUBLIC_MEDIA_THUMBS !== "0";
  if (thumbsOn && !opts?.original && IMAGE_EXT.test(clean)) {
    const w = THUMB_SIZES.has(opts?.w ?? 256) ? (opts?.w ?? 256) : 256;
    return `${base}/media/thumb/${w}/${clean}`;
  }
  return `${base}/media/${clean}`;
}

export const audioUrl = (filePath: string) =>
  `${getMediaBase()}/media/${filePath.replace(/^\//, "")}`;
