import * as auth from "../auth";
import { fetchJusoAddresses } from "../address";
import { populateInfoPage } from "./profile";
import { showToast } from "./toast";

type AddressEntry = auth.AddressEntry;

const ADDRESS_TAGS: { value: string; label: string; badge: string }[] = [
  { value: "home", label: "집", badge: "badge--home" },
  { value: "work", label: "회사", badge: "badge--work" },
  { value: "friend", label: "친구집", badge: "badge--friend" },
  { value: "other", label: "직접 입력", badge: "badge--other" },
];

export function setupAddressManage() {
  const modal =
    document.querySelector<HTMLElement>(".info-page .address-manage-modal") ||
    document.querySelector<HTMLElement>(".address-manage-modal");
  const trigger = document.getElementById(
    "js-address-manage"
  ) as HTMLButtonElement | null;
  if (!modal || !trigger) return;
  const modalEl = modal as HTMLElement;

  if (modalEl.dataset._addressInit === "true") return;

  const closeBtn = modal.querySelector<HTMLButtonElement>(
    ".address-manage-modal__close"
  );
  const listEl = modal.querySelector<HTMLUListElement>(".js-address-list");
  const status = modal.querySelector<HTMLElement>(
    ".address-manage-modal__status"
  );
  const editor = modal.querySelector<HTMLElement>(".js-address-editor");
  const editorTitle = modal.querySelector<HTMLElement>(".js-editor-title");
  const tagSelect = modal.querySelector<HTMLSelectElement>(".js-address-tag");
  const tagCustomInput = modal.querySelector<HTMLInputElement>(
    ".js-address-tag-custom"
  );
  const searchInput = modal.querySelector<HTMLInputElement>(
    ".js-address-keyword"
  );
  const resultsList = modal.querySelector<HTMLUListElement>(
    ".js-address-results"
  );
  const inputRoad = modal.querySelector<HTMLInputElement>(".js-address-road");
  const inputDetail =
    modal.querySelector<HTMLInputElement>(".js-address-detail");
  const inputDefault = modal.querySelector<HTMLInputElement>(
    ".js-address-default"
  );
  const searchBtn =
    modal.querySelector<HTMLButtonElement>(".js-address-search");
  const addBtn = modal.querySelector<HTMLButtonElement>(".js-address-add");
  const saveBtn = modal.querySelector<HTMLButtonElement>(".js-address-save");
  const cancelBtn =
    modal.querySelector<HTMLButtonElement>(".js-address-cancel");

  if (
    !listEl ||
    !status ||
    !editor ||
    !tagSelect ||
    !searchInput ||
    !resultsList ||
    !inputRoad ||
    !inputDetail ||
    !inputDefault ||
    !searchBtn ||
    !addBtn ||
    !saveBtn ||
    !cancelBtn
  )
    return;

  const list = listEl as HTMLUListElement;
  const statusEl = status as HTMLElement;
  const editorEl = editor as HTMLElement;
  const tagSelectEl = tagSelect as HTMLSelectElement;
  const tagCustomEl = tagCustomInput as HTMLInputElement | null;
  const searchInputEl = searchInput as HTMLInputElement;
  const resultsListEl = resultsList as HTMLUListElement;
  const inputRoadEl = inputRoad as HTMLInputElement;
  const inputDetailEl = inputDetail as HTMLInputElement;
  const inputDefaultEl = inputDefault as HTMLInputElement;
  const searchBtnEl = searchBtn as HTMLButtonElement;
  const addBtnEl = addBtn as HTMLButtonElement;
  const saveBtnEl = saveBtn as HTMLButtonElement;
  const cancelBtnEl = cancelBtn as HTMLButtonElement;

  // lock manual editing of road address; only search results can fill it
  inputRoadEl.readOnly = true;
  inputRoadEl.tabIndex = -1;
  inputRoadEl.addEventListener("mousedown", (e) => {
    e.preventDefault();
    searchInputEl.focus();
  });

  // ephemeral state
  let addresses: AddressEntry[] = [];
  let editingId: string | null = null;

  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    open();
  });

  closeBtn?.addEventListener("click", close);
  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) close();
  });

  tagSelectEl.addEventListener("change", () => {
    const isCustom = tagSelectEl.value === "other";
    tagCustomEl?.classList.toggle("d-none", !isCustom);
    if (isCustom) tagCustomEl?.focus();
  });

  addBtnEl.addEventListener("click", () => {
    openEditor();
  });

  cancelBtnEl.addEventListener("click", () => {
    hideEditor();
  });

  searchBtnEl.addEventListener("click", async () => {
    const keyword = searchInputEl.value.trim();
    if (!keyword) {
      statusEl.textContent = "검색어를 입력해주세요.";
      searchInputEl.focus();
      return;
    }
    await runAddressSearch(keyword);
  });

  saveBtnEl.addEventListener("click", () => {
    saveCurrent();
  });

  function normalize(list: AddressEntry[]): AddressEntry[] {
    const seen = new Set<string>();
    const normalized = list
      .map((a) => {
        const id = a.id || cryptoId();
        if (seen.has(id)) return { ...a, id: cryptoId() };
        seen.add(id);
        return { ...a, id };
      })
      .filter((a) => a.road && a.road.trim());
    if (!normalized.length) return [];
    const hasDefault = normalized.some((a) => a.isDefault);
    if (!hasDefault) normalized[0].isDefault = true;
    else {
      let defaultFound = false;
      normalized.forEach((a) => {
        if (a.isDefault && !defaultFound) {
          defaultFound = true;
          return;
        }
        if (a.isDefault && defaultFound) a.isDefault = false;
      });
    }
    return normalized;
  }

  function open() {
    const username =
      sessionStorage.getItem(auth.LOGIN_USER_KEY) ||
      localStorage.getItem(auth.LOGIN_USER_KEY);
    if (!username) {
      showToast("로그인이 필요합니다. 먼저 로그인해주세요.");
      return;
    }

    const user = auth.findUserByUsername(username);
    addresses = normalize(
      Array.isArray(user?.addresses) && user?.addresses.length
        ? [...(user?.addresses as AddressEntry[])]
        : legacyToAddresses(user)
    );

    renderList();
    hideEditor();

    modalEl.classList.remove("d-none");
    requestAnimationFrame(() => modalEl.classList.add("is-open"));
    modalEl.setAttribute("aria-hidden", "false");
    statusEl.textContent = addresses.length
      ? "주소를 선택하거나 새로 추가할 수 있습니다."
      : "새 주소를 추가해주세요.";
  }

  function close() {
    try {
      const active = document.activeElement as HTMLElement | null;
      if (active && modalEl.contains(active)) {
        if (trigger) trigger.focus();
        else {
          const fallback = document.querySelector<HTMLElement>(
            'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (fallback) fallback.focus();
        }
      }
    } catch {}

    modalEl.classList.remove("is-open");
    const onEnd = () => {
      modalEl.classList.add("d-none");
      modalEl.setAttribute("aria-hidden", "true");
      modalEl.removeEventListener("transitionend", onEnd);
    };
    modalEl.addEventListener("transitionend", onEnd);
  }

  function openEditor(entry?: AddressEntry) {
    editingId = entry?.id ?? null;
    editorTitle &&
      (editorTitle.textContent = entry ? "주소 수정" : "새 주소 추가");

    tagSelectEl.value = entry?.tag || "home";
    tagSelectEl.dispatchEvent(new Event("change"));
    if (tagCustomEl) tagCustomEl.value = entry?.tag || "";
    inputRoadEl.value = entry?.road || "";
    inputDetailEl.value = entry?.detail || "";
    inputDefaultEl.checked = Boolean(entry?.isDefault || !addresses.length);

    resultsListEl.innerHTML = "";

    editorEl.classList.remove("d-none");
  }

  function hideEditor() {
    editorEl.classList.add("d-none");
    editingId = null;
    resultsListEl.innerHTML = "";
  }

  function renderList() {
    list.innerHTML = "";
    if (!addresses.length) {
      const empty = document.createElement("li");
      empty.className = "address-manage__item";
      empty.textContent = "등록된 배송지가 없습니다. 새 주소를 추가하세요.";
      list.appendChild(empty);
      return;
    }

    addresses.forEach((addr) => {
      const li = document.createElement("li");
      li.className = `address-manage__item${
        addr.isDefault ? " is-default" : ""
      }`;
      li.dataset.id = addr.id;

      const badgeInfo =
        ADDRESS_TAGS.find((t) => t.value === addr.tag) || ADDRESS_TAGS[3];
      const badge = document.createElement("span");
      badge.className = `badge ${badgeInfo.badge}`;
      badge.textContent = badgeInfo.label;

      const body = document.createElement("div");
      body.className = "address-manage__item-body";
      const title = document.createElement("div");
      title.className = "address-manage__item-title";
      title.textContent = addr.label || "배송지";
      const addrLine = document.createElement("div");
      addrLine.className = "address-manage__item-address";
      addrLine.textContent = `${addr.road} ${addr.detail ?? ""}`.trim();
      body.appendChild(title);
      body.appendChild(addrLine);

      const main = document.createElement("div");
      main.className = "address-manage__item-main";
      main.appendChild(badge);
      main.appendChild(body);

      const actions = document.createElement("div");
      actions.className = "address-manage__item-actions";
      const setBtn = document.createElement("button");
      setBtn.type = "button";
      setBtn.className = "btn";
      setBtn.textContent = addr.isDefault ? "기본 배송지" : "기본 설정";
      setBtn.disabled = !!addr.isDefault;

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn";
      editBtn.textContent = "수정";

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn";
      delBtn.textContent = "삭제";

      actions.append(setBtn, editBtn, delBtn);

      li.appendChild(main);
      li.appendChild(actions);

      li.addEventListener("click", (event) => {
        if (
          event.target instanceof HTMLElement &&
          actions.contains(event.target)
        )
          return;
        setDefault(addr.id);
      });

      setBtn.addEventListener("click", () => setDefault(addr.id));
      editBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        openEditor(addr);
      });
      delBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        deleteAddress(addr.id);
      });

      list.appendChild(li);
    });
  }

  function setDefault(id: string) {
    addresses = normalize(
      addresses.map((a) => ({ ...a, isDefault: a.id === id }))
    );
    persist("기본 배송지가 설정되었습니다.");
    hideEditor();
  }

  function deleteAddress(id: string) {
    addresses = addresses.filter((a) => a.id !== id);
    addresses = normalize(addresses);
    persist("배송지가 삭제되었습니다.");
    hideEditor();
  }

  function saveCurrent() {
    const road = (inputRoadEl.value || "").trim();
    const detail = (inputDetailEl.value || "").trim();
    const tagValue = tagSelectEl.value || "home";
    const label =
      tagValue === "other"
        ? tagCustomEl?.value.trim() || "사용자 지정"
        : ADDRESS_TAGS.find((t) => t.value === tagValue)?.label || "배송지";

    if (!road) {
      statusEl.textContent = "도로명 주소를 선택하거나 입력해주세요.";
      return;
    }

    const next: AddressEntry = {
      id: editingId || cryptoId(),
      tag: tagValue === "other" ? label : tagValue,
      label,
      road,
      detail: detail || undefined,
      isDefault: inputDefaultEl.checked,
    };

    const existingIndex = addresses.findIndex((a) => a.id === next.id);
    if (existingIndex >= 0)
      addresses[existingIndex] = { ...addresses[existingIndex], ...next };
    else addresses.push(next);

    addresses = normalize(addresses);
    persist(
      editingId ? "배송지가 수정되었습니다." : "배송지가 추가되었습니다."
    );
    hideEditor();
  }

  async function runAddressSearch(keyword: string) {
    statusEl.textContent = "주소 검색 중입니다...";
    resultsListEl.innerHTML = "";
    try {
      const results = await fetchJusoAddresses(keyword);
      if (!results.length) {
        statusEl.textContent = "검색 결과가 없습니다.";
        return;
      }
      statusEl.textContent = `${results.length}건의 주소를 찾았습니다.`;
      results.slice(0, 20).forEach((addr) => {
        const li = document.createElement("li");
        li.className = "address-manage__result-card";
        const road = document.createElement("div");
        road.className = "address-manage__result-road";
        road.textContent = addr.roadAddr;
        const meta = document.createElement("div");
        meta.className = "address-manage__result-meta";
        meta.textContent = addr.jibunAddr ?? "";
        li.append(road, meta);
        li.addEventListener("click", () => {
          inputRoadEl.value = addr.roadAddr;
          statusEl.textContent = "도로명 주소가 선택되었습니다.";
          resultsListEl.innerHTML = "";
          inputDetailEl.focus();
        });
        resultsListEl.appendChild(li);
      });
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message || "주소 검색 중 문제가 발생했습니다."
          : "주소 검색에 실패했습니다. 잠시 후 다시 시도해주세요.";
      statusEl.textContent = message;
      alert(message);
    }
  }

  function persist(message: string) {
    const username =
      sessionStorage.getItem(auth.LOGIN_USER_KEY) ||
      localStorage.getItem(auth.LOGIN_USER_KEY);
    if (!username) {
      statusEl.textContent = "로그인이 필요합니다.";
      return;
    }

    const normalized = normalize(addresses);
    addresses = normalized;
    const primary = normalized[0];
    const fullAddress = primary
      ? `${primary.road} ${primary.detail ?? ""}`.trim()
      : "";

    const ok = auth.updateUser(username, {
      addresses: normalized,
      roadAddress: primary?.road,
      addressDetail: primary?.detail,
      address: fullAddress,
    });
    if (!ok) {
      statusEl.textContent = "저장 중 오류가 발생했습니다.";
      return;
    }

    const updated = auth.findUserByUsername(username);
    if (updated) populateInfoPage(updated);
    renderList();
    statusEl.textContent = message;
    showToast(message);
  }

  function legacyToAddresses(user?: auth.StoredUser | null): AddressEntry[] {
    if (!user) return [];
    const road = user.roadAddress?.trim() || user.address?.trim() || "";
    const detail = user.addressDetail?.trim() || "";
    if (!road) return [];
    return [
      {
        id: cryptoId(),
        tag: "home",
        label: "기본 배송지",
        road,
        detail: detail || undefined,
        isDefault: true,
      },
    ];
  }

  function cryptoId() {
    try {
      if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
      ) {
        return crypto.randomUUID();
      }
    } catch {}
    return `addr-${Math.random().toString(36).slice(2, 10)}`;
  }

  modalEl.dataset._addressInit = "true";
}
