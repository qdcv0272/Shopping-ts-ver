import "../../css/page/info.css";

import { log } from "../function/log";
import * as auth from "../module/auth";
import { setupAddressModal } from "../module/address";

export function initInfo() {
  log("info");
  setupInfoLogin();
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

  // 세션 스토리지
  const sessionAuthed = sessionStorage.getItem(auth.LOGIN_STORAGE_KEY) === "true";
  const authedUsernameSession = sessionStorage.getItem(auth.LOGIN_USER_KEY);

  const authedUsername = authedUsernameSession;

  if (sessionAuthed && authedUsername) {
    console.log("로그인 되어있는중");
    const authedUser = auth.findUserByUsername(authedUsernameSession);

    if (authedUser) {
      populateInfoPage(authedUser);
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

  if (signupTrigger && signupSection) {
    signupTrigger.addEventListener("click", () => showSignup(loginSection, signupSection));
  }

  if (signupBackButton && signupSection) {
    signupBackButton.addEventListener("click", () => hideSignup(loginSection, signupSection));
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
