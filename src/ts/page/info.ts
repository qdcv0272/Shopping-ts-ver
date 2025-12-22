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

  const form = document.querySelector(
    "#info-login-form"
  ) as HTMLFormElement | null; // 로그인 폼

  if (!loginSection || !infoPage || !form) return;

  const feedback = form.querySelector<HTMLElement>(".info-login__feedback"); // 피드백 영역

  const submitButton = form.querySelector<HTMLButtonElement>(
    ".info-login__submit"
  ); // 제출 버튼
  const signupTrigger = document.querySelector<HTMLButtonElement>(
    ".js-info-open-signup"
  ); // 회원가입 열기 버튼

  const signupBackButton = signupSection?.querySelector<HTMLButtonElement>(
    '[data-action="back"]'
  ); // 회원가입 뒤로가기 버튼

  if (signupTrigger && signupSection) {
    signupTrigger.addEventListener("click", () => {
      console.log("회원가입 열기");
      showSignup(loginSection, signupSection);
    });
  }

  if (signupBackButton && signupSection) {
    signupBackButton.addEventListener("click", () => {
      console.log("뒤로가기 클릭");
      hideSignup(loginSection, signupSection);
    });
  }

  setupFindUsername(); // 아이디 찾기
  setupFindPassword(); // 비밀번호 찾기

  // 자동 로그인 처리
  const sessionAuthed =
    sessionStorage.getItem(auth.LOGIN_STORAGE_KEY) === "true";
  const authedUsernameSession = sessionStorage.getItem(auth.LOGIN_USER_KEY);

  const authedUsername = authedUsernameSession;

  if (sessionAuthed && authedUsername) {
    console.log("로그인 되어 있음@@@@@@@@@@@@@");
    const authedUser = auth.findUserByUsername(authedUsernameSession);
    if (authedUser) {
      // import
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

      const logoutBtnRestored = document.getElementById(
        "js-info-logout"
      ) as HTMLButtonElement | null;
      logoutBtnRestored?.addEventListener("click", () => {
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
    console.log("로그인 되어 있지 않음@@@@@@@@@@@@@");
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

    try {
      const summary = migrateSessionToLocal();
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

// 정보 페이지 표시 함수
function revealInfoPage(
  loginSection: HTMLElement,
  infoPage: HTMLElement,
  signupSection?: HTMLElement
) {
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

  list.innerHTML = "";

  /*
    주문 데이터 가져오기
    username이 있으면 그것을 사용하고,
    없으면 sessionStorage에 저장된 로그인 유저 아이디 사용
  */
  const orders = ordersModule.getOrders(
    username ?? (sessionStorage.getItem(auth.LOGIN_USER_KEY) || undefined)
  );

  if (!orders || !orders.length) {
    list.innerHTML = `
      <li class="order-item">
        <div class="order-item__body">주문 내역이 없습니다.</div>
      </li>
    `;
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
    const li = document.createElement("li");
    li.className = "order-item";

    const date = new Date(o.date);

    const first = o.items[0];
    const firstProduct = productMap[first?.id];

    const title = firstProduct?.title ?? first?.id ?? "상품"; // 첫 번째 아이템 제목

    const extra = o.items.length > 1 ? `외 ${o.items.length - 1}개` : ``;

    // 주문 아이템 HTML 구성
    li.innerHTML = `
      <div class="order-item__meta">
        <div class="order-id">${escapeHtml(o.id)}</div>
        <div class="order-date">
          ${date.getFullYear()}-
          ${(date.getMonth() + 1).toString().padStart(2, "0")}-
          ${date.getDate().toString().padStart(2, "0")}
        </div>
      </div>

      <div class="order-item__body">
        ${escapeHtml(title)} × ${o.items[0].qty}
        ${escapeHtml(extra)} — 결제금액 ${formatPrice(o.total)}
      </div>

      <div class="order-item__actions">
        <a href="#" class="link js-order-detail"
           data-order-id="${escapeHtml(o.id)}">
          주문상세
        </a>
      </div>
    `;

    // 리스트에 추가
    list.appendChild(li);
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

  (closeBtn as HTMLElement | null)?.focus();
}

// 로그인 후 병합된 항목 요약 모달 표시 함수
function showMergeSummaryModal(message: string) {
  const existing = document.getElementById("merge-summary-modal");
  if (existing) {
    existing.remove();
  }
  const modal = document.createElement("div");
  modal.id = "merge-summary-modal";
  modal.className = "product-modal";
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
  modal.classList.remove("d-none");
  const closeBtn = modal.querySelector(
    ".product-modal__close"
  ) as HTMLElement | null;
  const okBtn = modal.querySelector(".merge-ok") as HTMLElement | null;

  closeBtn?.focus();

  function closeModal() {
    modal.remove();
  }

  closeBtn?.addEventListener("click", closeModal);
  okBtn?.addEventListener("click", closeModal);
  modal
    .querySelectorAll("[data-dismiss=modal]")
    .forEach((el) => el.addEventListener("click", closeModal));
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
