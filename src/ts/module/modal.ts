export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};

export function showConfirmDialog({
  title = "확인",
  message,
  confirmText = "확인",
  cancelText = "취소",
}: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const existing = document.getElementById("app-confirm-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "app-confirm-modal";
    modal.className = "product-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-hidden", "false");

    modal.innerHTML = `
      <div class="product-modal__backdrop" data-dismiss="modal"></div>
      <div class="product-modal__panel" role="document">
        <button class="product-modal__close" aria-label="닫기">✕</button>
        <div class="product-modal__body">
          <div class="product-modal__info">
            <h3 class="product-modal__title">${escapeHtml(title)}</h3>
            <div class="product-modal__desc">${escapeHtml(message)}</div>
            <div style="text-align:right;margin-top:12px;display:flex;justify-content:flex-end;gap:8px;">
              <button class="ghost-btn js-cancel">${escapeHtml(
                cancelText
              )}</button>
              <button class="primary-btn js-confirm">${escapeHtml(
                confirmText
              )}</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const lastFocused = document.activeElement as HTMLElement | null;
    const confirmBtn = modal.querySelector<HTMLButtonElement>(".js-confirm");
    const cancelBtn = modal.querySelector<HTMLButtonElement>(".js-cancel");
    const closeBtn = modal.querySelector<HTMLButtonElement>(
      ".product-modal__close"
    );

    function cleanup(result: boolean) {
      try {
        modal.remove();
      } catch {}
      try {
        lastFocused?.focus();
      } catch {}
      document.removeEventListener("keydown", onKey);
      resolve(result);
    }

    confirmBtn?.addEventListener("click", () => cleanup(true));
    cancelBtn?.addEventListener("click", () => cleanup(false));
    closeBtn?.addEventListener("click", () => cleanup(false));
    modal
      .querySelectorAll("[data-dismiss=modal]")
      .forEach((el) => el.addEventListener("click", () => cleanup(false)));

    // keyboard support
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        cleanup(false);
      } else if (e.key === "Enter") {
        // Enter should confirm when an element that isn't a button is focused
        const active = document.activeElement;
        if (active && (active === confirmBtn || active === cancelBtn)) return;
        cleanup(true);
      }
    }
    document.addEventListener("keydown", onKey);

    // focus confirm button
    try {
      confirmBtn?.focus();
    } catch {}

    // no-op - cleanup already removes listener and resolves
  });
}

function escapeHtml(s: string) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
