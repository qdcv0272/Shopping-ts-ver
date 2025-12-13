import Swiper from "swiper";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

type SwiperInstance = Swiper | null;
type SwiperContainer = HTMLElement & { __swiperInitialized?: boolean };

export function initTestSwiper(): SwiperInstance {
  if (typeof window === "undefined") return null;

  const runInit = (): SwiperInstance => {
    const container = document.querySelector<SwiperContainer>(".swiper-test");
    if (!container) return null;

    if (container.__swiperInitialized) return null;
    container.__swiperInitialized = true;

    try {
      const paginationEl =
        container.querySelector<HTMLElement>(".swiper-pagination");
      const prevEl = container.querySelector<HTMLElement>(
        ".swiper-button-prev"
      );
      const nextEl = container.querySelector<HTMLElement>(
        ".swiper-button-next"
      );

      const swiper = new Swiper(container as unknown as HTMLElement, {
        modules: [Autoplay, Pagination, Navigation],
        slidesPerView: 1,
        loop: true,
        autoplay: { delay: 3000, disableOnInteraction: false },
        pagination: {
          el: paginationEl ?? ".swiper-pagination",
          clickable: true,
        },
        navigation: {
          nextEl: nextEl ?? ".swiper-button-next",
          prevEl: prevEl ?? ".swiper-button-prev",
        },
        observer: true,
        observeParents: true,
      });

      return swiper;
    } catch (err) {
      console.error("initTestSwiper error:", err);
      return null;
    }
  };

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    return runInit();
  }

  window.addEventListener("DOMContentLoaded", runInit, { once: true });
  return null;
}

export default initTestSwiper;
