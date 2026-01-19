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

  let isOpen = false;
  let isAnimating = false;

  const lockInteraction = (locked: boolean) => {
    [fab, sheet].forEach((el) => el.classList.toggle("pe-none", locked));
  };

  const setAria = (open: boolean) => {
    fab.setAttribute("aria-expanded", open ? "true" : "false");
    sheet.setAttribute("aria-hidden", open ? "false" : "true");
  };

  gsap.set(sheet, { autoAlpha: 0, scale: 0.96, y: 12 });
  sheet.classList.remove("is-open");
  setAria(false);

  const openSheet = () => {
    if (isAnimating || isOpen) return;
    isAnimating = true;
    lockInteraction(true);
    sheet.classList.add("is-open");
    gsap.killTweensOf(sheet);

    gsap.fromTo(
      sheet,
      { autoAlpha: 0, scale: 0.96, y: 12 },
      {
        autoAlpha: 1,
        scale: 1,
        y: 0,
        duration: 0.32,
        ease: "power2.out",
        onComplete: () => {
          isAnimating = false;
          isOpen = true;
          lockInteraction(false);
          setAria(true);
        },
      }
    );
  };

  const closeSheet = () => {
    if (isAnimating || !isOpen) return;
    isAnimating = true;
    lockInteraction(true);
    sheet.classList.remove("is-open");
    gsap.killTweensOf(sheet);

    gsap.to(sheet, {
      autoAlpha: 0,
      scale: 0.96,
      y: 12,
      duration: 0.26,
      ease: "power2.in",
      onComplete: () => {
        isAnimating = false;
        isOpen = false;
        lockInteraction(false);
        setAria(false);
        fab.focus({ preventScroll: true });
      },
    });
  };

  fab.addEventListener("click", () => {
    if (isOpen) {
      closeSheet();
    } else {
      openSheet();
    }
  });

  closeButton.addEventListener("click", closeSheet);

  const categoryNames = chips
    .map((c) => c.getAttribute("href") || "")
    .filter((h) => h.startsWith("#") && h.length > 1)
    .map((h) => h.slice(1));

  chips.forEach((chip) => {
    chip.addEventListener("click", (ev) => {
      ev.preventDefault();

      const href = chip.getAttribute("href") || "";
      if (href.startsWith("#") && href.length > 1) {
        const name = href.slice(1);

        categoryNames.forEach((cat) => {
          try {
            const els = Array.from(
              document.querySelectorAll<HTMLElement>(`.${cat}`)
            );
            els.forEach((el) => el.classList.add("d-none"));

            els.forEach((el) => {
              const grid = el.querySelector<HTMLElement>(".products-grid");
              const inst = (grid as any)?.__osInstance;
              if (inst && typeof inst.destroy === "function") {
                try {
                  inst.destroy();
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

        try {
          const selected = Array.from(
            document.querySelectorAll<HTMLElement>(`.${name}`)
          );
          if (selected.length)
            selected.forEach((t) => t.classList.remove("d-none"));

          if (typeof OverlayScrollbars !== "undefined") {
            selected.forEach((section) => {
              const grid = section.querySelector<HTMLElement>(".products-grid");
              if (!grid) return;

              grid.classList.remove("products-grid--card");
              grid.classList.add("products-grid--list");

              try {
                grid.style.setProperty("display", "grid", "important");
                grid.style.setProperty(
                  "grid-template-columns",
                  "1fr",
                  "important"
                );
                grid.style.setProperty("max-height", "54vh", "important");
                grid.style.setProperty("overflow", "auto", "important");
              } catch (e) {
                /* ignore environments that restrict style access */
              }

              const existing = (grid as any).__osInstance as any | undefined;
              if (existing && typeof existing.update === "function") {
                try {
                  existing.update();
                  return;
                } catch (e) {}
              }

              try {
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

                (grid as any).__osInstance = instance;
              } catch (err) {
                console.warn("OverlayScrollbars init failed", err);
              }
            });
          }
        } catch (err) {
          console.warn("category-nav: failed to reveal targets for", href, err);
        }
      }

      closeSheet();
    });
  });

  document.addEventListener("pointerdown", (event) => {
    if (!isOpen || isAnimating) return;

    const target = event.target as Node | null;
    if (!target) return;

    const insideSheet = sheet.contains(target);
    const onFab = fab.contains(target);

    if (!insideSheet && !onFab) {
      closeSheet();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSheet();
    }
  });
}

export default initCategoryNavToggle;
