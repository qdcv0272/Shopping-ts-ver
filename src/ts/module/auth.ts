export const LOGIN_STORAGE_KEY = "shoppingts-info-authed";
export const LOGIN_USER_KEY = "shoppingts-info-username";
export const USERS_STORAGE_KEY = "shoppingts-info-users";

export type StoredUser = {
  username: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  roadAddress?: string;
  addressDetail?: string;
};

type ValidationResult = { ok: boolean; message?: string };

export function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function isEmailTaken(email: string) {
  const target = email.toLowerCase();
  return loadUsers().some((user) => user.email.toLowerCase() === target);
}

export function validateName(value: string): ValidationResult {
  if (!value) return { ok: false, message: "이름을 입력해주세요." };
  if (value.length < 2) return { ok: false, message: "이름은 2자 이상 입력해주세요." };
  if (!/^[\p{L}\s]+$/u.test(value)) {
    return { ok: false, message: "이름에는 숫자나 특수문자를 사용할 수 없습니다." };
  }
  return { ok: true };
}

export function validateEmail(value: string): ValidationResult {
  if (!value) return { ok: false, message: "이메일을 입력해주세요." };
  const emailRegex = /^[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(value)) return { ok: false, message: "이메일 형식이 올바르지 않습니다." };
  return { ok: true };
}

export function validatePhone(value: string): ValidationResult {
  if (!value) return { ok: false, message: "휴대폰 번호를 입력해주세요." };
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) return { ok: false, message: "휴대폰 번호는 10~11자리여야 합니다." };
  if (!/^01[016789]\d{7,8}$/.test(digits)) return { ok: false, message: "휴대폰 번호 형식이 올바르지 않습니다." };
  return { ok: true };
}

export function validatePassword(value: string): ValidationResult {
  if (value.length < 6) return { ok: false, message: "비밀번호는 6자 이상이어야 합니다." };
  if (!/[A-Z]/.test(value)) return { ok: false, message: "대문자를 최소 1자 포함하세요." };
  if (!/[a-z]/.test(value)) return { ok: false, message: "소문자를 최소 1자 포함하세요." };
  if (!/[^A-Za-z0-9]/.test(value)) return { ok: false, message: "특수문자를 최소 1자 포함하세요." };
  return { ok: true };
}

export function setHintState(hint: HTMLElement | undefined, message: string, state: "default" | "success" | "error") {
  if (!hint) return;
  hint.textContent = message;
  hint.classList.remove("is-success", "is-error");
  if (state === "success") hint.classList.add("is-success");
  if (state === "error") hint.classList.add("is-error");
}

// 아이디 이메일 중복 체크
export function runDuplicateCheck({
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

export function validateUsername(value: string): ValidationResult {
  if (!value) return { ok: false, message: "아이디를 입력해주세요." };
  if (value.length < 4) return { ok: false, message: "아이디는 4자 이상이어야 합니다." };
  if (!/^[a-zA-Z0-9]+$/.test(value)) return { ok: false, message: "영문과 숫자만 사용할 수 있습니다." };
  if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
    return { ok: false, message: "영문과 숫자를 모두 포함해야 합니다." };
  }
  return { ok: true };
}

export function isUsernameTaken(username: string) {
  return findUserByUsername(username) ? true : false;
}

export function findUserByUsername(username: string): StoredUser | undefined {
  const target = username.toLowerCase();
  return loadUsers().find((user) => user.username.toLowerCase() === target);
}

export function loadUsers(): StoredUser[] {
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
    /*
      1. 잘못된/누락된/깨진 데이터 방지
      2. 런타임 에러 예방
      3. StoredUser 타입을 항상 믿고 쓸 수 있게
      4. 유지보수 + 기능 확장에 유리
      5. 코드 전반을 단순하고 안전하게 만들기 위해
    */
  } catch {
    return [];
  }
}
