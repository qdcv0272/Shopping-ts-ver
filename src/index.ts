import "./css/common/reset.css";
import "./css/common/common.css";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { log } from "./module/function/log";
import { initInfo } from "./module/page/info";
import { initFavorites } from "./module/page/favorites";
import { initCart } from "./module/page/cart";
import { initBootstrap } from "./module/page/bootstrap";
// import { initSignup } from "./module/page/signup";

// 스와이퍼
import { initTestSwiper } from "./module/function/swiper";

type PageKey = "home" | "info" | "favorites" | "cart" | "bootstrap";

const NAV_LINKS: Array<{ key: PageKey; label: string; href: string }> = [
  { key: "home", label: "Home", href: "index.html" },
  { key: "info", label: "내정보", href: "page/info.html" },
  { key: "favorites", label: "즐겨찾기", href: "page/favorites.html" },
  { key: "cart", label: "장바구니", href: "page/cart.html" },
  { key: "bootstrap", label: "부트스트랩", href: "page/bootstrap.html" },
  // { key: "signup", label: "회원가입", href: "page/signup.html" },
];

const PAGE_CONTENT: Record<PageKey, { badge: string; title: string; description: string; accent: string }> = {
  home: {
    badge: "HOME",
    title: "메인 데모",
    description: "Webpack + TypeScript 환경에서 여러 페이지를 빠르게 스위칭해 보세요.",
    accent: "#2e5bff",
  },
  info: {
    badge: "INFO",
    title: "내 정보",
    description: "회원 정보와 주문 내역을 볼 수 있는 샘플 페이지",
    accent: "#6f42c1",
  },
  favorites: {
    badge: "FAV",
    title: "즐겨찾기",
    description: "즐겨찾기 페이지 — 좋아한 상품을 모아볼 수 있습니다 (샘플)",
    accent: "#ff6b6b",
  },
  cart: {
    badge: "CART",
    title: "장바구니",
    description: "장바구니 페이지 — 담은 상품을 확인하세요 (샘플)",
    accent: "#00875a",
  },
  bootstrap: {
    badge: "BOOTSTRAP",
    title: "부트스트랩",
    description: "부트스트랩 처럼 css 모음",
    accent: "#123456",
  },
  // signup: {
  //   badge: "SIGNUP",
  //   title: "부트스트랩",
  //   description: "부트스트랩 처럼 css 모음",
  //   accent: "#123456",
  // },
};

const root = document.getElementById("app");

function isPageKey(value: string): value is PageKey {
  return value in PAGE_CONTENT;
}

function detectPage(): PageKey {
  if (!root) return "home";

  const datasetPage = root.getAttribute("data-page");

  if (datasetPage && isPageKey(datasetPage)) {
    return datasetPage;
  }
  // else
  const currentPath = window.location.pathname;

  const filename = currentPath.split("/").filter(Boolean).pop() ?? "index.html";
  const baseName = filename.replace(/\.html$/, "");

  if (baseName === "index") {
    return "home";
  }

  if (isPageKey(baseName)) {
    return baseName;
  }

  return "home";
}

if (root) {
  // 1) 페이지 이동 시점마다 detectPage가 현재 페이지 키를 계산.
  const currentPage = detectPage();

  // 2) 그 키를 이용해 PAGE_CONTENT에서 해당 페이지의 badge/title 등 꺼냅.
  // const { badge, title, description, accent } = PAGE_CONTENT[currentPage];

  const headerActions = Array.from(document.querySelectorAll<HTMLAnchorElement>(".header-action"));
  headerActions.forEach((a) => {
    const href = a.href;
    const match = NAV_LINKS.find((key) => {
      const link = key.href;
      const nowURL = new URL(link, window.location.origin + "/").href;
      return nowURL === href;
    });
    a.classList.toggle("is-active", match?.key === currentPage);
  });

  // initialize demo swiper (if markup exists)
  initTestSwiper();

  if (currentPage === "home") {
    log("index");
  } else {
    if (currentPage === "info") initInfo();
    if (currentPage === "favorites") initFavorites();
    if (currentPage === "cart") initCart();
    if (currentPage === "bootstrap") initBootstrap();
    // if (currentPage === "signup") initSignup();
  }
}
