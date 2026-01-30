import gsap from "gsap";

export function initCategoryNavToggle(): void {
  console.log("initCategoryNavToggle");
  if (typeof window === "undefined") return;

  const fab = document.querySelector<HTMLButtonElement>(".category-fab"); // 카테고리 버튼
  const sheet = document.getElementById("category-sheet"); // 카테고리 시트
  const closeButton = sheet?.querySelector<HTMLButtonElement>(".category-sheet__close");
  // 카테고리 클로즈 버튼

  const chips = Array.from(sheet?.querySelectorAll<HTMLAnchorElement>(".category-chip") ?? []);
  // 카테고리 칩s

  if (!fab || !sheet || !closeButton) return;

  // TypeScript + DOM 타입 안정성
  const fabEl: HTMLButtonElement = fab;
  const sheetEl: HTMLElement = sheet;
  const closeButtonEl: HTMLButtonElement = closeButton;

  let isOpen = false;
  let isAnimating = false;

  const ANIM = {
    // 따로 빼 둠 나중에 조정하기 편하게
    openDuration: 0.32,
    closeDuration: 0.26,
    openEase: "power2.out",
    closeEase: "power2.in",
  };

  function lockInteraction(locked: boolean): void {
    [fabEl, sheetEl].forEach((el) => el.classList.toggle("pe-none", locked));
  }

  function setAria(open: boolean): void {
    fabEl.setAttribute("aria-expanded", open ? "true" : "false");
    sheetEl.setAttribute("aria-hidden", open ? "false" : "true");
  }

  /*
    난 원래는 opacity 를 쓰는데
    autoAlpha 가 더 편함 visible + opacity 라서
  */
  gsap.set(sheetEl, { autoAlpha: 0, scale: 0.96, y: 12 });
  sheetEl.classList.remove("is-open");
  setAria(false);

  // 오픈 되지 않았을때 열어 주기
  fabEl.addEventListener(
    "click",
    () => {
      if (!isOpen) openSheet();
    },
    { passive: true },
  );

  function openSheet(): void {
    if (isAnimating || isOpen) return;
    isAnimating = true;
    lockInteraction(true);
    sheetEl.classList.add("is-open");
    sheetEl.classList.add("is-animating");
    gsap.killTweensOf(sheetEl);

    gsap.set(sheetEl, { autoAlpha: 0, scale: 0.96, y: 12 });

    gsap.to(sheetEl, {
      autoAlpha: 1,
      scale: 1,
      y: 0,
      duration: ANIM.openDuration,
      ease: ANIM.openEase,
      force3D: true,
      onComplete: () => {
        isAnimating = false;
        isOpen = true;
        lockInteraction(false);
        setAria(true);
        sheetEl.classList.remove("is-animating");
      },
    });
  }

  function closeSheet(): void {
    if (isAnimating || !isOpen) return;
    isAnimating = true;
    lockInteraction(true);
    sheetEl.classList.remove("is-open");
    sheetEl.classList.add("is-animating");
    gsap.killTweensOf(sheetEl);

    gsap.set(sheetEl, { autoAlpha: 1, scale: 1, y: 0 });

    gsap.to(sheetEl, {
      autoAlpha: 0,
      scale: 0.96,
      y: 12,
      duration: ANIM.closeDuration,
      ease: ANIM.closeEase,
      force3D: true,
      onComplete: () => {
        isAnimating = false;
        isOpen = false;
        lockInteraction(false);
        setAria(false);
        sheetEl.classList.remove("is-animating");
        fabEl.focus({ preventScroll: true }); // 포커스 복귀 스크롤 방지
      },
    });
  }

  closeButtonEl.addEventListener("click", closeSheet, { passive: true }); // 닫기 버튼

  // 카테고리 칩 클릭 이벤트
  chips.forEach((chip) => {
    chip.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      const href = chip.getAttribute("href") || "";
      if (href.startsWith("#") && href.length > 1) {
        const name = href.slice(1);

        // 성능 최적화: querySelectorAll 한 번만 호출
        const allSections = document.querySelectorAll<HTMLElement>("section.demo-section");

        // 성능 최적화: 배치 DOM 업데이트
        allSections.forEach((section) => {
          const shouldShow = section.classList.contains(name);
          section.classList.toggle("d-none", !shouldShow);
        });

        console.log("카테고리 선택:", name);
        // 성능 최적화: OverlayScrollbars 제거 (네이티브 스크롤 사용)
      }

      closeSheet();
    });
  });

  // 성능 최적화: capture phase로 이벤트 캡처
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!isOpen || isAnimating) return;

      const target = e.target as Node | null;
      if (!target) return;

      const insideSheet = sheetEl.contains(target);
      const onFab = fabEl.contains(target);

      if (!insideSheet && !onFab) {
        closeSheet();
      }
    },
    { capture: true, passive: true },
  );

  // ESC 키 눌렀을 때 닫기
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && isOpen) {
        closeSheet();
      }
    },
    { passive: true },
  );
}
export default initCategoryNavToggle;
