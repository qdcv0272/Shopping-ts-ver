import gsap from "gsap";
import { OverlayScrollbars } from "overlayscrollbars";

export function initCategoryNavToggle(): void {
  console.log("initCategoryNavToggle");
  if (typeof window === "undefined") return;

  const fab = document.querySelector<HTMLButtonElement>(".category-fab"); // 카테고리 버튼
  const sheet = document.getElementById("category-sheet"); // 카테고리 시트
  const closeButton = sheet?.querySelector<HTMLButtonElement>(
    ".category-sheet__close"
  );
  // 카테고리 클로즈 버튼

  const chips = Array.from(
    sheet?.querySelectorAll<HTMLAnchorElement>(".category-chip") ?? []
  );
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
  fabEl.addEventListener("click", () => {
    if (!isOpen) openSheet();
  });

  function openSheet(): void {
    if (isAnimating || isOpen) return;
    isAnimating = true;
    lockInteraction(true);
    sheetEl.classList.add("is-open");
    gsap.killTweensOf(sheetEl);

    gsap.set(sheetEl, { autoAlpha: 0, scale: 0.96, y: 12 });

    gsap.to(sheetEl, {
      autoAlpha: 1,
      scale: 1,
      y: 0,
      duration: ANIM.openDuration,
      ease: ANIM.openEase,
      onComplete: () => {
        isAnimating = false;
        isOpen = true;
        lockInteraction(false);
        setAria(true);
      },
    });
  }

  function closeSheet(): void {
    if (isAnimating || !isOpen) return;
    isAnimating = true;
    lockInteraction(true);
    sheetEl.classList.remove("is-open");
    gsap.killTweensOf(sheetEl);

    gsap.set(sheetEl, { autoAlpha: 1, scale: 1, y: 0 });

    gsap.to(sheetEl, {
      autoAlpha: 0,
      scale: 0.96,
      y: 12,
      duration: ANIM.closeDuration,
      ease: ANIM.closeEase,
      onComplete: () => {
        isAnimating = false;
        isOpen = false;
        lockInteraction(false);
        setAria(false);
        fabEl.focus({ preventScroll: true }); // 포커스 복귀 스크롤 방지
      },
    });
  }

  closeButtonEl.addEventListener("click", closeSheet); // 닫기 버튼

  // a 태그들 을 이용해서 section 태그 들을 처리
  const categoryNames = chips
    .map((c) => c.getAttribute("href") || "") // href 속성들
    .filter((h) => h.startsWith("#") && h.length > 1) // #으로 시작하는 것들
    .map((h) => h.slice(1)); // # 제거한 카테고리 이름들

  chips.forEach((chip) => {
    chip.addEventListener("click", (ev) => {
      ev.preventDefault();

      const href = chip.getAttribute("href") || "";
      if (href.startsWith("#") && href.length > 1) {
        const name = href.slice(1); // # 제거한 카테고리 이름, 선택된 색션

        /*
          1. 모든 섹션 태그들 숨기기
          2. 선택된 섹션 태그들 보이기
          3. 오버레일 스크롤바 초기화
          4. 기존 오버레일 인스턴스 제거
          5. 새로운 오버레일 인스턴스 생성
        */
        categoryNames.forEach((cat) => {
          try {
            // 혹시 몰라 에러 방지
            const els = Array.from(
              // 섹션태그들
              document.querySelectorAll<HTMLElement>(`.${cat}`)
            );

            els.forEach((el) => {
              el.classList.add("d-none");

              const grid = el.querySelector<HTMLElement>(".products-grid");
              const inst = (grid as any)?.__osInstance; // 오버레일 인스턴스

              if (inst && typeof inst.destroy === "function") {
                try {
                  inst.destroy(); // 오버레일 스크롤바 제거
                } catch (e) {
                  /* ignore */
                }
                (grid as any).__osInstance = undefined;
              }
            });
          } catch (err) {
            /* ignore */
          }
        });

        // 선택된 섹션 태그들 보이기
        try {
          const selected = Array.from(
            document.querySelectorAll<HTMLElement>(`.${name}`)
          );

          if (selected.length) {
            selected.forEach((t) => t.classList.remove("d-none"));
          }
          // 오버레일 스크롤바 초기화
          if (typeof OverlayScrollbars !== "undefined") {
            selected.forEach((section) => {
              const grid = section.querySelector<HTMLElement>(".products-grid");
              if (!grid) return;

              // grid.classList.remove("products-grid--card");
              grid.classList.add("products-grid--list");

              grid.style.setProperty("display", "grid", "important");
              grid.style.setProperty(
                "grid-template-columns",
                "1fr",
                "important"
              );
              const maxHeightPx = `${Math.round(window.innerHeight * 0.54)}px`;
              grid.style.setProperty("max-height", maxHeightPx, "important");
              grid.style.setProperty("overflow", "auto", "important");

              // 기존 인스턴스가 있으면 업데이트
              const existing = (grid as any).__osInstance as any | undefined;

              if (existing && typeof existing.update === "function") {
                try {
                  existing.update();
                  return;
                } catch (e) {}
              }

              // 새로운 인스턴스 생성
              const instance = (OverlayScrollbars as any)(grid, {
                theme: "os-theme-dark",
                resize: "none",
                sizeAutoCapable: true,

                scrollbars: {
                  autoHide: "never",
                  autoHideDelay: 600,
                  clickScroll: true,
                },
              } as any);

              (grid as any).__osInstance = instance; // 인스턴스 저장
            });
          }
        } catch (err) {}
      }

      console.log("클립 클릭됨, 카테고리 시트 닫기");
      closeSheet();
    });
  });

  // 시트 외부 클릭 시 닫기
  document.addEventListener("pointerdown", (e) => {
    if (!isOpen || isAnimating) return;

    const target = e.target as Node | null;
    if (!target) return;

    const insideSheet = sheetEl.contains(target);
    const onFab = fabEl.contains(target);

    if (!insideSheet && !onFab) {
      console.log("시트 외부 클릭, 카테고리 시트 닫기");
      closeSheet();
    }
  });

  // ESC 키 눌렀을 때 닫기
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      console.log("ESC 키 눌림, 카테고리 시트 닫기");
      closeSheet();
    }
  });
}
export default initCategoryNavToggle;
