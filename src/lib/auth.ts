const KEY = "em_admin_token";

export function saveToken(token: string) {
  localStorage.setItem(KEY, token);
}
export function getToken(): string | null {
  return localStorage.getItem(KEY);
}
export function clearToken() {
  localStorage.removeItem(KEY);
}
export function isAuthed() {
  return !!getToken();
}
