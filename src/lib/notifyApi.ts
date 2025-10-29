// src/lib/notifyApi.ts
export type Noti = {
  id: number;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  createdAt: string;
  isRead: boolean;
  campaignId?: number;
};

function getDeviceId(): string {
  const id = localStorage.getItem("em_device_id");
  if (!id) throw new Error("deviceId yoxdur. Əvvəl /api/push/subscribe çağır.");
  return id;
}

export async function fetchUnreadCount(): Promise<number> {
  const id = getDeviceId();
  const r = await fetch(`/api/notifications/unread-count?deviceId=${id}`, { credentials: "include" });
  if (!r.ok) return 0;
  const j = await r.json();
  return j.count ?? 0;
}

export async function fetchNotifications(page = 1, pageSize = 20) {
  const id = getDeviceId();
  const r = await fetch(`/api/notifications?deviceId=${id}&page=${page}&pageSize=${pageSize}`, { credentials: "include" });
  if (!r.ok) return { total: 0, items: [] as Noti[] };
  return r.json() as Promise<{ total: number; items: Noti[] }>;
}

export async function markRead(ids: number[]) {
  if (!ids?.length) return;
  const id = getDeviceId();
  await fetch(`/api/notifications/mark-read?deviceId=${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ ids })
  });
}
