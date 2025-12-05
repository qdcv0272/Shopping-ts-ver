const JUSO_API_KEY = "devU01TX0FVVEgyMDI1MTEyNzE2MjMzNTExNjUwMzQ=";
const JUSO_API_URL = "https://business.juso.go.kr/addrlink/addrLinkApi.do";

export type JusoAddress = {
  roadAddr: string;
  jibunAddr?: string;
  zipNo?: string;
};

type AddressModalOptions = {
  signupSection: HTMLElement;
  roadAddressInput: HTMLInputElement;
  detailInput: HTMLInputElement;
  hint?: HTMLElement;
};

export function setupAddressModal({ signupSection, roadAddressInput, detailInput, hint }: AddressModalOptions) {
  const modal = document.querySelector<HTMLElement>(".address-modal");
  const trigger = signupSection.querySelector<HTMLButtonElement>(".js-address-search");
  if (!modal || !trigger) return;

  const closeButton = modal.querySelector<HTMLButtonElement>(".address-modal__close");
  const searchForm = modal.querySelector<HTMLFormElement>(".address-modal__search");
  const searchInput = modal.querySelector<HTMLInputElement>(".js-address-keyword");
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
          if (hint) hint.textContent = "도로명 주소가 선택되었습니다.";
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

export async function fetchJusoAddresses(keyword: string): Promise<JusoAddress[]> {
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
