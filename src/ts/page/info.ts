import "../../css/page/info.css";

import { log } from "../function/log"; // 로그 찍기 테스트
import * as auth from "../module/auth"; // 인증 모듈
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
  setupInfoLogin(); // 정보 페이지 로그인 처리
  setupChangePassword(); // 정보 페이지 안에서 비밀번호 변경
  setupContactModal(); // 문의 모달
  setupAddressManage(); // 주소 관리
}

function setupInfoLogin() {
  const loginSection = document.querySelector<HTMLElement>(".info-login"); // 로그인 섹션
  const signupSection = document.querySelector<HTMLElement>(".info-signup"); // 회원가입 섹션
  const infoPage = document.querySelector<HTMLElement>(".info-page"); // 정보 페이지 섹션

  const form = document.querySelector("#info-login-form") as HTMLFormElement | null; // 로그인 폼

  if (!loginSection || !infoPage || !form) return;

  const feedback = form.querySelector<HTMLElement>(".info-login__feedback"); // 피드백 영역

  const submitButton = form.querySelector<HTMLButtonElement>(".info-login__submit"); // 제출 버튼
  const signupTrigger = document.querySelector<HTMLButtonElement>(".js-info-open-signup"); // 회원가입 열기 버튼

  const signupBackButton = signupSection?.querySelector<HTMLButtonElement>('[data-action="back"]'); // 회원가입 뒤로가기 버튼

  if (signupTrigger && signupSection) {
    signupTrigger.addEventListener(
      "click",
      () => {
        showSignup(loginSection, signupSection);
      },
      { passive: true },
    );
  }

  if (signupBackButton && signupSection) {
    signupBackButton.addEventListener(
      "click",
      () => {
        hideSignup(loginSection, signupSection);
      },
      { passive: true },
    );
  }

  setupFindUsername(); // 아이디 찾기
  setupFindPassword(); // 비밀번호 찾기

  // 자동 로그인 처리
  const sessionAuthed = sessionStorage.getItem(auth.LOGIN_STORAGE_KEY) === "true";
  const authedUsernameSession = sessionStorage.getItem(auth.LOGIN_USER_KEY);

  const authedUsername = authedUsernameSession;

  if (sessionAuthed && authedUsername) {
    const authedUser = auth.findUserByUsername(authedUsernameSession);
    if (authedUser) {
      // 가져오기
      populateInfoPage(authedUser); // 정보 페이지 채우기
      setupProfileUploader(); // 프로필 업로더 설정
      setupChangePassword(); // 비밀번호 변경 설정
      setupContactModal(); // 연락처 모달 설정
      setupAddressManage(); // 주소 관리 설정

      // info.ts 내부 함수
      revealInfoPage(loginSection, infoPage, signupSection ?? undefined); // 정보 페이지 표시
      renderOrders(authedUser.username); // 주문 내역 렌더링 @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

      const lastId = sessionStorage.getItem("lastOrderId");
      if (lastId) {
        sessionStorage.removeItem("lastOrderId");
        const userOrders = ordersModule.getOrders(authedUser.username);
        const target = userOrders.find((o) => o.id === lastId);
        if (target) showOrderDetailsModal(target);
      }

      const logoutBtnRestored = document.getElementById("js-info-logout") as HTMLButtonElement | null;
      // 성능 최적화: 기존 리스너 제거 후 새로 등록
      const newLogoutBtn = logoutBtnRestored?.cloneNode(true) as HTMLButtonElement | null;
      if (newLogoutBtn && logoutBtnRestored?.parentNode) {
        logoutBtnRestored.parentNode.replaceChild(newLogoutBtn, logoutBtnRestored);
      }
      newLogoutBtn?.addEventListener("click", () => {
        sessionStorage.removeItem(auth.LOGIN_STORAGE_KEY);
        sessionStorage.removeItem(auth.LOGIN_USER_KEY);
        localStorage.removeItem(auth.LOGIN_STORAGE_KEY);
        localStorage.removeItem(auth.LOGIN_USER_KEY);

        localStorage.removeItem("cartItems");
        localStorage.removeItem("favorites");

        showToast("로그아웃되어 로컬 데이터가 삭제되었습니다.");

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

    const usernameInput = form.querySelector<HTMLInputElement>(".js-login-username") as HTMLInputElement | null;
    const passwordInput = form.querySelector<HTMLInputElement>(".js-login-password") as HTMLInputElement | null;

    if (!usernameInput || !passwordInput || !feedback) return;

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showFeedback(feedback, "아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    const matchedUser = auth.findUserByUsername(username);
    if (!matchedUser || matchedUser.password !== password) {
      showFeedback(feedback, "계정 정보가 일치하지 않습니다. 다시 확인해주세요.");
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

    const summary = migrateSessionToLocal();
    // 성능 최적화: 필요한 제품만 조회
    const productMap = new Map<string, string>();
    const neededIds = new Set<string>();
    summary.cart?.forEach((c) => neededIds.add(c.id));
    summary.favorites?.forEach((id) => neededIds.add(id));

    (products as any[]).forEach((p) => {
      if (p?.id && p?.title && neededIds.has(p.id)) {
        productMap.set(p.id, p.title);
      }
    });
    const lines: string[] = [];
    if (summary.cart && summary.cart.length) {
      lines.push("장바구니에 병합된 항목:");
      summary.cart.forEach((c) => {
        const title = productMap.get(c.id) ?? c.id;
        lines.push(`- ${title}: 기존 ${c.prev} → ${c.now} (추가 ${c.added})`);
      });
    }
    if (summary.favorites && summary.favorites.length) {
      lines.push("즐겨찾기에서 병합된 항목:");
      summary.favorites.forEach((id) => {
        const title = productMap.get(id) ?? id;
        lines.push(`- ${title}`);
      });
    }
    if (lines.length) {
      showMergeSummaryModal(lines.join("\n"));
    }

    const r = sessionStorage.getItem("postLoginReturnTo");
    if (r === "cart") {
      sessionStorage.removeItem("postLoginReturnTo");
      window.location.href = "../page/cart.html";
      return;
    }

    const logoutBtn = document.getElementById("js-info-logout") as HTMLButtonElement | null;
    logoutBtn?.addEventListener("click", () => {
      sessionStorage.removeItem(auth.LOGIN_STORAGE_KEY);
      sessionStorage.removeItem(auth.LOGIN_USER_KEY);
      localStorage.removeItem(auth.LOGIN_STORAGE_KEY);
      localStorage.removeItem(auth.LOGIN_USER_KEY);

      localStorage.removeItem("cartItems");
      localStorage.removeItem("favorites");

      showToast("로그아웃되어 로컬 데이터가 삭제되었습니다.");

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

// 정보 페이지 표시 함수
function revealInfoPage(loginSection: HTMLElement, infoPage: HTMLElement, signupSection?: HTMLElement) {
  loginSection.classList.add("d-none"); // 로그인 섹션 숨기기
  if (signupSection) signupSection.classList.add("d-none"); // 회원가입 섹션 숨기기
  infoPage.classList.remove("d-none"); // 정보 페이지 표시
}

/*
  주문 목록을 화면에 렌더링하는 함수
  username이 전달되면 해당 유저 주문,
  없으면 세션에 저장된 로그인 유저의 주문을 사용
*/
function renderOrders(username?: string) {
  const list = document.querySelector<HTMLUListElement>(".orders-list");
  if (!list) return;

  const tplOrderEmpty = document.getElementById("tpl-order-empty") as HTMLTemplateElement | null;
  const tplOrderItem = document.getElementById("tpl-order-item") as HTMLTemplateElement | null;
  if (!tplOrderEmpty || !tplOrderItem) return;

  const tplOrderEmptyEl = tplOrderEmpty;
  const tplOrderItemEl = tplOrderItem;

  list.textContent = "";

  /*
    주문 데이터 가져오기
    username이 있으면 그것을 사용하고,
    없으면 sessionStorage에 저장된 로그인 유저 아이디 사용
  */
  const orders = ordersModule.getOrders(username ?? (sessionStorage.getItem(auth.LOGIN_USER_KEY) || undefined));

  if (!orders || !orders.length) {
    const emptyFrag = tplOrderEmptyEl.content.cloneNode(true) as DocumentFragment;
    const emptyBody = emptyFrag.querySelector<HTMLElement>(".order-item__body");
    if (emptyBody) emptyBody.textContent = "주문 내역이 없습니다.";
    list.appendChild(emptyFrag);
    return;
  }

  // 상품 ID → 상품 정보로 빠르게 찾기 위한 맵 생성
  // (주문에는 상품 ID만 있으므로 제목/가격 조회용)
  const productMap: Record<string, any> = {};
  (products as any[]).forEach((p) => {
    if (p?.id) productMap[p.id] = p;
  });
  /*
const productMap: { [key: string]: any } = {};

(products as any[]).forEach((p) => {
  if (p?.id) {
    productMap[p.id] = p;
  }
});
  */

  // 주문 목록 하나씩 화면에 추가
  orders.forEach((o) => {
    const itemFrag = tplOrderItemEl.content.cloneNode(true) as DocumentFragment;
    const li = itemFrag.querySelector<HTMLElement>(".order-item");
    if (!li) return;

    const date = new Date(o.date);

    const first = o.items[0];
    const firstProduct = productMap[first?.id];

    const title = firstProduct?.title ?? first?.id ?? "상품"; // 첫 번째 아이템 제목

    const extra = o.items.length > 1 ? `외 ${o.items.length - 1}개` : ``;

    const orderId = li.querySelector<HTMLElement>(".order-id");
    if (orderId) orderId.textContent = o.id;

    const orderDate = li.querySelector<HTMLElement>(".order-date");
    if (orderDate) {
      const dateText = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
      orderDate.textContent = dateText;
    }

    const body = li.querySelector<HTMLElement>(".order-item__body");
    if (body) {
      body.textContent = `${title} × ${o.items[0].qty} ${extra} — 결제금액 ${formatPrice(o.total)}`.trim();
    }

    const detailLink = li.querySelector<HTMLAnchorElement>(".js-order-detail");
    if (detailLink) detailLink.dataset.orderId = o.id;

    // 리스트에 추가
    list.appendChild(itemFrag);
  });

  list.querySelectorAll<HTMLAnchorElement>(".js-order-detail").forEach((a) => {
    a.addEventListener("click", (ev) => {
      ev.preventDefault();

      console.log("주문 상세 보기 클릭");
      const id = a.dataset.orderId;
      if (!id) return;

      const order = orders.find((x) => x.id === id);
      if (!order) return;

      showOrderDetailsModal(order);
    });
  });
}

// 주문 상세 모달 표시 함수
function showOrderDetailsModal(order: Order) {
  const existing = document.getElementById("order-details-modal");
  if (existing) existing.remove();

  const tplOrderDetails = document.getElementById("tpl-order-details-modal") as HTMLTemplateElement | null;
  if (!tplOrderDetails) return;

  const modalFrag = tplOrderDetails.content.cloneNode(true) as DocumentFragment;
  const modal = modalFrag.querySelector<HTMLElement>(".order-details-modal");
  if (!modal) return;
  modal.id = "order-details-modal";

  const productMap: Record<string, any> = {};
  (products as any[]).forEach((p) => {
    if (p?.id) productMap[p.id] = p;
  });

  const titleEl = modal.querySelector<HTMLElement>(".product-modal__title");
  if (titleEl) titleEl.textContent = `주문 상세: ${order.id}`;

  const descEl = modal.querySelector<HTMLElement>(".product-modal__desc");
  if (descEl) descEl.textContent = `주문일: ${new Date(order.date).toLocaleString()}`;

  const listEl = modal.querySelector<HTMLUListElement>(".order-details__list");
  if (!listEl) return;
  listEl.textContent = "";
  order.items.forEach((it) => {
    const p = productMap[it.id];
    const li = document.createElement("li");
    const itemTotal = (parseInt((p?.price || "0").replace(/[^0-9]/g, ""), 10) || 0) * it.qty;
    li.textContent = `${p?.title ?? it.id} × ${it.qty} — ${formatPrice(itemTotal)}`;
    listEl.appendChild(li);
  });

  const totalEl = modal.querySelector<HTMLElement>(".order-details__total-value");
  if (totalEl) totalEl.textContent = formatPrice(order.total);

  document.body.appendChild(modalFrag);
  const closeBtn = modal.querySelector<HTMLButtonElement>(".product-modal__close") as HTMLButtonElement | null;
  const dismiss = () => modal.remove();
  closeBtn?.addEventListener("click", dismiss);
  modal.querySelectorAll("[data-dismiss=modal]").forEach((el) => el.addEventListener("click", dismiss));

  (closeBtn as HTMLElement | null)?.focus();
}

// 로그인 후 병합된 항목 요약 모달 표시 함수
function showMergeSummaryModal(message: string) {
  const existing = document.getElementById("merge-summary-modal");
  if (existing) {
    existing.remove();
  }
  const tplMerge = document.getElementById("tpl-merge-summary-modal") as HTMLTemplateElement | null;
  if (!tplMerge) return;

  const modalFrag = tplMerge.content.cloneNode(true) as DocumentFragment;
  const modal = modalFrag.querySelector<HTMLElement>(".merge-summary-modal");
  if (!modal) return;
  const modalEl = modal;
  modalEl.id = "merge-summary-modal";
  document.body.appendChild(modalFrag);
  modalEl.classList.remove("d-none");

  const msgEl = modalEl.querySelector<HTMLElement>(".merge-summary__message");
  if (msgEl) msgEl.textContent = message;
  const closeBtn = modalEl.querySelector(".product-modal__close") as HTMLElement | null;
  const okBtn = modalEl.querySelector(".merge-ok") as HTMLElement | null;

  closeBtn?.focus();

  function closeModal() {
    modalEl.remove();
  }

  closeBtn?.addEventListener("click", closeModal);
  okBtn?.addEventListener("click", closeModal);
  modalEl.querySelectorAll("[data-dismiss=modal]").forEach((el) => el.addEventListener("click", closeModal));
}

// HTML 이스케이프 함수
function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 가격 포맷 함수
function formatPrice(n: number) {
  return "₩" + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 피드백 표시 함수
function showFeedback(target: HTMLElement, message: string, success = false) {
  target.textContent = message;
  target.classList.toggle("is-success", success);
}
