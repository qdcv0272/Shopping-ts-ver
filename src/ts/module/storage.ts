import * as auth from "./auth";

/**
 * Storage helper: when user is authenticated (sessionStorage key set), prefer localStorage,
 * otherwise prefer sessionStorage. When reading, fall back to the other storage if key not found.
 */
export function isAuthed(): boolean {
  try {
    return sessionStorage.getItem(auth.LOGIN_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function preferredStorage(): Storage {
  return isAuthed() ? localStorage : sessionStorage;
}

export function otherStorage(): Storage {
  return preferredStorage() === localStorage ? sessionStorage : localStorage;
}

export function getItemPrefer(key: string): string | null {
  const pref = preferredStorage();
  try {
    const v = pref.getItem(key);
    if (v !== null) return v;
  } catch {}
  try {
    return otherStorage().getItem(key);
  } catch {
    return null;
  }
}

export function setItemPrefer(key: string, value: string): void {
  try {
    preferredStorage().setItem(key, value);
  } catch {}
}

export function removeItemPrefer(key: string): void {
  try {
    preferredStorage().removeItem(key);
  } catch {}
}

export default {
  isAuthed,
  preferredStorage,
  otherStorage,
  getItemPrefer,
  setItemPrefer,
  removeItemPrefer,
};
