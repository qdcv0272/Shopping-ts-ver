export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};

export function showConfirmDialog({ title = "확인", message, confirmText = "확인", cancelText = "취소" }: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const existing = document.getElementById("app-confirm-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "app-confirm-modal";
    modal.className = "product-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-hidden", "false");

    const backdrop = document.createElement("div");
    backdrop.className = "product-modal__backdrop";
    backdrop.setAttribute("data-dismiss", "modal");

    const panel = document.createElement("div");
    panel.className = "product-modal__panel";
    panel.setAttribute("role", "document");

    const closeBtnEl = document.createElement("button");
    closeBtnEl.className = "product-modal__close";
    closeBtnEl.setAttribute("aria-label", "닫기");
    closeBtnEl.type = "button";
    closeBtnEl.textContent = "✕";

    const body = document.createElement("div");
    body.className = "product-modal__body";

    const info = document.createElement("div");
    info.className = "product-modal__info";

    const titleEl = document.createElement("h3");
    titleEl.className = "product-modal__title";
    titleEl.textContent = title;

    const descEl = document.createElement("div");
    descEl.className = "product-modal__desc";
    descEl.textContent = message;

    const actions = document.createElement("div");
    actions.style.textAlign = "right";
    actions.style.marginTop = "12px";
    actions.style.display = "flex";
    actions.style.justifyContent = "flex-end";
    actions.style.gap = "8px";

    const cancelBtnEl = document.createElement("button");
    cancelBtnEl.className = "ghost-btn js-cancel";
    cancelBtnEl.type = "button";
    cancelBtnEl.textContent = cancelText;

    const confirmBtnEl = document.createElement("button");
    confirmBtnEl.className = "primary-btn js-confirm";
    confirmBtnEl.type = "button";
    confirmBtnEl.textContent = confirmText;

    actions.append(cancelBtnEl, confirmBtnEl);
    info.append(titleEl, descEl, actions);
    body.appendChild(info);
    panel.append(closeBtnEl, body);
    modal.append(backdrop, panel);

    document.body.appendChild(modal);

    const lastFocused = document.activeElement as HTMLElement | null;
    const confirmBtn = modal.querySelector<HTMLButtonElement>(".js-confirm");
    const cancelBtn = modal.querySelector<HTMLButtonElement>(".js-cancel");
    const closeBtn = modal.querySelector<HTMLButtonElement>(".product-modal__close");

    function cleanup(result: boolean) {
      modal.remove();

      lastFocused?.focus();

      document.removeEventListener("keydown", onKey);
      resolve(result);
    }

    confirmBtn?.addEventListener("click", () => cleanup(true));
    cancelBtn?.addEventListener("click", () => cleanup(false));
    closeBtn?.addEventListener("click", () => cleanup(false));
    modal.querySelectorAll("[data-dismiss=modal]").forEach((el) => el.addEventListener("click", () => cleanup(false)));

    // 키보드 지원
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        cleanup(false);
      } else if (e.key === "Enter") {
        // 버튼이 아닌 요소에 포커스가 있을 때 Enter는 확인 처리
        const active = document.activeElement;
        if (active && (active === confirmBtn || active === cancelBtn)) return;
        cleanup(true);
      }
    }
    document.addEventListener("keydown", onKey);

    confirmBtn?.focus();
  });
}
