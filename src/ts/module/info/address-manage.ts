import * as auth from "../auth";
import { fetchJusoAddresses } from "../address";
import { populateInfoPage } from "./profile";
import { showToast } from "./toast";

type AddressEntry = auth.AddressEntry;

// 주소 태그 정보
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

  const list = listEl as HTMLUListElement; // 주소 목록
  const statusEl = status as HTMLElement; // 상태 표시 영역
  const editorEl = editor as HTMLElement; // 편집기 영역
  const tagSelectEl = tagSelect as HTMLSelectElement; // 태그 선택 셀렉트
  const tagCustomEl = tagCustomInput as HTMLInputElement | null; // 사용자 지정 태그 입력
  const searchInputEl = searchInput as HTMLInputElement; // 주소 검색 입력
  const resultsListEl = resultsList as HTMLUListElement; // 주소 검색 결과 목록
  const inputRoadEl = inputRoad as HTMLInputElement; // 도로명 주소 입력
  const inputDetailEl = inputDetail as HTMLInputElement; // 상세 주소 입력
  const inputDefaultEl = inputDefault as HTMLInputElement; // 기본 주소 체크박스
  const searchBtnEl = searchBtn as HTMLButtonElement; // 주소 검색 버튼
  const addBtnEl = addBtn as HTMLButtonElement; // 새 주소 추가 버튼
  const saveBtnEl = saveBtn as HTMLButtonElement; // 저장 버튼
  const cancelBtnEl = cancelBtn as HTMLButtonElement; // 취소 버튼

  inputRoadEl.readOnly = true;
  inputRoadEl.tabIndex = -1;
  inputRoadEl.addEventListener("mousedown", (e) => {
    e.preventDefault();
    searchInputEl.focus();
  });

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

  function normalize(list: AddressEntry[]): AddressEntry[] {
    // 이미 사용된 id를 기록해서 중복을 막기 위한 Set
    const seen = new Set<string>();

    // 주소 목록을 순회하며 id 보정 + 유효하지 않은 주소 제거
    const normalized = list
      .map((a) => {
        // id가 없으면 새로 생성
        const id = a.id || cryptoId();

        // 이미 사용된 id라면 새 id로 교체
        if (seen.has(id)) return { ...a, id: cryptoId() };

        // 처음 등장한 id라면 Set에 기록
        seen.add(id);

        // id가 보장된 주소 객체 반환
        return { ...a, id };
      })
      // 도로명 주소가 없거나 공백이면 제거
      .filter((a) => a.road && a.road.trim());

    // 유효한 주소가 하나도 없으면 빈 배열 반환
    if (!normalized.length) return [];

    // 기본 배송지(isDefault)가 하나라도 있는지 확인
    const hasDefault = normalized.some((a) => a.isDefault);

    // 기본 배송지가 하나도 없으면 첫 번째 주소를 기본으로 설정
    if (!hasDefault) normalized[0].isDefault = true;
    else {
      // 첫 번째 기본 배송지만 유지하기 위한 플래그
      let defaultFound = false;

      // 기본 배송지가 여러 개일 경우 하나만 남기고 나머지 해제
      normalized.forEach((a) => {
        // 첫 번째 기본 배송지는 유지
        if (a.isDefault && !defaultFound) {
          defaultFound = true;
          return;
        }
        // 두 번째 이후 기본 배송지는 해제
        if (a.isDefault && defaultFound) a.isDefault = false;
      });
    }

    return normalized;
  }

  function cryptoId() {
    // 전역 crypto 객체가 존재하고
    // randomUUID 함수가 지원되는 환경인지 확인
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      // 브라우저 내장 UUID 생성기 사용 (충돌 가능성 거의 없음)
      return crypto.randomUUID();
    }

    // crypto.randomUUID를 지원하지 않는 구형 환경 대비용
    // 랜덤 문자열을 생성해 id로 사용
    return `addr-${Math.random().toString(36).slice(2, 10)}`;
  }

  function legacyToAddresses(user?: auth.StoredUser | null): AddressEntry[] {
    console.log("@@@@@@ 기존 배송지 다 삭제 후 변환 처리 @@@@@@");
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

      // 태그 배지 생성
      const badgeInfo =
        ADDRESS_TAGS.find((t) => t.value === addr.tag) || ADDRESS_TAGS[3]; // 'other' 태그 정보
      const badge = document.createElement("span");
      badge.className = `badge ${badgeInfo.badge}`;
      badge.textContent = badgeInfo.label;

      // 주소 본문 생성
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

      // 메인 영역 생성
      const main = document.createElement("div");
      main.className = "address-manage__item-main";
      main.appendChild(badge);
      main.appendChild(body);

      // 액션 버튼 영역 생성
      const actions = document.createElement("div");
      actions.className = "address-manage__item-actions";
      const setBtn = document.createElement("button");
      setBtn.type = "button";
      setBtn.className = "btn";
      setBtn.textContent = addr.isDefault ? "기본 배송지" : "기본 설정";
      setBtn.disabled = !!addr.isDefault;

      // 수정, 삭제 버튼 생성
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn";
      editBtn.textContent = "수정";

      // 삭제 버튼 생성
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
        ) {
          return;
        }

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

  function hideEditor() {
    editorEl.classList.add("d-none");
    editingId = null;
    resultsListEl.innerHTML = "";
  }

  function openEditor(entry?: AddressEntry) {
    console.log("@@@@@@ 주소 수정 열기 @@@@@@");
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

  function deleteAddress(id: string) {
    addresses = addresses.filter((a) => a.id !== id);
    addresses = normalize(addresses);
    persist("배송지가 삭제되었습니다.");
    hideEditor();
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

  /*
  주소 검색 API 연동 흐름도
  
  검색 버튼 클릭
     ↓
  상태: 검색 중
     ↓
  주소 API 호출
     ↓
  결과 없음 → 메시지 + 종료
     ↓
  결과 있음
     ↓
  주소 목록 렌더링
     ↓
  주소 클릭
     ↓
  도로명 입력 + 상세주소 포커스 
  */

  modalEl.dataset._addressInit = "true";
}
