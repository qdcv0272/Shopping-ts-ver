import * as auth from "../auth";

export function populateInfoPage(user: auth.StoredUser) {
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
      avatarEl.innerHTML = "👤";
      avatarEl.setAttribute("aria-hidden", "true");
    }
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

export function setupProfileUploader() {
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

      avatarEl.innerHTML = "";
      const img = document.createElement("img");
      img.className = "avatar-img";
      img.alt = "프로필 미리보기";
      img.src = dataUrl;
      avatarEl.appendChild(img);

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

      avatarEl.innerHTML = "👤";
      avatarEl.setAttribute("aria-hidden", "true");
      if (uploadInput) uploadInput.value = "";
      removeBtn.disabled = true;
    });
  }
}
