import * as auth from "./auth";

// 장바구니 항목 타입 정의
export type CartItem = { id: string; qty: number };

// 사용자가 인증되었는지 확인하는 함수
export function isAuthed(): boolean {
  return sessionStorage.getItem(auth.LOGIN_STORAGE_KEY) === "true";
}

// 사용자의 인증 상태에 따라 선호하는 스토리지를 반환하는 함수
export function preferredStorage(): Storage {
  return isAuthed() ? localStorage : sessionStorage;
}

// 다른 스토리지를 반환하는 함수
export function otherStorage(): Storage {
  return preferredStorage() === localStorage ? sessionStorage : localStorage;
}

// 선호하는 스토리지에서 항목을 가져오는 함수
export function getItemPrefer(key: string): string | null {
  const pref = preferredStorage();

  const v = pref.getItem(key);
  if (v !== null) return v;

  return otherStorage().getItem(key);
}

// 선호하는 스토리지에 항목을 설정하는 함수
export function setItemPrefer(key: string, value: string): void {
  preferredStorage().setItem(key, value);
}

// 선호하는 스토리지에서 항목을 제거하는 함수
export function removeItemPrefer(key: string): void {
  preferredStorage().removeItem(key);
}

// 세션 스토리지의 데이터를 로컬 스토리지로 마이그레이션하는 함수
export function migrateSessionToLocal(): {
  cart: { id: string; added: number; prev: number; now: number }[];
  favorites: string[];
} {
  const summary = {
    cart: [] as { id: string; added: number; prev: number; now: number }[],
    favorites: [] as string[],
  };

  const sessionCartRaw = sessionStorage.getItem("cartItems");
  const localCartRaw = localStorage.getItem("cartItems");
  let sessionCart: CartItem[] = [];
  let localCart: CartItem[] = [];
  if (sessionCartRaw) {
    const parsed = JSON.parse(sessionCartRaw);
    if (Array.isArray(parsed)) {
      if (parsed.length && typeof parsed[0] === "string") {
        sessionCart = (parsed as string[]).map((s) => ({ id: s, qty: 1 }));
      } else {
        sessionCart = parsed as CartItem[];
      }
    }
  }
  if (localCartRaw) {
    const parsed = JSON.parse(localCartRaw);
    if (Array.isArray(parsed)) {
      if (parsed.length && typeof parsed[0] === "string") {
        localCart = (parsed as string[]).map((s) => ({ id: s, qty: 1 }));
      } else {
        localCart = parsed as CartItem[];
      }
    }
  }

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

  localStorage.setItem("cartItems", JSON.stringify(localCart));

  sessionStorage.removeItem("cartItems");

  const sessionFavRaw = sessionStorage.getItem("favorites");
  const localFavRaw = localStorage.getItem("favorites");
  let sessionFav: string[] = [];
  let localFav: string[] = [];
  if (sessionFavRaw) {
    const parsed = JSON.parse(sessionFavRaw);
    if (Array.isArray(parsed)) sessionFav = parsed as string[];
  }
  if (localFavRaw) {
    const parsed = JSON.parse(localFavRaw);
    if (Array.isArray(parsed)) localFav = parsed as string[];
  }
  const addedFavs: string[] = [];
  sessionFav.forEach((id) => {
    if (!localFav.includes(id)) {
      localFav.push(id);
      addedFavs.push(id);
    }
  });
  if (addedFavs.length > 0) {
    localStorage.setItem("favorites", JSON.stringify(localFav));
  }

  sessionStorage.removeItem("favorites");

  summary.favorites = addedFavs;

  return summary;
}

// 로컬 스토리지의 데이터를 세션 스토리지로 마이그레이션하는 함수
export function migrateLocalToSession(): {
  cart: { id: string; added: number; prev: number; now: number }[];
  favorites: string[];
} {
  const summary = {
    cart: [] as { id: string; added: number; prev: number; now: number }[],
    favorites: [] as string[],
  };

  const localCartRaw = localStorage.getItem("cartItems");
  const sessionCartRaw = sessionStorage.getItem("cartItems");
  let localCart: CartItem[] = [];
  let sessionCart: CartItem[] = [];
  if (localCartRaw) {
    const parsed = JSON.parse(localCartRaw);
    if (Array.isArray(parsed)) {
      if (parsed.length && typeof parsed[0] === "string") {
        localCart = (parsed as string[]).map((s) => ({ id: s, qty: 1 }));
      } else {
        localCart = parsed as CartItem[];
      }
    }
  }
  if (sessionCartRaw) {
    const parsed = JSON.parse(sessionCartRaw);
    if (Array.isArray(parsed)) {
      if (parsed.length && typeof parsed[0] === "string") {
        sessionCart = (parsed as string[]).map((s) => ({ id: s, qty: 1 }));
      } else {
        sessionCart = parsed as CartItem[];
      }
    }
  }

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

  sessionStorage.setItem("cartItems", JSON.stringify(sessionCart));

  localStorage.removeItem("cartItems");

  const localFavRaw = localStorage.getItem("favorites");
  const sessionFavRaw = sessionStorage.getItem("favorites");
  let localFav: string[] = [];
  let sessionFav: string[] = [];
  if (localFavRaw) {
    const parsed = JSON.parse(localFavRaw);
    if (Array.isArray(parsed)) localFav = parsed as string[];
  }
  if (sessionFavRaw) {
    const parsed = JSON.parse(sessionFavRaw);
    if (Array.isArray(parsed)) sessionFav = parsed as string[];
  }
  const addedFavs: string[] = [];
  localFav.forEach((id) => {
    if (!sessionFav.includes(id)) {
      sessionFav.push(id);
      addedFavs.push(id);
    }
  });
  if (addedFavs.length > 0) {
    sessionStorage.setItem("favorites", JSON.stringify(sessionFav));
  }

  localStorage.removeItem("favorites");

  summary.favorites = addedFavs;

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
