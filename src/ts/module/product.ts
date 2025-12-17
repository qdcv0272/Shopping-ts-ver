import gsap from "gsap";
import { showToast } from "./info/toast";
import storage from "./storage";
import products from "../../data/products.json";

// 상품 상세보기 모달 초기화 및 이벤트 핸들러 등록
export function initProductQuickView(): void {
  if (typeof window === "undefined") return;

  const modal = document.getElementById("product-modal");
  if (!modal) return;
  const modalEl = modal as HTMLElement;

  const titleEl = modalEl.querySelector<HTMLElement>(".product-modal__title"); // 상품명
  const descEl = modalEl.querySelector<HTMLElement>(".product-modal__desc"); // 상품 설명
  const priceEl = modalEl.querySelector<HTMLElement>(".product-modal__price"); // 가격
  const thumbEl = modalEl.querySelector<HTMLElement>(".product-modal__thumb"); // 썸네일
  const closeBtn = modalEl.querySelector<HTMLElement>(".product-modal__close"); // 닫기 버튼
  const addBtn = modalEl.querySelector<HTMLButtonElement>(
    ".product-modal__add"
  ); // 장바구니 추가 버튼
  const favBtn = modalEl.querySelector<HTMLButtonElement>(
    ".product-modal__fav"
  ); // 즐겨찾기 버튼

  let isOpen = false; // 열고 닫기
  let isAnimating = false; // 애니메이션 중복 방지
  let lastFocusedBeforeOpen: HTMLElement | null = null; // 모달 열기 전 포커스된 엘리먼트
  // 현재 보고 있는 상품 데이터
  type ProductPreview = {
    id?: string;
    title?: string;
    desc?: string;
    price?: string;
    thumb?: string;
  };

  let currentData: ProductPreview | null = null; // 현재 보고 있는 상품 데이터

  type CartItem = { id: string; qty: number }; // 장바구니 아이템 타입

  document.addEventListener("click", (e) => {
    const el = e.target as HTMLElement;

    // 퀵뷰 열기
    if (el.closest(".quick-view")) {
      console.log("상세보기");
      const card = el.closest(".product-card") as HTMLElement | null;
      if (!card) return;

      const data = {
        id: card.dataset.id,
        title: card.dataset.title,
        desc: card.dataset.desc,
        price: card.dataset.price,
        thumb: card.dataset.thumb,
      };

      e.preventDefault();
      currentData = data;
      open(data);

      const qty = getCartQty(data.id);

      qty > 0
        ? addBtn?.classList.add("is-added")
        : addBtn?.classList.remove("is-added");

      // 즐겨찾기 여부는 ID를 우선 확인하고, ID가 없으면 title로도 확인합니다.
      const fav = isFavorited(data.id ?? data.title);
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

    if (
      el.matches("[data-dismiss=modal]") ||
      el.closest("[data-dismiss=modal]")
    ) {
      close();
    }

    if (el.closest(".product-modal__add")) {
      if (!currentData || !currentData.id) return;
      const id = currentData.id;
      const title = currentData.title ?? "상품";
      const items = getCartItems();
      const found = items.find((x) => x.id === id);

      found
        ? (found.qty = Math.max(1, found.qty + 1))
        : items.push({ id, qty: 1 });

      setCartItems(items);

      document.dispatchEvent(
        new CustomEvent("cart:changed", { detail: { id } }) // 장바구니 변경 이벤트
      );

      showToast(`${title}이(가) 장바구니에 추가되었습니다`);
      if (addBtn) addBtn.textContent = `장바구니 +1`;
      close();
      return;
    }

    if (el.closest(".product-modal__fav")) {
      if (!currentData || !currentData.id) return;
      const id = currentData.id;
      const title = currentData.title ?? "상품";
      const favs = getFavorites();
      if (favs.includes(id)) {
        const remaining = favs.filter((x) => x !== id);
        setFavorites(remaining);
        document.dispatchEvent(
          new CustomEvent("favorites:changed", { detail: { id } })
        );
        showToast(`${title}이(가) 즐겨찾기에서 제거되었습니다`);
        favBtn?.classList.remove("is-favorited");
        if (favBtn) favBtn.textContent = "즐겨찾기";
      } else {
        favs.push(id);
        setFavorites(favs);
        document.dispatchEvent(
          new CustomEvent("favorites:changed", { detail: { id } })
        );
        showToast(`${title}이(가) 즐겨찾기에 추가되었습니다`);
        favBtn?.classList.add("is-favorited");
        if (favBtn) favBtn.textContent = "즐겨찾기 해제";
      }
      return;
    }
  });

  function open(data: {
    id?: string;
    title?: string;
    desc?: string;
    price?: string;
    thumb?: string;
  }) {
    if (isOpen || isAnimating) return;
    isAnimating = true;

    lastFocusedBeforeOpen = document.activeElement as HTMLElement | null; // 현재 포커스된 엘리먼트 저장
    modalEl.classList.remove("d-none");
    modalEl.setAttribute("aria-hidden", "false");

    if (titleEl) titleEl.textContent = data.title ?? "상품명";
    if (descEl) descEl.textContent = data.desc ?? "상품 설명";
    if (priceEl) priceEl.textContent = data.price ?? "₩0";
    if (thumbEl) thumbEl.textContent = data.thumb ?? "📦";

    const panel = modalEl.querySelector<HTMLElement>(".product-modal__panel");
    if (panel) {
      gsap.set(panel, { autoAlpha: 0, scale: 0.96, y: 10 });
      gsap.to(panel, {
        autoAlpha: 1,
        scale: 1,
        y: 0,
        duration: 0.32,
        ease: "power2.out",
        onComplete: () => {
          isAnimating = false;
          isOpen = true;
          (closeBtn as HTMLElement | null)?.focus(); // 모달 내 닫기 버튼에 포커스 이동
        },
      });
    } else {
      console.warn("@@@@@@@@@@@@@@ 리턴 풀어 @@@@@@@@@@@@@");

      return;
      isAnimating = false;
      isOpen = true;
      (closeBtn as HTMLElement | null)?.focus();
    }
  }

  function isFavorited(id?: string) {
    if (!id) return false;
    const favs = getFavorites();
    if (favs.includes(id)) return true;
    // id가 실제로 title로 전달된 경우를 지원: title로 상품을 찾아 해당 id가 favorites에 있는지 확인
    const p = (products as any[]).find((x) => x.title === id);
    return !!(p && favs.includes(p.id));
  }

  // get & set 즐겨찾기 아이템
  function getFavorites(): string[] {
    const raw = storage.getItemPrefer("favorites");
    if (!raw) return [];
    const parsed = JSON.parse(raw);

    // 이전 버전 호환성: 문자열 id 또는 title 배열 처리
    if (
      Array.isArray(parsed) &&
      parsed.length &&
      typeof parsed[0] === "string"
    ) {
      // legacy: 문자열 id 또는 title 배열을 id 배열로 정규화
      const mapped = (parsed as string[])
        .map((s) => {
          const p = (products as any[]).find(
            (x) => x.id === s || x.title === s
          );
          return p?.id ?? null;
        })
        .filter(Boolean) as string[];
      setFavorites(mapped);
      return mapped;
    }
    return parsed as string[];
  }

  function setFavorites(items: string[]) {
    storage.setItemPrefer("favorites", JSON.stringify(items));
  }

  function close() {
    if (!isOpen || isAnimating) return;
    isAnimating = true;
    const panel = modalEl.querySelector<HTMLElement>(".product-modal__panel");

    if (panel) {
      gsap.to(panel, {
        autoAlpha: 0,
        scale: 0.96,
        y: 10,
        duration: 0.24,
        ease: "power2.in",
        onComplete: finishClose,
      });
    } else {
      finishClose();
    }
  }

  function finishClose() {
    const active = document.activeElement as HTMLElement | null;
    if (active && modalEl.contains(active)) {
      active.blur();
    }
    modalEl.classList.add("d-none");
    modalEl.setAttribute("aria-hidden", "true");

    if (lastFocusedBeforeOpen && !modalEl.contains(lastFocusedBeforeOpen)) {
      lastFocusedBeforeOpen.focus();
    }

    lastFocusedBeforeOpen = null;
    isAnimating = false;
    isOpen = false;
  }

  // get & set 장바구니 아이템
  function getCartItems(): CartItem[] {
    const raw = storage.getItemPrefer("cartItems");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length &&
      typeof parsed[0] === "string"
    ) {
      // legacy: 문자열 id 또는 title 배열을 최신 형태로 변환
      const converted: CartItem[] = (parsed as string[])
        .map((s) => {
          const p = (products as any[]).find(
            (x) => x.id === s || x.title === s
          );
          return p && p.id ? { id: p.id, qty: 1 } : { id: s, qty: 1 };
        })
        .filter(Boolean);
      setCartItems(converted);
      return converted;
    }
    return parsed as CartItem[];
  }

  function setCartItems(items: CartItem[]) {
    storage.setItemPrefer("cartItems", JSON.stringify(items));
  }

  function getCartQty(id?: string) {
    if (!id) return 0;
    const items = getCartItems();
    const found = items.find((x) => x.id === id);
    return found ? found.qty : 0;
  }

  closeBtn?.addEventListener("click", close);

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") close();
  });
}

export default initProductQuickView;
