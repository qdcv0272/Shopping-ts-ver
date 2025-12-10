import "../../css/page/favorites.css";
import { log } from "../function/log";
import products from "../../data/products.json";
import { showToast } from "../module/info/toast";
import storage from "../module/storage";

type Product = { id?: string; title: string; price: string; desc: string; thumb?: string };

function getFavorites(): string[] {
  try {
    const raw = storage.getItemPrefer("favorites");
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function setFavorites(items: string[]) {
  try {
    storage.setItemPrefer("favorites", JSON.stringify(items));
    document.dispatchEvent(new CustomEvent("favorites:changed", { detail: { count: items.length } }));
  } catch {}
}

export function initFavorites() {
  log("favorites");

  const root = document.getElementById("app");
  if (!root) return;
  const rootEl = root as HTMLElement;

  function render() {
    const items = getFavorites();
    const found = items
      .map((id) => ({ id, product: (products as Product[]).find((p) => p.id === id) }))
      .filter((x) => x.product) as { id: string; product: Product }[];

    rootEl.innerHTML = "";

    if (!found.length) {
      rootEl.innerHTML = `<div class="demo-section"><h2>즐겨찾기가 비어있습니다</h2><p>마음에 드는 상품을 즐겨찾기에 추가해보세요.</p></div>`;
      return;
    }

    const header = document.createElement("div");
    header.className = "demo-section";
    header.innerHTML = `<div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px\"><div><h2>즐겨찾기 (${found.length})</h2><div style=\"color:#475569;font-size:13px\">저장한 상품을 관리하세요.</div></div><div><button class=\"primary-btn move-all\">모두 장바구니로 담기</button></div></div>`;
    rootEl.appendChild(header);

    const list = document.createElement("div");
    list.className = "products-grid";

    found.forEach(({ product: p }) => {
      const card = document.createElement("article");
      card.className = "product-card";

      card.innerHTML = `
        <div class="product-thumb" aria-hidden="true">${p.thumb ?? "📦"}</div>
        <div class="product-meta">
          <div class="product-title">${p.title}</div>
          <div class="product-desc">${p.desc}</div>
          <div class="product-bottom"><div class="price">${
            p.price ?? "₩0"
          }</div><div><button class=\"ghost-btn btn-unfav\">즐겨찾기 해제</button></div></div>
        </div>
      `;

      list.appendChild(card);
    });

    rootEl.appendChild(list);

    // hook up un-favorite buttons
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
    // hook up move-all button: move all favorites to cart (increase qty if exist)
    const moveAll = header.querySelector<HTMLButtonElement>(".move-all");
    moveAll?.addEventListener("click", () => {
      const favIds = getFavorites();
      if (!favIds.length) return;
      // merge into cart
      try {
        const raw = storage.getItemPrefer("cartItems");
        const cart = raw ? (JSON.parse(raw) as { id: string; qty: number }[]) : [];
        favIds.forEach((id) => {
          const found = cart.find((c) => c.id === id);
          if (found) found.qty = found.qty + 1;
          else cart.push({ id, qty: 1 });
        });
        storage.setItemPrefer("cartItems", JSON.stringify(cart));
        document.dispatchEvent(new CustomEvent("cart:changed", { detail: { count: cart.reduce((s, i) => s + i.qty, 0) } }));
        // clear moved favorites
        setFavorites([]);
        document.dispatchEvent(new CustomEvent("favorites:changed", { detail: { moved: favIds.length } }));
        showToast(`즐겨찾기 항목을 모두 장바구니로 옮겼습니다`);
        render();
      } catch {
        // noop
      }
    });
  }

  render();
}
