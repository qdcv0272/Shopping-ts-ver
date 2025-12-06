import "../../css/page/info.css";

import { log } from "../function/log";
import * as auth from "../module/auth";
import { setupAddressModal } from "../module/address";

export function initInfo() {
  log("info");
  setupInfoLogin();
  // Ensure the change-password UI is wired up early so the profile button
  // can respond consistently (it will check auth state before opening)
  setupChangePassword();
  // Also wire contact modal early so the contact-edit button works consistently
  setupContactModal();
  setupAddressManage();
}

function setupInfoLogin() {
  const loginSection = document.querySelector<HTMLElement>(".info-login"); // 로그인 페이지
  const signupSection = document.querySelector<HTMLElement>(".info-signup"); // 회원가입 페이지
  const infoPage = document.querySelector<HTMLElement>(".info-page"); // 내정보 페이지

  const form = document.querySelector("#info-login-form") as HTMLFormElement | null;

  if (!loginSection || !infoPage || !form) return;

  const feedback = form.querySelector<HTMLElement>(".info-login__feedback"); // 회원가입 피드백

  const submitButton = form.querySelector<HTMLButtonElement>(".info-login__submit"); // 로그인 버튼
  const signupTrigger = document.querySelector<HTMLButtonElement>(".js-info-open-signup"); // 회원가입

  const signupBackButton = signupSection?.querySelector<HTMLButtonElement>('[data-action="back"]'); // 로그인으로 돌아가기

  // 회원가입 오픈 / 뒤로가기 이벤트는 로그인 상태와 상관없이 항상 바인딩합니다.
  if (signupTrigger && signupSection) {
    signupTrigger.addEventListener("click", () => showSignup(loginSection, signupSection));
  }
  if (signupBackButton && signupSection) {
    signupBackButton.addEventListener("click", () => hideSignup(loginSection, signupSection));
  }

  // 아이디 찾기 트리거는 로그인 화면이 언제 보이든 동작해야 하므로 초기화 시점에 설정합니다.
  setupFindUsername();
  setupFindPassword();

  // 세션 스토리지
  const sessionAuthed = sessionStorage.getItem(auth.LOGIN_STORAGE_KEY) === "true";
  const authedUsernameSession = sessionStorage.getItem(auth.LOGIN_USER_KEY);

  const authedUsername = authedUsernameSession;

  if (sessionAuthed && authedUsername) {
    console.log("로그인 되어있는중");
    const authedUser = auth.findUserByUsername(authedUsernameSession);

    if (authedUser) {
      populateInfoPage(authedUser);
      setupProfileUploader();
      setupChangePassword();
      setupContactModal();
      setupAddressManage();
      revealInfoPage(loginSection, infoPage, signupSection ?? undefined);

      const logoutBtnRestored = document.getElementById("js-info-logout") as HTMLButtonElement | null;
      logoutBtnRestored?.addEventListener("click", () => {
        // 로그아웃 버튼 누르면
        sessionStorage.removeItem(auth.LOGIN_STORAGE_KEY);
        sessionStorage.removeItem(auth.LOGIN_USER_KEY);
        localStorage.removeItem(auth.LOGIN_STORAGE_KEY);
        localStorage.removeItem(auth.LOGIN_USER_KEY);

        // clear any success feedback and restore login button
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

  // signup trigger / back binding moved earlier to ensure listeners exist

  setupSignup(signupSection, loginSection);

  // (setupFindUsername는 함수 시작부에서 이미 바인딩됨)

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

    const logoutBtn = document.getElementById("js-info-logout") as HTMLButtonElement | null;
    logoutBtn?.addEventListener("click", () => {
      sessionStorage.removeItem(auth.LOGIN_STORAGE_KEY);
      sessionStorage.removeItem(auth.LOGIN_USER_KEY);
      localStorage.removeItem(auth.LOGIN_STORAGE_KEY);
      localStorage.removeItem(auth.LOGIN_USER_KEY);

      // clear any success feedback and restore login button
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

function showSignup(loginSection: HTMLElement, signupSection: HTMLElement) {
  loginSection.classList.add("d-none");
  signupSection.classList.remove("d-none");
  const firstField = signupSection.querySelector<HTMLInputElement>("input");
  firstField?.focus();
}

function populateInfoPage(user: auth.StoredUser) {
  const safeName = user.name?.trim() || user.username;
  const safeEmail = user.email?.trim() || "이메일 정보가 없습니다.";
  const safePhoneRaw = user.phone?.trim() || "";
  const safePhone = safePhoneRaw || "휴대폰 정보가 없습니다.";
  const primaryAddress = user.roadAddress?.trim() || user.address?.trim() || "";
  const addressLine1 = primaryAddress || "기본 배송지가 아직 등록되지 않았습니다.";

  const secondaryParts: string[] = [];

  if (user.addressDetail?.trim()) secondaryParts.push(user.addressDetail.trim());
  if (safePhoneRaw) secondaryParts.push(`${safeName} (${safePhoneRaw})`);

  const addressLine2 = primaryAddress
    ? secondaryParts.join(" · ") || "상세 주소를 추가해주세요."
    : "배송지를 추가하면 여기에 표시됩니다.";

  document.querySelectorAll<HTMLElement>(".js-info-name").forEach((el) => {
    el.textContent = safeName;
  });
  document.querySelectorAll<HTMLElement>(".js-info-email").forEach((el) => {
    el.textContent = safeEmail;
  });
  document.querySelectorAll<HTMLElement>(".js-info-phone").forEach((el) => {
    el.textContent = safePhone;
  });
  document.querySelectorAll<HTMLElement>(".js-info-address-line1").forEach((el) => {
    el.textContent = addressLine1;
  });
  document.querySelectorAll<HTMLElement>(".js-info-address-line2").forEach((el) => {
    el.textContent = addressLine2;
  });

  // 프로필 이미지가 있으면 avatar에 적용
  const avatarEl = document.querySelector<HTMLDivElement>(".profile-card__media .avatar");
  const removeBtn = document.getElementById("js-profile-remove") as HTMLButtonElement | null;
  if (avatarEl) {
    if (user.profileImage) {
      avatarEl.innerHTML = "";
      const img = document.createElement("img");
      img.className = "avatar-img";
      img.alt = `${user.name}의 프로필`;
      img.src = user.profileImage;
      avatarEl.appendChild(img);
    } else {
      // 현재 유저에 프로필 이미지가 없으면 이전에 남아있을 수 있는 <img>를 제거하고 기본 이모지로 초기화합니다.
      avatarEl.innerHTML = "👤";
      avatarEl.setAttribute("aria-hidden", "true");
    }
    // 삭제 버튼 상태 토글
    if (removeBtn) removeBtn.disabled = !user.profileImage;
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });
}

/**
 * 프로필 업로더
 * - 페이지 내 숨김 file input (#js-profile-upload)를 사용하여 이미지를 선택합니다.
 * - 이미지 파일은 Data URL(base64)로 읽어 `auth.updateUser`로 현재 로그인한 사용자의 profileImage에 저장합니다.
 * - 저장된 이미지는 `populateInfoPage`에서 avatar에 적용됩니다 (localStorage 기반 저장).
 */
function setupProfileUploader() {
  const uploadInput = document.getElementById("js-profile-upload") as HTMLInputElement | null;
  const avatarEl = document.querySelector<HTMLDivElement>(".profile-card__media .avatar");
  if (!uploadInput || !avatarEl) return;

  const removeBtn = document.getElementById("js-profile-remove") as HTMLButtonElement | null;

  uploadInput.addEventListener("change", async () => {
    const file = uploadInput.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      alert("이미지는 4MB 이하만 업로드 가능합니다.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);

      // 미리보기
      avatarEl.innerHTML = "";
      const img = document.createElement("img");
      img.className = "avatar-img";
      img.alt = "프로필 미리보기";
      img.src = dataUrl;
      avatarEl.appendChild(img);

      // 현재 로그인한 유저 이름을 찾아 업데이트
      const username = sessionStorage.getItem(auth.LOGIN_USER_KEY) || localStorage.getItem(auth.LOGIN_USER_KEY);
      if (!username) {
        console.warn("로그인된 유저를 찾을 수 없습니다. 프로필 저장을 건너뜁니다.");
        return;
      }

      const ok = auth.updateUser(username, { profileImage: dataUrl });
      if (!ok) console.warn("프로필 저장에 실패했습니다.");
      if (removeBtn) removeBtn.disabled = false;
    } catch (err) {
      console.error(err);
      alert("프로필 이미지 처리를 하지 못했습니다.");
    }
  });

  // 프로필 삭제 핸들러
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      const confirmDelete = confirm("프로필 사진을 정말 삭제하시겠습니까?");
      if (!confirmDelete) return;

      const username = sessionStorage.getItem(auth.LOGIN_USER_KEY) || localStorage.getItem(auth.LOGIN_USER_KEY);
      if (!username) {
        alert("로그인된 사용자가 없습니다.");
        return;
      }

      const ok = auth.updateUser(username, { profileImage: undefined });
      if (!ok) {
        alert("프로필을 삭제하지 못했습니다.");
        return;
      }

      // 초기화 UI
      avatarEl.innerHTML = "👤";
      avatarEl.setAttribute("aria-hidden", "true");
      if (uploadInput) uploadInput.value = "";
      removeBtn.disabled = true;
    });
  }
}

function revealInfoPage(loginSection: HTMLElement, infoPage: HTMLElement, signupSection?: HTMLElement) {
  loginSection.classList.add("d-none");
  if (signupSection) signupSection.classList.add("d-none");
  infoPage.classList.remove("d-none");
}

function showFeedback(target: HTMLElement, message: string, success = false) {
  target.textContent = message;
  target.classList.toggle("is-success", success);
}

/**
 * 작은 토스트 알림을 화면 우측 하단에 표시합니다.
 */
function showToast(message: string, duration = 2500) {
  const existing = document.querySelector<HTMLDivElement>(".app-toast");
  if (existing) existing.remove();

  const el = document.createElement("div");
  el.className = "app-toast";
  el.textContent = message;
  document.body.appendChild(el);

  // show
  requestAnimationFrame(() => el.classList.add("is-visible"));

  setTimeout(() => {
    el.classList.remove("is-visible");
    el.addEventListener(
      "transitionend",
      () => {
        el.remove();
      },
      { once: true }
    );
  }, duration);
}

function setupSignup(signupSection: HTMLElement | null, loginSection: HTMLElement) {
  if (!signupSection) return;

  const signupForm = document.getElementById("info-signup-form") as HTMLFormElement | null;
  if (!signupForm) return;

  // 아이디
  const usernameInput = signupForm.querySelector<HTMLInputElement>(".js-signup-username") as HTMLInputElement | null;
  // 이메일
  const emailInput = signupForm.querySelector<HTMLInputElement>(".js-signup-email") as HTMLInputElement | null;
  // 이름
  const nameInput = signupForm.querySelector<HTMLInputElement>(".js-signup-name") as HTMLInputElement | null;
  // 도로명 주소
  const roadAddressInput = signupForm.querySelector<HTMLInputElement>(".js-signup-road-address") as HTMLInputElement | null;
  // 상세 주소
  const addressDetailInput = signupForm.querySelector<HTMLInputElement>(".js-signup-address-detail") as HTMLInputElement | null;
  // 휴대폰
  const phoneInput = signupForm.querySelector<HTMLInputElement>(".js-signup-phone") as HTMLInputElement | null;
  // 비번
  const passwordInput = signupForm.querySelector<HTMLInputElement>(".js-signup-password") as HTMLInputElement | null;
  const passwordConfirmInput = signupForm.querySelector<HTMLInputElement>(
    ".js-signup-password-confirm"
  ) as HTMLInputElement | null;
  // 피드백
  const signupFeedback = signupForm.querySelector<HTMLElement>(".info-signup__feedback");

  if (
    !usernameInput ||
    !emailInput ||
    !nameInput ||
    !roadAddressInput ||
    !addressDetailInput ||
    !phoneInput ||
    !passwordInput ||
    !passwordConfirmInput
  )
    return;

  const hintMap = new Map<string, HTMLElement>();

  signupForm.querySelectorAll<HTMLElement>(".info-field-hint").forEach((hint) => {
    const key = hint.dataset.hintTarget;
    if (key) hintMap.set(key, hint);
    // 힌트 정보
  });

  // 주소 api
  setupAddressModal({
    signupSection,
    roadAddressInput,
    detailInput: addressDetailInput,
    hint: hintMap.get("road-address"),
  });

  // 아이디 이메일 중복 체크
  const duplicateButtons = signupForm.querySelectorAll<HTMLButtonElement>(".js-field-check");
  duplicateButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.checkTarget as "username" | "email" | undefined;
      if (!target) return;
      if (target === "username") {
        auth.runDuplicateCheck({
          input: usernameInput,
          hint: hintMap.get("username"),
          validator: auth.validateUsername,
          isTaken: auth.isUsernameTaken,
          duplicateMessage: "이미 사용 중인 아이디입니다.",
          successMessage: "사용 가능한 아이디입니다.",
        });
      }
      if (target === "email") {
        auth.runDuplicateCheck({
          input: emailInput,
          hint: hintMap.get("email"),
          validator: auth.validateEmail,
          isTaken: auth.isEmailTaken,
          duplicateMessage: "이미 등록된 이메일입니다.",
          successMessage: "사용 가능한 이메일입니다.",
        });
      }
    });
  });

  const resetDuplicateFlag = (input: HTMLInputElement, hintKey: string) => {
    input.dataset.duplicate = "false";
    const hint = hintMap.get(hintKey);
    if (hint) {
      const defaultMsg = hint.dataset.hintDefault ?? "";
      auth.setHintState(hint, defaultMsg, "default");
    }
  };

  usernameInput.addEventListener("input", () => resetDuplicateFlag(usernameInput, "username"));
  emailInput.addEventListener("input", () => resetDuplicateFlag(emailInput, "email"));
  nameInput.addEventListener("input", () => {
    const hint = hintMap.get("name");
    if (hint) auth.setHintState(hint, hint.dataset.hintDefault ?? "", "default");
  });
  roadAddressInput.addEventListener("input", () => {
    delete roadAddressInput.dataset.selected;
    const hint = hintMap.get("road-address");
    if (hint) auth.setHintState(hint, hint.dataset.hintDefault ?? "", "default");
  });
  addressDetailInput.addEventListener("input", () => {
    const hint = hintMap.get("address-detail");
    if (hint) auth.setHintState(hint, hint.dataset.hintDefault ?? "", "default");
  });

  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const name = nameInput.value.trim();
    const roadAddress = roadAddressInput.value.trim();
    const addressDetail = addressDetailInput.value.trim();
    const phone = phoneInput.value.trim();
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;

    const passwordValidation = auth.validatePassword(password);
    if (!passwordValidation.ok) {
      auth.setHintState(hintMap.get("password"), passwordValidation.message ?? "비밀번호를 확인해주세요.", "error");
      passwordInput.focus();
      return;
    }

    if (password !== passwordConfirm) {
      auth.setHintState(hintMap.get("password-confirm"), "비밀번호가 일치하지 않습니다.", "error");
      passwordConfirmInput.focus();
      return;
    }

    auth.setHintState(hintMap.get("password"), "안전한 비밀번호입니다.", "success");
    auth.setHintState(hintMap.get("password-confirm"), "비밀번호가 일치합니다.", "success");

    const fullAddress = `${roadAddress} ${addressDetail}`.trim();
    const users = auth.loadUsers();
    users.push({
      username,
      name,
      email,
      password,
      phone,
      address: fullAddress,
      roadAddress,
      addressDetail,
    });
    auth.saveUsers(users);

    if (signupFeedback) {
      signupFeedback.textContent = "가입이 완료되었습니다! 새 계정으로 로그인해주세요.";
      signupFeedback.classList.add("is-success");
    }

    setTimeout(() => {
      hideSignup(loginSection, signupSection);
    }, 1200);
  });
}

function hideSignup(loginSection: HTMLElement, signupSection: HTMLElement) {
  signupSection.classList.add("d-none");
  loginSection.classList.remove("d-none");
  resetSignupUI(signupSection);
  const firstField = loginSection.querySelector<HTMLInputElement>("input");
  firstField?.focus();
}

function setupFindUsername() {
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
    // trigger animation
    requestAnimationFrame(() => modal.classList.add("is-open"));
    modal.setAttribute("aria-hidden", "false");
    if (results) results.innerHTML = "";
    if (status) status.textContent = "가입 시 사용한 이메일을 입력하세요.";
    form?.reset();
    input?.focus();
  };

  const close = () => {
    // If focus is currently inside the modal, move it to a safe target
    try {
      const active = document.activeElement as HTMLElement | null;
      if (active && modal.contains(active)) {
        // prefer the original trigger if present, else find any focusable fallback
        if (trigger) trigger.focus();
        else {
          const fallback = document.querySelector<HTMLElement>(
            'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (fallback) fallback.focus();
        }
      }
    } catch {}

    // trigger closing animation and then hide
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

  // 외부 확인 버튼 연결
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

    // 찾기
    const found = auth.findUserByEmail(email);
    results.innerHTML = "";
    if (found) {
      const li = document.createElement("li");
      li.className = "findid-modal__result";

      // result text + copy button
      const textWrap = document.createElement("div");
      textWrap.className = "findid-modal__result-textwrap";
      textWrap.innerHTML = `등록된 아이디: <strong class=\"findid-modal__username\">${found.username}</strong>`;

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
          // fallback: select and execCopy
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

function setupFindPassword() {
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
    // move focus out of the dialog if it's currently focused inside
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

  // 외부 확인 버튼 연결
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

    // 일치하면 비밀번호 재설정 UI 표시
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
    // 자동으로 모달 닫기
    setTimeout(() => close(), 1200);
  });
}

function setupChangePassword() {
  // Prefer the modal placed inside the info page (visible to signed-in users).
  // Fallback to any `.change-password-modal` in the document (older markup).
  const modal =
    document.querySelector<HTMLElement>(".info-page .change-password-modal") ||
    document.querySelector<HTMLElement>(".info-page .change-pw-modal") ||
    document.querySelector<HTMLElement>(".change-password-modal") ||
    document.querySelector<HTMLElement>(".change-pw-modal");
  const trigger = document.getElementById("js-profile-change-password") as HTMLButtonElement | null;
  if (!modal || !trigger) return;

  // Prevent attaching listeners more than once
  if (modal.dataset._changePasswordInit === "true") return;

  const closeBtn = modal.querySelector<HTMLButtonElement>(".change-password-modal__close");
  const form = modal.querySelector<HTMLFormElement>(".change-password-modal__form");
  const inputCurrent = modal.querySelector<HTMLInputElement>(".js-change-current");
  const inputNew = modal.querySelector<HTMLInputElement>(".js-change-new");
  const inputNewConfirm = modal.querySelector<HTMLInputElement>(".js-change-new-confirm");
  const status = modal.querySelector<HTMLElement>(".change-password-modal__status");
  const saveBtn = modal.querySelector<HTMLButtonElement>(".js-change-save");

  const open = () => {
    // Require login before opening
    const username = sessionStorage.getItem(auth.LOGIN_USER_KEY) || localStorage.getItem(auth.LOGIN_USER_KEY);
    if (!username) {
      showToast("로그인이 필요합니다. 먼저 로그인해주세요.");
      return;
    }

    modal.classList.remove("d-none");
    requestAnimationFrame(() => modal.classList.add("is-open"));
    modal.setAttribute("aria-hidden", "false");
    status && (status.textContent = "현재 비밀번호를 입력하세요.");
    form?.reset();
    inputCurrent?.focus();
  };

  const close = () => {
    // move focus out of modal if necessary
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

  if (!form || !inputCurrent || !inputNew || !inputNewConfirm || !status || !saveBtn) return;

  saveBtn.addEventListener("click", () => {
    const current = (inputCurrent.value || "").trim();
    const next = (inputNew.value || "").trim();
    const confirm = (inputNewConfirm.value || "").trim();

    const username = sessionStorage.getItem(auth.LOGIN_USER_KEY) || localStorage.getItem(auth.LOGIN_USER_KEY);
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

    // Prevent changing to the same password as the current one
    if (next === current) {
      status.textContent = "새 비밀번호가 현재 비밀번호와 동일합니다. 다른 비밀번호를 입력하세요.";
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

    // Inform the user via alert, then force logout and return to the login view
    try {
      // show blocking alert message before logout/close
      alert("비밀번호가 변경되어 보안을 위해 자동으로 로그아웃됩니다. 다시 로그인해주세요.");
    } catch (e) {
      // ignore if alerts are blocked in environment
    }

    // perform logout: clear storage and switch views back to login
    sessionStorage.removeItem(auth.LOGIN_STORAGE_KEY);
    sessionStorage.removeItem(auth.LOGIN_USER_KEY);
    localStorage.removeItem(auth.LOGIN_STORAGE_KEY);
    localStorage.removeItem(auth.LOGIN_USER_KEY);

    // show the login section and hide info page if present
    const loginSection = document.querySelector<HTMLElement>(".info-login");
    const infoPage = document.querySelector<HTMLElement>(".info-page");
    const feedback = document.querySelector<HTMLElement>("#info-login-form .info-login__feedback");
    const submitButton = document.querySelector<HTMLButtonElement>("#info-login-form .info-login__submit");

    if (loginSection) loginSection.classList.remove("d-none");
    if (infoPage) infoPage.classList.add("d-none");

    if (feedback) {
      feedback.textContent = "비밀번호가 변경되어 자동 로그아웃되었습니다. 다시 로그인해주세요.";
      feedback.classList.add("is-success");
    }
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "로그인";
    }

    // close the modal after the logout UI changes
    setTimeout(() => close(), 300);
  });

  // mark as initialized
  modal.dataset._changePasswordInit = "true";
}

function setupContactModal() {
  // Prefer in-page contact modal (.info-page) for profile view, fall back to any contact-modal
  const modal =
    document.querySelector<HTMLElement>(".info-page .contact-modal") ||
    document.querySelector<HTMLElement>(".info-page .info-contact-modal") ||
    document.querySelector<HTMLElement>(".contact-modal");
  const trigger = document.getElementById("js-contact-edit") as HTMLButtonElement | null;
  if (!modal || !trigger) return;

  // prevent duplicate initialization
  if (modal.dataset._contactInit === "true") return;

  const closeBtn = modal.querySelector<HTMLButtonElement>(".contact-modal__close");
  const form = modal.querySelector<HTMLFormElement>(".contact-modal__form");
  const inputEmail = modal.querySelector<HTMLInputElement>(".js-contact-email");
  const inputPhone = modal.querySelector<HTMLInputElement>(".js-contact-phone");
  const status = modal.querySelector<HTMLElement>(".contact-modal__status");
  const saveBtn = modal.querySelector<HTMLButtonElement>(".js-contact-save");

  const open = () => {
    // require login before opening from profile actions
    const username = sessionStorage.getItem(auth.LOGIN_USER_KEY) || localStorage.getItem(auth.LOGIN_USER_KEY);
    if (!username) {
      showToast("로그인이 필요합니다. 먼저 로그인해주세요.");
      return;
    }

    modal.classList.remove("d-none");
    requestAnimationFrame(() => modal.classList.add("is-open"));
    modal.setAttribute("aria-hidden", "false");
    form?.reset();

    // prefill current user
    if (username) {
      const user = auth.findUserByUsername(username);
      if (user) {
        if (inputEmail) inputEmail.value = user.email ?? "";
        if (inputPhone) inputPhone.value = user.phone ?? "";
      }
    }
    inputEmail?.focus();
    status && (status.textContent = "이메일과 휴대폰을 확인 후 저장하세요.");
  };

  const close = () => {
    // ensure focus leaves the modal before hiding it to avoid aria-hidden on focused element
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

  if (!form || !inputEmail || !inputPhone || !status || !saveBtn) return;

  saveBtn.addEventListener("click", () => {
    const email = (inputEmail.value || "").trim();
    const phone = (inputPhone.value || "").trim();
    const username = sessionStorage.getItem(auth.LOGIN_USER_KEY) || localStorage.getItem(auth.LOGIN_USER_KEY);
    if (!username) {
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

  // mark initialized to avoid duplicate listeners
  modal.dataset._contactInit = "true";
}

function setupAddressManage() {
  // prefer modal inside the info page (visible to logged-in users)
  const modal =
    document.querySelector<HTMLElement>(".info-page .address-manage-modal") ||
    document.querySelector<HTMLElement>(".address-manage-modal");
  const trigger = document.getElementById("js-address-manage") as HTMLButtonElement | null;
  if (!modal || !trigger) return;

  // avoid double initialization
  if (modal.dataset._addressInit === "true") return;

  const closeBtn = modal.querySelector<HTMLButtonElement>(".address-manage-modal__close");
  const form = modal.querySelector<HTMLFormElement>(".address-manage-modal__form");
  const inputRoad = modal.querySelector<HTMLInputElement>(".js-address-road");
  const inputDetail = modal.querySelector<HTMLInputElement>(".js-address-detail");
  const status = modal.querySelector<HTMLElement>(".address-manage-modal__status");
  const saveBtn = modal.querySelector<HTMLButtonElement>(".js-address-save");

  const open = () => {
    // require login before opening
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
    // move focus out of the modal if focused inside to avoid aria-hidden on focused element
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

    // Road address is optional but at least one of road or detail should be present
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

  // mark as initialized
  modal.dataset._addressInit = "true";
}

function resetSignupUI(signupSection: HTMLElement) {
  const signupForm = signupSection.querySelector<HTMLFormElement>("#info-signup-form");
  if (!signupForm) return;
  signupForm.reset();
  signupForm.querySelectorAll<HTMLInputElement>("input").forEach((input) => {
    delete input.dataset.duplicate;
    delete input.dataset.selected;
  });
  signupForm.querySelectorAll<HTMLElement>(".info-field-hint").forEach((hint) => {
    const defaultMsg = hint.dataset.hintDefault ?? "";
    auth.setHintState(hint, defaultMsg, "default");
  });
  const feedback = signupForm.querySelector<HTMLElement>(".info-signup__feedback");
  if (feedback) {
    feedback.textContent = "";
    feedback.classList.remove("is-success");
  }
}
