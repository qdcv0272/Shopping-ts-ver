import * as auth from "../auth";
import { populateInfoPage } from "./profile";
import { showToast } from "./toast";

export function setupContactModal() {
  const modal =
    document.querySelector<HTMLElement>(".info-page .contact-modal") || document.querySelector<HTMLElement>(".info-page .info-contact-modal") || document.querySelector<HTMLElement>(".contact-modal");
  const trigger = document.getElementById("js-contact-edit") as HTMLButtonElement | null;
  if (!modal || !trigger) return;
  const modalEl = modal as HTMLElement;

  if (modalEl.dataset._contactInit === "true") return;

  const closeBtn = modal.querySelector<HTMLButtonElement>(".contact-modal__close");
  const form = modal.querySelector<HTMLFormElement>(".contact-modal__form");
  const inputEmail = modal.querySelector<HTMLInputElement>(".js-contact-email");
  const inputPhone = modal.querySelector<HTMLInputElement>(".js-contact-phone");
  const status = modal.querySelector<HTMLElement>(".contact-modal__status");
  const saveBtn = modal.querySelector<HTMLButtonElement>(".js-contact-save");

  trigger.addEventListener("click", (e) => {
    console.log("@@ 연락처 정보 수정 모달 열기");
    e.preventDefault();
    open();
  });

  closeBtn?.addEventListener("click", close);

  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) close();
  });

  function open() {
    const username = sessionStorage.getItem(auth.LOGIN_USER_KEY) || localStorage.getItem(auth.LOGIN_USER_KEY);

    if (!username) {
      // 혹시 모를 오류 방지
      showToast("로그인이 필요합니다. 먼저 로그인해주세요.");
      return;
    }

    modalEl.classList.remove("d-none");
    requestAnimationFrame(() => modalEl.classList.add("is-open")); // rAF 사용
    modalEl.setAttribute("aria-hidden", "false");
    form?.reset();

    if (username) {
      const user = auth.findUserByUsername(username);
      if (user) {
        if (inputEmail) inputEmail.value = user.email ?? "";
        if (inputPhone) inputPhone.value = user.phone ?? "";
      }
    }
    inputEmail?.focus();
    status && (status.textContent = "이메일과 휴대폰을 확인 후 저장하세요.");
  }

  function close() {
    const active = document.activeElement as HTMLElement | null;
    if (active && modalEl.contains(active)) {
      if (trigger) trigger.focus();
      else {
        console.warn("@@@@@@@ 리턴 풀어스 @@@@@@@@@@@@@");
      }

      // else {
      //   const fallback = document.querySelector<HTMLElement>(
      //     'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      //   );
      //   if (fallback) fallback.focus();
      // }
    }

    modalEl.classList.remove("is-open");
    const onEnd = () => {
      modalEl.classList.add("d-none");
      modalEl.setAttribute("aria-hidden", "true");
      form?.reset();
      modalEl.removeEventListener("transitionend", onEnd);
    };
    modalEl.addEventListener("transitionend", onEnd);
  }

  if (!form || !inputEmail || !inputPhone || !status || !saveBtn) return;

  saveBtn.addEventListener("click", () => {
    const email = (inputEmail.value || "").trim();
    const phone = (inputPhone.value || "").trim();
    const username = sessionStorage.getItem(auth.LOGIN_USER_KEY) || localStorage.getItem(auth.LOGIN_USER_KEY);

    if (!username) {
      // 혹시 모를 오류 방지
      status.textContent = "로그인이 필요합니다.";
      return;
    }

    const emailVal = auth.validateEmail(email);
    if (!emailVal.ok) {
      status.textContent = emailVal.message ?? "이메일 형식을 확인하세요.";
      return;
    }

    const phoneVal = auth.validatePhone(phone);
    if (!phoneVal.ok) {
      status.textContent = phoneVal.message ?? "휴대폰 형식을 확인하세요.";
      return;
    }

    const ok = auth.updateUser(username, { email, phone });
    if (!ok) {
      status.textContent = "저장 중 오류가 발생했습니다.";
      return;
    }

    showToast("연락처 정보가 저장되었습니다.");
    const user = auth.findUserByUsername(username);
    if (user) populateInfoPage(user);
    setTimeout(() => close(), 700);
  });

  modalEl.dataset._contactInit = "true";
}
