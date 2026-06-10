const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3526";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hiunitut_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("hiunitut_token", token);
  else localStorage.removeItem("hiunitut_token");
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

  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? res.statusText);
  }
  return data as T;
}

export const mediaUrl = (filePath: string) =>
  `${API}/media/${filePath.replace(/^\//, "")}`;
