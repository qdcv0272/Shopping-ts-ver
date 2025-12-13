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

function getCartItems(): CartItem[] {
  try {
    const raw = storage.getItemPrefer("cartItems");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length &&
      typeof parsed[0] === "string"
    ) {
      // migrate from string[] (title or id) -> CartItem[]
      const converted = (parsed as string[])
        .map((s) => {
          const p = (products as Product[]).find(
            (x) => x.id === s || x.title === s
          );
          if (p?.id) return { id: p.id, qty: 1 } as CartItem;
          return { id: s, qty: 1 } as CartItem;
        })
        .filter(Boolean);
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
    document.dispatchEvent(
      new CustomEvent("cart:changed", {
        detail: { count: items.reduce((s, i) => s + i.qty, 0) },
      })
    );
  } catch {}
}

function parsePrice(raw?: string) {
  if (!raw) return 0;
  const digits = raw.replace(/[^0-9]/g, "");
  return parseInt(digits || "0", 10);
}

function formatPriceNumber(n: number) {
  return "₩" + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function initCart() {
  log("cart");

  const root = document.getElementById("app");
  if (!root) return;
  const rootEl = root as HTMLElement;

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
      rootEl.innerHTML = `<div class=\"demo-section\"><h2>장바구니가 비어있습니다</h2><p>상품을 둘러보고 장바구니에 담아보세요.</p></div>`;
      return;
    }

    // header with count and clear-all
    const header = document.createElement("div");
    header.className = "demo-section";
    header.innerHTML = `<div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px\"><div><h2>장바구니 (${found.length})</h2><div style=\"color:#475569;font-size:13px\">담긴 상품을 확인하고 결제하세요.</div></div><div><button class=\"accent-btn clear-cart\">비우기</button></div></div>`;
    rootEl.appendChild(header);

    const list = document.createElement("div");
    list.className = "products-grid";

    found.forEach(({ item, product: p }) => {
      const card = document.createElement("article");
      card.className = "product-card";

      const subtotal = parsePrice(p.price) * (item.qty || 1);

      card.innerHTML = `
        <div class="product-thumb" aria-hidden="true">${p.thumb ?? "📦"}</div>
        <div class="product-meta">
          <div class="product-title">${p.title}</div>
          <div class="product-desc">${p.desc}</div>
          <div class="product-bottom">
            <div class="price">${formatPriceNumber(parsePrice(p.price))} x ${
        item.qty
      } = <strong>${formatPriceNumber(subtotal)}</strong></div>
            <div class="qty-controls">
              <button class=\"circle-btn qty-decrease\" ${
                item.qty <= 1 ? "disabled" : ""
              } aria-label="수량 감소">−</button>
              <span class=\"qty-value\" aria-live="polite">${item.qty}</span>
              <button class=\"circle-btn qty-increase\" aria-label="수량 증가">＋</button>
              <button class=\"danger-btn btn-remove\" aria-label="항목 제거">제거</button>
            </div>
          </div>
        </div>
      `;

      list.appendChild(card);
    });

    rootEl.appendChild(list);

    // hook up qty and remove buttons
    rootEl
      .querySelectorAll<HTMLButtonElement>(".qty-increase")
      .forEach((btn, i) => {
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

    rootEl
      .querySelectorAll<HTMLButtonElement>(".qty-decrease")
      .forEach((btn, i) => {
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
            // minimum qty is 1 — do not remove here, use 제거 버튼 instead
            showToast(`${found[i].product.title}의 최소 수량은 1개입니다`);
          }
          render();
        });
      });

    rootEl
      .querySelectorAll<HTMLButtonElement>(".btn-remove")
      .forEach((btn, i) => {
        btn.addEventListener("click", () => {
          const all = getCartItems();
          const toRemoveId = found[i].item.id;
          const remaining = all.filter((x) => x.id !== toRemoveId);
          setCartItems(remaining);
          showToast(
            `${found[i].product.title}이(가) 장바구니에서 제거되었습니다`
          );
          render();
        });
      });

    const clearBtn = rootEl.querySelector<HTMLButtonElement>(".clear-cart");
    clearBtn?.addEventListener("click", () => {
      setCartItems([]);
      showToast(`장바구니가 비워졌습니다`);
      render();
    });

    // total
    const total = found.reduce(
      (acc, cur) => acc + parsePrice(cur.product.price) * cur.item.qty,
      0
    );
    const totalEl = document.createElement("div");
    totalEl.className = "demo-section";
    totalEl.innerHTML = `<div style=\"display:flex;justify-content:flex-end;align-items:center;gap:12px;\"><div style=\"font-size:18px;font-weight:800\">총 합계: ${formatPriceNumber(
      total
    )}</div></div>`;
    rootEl.appendChild(totalEl);

    // order / checkout button
    const orderWrap = document.createElement("div");
    orderWrap.className = "demo-section";
    orderWrap.innerHTML = `<div style=\"display:flex;justify-content:flex-end;align-items:center;gap:12px;\"><button class=\"primary-btn order-btn\">주문하기</button></div>`;
    rootEl.appendChild(orderWrap);

    const orderBtn = orderWrap.querySelector<HTMLButtonElement>(".order-btn");
    orderBtn?.addEventListener("click", async () => {
      const current = getCartItems();
      if (!current.length) {
        showToast("장바구니가 비어있습니다");
        return;
      }

      // require login to proceed
      if (!storage.isAuthed()) {
        const goToLogin = await showConfirmDialog({
          message:
            "주문하려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?",
          confirmText: "확인",
          cancelText: "취소",
        });
        if (!goToLogin) return;
        try {
          sessionStorage.setItem("postLoginReturnTo", "cart");
        } catch {}
        window.location.href = "../page/info.html";
        return;
      }

      const confirmed = confirm("주문을 진행하시겠습니까?");
      if (!confirmed) return;

      // create order object, save to orders storage
      const totalAmount = found.reduce(
        (acc, cur) => acc + parsePrice(cur.product.price) * cur.item.qty,
        0
      );
      const order = {
        id: ordersModule.generateOrderId(),
        username: sessionStorage.getItem(auth.LOGIN_USER_KEY) || undefined,
        items: current,
        total: totalAmount,
        date: new Date().toISOString(),
        status: "접수",
      };
      ordersModule.addOrder(order);
      try {
        sessionStorage.setItem("lastOrderId", order.id);
      } catch {}
      setCartItems([]);
      showToast("주문이 접수되었습니다. 감사합니다 🙏");
      // navigate to info page so user can see orders
      window.location.href = "../page/info.html";
    });
  }

  render();
}
