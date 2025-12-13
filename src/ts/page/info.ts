import "../../css/page/info.css";

import { log } from "../function/log";
import * as auth from "../module/auth";
import { setupAddressManage } from "../module/info/address-manage";
import { setupChangePassword } from "../module/info/password";
import { setupContactModal } from "../module/info/contact";
import { setupFindPassword, setupFindUsername } from "../module/info/recovery";
import { populateInfoPage, setupProfileUploader } from "../module/info/profile";
import { hideSignup, setupSignup, showSignup } from "../module/info/signup";
import storage, { migrateSessionToLocal } from "../module/storage";
import { showToast } from "../module/info/toast";
import products from "../../data/products.json";
import ordersModule, { Order } from "../module/orders";

export function initInfo() {
  log("info");
  setupInfoLogin();
  setupChangePassword();
  setupContactModal();
  setupAddressManage();
}

function setupInfoLogin() {
  const loginSection = document.querySelector<HTMLElement>(".info-login");
  const signupSection = document.querySelector<HTMLElement>(".info-signup");
  const infoPage = document.querySelector<HTMLElement>(".info-page");

  const form = document.querySelector(
    "#info-login-form"
  ) as HTMLFormElement | null;

  if (!loginSection || !infoPage || !form) return;

  const feedback = form.querySelector<HTMLElement>(".info-login__feedback");

  const submitButton = form.querySelector<HTMLButtonElement>(
    ".info-login__submit"
  );
  const signupTrigger = document.querySelector<HTMLButtonElement>(
    ".js-info-open-signup"
  );

  const signupBackButton = signupSection?.querySelector<HTMLButtonElement>(
    '[data-action="back"]'
  );

  if (signupTrigger && signupSection) {
    signupTrigger.addEventListener("click", () =>
      showSignup(loginSection, signupSection)
    );
  }
  if (signupBackButton && signupSection) {
    signupBackButton.addEventListener("click", () =>
      hideSignup(loginSection, signupSection)
    );
  }

  setupFindUsername();
  setupFindPassword();

  const sessionAuthed =
    sessionStorage.getItem(auth.LOGIN_STORAGE_KEY) === "true";
  const authedUsernameSession = sessionStorage.getItem(auth.LOGIN_USER_KEY);

  const authedUsername = authedUsernameSession;

  if (sessionAuthed && authedUsername) {
    
    const authedUser = auth.findUserByUsername(authedUsernameSession);

    if (authedUser) {
      populateInfoPage(authedUser);
      setupProfileUploader();
      setupChangePassword();
      setupContactModal();
      setupAddressManage();
      revealInfoPage(loginSection, infoPage, signupSection ?? undefined);
      // render orders list for this user
      renderOrders(authedUser.username);
      try {
        const lastId = sessionStorage.getItem("lastOrderId");
        if (lastId) {
          sessionStorage.removeItem("lastOrderId");
          const userOrders = ordersModule.getOrders(authedUser.username);
          const target = userOrders.find((o) => o.id === lastId);
          if (target) showOrderDetailsModal(target);
        }
      } catch {}

      const logoutBtnRestored = document.getElementById(
        "js-info-logout"
      ) as HTMLButtonElement | null;
      logoutBtnRestored?.addEventListener("click", () => {
        sessionStorage.removeItem(auth.LOGIN_STORAGE_KEY);
        sessionStorage.removeItem(auth.LOGIN_USER_KEY);
        localStorage.removeItem(auth.LOGIN_STORAGE_KEY);
        localStorage.removeItem(auth.LOGIN_USER_KEY);
        // remove local cart and favorites on logout to avoid previous user's data remaining in localStorage
        try {
          localStorage.removeItem("cartItems");
          localStorage.removeItem("favorites");
        } catch {}
        try {
          showToast("로그아웃되어 로컬 데이터가 삭제되었습니다.");
        } catch {}

        if (feedback) {
          feedback.textContent = "로그아웃 버튼으로 로그아웃 성공";
          feedback.classList.remove("is-success");
        }
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "로그인";
        }

        loginSection.classList.remove("d-none");
        infoPage.classList.add("d-none");
      });
      return;
    }
    sessionStorage.removeItem(auth.LOGIN_STORAGE_KEY);
    sessionStorage.removeItem(auth.LOGIN_USER_KEY);
  } else {
    localStorage.removeItem(auth.LOGIN_STORAGE_KEY);
    localStorage.removeItem(auth.LOGIN_USER_KEY);
  }

  setupSignup(signupSection, loginSection);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const usernameInput = form.querySelector<HTMLInputElement>(
      ".js-login-username"
    ) as HTMLInputElement | null;
    const passwordInput = form.querySelector<HTMLInputElement>(
      ".js-login-password"
    ) as HTMLInputElement | null;

    if (!usernameInput || !passwordInput || !feedback) return;

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showFeedback(feedback, "아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    const matchedUser = auth.findUserByUsername(username);
    if (!matchedUser || matchedUser.password !== password) {
      showFeedback(
        feedback,
        "계정 정보가 일치하지 않습니다. 다시 확인해주세요."
      );
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "로그인 중...";
    }

    showFeedback(feedback, "로그인에 성공했어요!", true);

    sessionStorage.setItem(auth.LOGIN_STORAGE_KEY, "true");
    sessionStorage.setItem(auth.LOGIN_USER_KEY, matchedUser.username);

    localStorage.removeItem(auth.LOGIN_STORAGE_KEY);
    localStorage.removeItem(auth.LOGIN_USER_KEY);
    populateInfoPage(matchedUser);
    setupProfileUploader();
    setupChangePassword();
    setupContactModal();
    setupAddressManage();
    form.reset();
    revealInfoPage(loginSection, infoPage, signupSection ?? undefined);

    // migrate session items (cart/favorites) into local storage when logging in
    try {
      const summary = migrateSessionToLocal();
      // build a friendly message: map ids to product titles
      const productMap: Record<string, string> = {};
      (products as any[]).forEach((p) => {
        if (p?.id && p?.title) productMap[p.id] = p.title;
      });
      const lines: string[] = [];
      if (summary.cart && summary.cart.length) {
        lines.push("장바구니에 병합된 항목:");
        summary.cart.forEach((c) => {
          const title = productMap[c.id] ?? c.id;
          lines.push(`- ${title}: 기존 ${c.prev} → ${c.now} (추가 ${c.added})`);
        });
      }
      if (summary.favorites && summary.favorites.length) {
        lines.push("즐겨찾기에서 병합된 항목:");
        summary.favorites.forEach((id) => {
          const title = productMap[id] ?? id;
          lines.push(`- ${title}`);
        });
      }
      if (lines.length) {
        showMergeSummaryModal(lines.join("\n"));
      }
    } catch (err) {
      // ignore errors
    }
    // if login was triggered by checkout flow, redirect back to cart
    try {
      const r = sessionStorage.getItem("postLoginReturnTo");
      if (r === "cart") {
        sessionStorage.removeItem("postLoginReturnTo");
        window.location.href = "../page/cart.html";
        return;
      }
    } catch {}

    const logoutBtn = document.getElementById(
      "js-info-logout"
    ) as HTMLButtonElement | null;
    logoutBtn?.addEventListener("click", () => {
      sessionStorage.removeItem(auth.LOGIN_STORAGE_KEY);
      sessionStorage.removeItem(auth.LOGIN_USER_KEY);
      localStorage.removeItem(auth.LOGIN_STORAGE_KEY);
      localStorage.removeItem(auth.LOGIN_USER_KEY);
      try {
        localStorage.removeItem("cartItems");
        localStorage.removeItem("favorites");
      } catch {}
      try {
        showToast("로그아웃되어 로컬 데이터가 삭제되었습니다.");
      } catch {}

      if (feedback) {
        feedback.textContent = "로그아웃 성공";
        feedback.classList.remove("is-success");
      }
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "로그인";
      }

      loginSection.classList.remove("d-none");
      infoPage.classList.add("d-none");
    });
  });
}

function showMergeSummaryModal(message: string) {
  const existing = document.getElementById("merge-summary-modal");
  if (existing) {
    existing.remove();
  }
  const modal = document.createElement("div");
  modal.id = "merge-summary-modal";
  modal.className = "product-modal"; // reuse modal styling
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-hidden", "false");
  modal.innerHTML = `
    <div class="product-modal__backdrop" data-dismiss="modal"></div>
    <div class="product-modal__panel" role="document">
      <button class="product-modal__close" aria-label="닫기">✕</button>
      <div class="product-modal__body">
        <div class="product-modal__info">
          <h3 class="product-modal__title">로그인으로 병합된 항목</h3>
          <pre style="white-space:pre-wrap;">${escapeHtml(message)}</pre>
          <div style="text-align:right;margin-top:12px;"><button class="primary-btn merge-ok">확인</button></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  // show modal by removing d-none if present
  modal.classList.remove("d-none");
  // focus the close button
  const closeBtn = modal.querySelector(
    ".product-modal__close"
  ) as HTMLElement | null;
  const okBtn = modal.querySelector(".merge-ok") as HTMLElement | null;
  try {
    closeBtn?.focus();
  } catch {}
  function closeModal() {
    modal.remove();
  }
  closeBtn?.addEventListener("click", closeModal);
  okBtn?.addEventListener("click", closeModal);
  modal
    .querySelectorAll("[data-dismiss=modal]")
    .forEach((el) => el.addEventListener("click", closeModal));
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatPrice(n: number) {
  return "₩" + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function renderOrders(username?: string) {
  const list = document.querySelector<HTMLUListElement>(".orders-list");
  if (!list) return;
  // clear existing
  list.innerHTML = "";
  const orders = ordersModule.getOrders(
    username ?? (sessionStorage.getItem(auth.LOGIN_USER_KEY) || undefined)
  );
  if (!orders || !orders.length) {
    list.innerHTML = `<li class="order-item"><div class="order-item__body">주문 내역이 없습니다.</div></li>`;
    return;
  }

  const productMap: Record<string, any> = {};
  (products as any[]).forEach((p) => {
    if (p?.id) productMap[p.id] = p;
  });

  orders.forEach((o) => {
    const li = document.createElement("li");
    li.className = "order-item";
    const date = new Date(o.date);
    const first = o.items[0];
    const firstProduct = productMap[first?.id];
    const title = firstProduct?.title ?? first?.id ?? "상품";
    const extra = o.items.length > 1 ? `외 ${o.items.length - 1}개` : ``;
    li.innerHTML = `
      <div class="order-item__meta">
        <div class="order-id">${escapeHtml(o.id)}</div>
        <div class="order-date">${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}</div>
      </div>
      <div class="order-item__body">${escapeHtml(title)} × ${
      o.items[0].qty
    } ${escapeHtml(extra)} — 결제금액 ${formatPrice(o.total)}</div>
      <div class="order-item__actions"><a href="#" class="link js-order-detail" data-order-id="${escapeHtml(
        o.id
      )}">주문상세</a></div>
    `;
    list.appendChild(li);
  });

  // attach click listeners
  list.querySelectorAll<HTMLAnchorElement>(".js-order-detail").forEach((a) => {
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      const id = a.dataset.orderId;
      if (!id) return;
      const order = orders.find((x) => x.id === id);
      if (!order) return;
      showOrderDetailsModal(order);
    });
  });
}

function showOrderDetailsModal(order: Order) {
  const existing = document.getElementById("order-details-modal");
  if (existing) existing.remove();
  const modal = document.createElement("div");
  modal.id = "order-details-modal";
  modal.className = "product-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-hidden", "false");
  const productMap: Record<string, any> = {};
  (products as any[]).forEach((p) => {
    if (p?.id) productMap[p.id] = p;
  });
  const rows = order.items
    .map((it) => {
      const p = productMap[it.id];
      return `<li>${escapeHtml(p?.title ?? it.id)} × ${it.qty} — ${formatPrice(
        (parseInt((p?.price || "0").replace(/[^0-9]/g, ""), 10) || 0) * it.qty
      )}</li>`;
    })
    .join("");
  modal.innerHTML = `
    <div class="product-modal__backdrop" data-dismiss="modal"></div>
    <div class="product-modal__panel" role="document">
      <button class="product-modal__close" aria-label="닫기">✕</button>
      <div class="product-modal__body">
        <div class="product-modal__info">
          <h3 class="product-modal__title">주문 상세: ${escapeHtml(
            order.id
          )}</h3>
          <div class="product-modal__desc">주문일: ${new Date(
            order.date
          ).toLocaleString()}</div>
          <ul>${rows}</ul>
          <div style="text-align:right;margin-top:12px;">총 합계: <strong>${formatPrice(
            order.total
          )}</strong></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const closeBtn = modal.querySelector<HTMLButtonElement>(
    ".product-modal__close"
  ) as HTMLButtonElement | null;
  const dismiss = () => modal.remove();
  closeBtn?.addEventListener("click", dismiss);
  modal
    .querySelectorAll("[data-dismiss=modal]")
    .forEach((el) => el.addEventListener("click", dismiss));
  try {
    (closeBtn as HTMLElement | null)?.focus();
  } catch {}
}

function revealInfoPage(
  loginSection: HTMLElement,
  infoPage: HTMLElement,
  signupSection?: HTMLElement
) {
  loginSection.classList.add("d-none");
  if (signupSection) signupSection.classList.add("d-none");
  infoPage.classList.remove("d-none");
}

function showFeedback(target: HTMLElement, message: string, success = false) {
  target.textContent = message;
  target.classList.toggle("is-success", success);
}
