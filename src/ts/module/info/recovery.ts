import * as auth from "../auth";
import { showToast } from "./toast";

export function setupFindUsername() {
  const modal = document.querySelector<HTMLElement>(".findid-modal");
  const trigger = document.querySelector<HTMLButtonElement>(".js-info-find-username");
  if (!modal || !trigger) return;

  const closeBtn = modal.querySelector<HTMLButtonElement>(".findid-modal__close");
  const form = modal.querySelector<HTMLFormElement>(".findid-modal__search");
  const input = modal.querySelector<HTMLInputElement>(".js-findid-email");
  const status = modal.querySelector<HTMLElement>(".findid-modal__status");
  const results = modal.querySelector<HTMLUListElement>(".findid-modal__results");

  const open = () => {
    modal.classList.remove("d-none");
    requestAnimationFrame(() => modal.classList.add("is-open"));
    modal.setAttribute("aria-hidden", "false");
    if (results) results.innerHTML = "";
    if (status) status.textContent = "가입 시 사용한 이메일을 입력하세요.";
    form?.reset();
    input?.focus();
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
    const onEnd = (ev?: Event) => {
      modal.classList.add("d-none");
      modal.setAttribute("aria-hidden", "true");
      form?.reset();
      modal.removeEventListener("transitionend", onEnd);
    };
    modal.addEventListener("transitionend", onEnd);
    form?.reset();
  };

  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    open();
  });

  closeBtn?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  if (!form || !input || !results || !status) return;

  const confirmBtn = modal.querySelector<HTMLButtonElement>(".findid-modal__confirm");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      if (typeof (form as any).requestSubmit === "function") (form as any).requestSubmit();
      else form.submit();
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = (input.value || "").trim();
    if (!email) {
      status.textContent = "이메일을 입력해주세요.";
      return;
    }

    const validation = auth.validateEmail(email);
    if (!validation.ok) {
      status.textContent = validation.message ?? "유효한 이메일을 입력해주세요.";
      return;
    }

    const found = auth.findUserByEmail(email);
    results.innerHTML = "";
    if (found) {
      const li = document.createElement("li");
      li.className = "findid-modal__result";

      const textWrap = document.createElement("div");
      textWrap.className = "findid-modal__result-textwrap";
      textWrap.innerHTML = `등록된 아이디: <strong class="findid-modal__username">${found.username}</strong>`;

      const copyBtn = document.createElement("button");
      copyBtn.className = "btn btn--ghost findid-modal__copy";
      copyBtn.type = "button";
      copyBtn.dataset.username = found.username;
      copyBtn.setAttribute("aria-label", "아이디 복사");
      copyBtn.textContent = "복사";

      copyBtn.addEventListener("click", async () => {
        const text = copyBtn.dataset.username ?? "";
        try {
          await navigator.clipboard.writeText(text);
          showToast("아이디가 클립보드에 복사되었습니다.");
        } catch {
          try {
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            ta.remove();
            showToast("아이디가 복사되었습니다.");
          } catch {
            alert("복사에 실패했습니다. 아이디를 수동으로 복사해주세요.");
          }
        }
      });

      li.appendChild(textWrap);
      li.appendChild(copyBtn);
      results.appendChild(li);
      status.textContent = "아이디를 찾았습니다.";
      showToast("아이디를 찾았습니다.");
    } else {
      status.textContent = "등록된 계정이 없습니다.";
    }
  });
}

export function setupFindPassword() {
  const modal = document.querySelector<HTMLElement>(".findpw-modal");
  const trigger = document.querySelector<HTMLButtonElement>(".js-info-find-password");
  if (!modal || !trigger) return;

  const closeBtn = modal.querySelector<HTMLButtonElement>(".findpw-modal__close");
  const form = modal.querySelector<HTMLFormElement>(".findpw-modal__search");
  const inputUsername = modal.querySelector<HTMLInputElement>(".js-findpw-username");
  const inputEmail = modal.querySelector<HTMLInputElement>(".js-findpw-email");
  const status = modal.querySelector<HTMLElement>(".findpw-modal__status");
  const resetBox = modal.querySelector<HTMLElement>(".findpw-modal__reset");
  const newPass = modal.querySelector<HTMLInputElement>(".js-findpw-newpass");
  const newPassConfirm = modal.querySelector<HTMLInputElement>(".js-findpw-newpass-confirm");
  const resetBtn = modal.querySelector<HTMLButtonElement>(".js-findpw-reset");

  const open = () => {
    modal.classList.remove("d-none");
    requestAnimationFrame(() => modal.classList.add("is-open"));
    modal.setAttribute("aria-hidden", "false");
    status && (status.textContent = "아이디와 이메일을 입력하세요.");
    form?.reset();
    resetBox?.classList.add("d-none");
    inputUsername?.focus();
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
      resetBox?.classList.add("d-none");
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

  if (!form || !inputUsername || !inputEmail || !status || !resetBox || !newPass || !newPassConfirm || !resetBtn) return;

  const confirmPw = modal.querySelector<HTMLButtonElement>(".findpw-modal__confirm");
  if (confirmPw) {
    confirmPw.addEventListener("click", () => {
      if (typeof (form as any).requestSubmit === "function") (form as any).requestSubmit();
      else form.submit();
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = (inputUsername.value || "").trim();
    const email = (inputEmail.value || "").trim();
    if (!username || !email) {
      status.textContent = "아이디와 이메일을 모두 입력해주세요.";
      return;
    }

    const user = auth.findUserByUsername(username);
    if (!user) {
      status.textContent = "해당 아이디가 없습니다.";
      return;
    }
    if (user.email.toLowerCase() !== email.toLowerCase()) {
      status.textContent = "입력한 이메일이 등록된 계정의 이메일과 일치하지 않습니다.";
      return;
    }

    status.textContent = "본인 확인 되었습니다. 새 비밀번호를 입력하세요.";
    resetBox.classList.remove("d-none");
    newPass.focus();
  });

  resetBtn.addEventListener("click", () => {
    const username = (inputUsername.value || "").trim();
    const pass = (newPass.value || "").trim();
    const passConfirm = (newPassConfirm.value || "").trim();
    if (!pass || !passConfirm) {
      status.textContent = "새 비밀번호와 확인 모두 입력해주세요.";
      return;
    }
    if (pass !== passConfirm) {
      status.textContent = "비밀번호가 일치하지 않습니다.";
      return;
    }

    const validation = auth.validatePassword(pass);
    if (!validation.ok) {
      status.textContent = validation.message ?? "유효한 비밀번호를 입력해주세요.";
      return;
    }

    const ok = auth.updateUser(username, { password: pass });
    if (!ok) {
      status.textContent = "비밀번호 재설정에 실패했습니다. 잠시 후 다시 시도해 주세요.";
      return;
    }

    status.textContent = "비밀번호가 변경되었습니다. 로그인 화면에서 새 비밀번호로 로그인하세요.";
    resetBox.classList.add("d-none");
    showToast("비밀번호가 변경되었습니다.");
    setTimeout(() => close(), 1200);
  });
}
