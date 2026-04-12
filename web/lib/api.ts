import { mockApiFetch } from "@/lib/mockApi";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("getto_token");
}

export function setToken(t: string | null) {
  if (typeof window === "undefined") return;
  if (t) localStorage.setItem("getto_token", t);
  else localStorage.removeItem("getto_token");
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const headers: HeadersInit = { ...(options.headers || {}) };
  const token = getToken();
  if (token)
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  if (options.json !== undefined) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }
  return mockApiFetch<T>(
    path,
    {
    ...options,
      headers,
    },
    token
  );
}
