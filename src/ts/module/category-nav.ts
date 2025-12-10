import gsap from "gsap";
// OverlayScrollbars: named export from package
// Use a typed-any call because the library typings can be strict in this workspace
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { OverlayScrollbars } from "overlayscrollbars";

export function initCategoryNavToggle(): void {
  if (typeof window === "undefined") return;

  const fab = document.querySelector<HTMLButtonElement>(".category-fab");
  const sheet = document.getElementById("category-sheet");
  const closeButton = sheet?.querySelector<HTMLButtonElement>(".category-sheet__close");
  const chips = Array.from(sheet?.querySelectorAll<HTMLAnchorElement>(".category-chip") ?? []);

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
  // derive all category names from chips so we can hide/show consistently
  const categoryNames = chips
    .map((c) => c.getAttribute("href") || "")
    .filter((h) => h.startsWith("#") && h.length > 1)
    .map((h) => h.slice(1));

  chips.forEach((chip) => {
    chip.addEventListener("click", (ev) => {
      // prevent navigation to `index.html#fragment` — we want to reveal local elements instead
      ev.preventDefault();

      const href = chip.getAttribute("href") || "";
      if (href.startsWith("#") && href.length > 1) {
        const name = href.slice(1);

        // Hide all known categories first
        categoryNames.forEach((cat) => {
          try {
            const els = Array.from(document.querySelectorAll<HTMLElement>(`.${cat}`));
            els.forEach((el) => el.classList.add("d-none"));
            // if a products-grid inside this category had an OverlayScrollbars instance, destroy it
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

        // Show only the selected
        try {
          const selected = Array.from(document.querySelectorAll<HTMLElement>(`.${name}`));
          if (selected.length) selected.forEach((t) => t.classList.remove("d-none"));

          // ensure the grid remains in vertical list mode and initialize overlay
          // scrollbars for any products-grid inside the selected section(s)
          if (typeof OverlayScrollbars !== "undefined") {
            selected.forEach((section) => {
              const grid = section.querySelector<HTMLElement>(".products-grid");
              if (!grid) return;

              // Ensure selected area uses the vertical list layout (single column)
              // so users see the same vertical, scrollable list as the initial page.
              grid.classList.remove("products-grid--card");
              grid.classList.add("products-grid--list");

              // Defensive inline styles: if OverlayScrollbars or page CSS attempts
              // to change display/overflow, force the host into a single-column
              // grid with a limited height so vertical scrollbar appears.
              try {
                grid.style.setProperty("display", "grid", "important");
                grid.style.setProperty("grid-template-columns", "1fr", "important");
                grid.style.setProperty("max-height", "54vh", "important");
                grid.style.setProperty("overflow", "auto", "important");
              } catch (e) {
                /* ignore environments that restrict style access */
              }

              // if already exists, update and skip
              const existing = (grid as any).__osInstance as any | undefined;
              if (existing && typeof existing.update === "function") {
                try {
                  existing.update();
                  return;
                } catch (e) {
                  // fallthrough to recreate
                }
              }

              try {
                // call OverlayScrollbars as function and store instance
                const instance = (OverlayScrollbars as any)(grid, {
                  theme: "os-theme-dark",
                  resize: "none",
                  sizeAutoCapable: true,
                  // don't auto-hide on hover or leave — keep scrollbars visible
                  scrollbars: { autoHide: "never", autoHideDelay: 600, clickScroll: true },
                } as any);

                (grid as any).__osInstance = instance;
              } catch (err) {
                // eslint-disable-next-line no-console
                console.warn("OverlayScrollbars init failed", err);
              }
            });
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("category-nav: failed to reveal targets for", href, err);
        }
      }

      // close sheet after revealing
      closeSheet();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSheet();
    }
  });
}

export default initCategoryNavToggle;
