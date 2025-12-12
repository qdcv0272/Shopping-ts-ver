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

export type CartItem = { id: string; qty: number };

export function migrateSessionToLocal(): {
  cart: { id: string; added: number; prev: number; now: number }[];
  favorites: string[];
} {
  const summary = {
    cart: [] as { id: string; added: number; prev: number; now: number }[],
    favorites: [] as string[],
  };
  try {
    const sessionCartRaw = sessionStorage.getItem("cartItems");
    const localCartRaw = localStorage.getItem("cartItems");
    let sessionCart: CartItem[] = [];
    let localCart: CartItem[] = [];
    if (sessionCartRaw) {
      try {
        const parsed = JSON.parse(sessionCartRaw);
        if (Array.isArray(parsed)) {
          if (parsed.length && typeof parsed[0] === "string") {
            sessionCart = (parsed as string[]).map((s) => ({ id: s, qty: 1 }));
          } else {
            sessionCart = parsed as CartItem[];
          }
        }
      } catch {}
    }
    if (localCartRaw) {
      try {
        const parsed = JSON.parse(localCartRaw);
        if (Array.isArray(parsed)) {
          if (parsed.length && typeof parsed[0] === "string") {
            localCart = (parsed as string[]).map((s) => ({ id: s, qty: 1 }));
          } else {
            localCart = parsed as CartItem[];
          }
        }
      } catch {}
    }

    // merge: for each session item, add its qty to local
    sessionCart.forEach((s) => {
      const idx = localCart.findIndex((x) => x.id === s.id);
      if (idx === -1) {
        localCart.push({ id: s.id, qty: s.qty });
        summary.cart.push({ id: s.id, added: s.qty, prev: 0, now: s.qty });
      } else {
        const prev = localCart[idx].qty;
        localCart[idx].qty = Math.max(1, prev + s.qty);
        summary.cart.push({
          id: s.id,
          added: s.qty,
          prev,
          now: localCart[idx].qty,
        });
      }
    });

    try {
      localStorage.setItem("cartItems", JSON.stringify(localCart));
    } catch {}
    try {
      sessionStorage.removeItem("cartItems");
    } catch {}
  } catch {}

  try {
    const sessionFavRaw = sessionStorage.getItem("favorites");
    const localFavRaw = localStorage.getItem("favorites");
    let sessionFav: string[] = [];
    let localFav: string[] = [];
    if (sessionFavRaw) {
      try {
        const parsed = JSON.parse(sessionFavRaw);
        if (Array.isArray(parsed)) sessionFav = parsed as string[];
      } catch {}
    }
    if (localFavRaw) {
      try {
        const parsed = JSON.parse(localFavRaw);
        if (Array.isArray(parsed)) localFav = parsed as string[];
      } catch {}
    }
    const addedFavs: string[] = [];
    sessionFav.forEach((id) => {
      if (!localFav.includes(id)) {
        localFav.push(id);
        addedFavs.push(id);
      }
    });
    if (addedFavs.length > 0) {
      try {
        localStorage.setItem("favorites", JSON.stringify(localFav));
      } catch {}
    }
    try {
      sessionStorage.removeItem("favorites");
    } catch {}
    summary.favorites = addedFavs;
  } catch {}

  return summary;
}

export function migrateLocalToSession(): {
  cart: { id: string; added: number; prev: number; now: number }[];
  favorites: string[];
} {
  const summary = {
    cart: [] as { id: string; added: number; prev: number; now: number }[],
    favorites: [] as string[],
  };
  try {
    const localCartRaw = localStorage.getItem("cartItems");
    const sessionCartRaw = sessionStorage.getItem("cartItems");
    let localCart: CartItem[] = [];
    let sessionCart: CartItem[] = [];
    if (localCartRaw) {
      try {
        const parsed = JSON.parse(localCartRaw);
        if (Array.isArray(parsed)) {
          if (parsed.length && typeof parsed[0] === "string") {
            localCart = (parsed as string[]).map((s) => ({ id: s, qty: 1 }));
          } else {
            localCart = parsed as CartItem[];
          }
        }
      } catch {}
    }
    if (sessionCartRaw) {
      try {
        const parsed = JSON.parse(sessionCartRaw);
        if (Array.isArray(parsed)) {
          if (parsed.length && typeof parsed[0] === "string") {
            sessionCart = (parsed as string[]).map((s) => ({ id: s, qty: 1 }));
          } else {
            sessionCart = parsed as CartItem[];
          }
        }
      } catch {}
    }

    // merge: for each local item, add its qty to session
    localCart.forEach((l) => {
      const idx = sessionCart.findIndex((x) => x.id === l.id);
      if (idx === -1) {
        sessionCart.push({ id: l.id, qty: l.qty });
        summary.cart.push({ id: l.id, added: l.qty, prev: 0, now: l.qty });
      } else {
        const prev = sessionCart[idx].qty;
        sessionCart[idx].qty = Math.max(1, prev + l.qty);
        summary.cart.push({
          id: l.id,
          added: l.qty,
          prev,
          now: sessionCart[idx].qty,
        });
      }
    });

    try {
      sessionStorage.setItem("cartItems", JSON.stringify(sessionCart));
    } catch {}
    try {
      localStorage.removeItem("cartItems");
    } catch {}
  } catch {}

  try {
    const localFavRaw = localStorage.getItem("favorites");
    const sessionFavRaw = sessionStorage.getItem("favorites");
    let localFav: string[] = [];
    let sessionFav: string[] = [];
    if (localFavRaw) {
      try {
        const parsed = JSON.parse(localFavRaw);
        if (Array.isArray(parsed)) localFav = parsed as string[];
      } catch {}
    }
    if (sessionFavRaw) {
      try {
        const parsed = JSON.parse(sessionFavRaw);
        if (Array.isArray(parsed)) sessionFav = parsed as string[];
      } catch {}
    }
    const addedFavs: string[] = [];
    localFav.forEach((id) => {
      if (!sessionFav.includes(id)) {
        sessionFav.push(id);
        addedFavs.push(id);
      }
    });
    if (addedFavs.length > 0) {
      try {
        sessionStorage.setItem("favorites", JSON.stringify(sessionFav));
      } catch {}
    }
    try {
      localStorage.removeItem("favorites");
    } catch {}
    summary.favorites = addedFavs;
  } catch {}

  return summary;
}

export default {
  isAuthed,
  preferredStorage,
  otherStorage,
  getItemPrefer,
  setItemPrefer,
  removeItemPrefer,
};
