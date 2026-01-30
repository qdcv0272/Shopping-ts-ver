import "../../css/page/favorites.css";
import { log } from "../function/log";
import products from "../../data/products.json";
import { showToast } from "../module/info/toast";
import storage from "../module/storage";

type Product = {
  id?: string;
  title: string;
  price: string;
  desc: string;
  thumb?: string;
};

// get & set 즐겨찾기 항목을 불러오고 저장하는 함수
function getFavorites(): string[] {
  const raw = storage.getItemPrefer("favorites");
  if (!raw) return [];
  return JSON.parse(raw) as string[];
}

// 저장된 즐겨찾기 항목을 업데이트하는 함수
function setFavorites(items: string[]) {
  storage.setItemPrefer("favorites", JSON.stringify(items));
  document.dispatchEvent(new CustomEvent("favorites:changed", { detail: { count: items.length } }));
}

export function initFavorites() {
  log("favorites");

  const root = document.getElementById("app");
  if (!root) return;
  const rootEl = root as HTMLElement;

  const tplEmpty = document.getElementById("tpl-fav-empty") as HTMLTemplateElement | null;
  const tplHeader = document.getElementById("tpl-fav-header") as HTMLTemplateElement | null;
  const tplList = document.getElementById("tpl-fav-list") as HTMLTemplateElement | null;
  const tplItem = document.getElementById("tpl-fav-item") as HTMLTemplateElement | null;

  if (!tplEmpty || !tplHeader || !tplList || !tplItem) return;

  const tplEmptyEl = tplEmpty;
  const tplHeaderEl = tplHeader;
  const tplListEl = tplList;
  const tplItemEl = tplItem;

  function render() {
    const items = getFavorites();
    const found = items
      .map((id) => ({
        id,
        product: (products as Product[]).find((p) => p.id === id),
      }))
      .filter((x) => x.product) as { id: string; product: Product }[];

    rootEl.innerHTML = "";

    if (!found.length) {
      rootEl.appendChild(tplEmptyEl.content.cloneNode(true));
      return;
    }

    const headerFrag = tplHeaderEl.content.cloneNode(true) as DocumentFragment;
    const headerTitle = headerFrag.querySelector<HTMLElement>(".fav-header__title");
    if (headerTitle) headerTitle.textContent = `즐겨찾기 (${found.length})`;
    rootEl.appendChild(headerFrag);

    const listFrag = tplListEl.content.cloneNode(true) as DocumentFragment;
    const list = listFrag.querySelector<HTMLElement>(".fav-list");
    if (!list) return;

    found.forEach(({ product: p }) => {
      const cardFrag = tplItemEl.content.cloneNode(true) as DocumentFragment;
      const cardEl = cardFrag.querySelector<HTMLElement>(".product-card");
      if (!cardEl) return;

      const thumb = cardEl.querySelector<HTMLElement>(".product-thumb");
      if (thumb) thumb.textContent = p.thumb ?? "📦";

      const title = cardEl.querySelector<HTMLElement>(".product-title");
      if (title) title.textContent = p.title;

      const desc = cardEl.querySelector<HTMLElement>(".product-desc");
      if (desc) desc.textContent = p.desc;

      const price = cardEl.querySelector<HTMLElement>(".price");
      if (price) price.textContent = p.price ?? "₩0";

      list.appendChild(cardFrag);
    });

    rootEl.appendChild(listFrag);

    rootEl.querySelectorAll<HTMLButtonElement>(".btn-unfav").forEach((btn, i) => {
      btn.addEventListener("click", () => {
        const items = getFavorites();
        const toRemove = found[i]?.id;
        const name = found[i]?.product.title;
        if (!toRemove) return;
        const remaining = items.filter((x) => x !== toRemove);
        setFavorites(remaining);
        showToast(`${name}이(가) 즐겨찾기에서 제거되었습니다`);
        render();
      });
    });

    const moveAll = rootEl.querySelector<HTMLButtonElement>(".move-all");
    moveAll?.addEventListener("click", () => {
      const favIds = getFavorites();
      if (!favIds.length) return;

      const raw = storage.getItemPrefer("cartItems");
      const cart = raw ? (JSON.parse(raw) as { id: string; qty: number }[]) : [];
      favIds.forEach((id) => {
        const found = cart.find((c) => c.id === id);
        if (found) found.qty = found.qty + 1;
        else cart.push({ id, qty: 1 });
      });
      storage.setItemPrefer("cartItems", JSON.stringify(cart));
      document.dispatchEvent(
        new CustomEvent("cart:changed", {
          detail: { count: cart.reduce((s, i) => s + i.qty, 0) },
        }),
      );
      // 옮겨진 즐겨찾기 초기화
      setFavorites([]);
      document.dispatchEvent(
        new CustomEvent("favorites:changed", {
          detail: { moved: favIds.length },
        }),
      );
      showToast(`즐겨찾기 항목을 모두 장바구니로 옮겼습니다`);
      render();
    });
  }

  render();
}
