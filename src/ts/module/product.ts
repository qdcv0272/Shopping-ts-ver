import gsap from "gsap";
import { showToast } from "./info/toast";
import storage from "./storage";
import products from "../../data/products.json";

export function initProductQuickView(): void {
  if (typeof window === "undefined") return;

  const modal = document.getElementById("product-modal");
  if (!modal) return;

  const titleEl = modal.querySelector<HTMLElement>(".product-modal__title");
  const descEl = modal.querySelector<HTMLElement>(".product-modal__desc");
  const priceEl = modal.querySelector<HTMLElement>(".product-modal__price");
  const thumbEl = modal.querySelector<HTMLElement>(".product-modal__thumb");
  const closeBtn = modal.querySelector<HTMLElement>(".product-modal__close");
  const addBtn = modal.querySelector<HTMLButtonElement>(".product-modal__add");
  const favBtn = modal.querySelector<HTMLButtonElement>(".product-modal__fav");

  let isOpen = false;
  let isAnimating = false;
  let currentData: { id?: string; title?: string; desc?: string; price?: string; thumb?: string } | null = null;

  // cart: store array of { id, qty }
  type CartItem = { id: string; qty: number };

  function getCartItems(): CartItem[] {
    try {
      const raw = storage.getItemPrefer("cartItems");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // migrate old string[] format (titles or ids) -> CartItem[]
      if (Array.isArray(parsed) && parsed.length && typeof parsed[0] === "string") {
        const converted: CartItem[] = (parsed as string[])
          .map((s) => {
            // try to find product by id or title
            const p = (products as any[]).find((x) => x.id === s || x.title === s);
            if (p && p.id) return { id: p.id, qty: 1 } as CartItem;
            // fallback: assume string is id
            return { id: s, qty: 1 } as CartItem;
          })
          .filter(Boolean);
        // persist normalized format
        setCartItems(converted);
        return converted;
      }
      return parsed as CartItem[];
    } catch {
      return [];
    }
  }

  function setCartItems(items: CartItem[]) {
    try {
      storage.setItemPrefer("cartItems", JSON.stringify(items));
    } catch {}
  }

  function getCartQty(id?: string) {
    if (!id) return 0;
    const items = getCartItems();
    const found = items.find((x) => x.id === id);
    return found ? found.qty : 0;
  }

  // favorites (localStorage titles)
  function getFavorites(): string[] {
    try {
      const raw = storage.getItemPrefer("favorites");
      // migration: if favorites stored as titles, convert to ids
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length && typeof parsed[0] === "string") {
        // if these look like titles, try mapping to id
        const mapped = (parsed as string[])
          .map((s) => {
            const p = (products as any[]).find((x) => x.id === s || x.title === s);
            return p?.id ?? null;
          })
          .filter(Boolean) as string[];
        // persist normalized list
        setFavorites(mapped);
        return mapped;
      }
      return parsed as string[];
    } catch {
      return [];
    }
  }

  function setFavorites(items: string[]) {
    try {
      storage.setItemPrefer("favorites", JSON.stringify(items));
    } catch {}
  }

  function isFavorited(id?: string) {
    if (!id) return false;
    return getFavorites().includes(id);
  }

  const open = (data: { id?: string; title?: string; desc?: string; price?: string; thumb?: string }) => {
    if (isOpen || isAnimating) return;
    isAnimating = true;
    modal.classList.remove("d-none");
    modal.setAttribute("aria-hidden", "false");

    if (titleEl) titleEl.textContent = data.title ?? "상품명";
    if (descEl) descEl.textContent = data.desc ?? "상품 설명";
    if (priceEl) priceEl.textContent = data.price ?? "₩0";
    if (thumbEl) thumbEl.textContent = data.thumb ?? "📦";

    gsap.fromTo(
      modal.querySelector(".product-modal__panel"),
      { autoAlpha: 0, scale: 0.96, y: 10 },
      {
        autoAlpha: 1,
        scale: 1,
        y: 0,
        duration: 0.32,
        ease: "power2.out",
        onComplete: () => {
          isAnimating = false;
          isOpen = true;
        },
      }
    );
  };

  const close = () => {
    if (!isOpen || isAnimating) return;
    isAnimating = true;
    gsap.to(modal.querySelector(".product-modal__panel"), {
      autoAlpha: 0,
      scale: 0.96,
      y: 10,
      duration: 0.24,
      ease: "power2.in",
      onComplete: () => {
        modal.classList.add("d-none");
        modal.setAttribute("aria-hidden", "true");
        isAnimating = false;
        isOpen = false;
      },
    });
  };

  document.addEventListener("click", (ev) => {
    const el = ev.target as HTMLElement;

    // quick-view button
    if (el.closest(".quick-view")) {
      const card = el.closest(".product-card") as HTMLElement | null;
      if (!card) return;

      const data = {
        id: card.dataset.id,
        title: card.dataset.title,
        desc: card.dataset.desc,
        price: card.dataset.price,
        thumb: card.dataset.thumb,
      };

      ev.preventDefault();
      currentData = data;
      open(data);
      // update add/remove button states based on current cart membership (by id)
      const qty = getCartQty(data.id);
      if (qty > 0) {
        if (addBtn) addBtn.textContent = `장바구니 +1`;
      } else {
        if (addBtn) addBtn.textContent = "장바구니 담기";
      }
      // update favorite button state
      const fav = isFavorited(data.title);
      if (favBtn) {
        if (fav) {
          favBtn.classList.add("is-favorited");
          favBtn.textContent = "즐겨찾기 해제";
        } else {
          favBtn.classList.remove("is-favorited");
          favBtn.textContent = "즐겨찾기";
        }
      }
      return;
    }

    // close on backdrop or data-dismiss
    if (el.matches("[data-dismiss=modal]") || el.closest("[data-dismiss=modal]")) {
      close();
    }

    // add-to-cart inside modal
    if (el.closest(".product-modal__add")) {
      if (!currentData || !currentData.id) return;
      const id = currentData.id;
      const title = currentData.title ?? "상품";
      const items = getCartItems();
      const found = items.find((x) => x.id === id);
      if (found) {
        found.qty = Math.max(1, found.qty + 1);
      } else {
        items.push({ id, qty: 1 });
      }
      setCartItems(items);
      document.dispatchEvent(new CustomEvent("cart:changed", { detail: { id } }));
      showToast(`${title}이(가) 장바구니에 추가되었습니다`);
      // update UI quickly
      if (addBtn) addBtn.textContent = `장바구니 +1`;
      close();
      return;
    }

    // (product-modal__remove button removed from markup) skip remove-from-modal behavior

    // favorite toggle
    if (el.closest(".product-modal__fav")) {
      if (!currentData || !currentData.id) return;
      const id = currentData.id;
      const title = currentData.title ?? "상품";
      const favs = getFavorites();
      if (favs.includes(id)) {
        // remove
        const remaining = favs.filter((x) => x !== id);
        setFavorites(remaining);
        document.dispatchEvent(new CustomEvent("favorites:changed", { detail: { id } }));
        showToast(`${title}이(가) 즐겨찾기에서 제거되었습니다`);
        favBtn?.classList.remove("is-favorited");
        if (favBtn) favBtn.textContent = "즐겨찾기";
      } else {
        favs.push(id);
        setFavorites(favs);
        document.dispatchEvent(new CustomEvent("favorites:changed", { detail: { id } }));
        showToast(`${title}이(가) 즐겨찾기에 추가되었습니다`);
        favBtn?.classList.add("is-favorited");
        if (favBtn) favBtn.textContent = "즐겨찾기 해제";
      }
      return;
    }
  });

  closeBtn?.addEventListener("click", close);

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") close();
  });
}

export default initProductQuickView;
