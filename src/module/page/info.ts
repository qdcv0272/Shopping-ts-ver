import "../../css/page/info.css";

import { log } from "../function/log";

const LOGIN_STORAGE_KEY = "shoppingts-info-authed";
const LOGIN_USER_KEY = "shoppingts-info-username";
const USERS_STORAGE_KEY = "shoppingts-info-users";
const JUSO_API_KEY = "devU01TX0FVVEgyMDI1MTEyNzE2MjMzNTExNjUwMzQ=";
const JUSO_API_URL = "https://business.juso.go.kr/addrlink/addrLinkApi.do";

type StoredUser = {
  username: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  roadAddress?: string;
  addressDetail?: string;
};

export function initInfo() {
  log("info");
  setupInfoLogin();
}

function setupInfoLogin() {
  const loginSection = document.querySelector<HTMLElement>(".info-login");
  const signupSection = document.querySelector<HTMLElement>(".info-signup");
  const infoPage = document.querySelector<HTMLElement>(".info-page");
  const form = document.getElementById("info-login-form") as HTMLFormElement | null;

  if (!loginSection || !infoPage || !form) return;

  const feedback = form.querySelector<HTMLElement>(".info-login__feedback");
  const submitButton = form.querySelector<HTMLButtonElement>(".info-login__submit");
  const signupTrigger = document.querySelector<HTMLButtonElement>(".js-info-open-signup");
  const signupBackButton = signupSection?.querySelector<HTMLButtonElement>('[data-action="back"]');

  // sessionStorage indicates an active session for this browser window/tab
  const sessionAuthed = sessionStorage.getItem(LOGIN_STORAGE_KEY) === "true";
  const authedUsernameSession = sessionStorage.getItem(LOGIN_USER_KEY);

  const authedUsername = authedUsernameSession;

  if (sessionAuthed && authedUsername) {
    const authedUser = findUserByUsername(authedUsernameSession);
    if (authedUser) {
      populateInfoPage(authedUser);
      revealInfoPage(loginSection, infoPage, signupSection ?? undefined);
      // bind logout button (for restored sessions)
      const logoutBtnRestored = document.getElementById("js-info-logout") as HTMLButtonElement | null;
      logoutBtnRestored?.addEventListener("click", () => {
        sessionStorage.removeItem(LOGIN_STORAGE_KEY);
        sessionStorage.removeItem(LOGIN_USER_KEY);
        localStorage.removeItem(LOGIN_STORAGE_KEY);
        localStorage.removeItem(LOGIN_USER_KEY);
        loginSection.classList.remove("d-none");
        infoPage.classList.add("d-none");
      });
      return;
    }
    sessionStorage.removeItem(LOGIN_STORAGE_KEY);
    sessionStorage.removeItem(LOGIN_USER_KEY);
  } else {
    // No session auth found — ensure persisted storage is not left behind
    localStorage.removeItem(LOGIN_STORAGE_KEY);
    localStorage.removeItem(LOGIN_USER_KEY);
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

    const usernameInput = form.elements.namedItem("username") as HTMLInputElement | null;
    const passwordInput = form.elements.namedItem("password") as HTMLInputElement | null;
    // no "remember me" checkbox — always use session storage for login

    if (!usernameInput || !passwordInput || !feedback) return;

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showFeedback(feedback, "아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    const matchedUser = findUserByUsername(username);
    if (!matchedUser || matchedUser.password !== password) {
      showFeedback(feedback, "계정 정보가 일치하지 않습니다. 다시 확인해주세요.");
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "로그인 중...";
    }

    showFeedback(feedback, "로그인에 성공했어요!", true);
    // Always use sessionStorage for login state (no persistence)
    sessionStorage.setItem(LOGIN_STORAGE_KEY, "true");
    sessionStorage.setItem(LOGIN_USER_KEY, matchedUser.username);
    // Remove any leftover persisted auth keys to prevent unexpected auto-login
    localStorage.removeItem(LOGIN_STORAGE_KEY);
    localStorage.removeItem(LOGIN_USER_KEY);
    populateInfoPage(matchedUser);
    form.reset();
    revealInfoPage(loginSection, infoPage, signupSection ?? undefined);
    // bind logout button (exists inside infoPage)
    const logoutBtn = document.getElementById("js-info-logout") as HTMLButtonElement | null;
    logoutBtn?.addEventListener("click", () => {
      // remove both session and local storage login values to ensure a thorough logout
      sessionStorage.removeItem(LOGIN_STORAGE_KEY);
      sessionStorage.removeItem(LOGIN_USER_KEY);
      localStorage.removeItem(LOGIN_STORAGE_KEY);
      localStorage.removeItem(LOGIN_USER_KEY);

      // show login UI again
      loginSection.classList.remove("d-none");
      infoPage.classList.add("d-none");
    });
  });
}

function showFeedback(target: HTMLElement, message: string, success = false) {
  target.textContent = message;
  target.classList.toggle("is-success", success);
}

function setupSignup(signupSection: HTMLElement | null, loginSection: HTMLElement) {
  if (!signupSection) return;

  const signupForm = document.getElementById("info-signup-form") as HTMLFormElement | null;
  if (!signupForm) return;

  const usernameInput = signupForm.elements.namedItem("signup-username") as HTMLInputElement | null;
  const emailInput = signupForm.elements.namedItem("signup-email") as HTMLInputElement | null;
  const nameInput = signupForm.elements.namedItem("signup-name") as HTMLInputElement | null;
  const roadAddressInput = signupForm.elements.namedItem("signup-road-address") as HTMLInputElement | null;
  const addressDetailInput = signupForm.elements.namedItem("signup-address-detail") as HTMLInputElement | null;
  const phoneInput = signupForm.elements.namedItem("signup-phone") as HTMLInputElement | null;
  const passwordInput = signupForm.elements.namedItem("signup-password") as HTMLInputElement | null;
  const passwordConfirmInput = signupForm.elements.namedItem("signup-password-confirm") as HTMLInputElement | null;
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
        runDuplicateCheck({
          input: usernameInput,
          hint: hintMap.get("username"),
          validator: validateUsername,
          isTaken: isUsernameTaken,
          duplicateMessage: "이미 사용 중인 아이디입니다.",
          successMessage: "사용 가능한 아이디입니다.",
        });
      }
      if (target === "email") {
        runDuplicateCheck({
          input: emailInput,
          hint: hintMap.get("email"),
          validator: validateEmail,
          isTaken: isEmailTaken,
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
      setHintState(hint, defaultMsg, "default");
    }
  };

  usernameInput.addEventListener("input", () => resetDuplicateFlag(usernameInput, "username"));
  emailInput.addEventListener("input", () => resetDuplicateFlag(emailInput, "email"));
  nameInput.addEventListener("input", () => {
    const hint = hintMap.get("name");
    if (hint) setHintState(hint, hint.dataset.hintDefault ?? "", "default");
  });
  roadAddressInput.addEventListener("input", () => {
    delete roadAddressInput.dataset.selected;
    const hint = hintMap.get("road-address");
    if (hint) setHintState(hint, hint.dataset.hintDefault ?? "", "default");
  });
  addressDetailInput.addEventListener("input", () => {
    const hint = hintMap.get("address-detail");
    if (hint) setHintState(hint, hint.dataset.hintDefault ?? "", "default");
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

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.ok) {
      setHintState(hintMap.get("password"), passwordValidation.message ?? "비밀번호를 확인해주세요.", "error");
      passwordInput.focus();
      return;
    }

    if (password !== passwordConfirm) {
      setHintState(hintMap.get("password-confirm"), "비밀번호가 일치하지 않습니다.", "error");
      passwordConfirmInput.focus();
      return;
    }

    setHintState(hintMap.get("password"), "안전한 비밀번호입니다.", "success");
    setHintState(hintMap.get("password-confirm"), "비밀번호가 일치합니다.", "success");

    const fullAddress = `${roadAddress} ${addressDetail}`.trim();
    const users = loadUsers();
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
    saveUsers(users);

    if (signupFeedback) {
      signupFeedback.textContent = "가입이 완료되었습니다! 새 계정으로 로그인해주세요.";
      signupFeedback.classList.add("is-success");
    }

    setTimeout(() => {
      hideSignup(loginSection, signupSection);
    }, 1200);
  });
}

function populateInfoPage(user: StoredUser) {
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

function showSignup(loginSection: HTMLElement, signupSection: HTMLElement) {
  loginSection.classList.add("d-none");
  signupSection.classList.remove("d-none");
  const firstField = signupSection.querySelector<HTMLInputElement>("input");
  firstField?.focus();
}

function hideSignup(loginSection: HTMLElement, signupSection: HTMLElement) {
  signupSection.classList.add("d-none");
  loginSection.classList.remove("d-none");
  resetSignupUI(signupSection);
  const firstField = loginSection.querySelector<HTMLInputElement>("input");
  firstField?.focus();
}

type ValidationResult = { ok: boolean; message?: string };

function validateName(value: string): ValidationResult {
  if (!value) return { ok: false, message: "이름을 입력해주세요." };
  if (value.length < 2) return { ok: false, message: "이름은 2자 이상 입력해주세요." };
  if (!/^[\p{L}\s]+$/u.test(value)) {
    return { ok: false, message: "이름에는 숫자나 특수문자를 사용할 수 없습니다." };
  }
  return { ok: true };
}

function validateUsername(value: string): ValidationResult {
  if (!value) return { ok: false, message: "아이디를 입력해주세요." };
  if (value.length < 4) return { ok: false, message: "아이디는 4자 이상이어야 합니다." };
  if (!/^[a-zA-Z0-9]+$/.test(value)) return { ok: false, message: "영문과 숫자만 사용할 수 있습니다." };
  if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
    return { ok: false, message: "영문과 숫자를 모두 포함해야 합니다." };
  }
  return { ok: true };
}

function validateEmail(value: string): ValidationResult {
  if (!value) return { ok: false, message: "이메일을 입력해주세요." };
  const emailRegex = /^[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(value)) return { ok: false, message: "이메일 형식이 올바르지 않습니다." };
  return { ok: true };
}

function validatePhone(value: string): ValidationResult {
  if (!value) return { ok: false, message: "휴대폰 번호를 입력해주세요." };
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) return { ok: false, message: "휴대폰 번호는 10~11자리여야 합니다." };
  if (!/^01[016789]\d{7,8}$/.test(digits)) return { ok: false, message: "휴대폰 번호 형식이 올바르지 않습니다." };
  return { ok: true };
}

function validatePassword(value: string): ValidationResult {
  if (value.length < 6) return { ok: false, message: "비밀번호는 6자 이상이어야 합니다." };
  if (!/[A-Z]/.test(value)) return { ok: false, message: "대문자를 최소 1자 포함하세요." };
  if (!/[a-z]/.test(value)) return { ok: false, message: "소문자를 최소 1자 포함하세요." };
  if (!/[^A-Za-z0-9]/.test(value)) return { ok: false, message: "특수문자를 최소 1자 포함하세요." };
  return { ok: true };
}

function runDuplicateCheck({
  input,
  hint,
  validator,
  isTaken,
  duplicateMessage,
  successMessage,
}: {
  input: HTMLInputElement;
  hint?: HTMLElement;
  validator: (value: string) => ValidationResult;
  isTaken: (value: string) => boolean;
  duplicateMessage: string;
  successMessage: string;
}) {
  const value = input.value.trim();
  const validation = validator(value);
  if (!validation.ok) {
    setHintState(hint, validation.message ?? "입력값을 확인해주세요.", "error");
    input.dataset.duplicate = "false";
    input.focus();
    return;
  }
  const exists = isTaken(value);
  if (exists) {
    setHintState(hint, duplicateMessage, "error");
    input.dataset.duplicate = "false";
    return;
  }
  setHintState(hint, successMessage, "success");
  input.dataset.duplicate = "true";
}

function setHintState(hint: HTMLElement | undefined, message: string, state: "default" | "success" | "error") {
  if (!hint) return;
  hint.textContent = message;
  hint.classList.remove("is-success", "is-error");
  if (state === "success") hint.classList.add("is-success");
  if (state === "error") hint.classList.add("is-error");
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
    setHintState(hint, defaultMsg, "default");
  });
  const feedback = signupForm.querySelector<HTMLElement>(".info-signup__feedback");
  if (feedback) {
    feedback.textContent = "";
    feedback.classList.remove("is-success");
  }
}

type AddressModalOptions = {
  signupSection: HTMLElement;
  roadAddressInput: HTMLInputElement;
  detailInput: HTMLInputElement;
  hint?: HTMLElement;
};

type JusoAddress = {
  roadAddr: string;
  jibunAddr?: string;
  zipNo?: string;
};

function setupAddressModal({ signupSection, roadAddressInput, detailInput, hint }: AddressModalOptions) {
  const modal = document.querySelector<HTMLElement>(".address-modal");
  const trigger = signupSection.querySelector<HTMLButtonElement>(".js-address-search");
  if (!modal || !trigger) return;

  const closeButton = modal.querySelector<HTMLButtonElement>(".address-modal__close");
  const searchForm = modal.querySelector<HTMLFormElement>(".address-modal__search");
  const searchInput = modal.querySelector<HTMLInputElement>('input[name="address-keyword"]');
  const resultsList = modal.querySelector<HTMLUListElement>(".address-modal__results");
  const statusText = modal.querySelector<HTMLElement>(".address-modal__status");
  const submitButton = searchForm?.querySelector<HTMLButtonElement>('button[type="submit"]');

  const openModal = () => {
    modal.classList.remove("d-none");
    modal.setAttribute("aria-hidden", "false");
    if (resultsList) resultsList.innerHTML = "";
    if (statusText) statusText.textContent = "도로명 주소를 검색해주세요.";
    searchForm?.reset();
    searchInput?.focus();
  };

  const closeModal = () => {
    modal.classList.add("d-none");
    modal.setAttribute("aria-hidden", "true");
    searchForm?.reset();
  };

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    openModal();
  });

  closeButton?.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  if (!searchForm || !searchInput || !resultsList || !statusText) return;

  searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const keyword = searchInput.value.trim();
    if (!keyword) {
      statusText.textContent = "검색어를 입력해주세요.";
      return;
    }
    statusText.textContent = "검색 중입니다...";
    resultsList.innerHTML = "";
    if (submitButton) submitButton.disabled = true;

    try {
      const addresses = await fetchJusoAddresses(keyword);
      if (!addresses.length) {
        statusText.textContent = "검색 결과가 없습니다. 다른 키워드로 시도해보세요.";
        return;
      }

      statusText.textContent = `${addresses.length}건의 주소를 찾았어요. 원하는 주소를 선택해주세요.`;
      addresses.forEach((address) => {
        const item = document.createElement("li");
        item.className = "address-modal__result";
        const road = document.createElement("p");
        road.className = "address-modal__road";
        road.textContent = address.roadAddr;
        const meta = document.createElement("p");
        meta.className = "address-modal__meta";
        meta.textContent = address.jibunAddr ? `지번: ${address.jibunAddr}` : "";
        item.appendChild(road);
        if (address.jibunAddr) item.appendChild(meta);
        item.addEventListener("click", () => {
          roadAddressInput.value = address.roadAddr;
          roadAddressInput.dataset.selected = "true";
          setHintState(hint, "도로명 주소가 선택되었습니다.", "success");
          closeModal();
          detailInput.focus();
        });
        resultsList.appendChild(item);
      });
    } catch (error) {
      statusText.textContent = error instanceof Error ? error.message : "주소 검색에 실패했습니다. 잠시 후 다시 시도해주세요.";
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

async function fetchJusoAddresses(keyword: string): Promise<JusoAddress[]> {
  const params = new URLSearchParams({
    confmKey: JUSO_API_KEY,
    keyword,
    resultType: "json",
    currentPage: "1",
    countPerPage: "20",
  });

  const response = await fetch(JUSO_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error("주소 검색 요청에 실패했습니다.");
  }

  const data: {
    results?: {
      common?: { errorCode?: string; errorMessage?: string };
      juso?: JusoAddress[];
    };
  } = await response.json();

  const errorCode = data?.results?.common?.errorCode;
  if (errorCode && errorCode !== "0") {
    throw new Error(data?.results?.common?.errorMessage ?? "주소 검색 중 오류가 발생했습니다.");
  }

  if (!Array.isArray(data?.results?.juso)) return [];
  return data.results?.juso ?? [];
}

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const normalized: StoredUser[] = [];
    parsed.forEach((user) => {
      if (typeof user?.username === "string" && typeof user?.email === "string" && typeof user?.password === "string") {
        const resolvedName =
          typeof user.name === "string" && user.name.trim() ? (user.name as string) : (user.username as string);
        normalized.push({
          username: user.username,
          name: resolvedName,
          email: user.email,
          password: user.password,
          phone: typeof user.phone === "string" ? user.phone : "",
          address: typeof user.address === "string" ? user.address : "",
          roadAddress: typeof user.roadAddress === "string" ? user.roadAddress : undefined,
          addressDetail: typeof user.addressDetail === "string" ? user.addressDetail : undefined,
        });
      }
    });
    return normalized;
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function findUserByUsername(username: string): StoredUser | undefined {
  const target = username.toLowerCase();
  return loadUsers().find((user) => user.username.toLowerCase() === target);
}

function isUsernameTaken(username: string) {
  return !!findUserByUsername(username);
}

function isEmailTaken(email: string) {
  const target = email.toLowerCase();
  return loadUsers().some((user) => user.email.toLowerCase() === target);
}
