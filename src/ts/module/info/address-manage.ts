import * as auth from "../auth";
import { populateInfoPage } from "./profile";
import { showToast } from "./toast";

export function setupAddressManage() {
  const modal =
    document.querySelector<HTMLElement>(".info-page .address-manage-modal") ||
    document.querySelector<HTMLElement>(".address-manage-modal");
  const trigger = document.getElementById("js-address-manage") as HTMLButtonElement | null;
  if (!modal || !trigger) return;

  if (modal.dataset._addressInit === "true") return;

  const closeBtn = modal.querySelector<HTMLButtonElement>(".address-manage-modal__close");
  const form = modal.querySelector<HTMLFormElement>(".address-manage-modal__form");
  const inputRoad = modal.querySelector<HTMLInputElement>(".js-address-road");
  const inputDetail = modal.querySelector<HTMLInputElement>(".js-address-detail");
  const status = modal.querySelector<HTMLElement>(".address-manage-modal__status");
  const saveBtn = modal.querySelector<HTMLButtonElement>(".js-address-save");

  const open = () => {
    const username = sessionStorage.getItem(auth.LOGIN_USER_KEY) || localStorage.getItem(auth.LOGIN_USER_KEY);
    if (!username) {
      showToast("로그인이 필요합니다. 먼저 로그인해주세요.");
      return;
    }

    modal.classList.remove("d-none");
    requestAnimationFrame(() => modal.classList.add("is-open"));
    modal.setAttribute("aria-hidden", "false");
    form?.reset();

    if (username) {
      const user = auth.findUserByUsername(username);
      if (user) {
        if (inputRoad) inputRoad.value = user.roadAddress ?? user.address ?? "";
        if (inputDetail) inputDetail.value = user.addressDetail ?? "";
      }
    }

    inputRoad?.focus();
    status && (status.textContent = "기본 배송지를 입력해주세요.");
  };

  const close = () => {
    try {
      const active = document.activeElement as HTMLElement | null;
      if (active && modal.contains(active)) {
        if (trigger) trigger.focus();
        else {
          const fallback = document.querySelector<HTMLElement>(
            'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (fallback) fallback.focus();
        }
      }
    } catch {}

    modal.classList.remove("is-open");
    const onEnd = () => {
      modal.classList.add("d-none");
      modal.setAttribute("aria-hidden", "true");
      form?.reset();
      modal.removeEventListener("transitionend", onEnd);
    };
    modal.addEventListener("transitionend", onEnd);
  };

  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    open();
  });

  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  if (!form || !inputRoad || !inputDetail || !status || !saveBtn) return;

  saveBtn.addEventListener("click", () => {
    const road = (inputRoad.value || "").trim();
    const detail = (inputDetail.value || "").trim();
    const username = sessionStorage.getItem(auth.LOGIN_USER_KEY) || localStorage.getItem(auth.LOGIN_USER_KEY);
    if (!username) {
      status.textContent = "로그인이 필요합니다.";
      return;
    }

    if (!road && !detail) {
      status.textContent = "주소를 입력해주세요.";
      return;
    }

    const address = `${road} ${detail}`.trim();

    const ok = auth.updateUser(username, { roadAddress: road || undefined, addressDetail: detail || undefined, address });
    if (!ok) {
      status.textContent = "저장 중 오류가 발생했습니다.";
      return;
    }

    showToast("배송지가 저장되었습니다.");
    const user = auth.findUserByUsername(username);
    if (user) populateInfoPage(user);
    setTimeout(() => close(), 700);
  });

  modal.dataset._addressInit = "true";
}
