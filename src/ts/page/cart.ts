import "../../css/page/cart.css";
import { log } from "../function/log";
import products from "../../data/products.json";
import { showToast } from "../module/info/toast";
import ordersModule from "../module/orders";
import * as auth from "../module/auth";
import storage from "../module/storage";
import { showConfirmDialog } from "../module/modal";

type Product = {
  id?: string;
  title: string;
  price: string;
  desc: string;
  thumb?: string;
};
type CartItem = { id: string; qty: number };

// get & set 장바구니 항목을 불러오고 저장하는 함수
function getCartItems(): CartItem[] {
  const raw = storage.getItemPrefer("cartItems");
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed) && parsed.length && typeof parsed[0] === "string") {
    const converted = (parsed as string[])
      .map((s) => {
        const p = (products as Product[]).find((x) => x.id === s || x.title === s);
        if (p?.id) return { id: p.id, qty: 1 } as CartItem;
        return { id: s, qty: 1 } as CartItem;
      })
      .filter(Boolean);
    setCartItems(converted);
    return converted;
  }
  return parsed as CartItem[];
}

function setCartItems(items: CartItem[]) {
  storage.setItemPrefer("cartItems", JSON.stringify(items));
  document.dispatchEvent(
    new CustomEvent("cart:changed", {
      detail: { count: items.reduce((s, i) => s + i.qty, 0) },
    }),
  );
}

// 가격 문자열을 숫자로 파싱하는 함수
function parsePrice(raw?: string) {
  if (!raw) return 0;
  const digits = raw.replace(/[^0-9]/g, "");
  return parseInt(digits || "0", 10);
}

// 숫자를 가격 문자열로 포맷팅하는 함수
function formatPriceNumber(n: number) {
  return "₩" + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function initCart() {
  log("cart");

  const root = document.getElementById("app");
  if (!root) return;
  const rootEl = root as HTMLElement;

  const tplEmpty = document.getElementById("tpl-cart-empty") as HTMLTemplateElement | null;
  const tplHeader = document.getElementById("tpl-cart-header") as HTMLTemplateElement | null;
  const tplList = document.getElementById("tpl-cart-list") as HTMLTemplateElement | null;
  const tplItem = document.getElementById("tpl-cart-item") as HTMLTemplateElement | null;
  const tplTotal = document.getElementById("tpl-cart-total") as HTMLTemplateElement | null;
  const tplOrder = document.getElementById("tpl-cart-order") as HTMLTemplateElement | null;

  if (!tplEmpty || !tplHeader || !tplList || !tplItem || !tplTotal || !tplOrder) return;

  const tplEmptyEl = tplEmpty;
  const tplHeaderEl = tplHeader;
  const tplListEl = tplList;
  const tplItemEl = tplItem;
  const tplTotalEl = tplTotal;
  const tplOrderEl = tplOrder;

  function render() {
    const items = getCartItems();
    const found = items
      .map((it) => ({
        item: it,
        product: (products as Product[]).find((p) => p.id === it.id),
      }))
      .filter((x) => x.product) as { item: CartItem; product: Product }[];

    rootEl.innerHTML = "";

    if (!found.length) {
      rootEl.appendChild(tplEmptyEl.content.cloneNode(true));
      return;
    }

    const headerFrag = tplHeaderEl.content.cloneNode(true) as DocumentFragment;
    const headerTitle = headerFrag.querySelector<HTMLElement>(".cart-header__title");
    if (headerTitle) headerTitle.textContent = `장바구니 (${found.length})`;
    rootEl.appendChild(headerFrag);

    const listFrag = tplListEl.content.cloneNode(true) as DocumentFragment;
    const list = listFrag.querySelector<HTMLElement>(".cart-list");
    if (!list) return;

    found.forEach(({ item, product: p }) => {
      const cardFrag = tplItemEl.content.cloneNode(true) as DocumentFragment;
      const cardEl = cardFrag.querySelector<HTMLElement>(".product-card");
      if (!cardEl) return;

      const subtotal = parsePrice(p.price) * (item.qty || 1);

      const thumb = cardEl.querySelector<HTMLElement>(".product-thumb");
      if (thumb) thumb.textContent = p.thumb ?? "📦";

      const title = cardEl.querySelector<HTMLElement>(".product-title");
      if (title) title.textContent = p.title;

      const desc = cardEl.querySelector<HTMLElement>(".product-desc");
      if (desc) desc.textContent = p.desc;

      const price = cardEl.querySelector<HTMLElement>(".price");
      if (price) {
        price.textContent = "";
        const baseText = `${formatPriceNumber(parsePrice(p.price))} x ${item.qty} = `;
        price.appendChild(document.createTextNode(baseText));
        const strong = document.createElement("strong");
        strong.textContent = formatPriceNumber(subtotal);
        price.appendChild(strong);
      }

      const qtyValue = cardEl.querySelector<HTMLElement>(".qty-value");
      if (qtyValue) qtyValue.textContent = String(item.qty);

      const decBtn = cardEl.querySelector<HTMLButtonElement>(".qty-decrease");
      if (decBtn) decBtn.disabled = item.qty <= 1;

      list.appendChild(cardFrag);
    });

    rootEl.appendChild(listFrag);

    rootEl.querySelectorAll<HTMLButtonElement>(".qty-increase").forEach((btn, i) => {
      btn.addEventListener("click", () => {
        const all = getCartItems();
        const id = found[i].item.id;
        const target = all.find((x) => x.id === id);
        if (!target) return;
        target.qty = target.qty + 1;
        setCartItems(all);
        showToast(`${found[i].product.title} 수량이 증가했습니다`);
        render();
      });
    });

    rootEl.querySelectorAll<HTMLButtonElement>(".qty-decrease").forEach((btn, i) => {
      btn.addEventListener("click", () => {
        const all = getCartItems();
        const id = found[i].item.id;
        const target = all.find((x) => x.id === id);
        if (!target) return;
        if (target.qty > 1) {
          target.qty = target.qty - 1;
          setCartItems(all);
          showToast(`${found[i].product.title} 수량이 감소했습니다`);
        } else {
          showToast(`${found[i].product.title}의 최소 수량은 1개입니다`);
        }
        render();
      });
    });

    rootEl.querySelectorAll<HTMLButtonElement>(".btn-remove").forEach((btn, i) => {
      btn.addEventListener("click", () => {
        const all = getCartItems();
        const toRemoveId = found[i].item.id;
        const remaining = all.filter((x) => x.id !== toRemoveId);
        setCartItems(remaining);
        showToast(`${found[i].product.title}이(가) 장바구니에서 제거되었습니다`);
        render();
      });
    });

    const clearBtn = rootEl.querySelector<HTMLButtonElement>(".clear-cart");
    clearBtn?.addEventListener("click", () => {
      setCartItems([]);
      showToast(`장바구니가 비워졌습니다`);
      render();
    });

    // 총합
    const total = found.reduce((acc, cur) => acc + parsePrice(cur.product.price) * cur.item.qty, 0);
    const totalFrag = tplTotalEl.content.cloneNode(true) as DocumentFragment;
    const totalValue = totalFrag.querySelector<HTMLElement>(".cart-total__value");
    if (totalValue) totalValue.textContent = formatPriceNumber(total);
    rootEl.appendChild(totalFrag);

    // 주문/결제 버튼
    const orderFrag = tplOrderEl.content.cloneNode(true) as DocumentFragment;
    rootEl.appendChild(orderFrag);

    const orderBtn = rootEl.querySelector<HTMLButtonElement>(".order-btn");
    orderBtn?.addEventListener("click", async () => {
      const current = getCartItems();
      if (!current.length) {
        showToast("장바구니가 비어있습니다");
        return;
      }

      // 진행하려면 로그인 필요
      if (!storage.isAuthed()) {
        const goToLogin = await showConfirmDialog({
          message: "주문하려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?",
          confirmText: "확인",
          cancelText: "취소",
        });
        if (!goToLogin) return;

        sessionStorage.setItem("postLoginReturnTo", "cart");

        window.location.href = "../page/info.html";
        return;
      }

      const confirmed = confirm("주문을 진행하시겠습니까?");
      if (!confirmed) return;

      // 주문 객체 생성 후 주문 저장소에 저장
      const totalAmount = found.reduce((acc, cur) => acc + parsePrice(cur.product.price) * cur.item.qty, 0);
      const order = {
        id: ordersModule.generateOrderId(),
        username: sessionStorage.getItem(auth.LOGIN_USER_KEY) || undefined,
        items: current,
        total: totalAmount,
        date: new Date().toISOString(),
        status: "접수",
      };
      ordersModule.addOrder(order);

      sessionStorage.setItem("lastOrderId", order.id);

      setCartItems([]);
      showToast("주문이 접수되었습니다. 감사합니다 🙏");

      window.location.href = "../page/info.html";
    });
  }

  render();
}
