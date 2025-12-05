import Swiper from "swiper";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

// initialize a demo swiper that exists in the static public/index.html
export function initTestSwiper(): Swiper | null {
  if (typeof window === "undefined") return null;

  const runInit = () => {
    const container = document.querySelector<HTMLElement>(".swiper-test");
    if (!container) return null;

    // guard against double-init
    if ((container as any).__swiperInitialized) {
      // already init'd
      // eslint-disable-next-line no-console
      console.debug("initTestSwiper: container already initialized");
      return null;
    }

    // mark as initialized so we don't create multiple instances
    (container as any).__swiperInitialized = true;

    // log for easier debugging in the browser console
    // eslint-disable-next-line no-console
    console.debug("initTestSwiper: initializing Swiper on", container);

    try {
      // Scope UI elements to the container so multiple swipers on a page don't conflict
      const paginationEl = container.querySelector<HTMLElement>(".swiper-pagination");
      const prevEl = container.querySelector<HTMLElement>(".swiper-button-prev");
      const nextEl = container.querySelector<HTMLElement>(".swiper-button-next");

      // create instance using modules option — modern, tree-shakeable
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const s = new Swiper(container as any, {
        modules: [Autoplay, Pagination, Navigation],
        // make intent explicit
        slidesPerView: 1,
        loop: true,
        autoplay: { delay: 3000, disableOnInteraction: false },
        // prefer element references scoped to the container
        // use Swiper's built-in clickable pagination (basic/default behavior)
        pagination: paginationEl ? { el: paginationEl, clickable: true } : { el: ".swiper-pagination", clickable: true },
        navigation: { nextEl: nextEl ?? ".swiper-button-next", prevEl: prevEl ?? ".swiper-button-prev" },
        // observe DOM/layout changes so Swiper recalculates sizes if the parent changes
        observer: true,
        observeParents: true,
      });

      // eslint-disable-next-line no-console
      console.debug("initTestSwiper: Swiper instance created", s);

      // Custom clickable pagination handler — use slideToLoop so looped sliders animate in the expected
      // direction when users click pagination bullets. This replaces Swiper's built-in clickable behavior
      // because that can sometimes pick an unexpected path in loop mode.
      // Use Swiper's built-in pagination handling (no custom click handler)
      return s;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("initTestSwiper: failed to init test swiper", err);
      return null;
    }
  };

  // If DOM already loaded, run immediately, otherwise wait for DOMContentLoaded
  if (document.readyState === "complete" || document.readyState === "interactive") {
    return runInit();
  } else {
    window.addEventListener("DOMContentLoaded", runInit, { once: true });
  }
  return null;
}

export default initTestSwiper;
