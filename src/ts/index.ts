// css
import "../css/common/reset.css";
import "../css/common/common.css";
import "../css/common/customScrollbar.css";
import "../css/index.css";

// 스와이퍼 css & ts
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { initTestSwiper } from "./function/swiper";

// 오버레이 스크롤바 css & ts
import "overlayscrollbars/overlayscrollbars.css";

// ts & module
import { log } from "./function/log";
import { initInfo } from "./page/info";
import { initFavorites } from "./page/favorites";
import { initCart } from "./page/cart";
import { initBootstrap } from "./page/bootstrap";

import { initCategoryNavToggle } from "./module/category-nav";
import { initProductQuickView } from "./module/product";
import { initProducts } from "./module/products";

// page 정보
type PageKey = "home" | "info" | "favorites" | "cart" | "bootstrap";

const NAV_LINKS: Array<{ key: PageKey; label: string; href: string }> = [
  { key: "home", label: "Home", href: "index.html" },
  { key: "info", label: "내정보", href: "page/info.html" },
  { key: "favorites", label: "즐겨찾기", href: "page/favorites.html" },
  { key: "cart", label: "장바구니", href: "page/cart.html" },
  { key: "bootstrap", label: "부트스트랩", href: "page/bootstrap.html" },
];

const currentPage = detectPage();

const headerActions = Array.from(
  document.querySelectorAll<HTMLAnchorElement>(".header-action")
);
headerActions.forEach((a) => {
  const href = a.href;
  const match = NAV_LINKS.find((key) => {
    const link = key.href;
    const nowURL = new URL(link, window.location.origin + "/").href;
    return nowURL === href;
  });
  a.classList.toggle("is-active", match?.key === currentPage);
});

initTestSwiper(); // 스와이퍼
initCategoryNavToggle(); // 카테고리 네비 토글
initProducts(); // 상품 리스트
initProductQuickView();

if (currentPage === "home") {
  log("index");
} else {
  if (currentPage === "info") initInfo();
  if (currentPage === "favorites") initFavorites();
  if (currentPage === "cart") initCart();
  if (currentPage === "bootstrap") initBootstrap();
}

function detectPage(): PageKey {
  const root = document.getElementById("app");
  const datasetPage = root?.getAttribute("data-page");

  if (datasetPage && isPageKey(datasetPage)) {
    return datasetPage;
  }

  // else
  const currentPath = window.location.pathname;
  const filename = currentPath.split("/").filter(Boolean).pop() ?? "index.html";
  const baseName = filename.replace(/\.html$/, "");

  if (baseName === "index") return "home";
  if (isPageKey(baseName)) return baseName;
  return "home";
}

function isPageKey(value: string): value is PageKey {
  return NAV_LINKS.some((n) => n.key === (value as PageKey));
}
