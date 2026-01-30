import * as auth from "../auth";
import { showToast } from "./toast";

export function setupFindUsername() {
  const modal = document.querySelector<HTMLElement>(".findid-modal");
  const trigger = document.querySelector<HTMLButtonElement>(".js-info-find-username");
  if (!modal || !trigger) return;
  const modalEl = modal as HTMLElement;

  const closeBtn = modalEl.querySelector<HTMLButtonElement>(".findid-modal__close");
  const form = modalEl.querySelector<HTMLFormElement>(".findid-modal__search");
  const input = modalEl.querySelector<HTMLInputElement>(".js-findid-email");
  const status = modalEl.querySelector<HTMLElement>(".findid-modal__status");
  const results = modalEl.querySelector<HTMLUListElement>(".findid-modal__results");
  const tplResult = document.getElementById("tpl-findid-result") as HTMLTemplateElement | null;

  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    open();
  });

  closeBtn?.addEventListener("click", close);

  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) close();
  });

  function open() {
    console.log("아이디 찾기 모달 열기");
    modalEl.classList.remove("d-none");
    requestAnimationFrame(() => modalEl.classList.add("is-open")); // rAF 사용하여 애니메이션 트리거
    modalEl.setAttribute("aria-hidden", "false");
    if (results) results.innerHTML = "";
    if (status) status.textContent = "가입 시 사용한 이메일을 입력하세요.";
    form?.reset();
    input?.focus();
  }

  function close() {
    console.log("아이디 찾기 모달 닫기");

    const active = document.activeElement as HTMLElement | null;
    if (active && modalEl.contains(active)) {
      if (trigger) trigger.focus();
      else {
        console.log("@@@@@@@ 리턴 주석 풀어 @@@@@@@");

        return;
        // const fallback = document.querySelector<HTMLElement>(
        //   'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        // );
        // if (fallback) fallback.focus();
      }
    }

    modalEl.classList.remove("is-open");
    const onEnd = (ev?: Event) => {
      modalEl.classList.add("d-none");
      modalEl.setAttribute("aria-hidden", "true");
      form?.reset();
      modalEl.removeEventListener("transitionend", onEnd);
    };
    modalEl.addEventListener("transitionend", onEnd);
    form?.reset();
  }

  if (!form || !input || !results || !status || !tplResult) return;

  const tplResultEl = tplResult;

  // const confirmBtn = modalEl.querySelector<HTMLButtonElement>(
  //   ".findid-modal__confirm"
  // );

  // if (confirmBtn) {
  //   confirmBtn.addEventListener("click", () => {
  //     if (typeof (form as any).requestSubmit === "function")
  //       (form as any).requestSubmit();
  //     else form.submit();
  //   });
  // }

  form.addEventListener("submit", (e) => {
    // 아이디찾기 폼 제출
    e.preventDefault();
    const email = (input.value || "").trim();

    // if (!email) {
    //   status.textContent = "이메일을 입력해주세요.";
    //   return;
    // }

    const validation = auth.validateEmail(email); // 이메일 유효성 검사
    if (!validation.ok) {
      status.textContent = validation.message ?? "유효한 이메일을 입력해주세요.";
      return;
    }

    const found = auth.findUserByEmail(email); // 이메일로 사용자 찾기

    results.innerHTML = "";
    if (found) {
      const itemFrag = tplResultEl.content.cloneNode(true) as DocumentFragment;
      const li = itemFrag.querySelector<HTMLLIElement>(".findid-modal__result");
      if (!li) return;

      const usernameEl = li.querySelector<HTMLElement>(".findid-modal__username");
      if (usernameEl) usernameEl.textContent = found.username;

      const copyBtn = li.querySelector<HTMLButtonElement>(".findid-modal__copy");
      if (!copyBtn) return;
      copyBtn.dataset.username = found.username;

      copyBtn.addEventListener("click", async () => {
        const text = copyBtn.dataset.username ?? "";

        console.log(navigator.clipboard);
        // try 안에 넣기
        await navigator.clipboard.writeText(text);
        showToast("아이디가 클립보드에 복사되었습니다.");
        //
        // try {
        // } catch {
        //   try {
        //     const ta = document.createElement("textarea");
        //     ta.value = text;
        //     document.body.appendChild(ta);
        //     ta.select();
        //     document.execCommand("copy");
        //     ta.remove();
        //     showToast("아이디가 복사되었습니다.");
        //   } catch {
        //     alert("복사에 실패했습니다. 아이디를 수동으로 복사해주세요.");
        //   }
        // }
      });

      results.appendChild(itemFrag);
      status.textContent = "아이디를 찾았습니다.";
      showToast("아이디를 찾았습니다.");
    } else {
      status.textContent = "등록된 계정이 없습니다.";
    }
  });
}

export function setupFindPassword() {
  const modal = document.querySelector<HTMLElement>(".findpw-modal"); // 비밀번호 찾기 모달
  const trigger = document.querySelector<HTMLButtonElement>(".js-info-find-password"); // 비밀번호 찾기 트리거 버튼

  if (!modal || !trigger) return;

  const modalEl = modal as HTMLElement;

  const closeBtn = modalEl.querySelector<HTMLButtonElement>(".findpw-modal__close");
  const form = modalEl.querySelector<HTMLFormElement>(".findpw-modal__search");
  const inputUsername = modalEl.querySelector<HTMLInputElement>(".js-findpw-username");
  const inputEmail = modalEl.querySelector<HTMLInputElement>(".js-findpw-email");
  const status = modalEl.querySelector<HTMLElement>(".findpw-modal__status");
  const resetBox = modalEl.querySelector<HTMLElement>(".findpw-modal__reset");
  const newPass = modalEl.querySelector<HTMLInputElement>(".js-findpw-newpass");
  const newPassConfirm = modalEl.querySelector<HTMLInputElement>(".js-findpw-newpass-confirm");
  const resetBtn = modalEl.querySelector<HTMLButtonElement>(".js-findpw-reset");

  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    open();
  });

  closeBtn?.addEventListener("click", close);

  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) close();
  });

  function open() {
    console.log("비밀번호 찾기 모달 열기");
    modalEl.classList.remove("d-none");
    requestAnimationFrame(() => modalEl.classList.add("is-open")); // rAF 사용하여 애니메이션 트리거
    modalEl.setAttribute("aria-hidden", "false");
    status && (status.textContent = "아이디와 이메일을 입력하세요.");
    form?.reset();
    resetBox?.classList.add("d-none");
    inputUsername?.focus();
  }

  function close() {
    console.log("비밀번호 찾기 모달 닫기");
    const active = document.activeElement as HTMLElement | null;
    if (active && modalEl.contains(active)) {
      if (trigger) trigger.focus();
      else {
        console.log("@@@@@@@ 리턴 주석 풀어 @@@@@@@");
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
      resetBox?.classList.add("d-none");
      modalEl.removeEventListener("transitionend", onEnd);
      // console.log("비밀번호 찾기 모달 애니종료");
    };
    modalEl.addEventListener("transitionend", onEnd);
  }

  if (!form || !inputUsername || !inputEmail || !status || !resetBox || !newPass || !newPassConfirm || !resetBtn) return;

  // const confirmPw = modalEl.querySelector<HTMLButtonElement>(
  //   ".findpw-modal__confirm"
  // );
  // if (confirmPw) {
  //   confirmPw.addEventListener("click", () => {
  //     if (typeof (form as any).requestSubmit === "function")
  //       (form as any).requestSubmit();
  //     else form.submit();
  //   });
  // }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("required 제거 후 제출 이벤트");
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
