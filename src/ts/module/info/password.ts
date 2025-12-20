import * as auth from "../auth";
import { showToast } from "./toast";

export function setupChangePassword() {
  // 여러 페이지 혹은 여러 모듈에서 중복 호출 방지
  const modal =
    document.querySelector<HTMLElement>(".info-page .change-password-modal") ||
    document.querySelector<HTMLElement>(".info-page .change-pw-modal") ||
    document.querySelector<HTMLElement>(".change-password-modal") ||
    document.querySelector<HTMLElement>(".change-pw-modal");

  const trigger = document.getElementById(
    "js-profile-change-password"
  ) as HTMLButtonElement | null;

  if (!modal || !trigger) return;
  const modalEl = modal as HTMLElement;

  if (modal.dataset._changePasswordInit === "true") return;

  const closeBtn = modal.querySelector<HTMLButtonElement>(
    ".change-password-modal__close"
  );
  const form = modal.querySelector<HTMLFormElement>(
    ".change-password-modal__form"
  );
  const inputCurrent =
    modal.querySelector<HTMLInputElement>(".js-change-current");
  const inputNew = modal.querySelector<HTMLInputElement>(".js-change-new");
  const inputNewConfirm = modal.querySelector<HTMLInputElement>(
    ".js-change-new-confirm"
  );
  const status = modal.querySelector<HTMLElement>(
    ".change-password-modal__status"
  );
  const saveBtn = modal.querySelector<HTMLButtonElement>(".js-change-save");

  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    open();
  });

  closeBtn?.addEventListener("click", close);
  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) close();
  });

  function open() {
    console.log("@@ 내 정보 페이지에서 비밀번호 변경 모달 열기");

    const username =
      sessionStorage.getItem(auth.LOGIN_USER_KEY) ||
      localStorage.getItem(auth.LOGIN_USER_KEY);

    if (!username) {
      // 혹시 모를 오류 방지
      showToast("로그인이 필요합니다. 먼저 로그인해주세요.");
      return;
    }

    modalEl.classList.remove("d-none");
    requestAnimationFrame(() => modalEl.classList.add("is-open"));
    modalEl.setAttribute("aria-hidden", "false");
    status && (status.textContent = "현재 비밀번호를 입력하세요.");
    form?.reset();
    inputCurrent?.focus();
  }

  function close() {
    const active = document.activeElement as HTMLElement | null;
    if (active && modalEl.contains(active)) {
      if (trigger) trigger.focus();
      else {
        console.warn("@@@@@@@@@@ 리턴 풀어 @@@@@@@@@@");
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

  if (
    !form ||
    !inputCurrent ||
    !inputNew ||
    !inputNewConfirm ||
    !status ||
    !saveBtn
  )
    return;

  saveBtn.addEventListener("click", () => {
    const current = (inputCurrent.value || "").trim();
    const next = (inputNew.value || "").trim();
    const confirm = (inputNewConfirm.value || "").trim();

    const username =
      sessionStorage.getItem(auth.LOGIN_USER_KEY) ||
      localStorage.getItem(auth.LOGIN_USER_KEY);
    if (!username) {
      status.textContent = "로그인 상태가 아닙니다.";
      return;
    }

    const user = auth.findUserByUsername(username);
    if (!user) {
      status.textContent = "계정을 찾을 수 없습니다.";
      return;
    }

    if (!current || user.password !== current) {
      status.textContent = "현재 비밀번호가 일치하지 않습니다.";
      return;
    }

    if (!next || !confirm) {
      status.textContent = "새 비밀번호와 확인을 모두 입력하세요.";
      return;
    }

    if (next !== confirm) {
      status.textContent = "새 비밀번호와 확인이 일치하지 않습니다.";
      return;
    }

    if (next === current) {
      status.textContent =
        "새 비밀번호가 현재 비밀번호와 동일합니다. 다른 비밀번호를 입력하세요.";
      return;
    }

    const validation = auth.validatePassword(next);
    if (!validation.ok) {
      status.textContent = validation.message ?? "비밀번호 규칙을 확인하세요.";
      return;
    }

    const ok = auth.updateUser(username, { password: next });
    if (!ok) {
      status.textContent = "비밀번호 변경 중 오류가 발생했습니다.";
      return;
    }

    status.textContent = "비밀번호가 성공적으로 변경되었습니다.";
    showToast("비밀번호가 변경되었습니다. 곧 자동 로그아웃됩니다.");

    alert(
      "비밀번호가 변경되어 보안을 위해 자동으로 로그아웃됩니다. 다시 로그인해주세요."
    );

    localStorage.removeItem("cartItems");
    localStorage.removeItem("favorites");
    showToast("로그아웃되어 로컬 데이터가 삭제되었습니다.");

    sessionStorage.removeItem(auth.LOGIN_STORAGE_KEY);
    sessionStorage.removeItem(auth.LOGIN_USER_KEY);
    localStorage.removeItem(auth.LOGIN_STORAGE_KEY);
    localStorage.removeItem(auth.LOGIN_USER_KEY);

    const loginSection = document.querySelector<HTMLElement>(".info-login");
    const infoPage = document.querySelector<HTMLElement>(".info-page");
    const feedback = document.querySelector<HTMLElement>(
      "#info-login-form .info-login__feedback"
    );
    const submitButton = document.querySelector<HTMLButtonElement>(
      "#info-login-form .info-login__submit"
    );

    if (loginSection) loginSection.classList.remove("d-none");
    if (infoPage) infoPage.classList.add("d-none");

    if (feedback) {
      feedback.textContent =
        "비밀번호가 변경되어 자동 로그아웃되었습니다. 다시 로그인해주세요.";
      feedback.classList.add("is-success");
    }
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "로그인";
    }

    setTimeout(() => close(), 300);
  });

  modalEl.dataset._changePasswordInit = "true";
}
