const RAW = (import.meta.env.VITE_API_BASE as string) || "";
export const API = RAW.replace(/\/+$/, ""); 

import { getToken, clearToken } from "./auth";

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    clearToken();
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  return (await res.json()) as T;
}

export async function post<T>(path: string, body: any) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

export async function get<T>(path: string) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return handle<T>(res);
}
