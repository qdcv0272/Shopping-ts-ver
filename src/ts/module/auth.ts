export const LOGIN_STORAGE_KEY = "shoppingts-info-authed"; // 로그인 상태 저장 키
export const LOGIN_USER_KEY = "shoppingts-info-username"; // 로그인 사용자 이름 저장 키
export const USERS_STORAGE_KEY = "shoppingts-info-users"; // 사용자 목록 저장 키

export type AddressEntry = {
  id: string;
  tag: string;
  label: string;
  road: string;
  detail?: string;
  isDefault?: boolean;
};

export type StoredUser = {
  username: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  profileImage?: string;
  roadAddress?: string;
  addressDetail?: string;
  addresses?: AddressEntry[];
};

type ValidationResult = { ok: boolean; message?: string };

// 성능 최적화: 사용자 목록 캠싱
let usersCache: StoredUser[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000; // 5초

function invalidateUsersCache() {
  usersCache = null;
  cacheTimestamp = 0;
}

export function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  invalidateUsersCache(); // 캠시 무효화
}

export function isEmailTaken(email: string) {
  const target = email.toLowerCase();
  const users = loadUsers();
  return users.some((user) => user.email.toLowerCase() === target);
}

export function validateName(value: string): ValidationResult {
  if (!value) return { ok: false, message: "이름을 입력해주세요." };
  if (value.length < 2) return { ok: false, message: "이름은 2자 이상 입력해주세요." };
  if (!/^[\p{L}\s]+$/u.test(value)) {
    return {
      ok: false,
      message: "이름에는 숫자나 특수문자를 사용할 수 없습니다.",
    };
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

export function findUserByEmail(email: string): StoredUser | undefined {
  if (!email) return undefined;
  const target = email.toLowerCase();
  return loadUsers().find((user) => user.email.toLowerCase() === target);
}

// 사용자 목록 불러오기 (성능 최적화: 캠싱 적용)
export function loadUsers(): StoredUser[] {
  const now = Date.now();
  if (usersCache && now - cacheTimestamp < CACHE_TTL) {
    return usersCache;
  }

  const raw = localStorage.getItem(USERS_STORAGE_KEY);
  if (!raw) {
    usersCache = [];
    cacheTimestamp = now;
    return [];
  }
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  const normalized: StoredUser[] = [];

  parsed.forEach((user) => {
    if (typeof user?.username === "string" && typeof user?.email === "string" && typeof user?.password === "string") {
      const resolvedName = typeof user.name === "string" && user.name.trim() ? (user.name as string) : (user.username as string);

      const legacyRoad = typeof user.roadAddress === "string" ? user.roadAddress : undefined;
      const legacyDetail = typeof user.addressDetail === "string" ? user.addressDetail : undefined;
      const legacyFull = typeof user.address === "string" ? user.address : "";

      let addresses: AddressEntry[] | undefined;
      if (Array.isArray(user.addresses)) {
        addresses = user.addresses
          .map((a: any): AddressEntry | null => {
            if (!a || typeof a.road !== "string" || !a.road.trim()) return null;
            return {
              id: typeof a.id === "string" && a.id ? a.id : cryptoRandomId(),
              tag: typeof a.tag === "string" && a.tag ? a.tag : "home",
              label: typeof a.label === "string" && a.label.trim() ? a.label.trim() : "기본 배송지",
              road: a.road.trim(),
              detail: typeof a.detail === "string" && a.detail.trim() ? a.detail.trim() : undefined,
              isDefault: a.isDefault === true,
            };
          })
          .filter((a: AddressEntry | null): a is AddressEntry => Boolean(a));
      }

      if (!addresses || !addresses.length) {
        if (legacyRoad || legacyFull) {
          addresses = [
            {
              id: cryptoRandomId(),
              tag: "home",
              label: "기본 배송지",
              road: (legacyRoad || legacyFull || "").trim(),
              detail: legacyDetail?.trim() || undefined,
              isDefault: true,
            },
          ];
        }
      }

      if (addresses && addresses.length) {
        const hasDefault = addresses.some((a) => a.isDefault);
        if (!hasDefault) addresses[0].isDefault = true;
      }

      normalized.push({
        username: user.username,
        name: resolvedName,
        email: user.email,
        password: user.password,
        phone: typeof user.phone === "string" ? user.phone : "",
        profileImage: typeof user.profileImage === "string" ? user.profileImage : undefined,
        address: legacyFull,
        roadAddress: legacyRoad,
        addressDetail: legacyDetail,
        addresses,
      });
    }
  });

  // 성능 최적화: 캠싱 저장
  usersCache = normalized;
  cacheTimestamp = now;
  return normalized;
}

export function updateUser(username: string, patch: Partial<StoredUser>) {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());
  if (idx === -1) return false;
  users[idx] = { ...users[idx], ...patch };
  saveUsers(users); // saveUsers가 캠싱 무효화 호출
  return true;
}

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `addr-${Math.random().toString(36).slice(2, 10)}`;
}
