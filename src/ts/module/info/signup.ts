import * as auth from "../auth";
import { setupAddressModal } from "../address";

export function showSignup(loginSection: HTMLElement, signupSection: HTMLElement) {
  loginSection.classList.add("d-none");
  signupSection.classList.remove("d-none");
  const firstField = signupSection.querySelector<HTMLInputElement>("input");
  firstField?.focus();
}

export function hideSignup(loginSection: HTMLElement, signupSection: HTMLElement) {
  signupSection.classList.add("d-none");
  loginSection.classList.remove("d-none");
  resetSignupUI(signupSection);
  const firstField = loginSection.querySelector<HTMLInputElement>("input");
  firstField?.focus();
}

export function setupSignup(signupSection: HTMLElement | null, loginSection: HTMLElement) {
  if (!signupSection) return;

  const signupForm = document.getElementById("info-signup-form") as HTMLFormElement | null;
  if (!signupForm) return;

  const usernameInput = signupForm.querySelector<HTMLInputElement>(".js-signup-username") as HTMLInputElement | null;
  const emailInput = signupForm.querySelector<HTMLInputElement>(".js-signup-email") as HTMLInputElement | null;
  const nameInput = signupForm.querySelector<HTMLInputElement>(".js-signup-name") as HTMLInputElement | null;
  const roadAddressInput = signupForm.querySelector<HTMLInputElement>(".js-signup-road-address") as HTMLInputElement | null;
  const addressDetailInput = signupForm.querySelector<HTMLInputElement>(".js-signup-address-detail") as HTMLInputElement | null;
  const phoneInput = signupForm.querySelector<HTMLInputElement>(".js-signup-phone") as HTMLInputElement | null;
  const passwordInput = signupForm.querySelector<HTMLInputElement>(".js-signup-password") as HTMLInputElement | null;
  const passwordConfirmInput = signupForm.querySelector<HTMLInputElement>(
    ".js-signup-password-confirm"
  ) as HTMLInputElement | null;
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
  });

  setupAddressModal({
    signupSection,
    roadAddressInput,
    detailInput: addressDetailInput,
    hint: hintMap.get("road-address"),
  });

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
