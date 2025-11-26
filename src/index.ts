import "./css/common/reset.css";
import "./css/index.css";
import { log } from "./module/function/log";
import { initInfo } from "./module/page/info";
import { initFavorites } from "./module/page/favorites";
import { initCart } from "./module/page/cart";
import { initBootstrap } from "./module/page/bootstrap";

// 페이지 진입 로그
log("index");

type PageKey = "home" | "info" | "favorites" | "cart" | "bootstrap";

const NAV_LINKS: Array<{ key: PageKey; label: string; href: string }> = [
  { key: "home", label: "Home", href: "index.html" },
  { key: "info", label: "내정보", href: "page/info.html" },
  { key: "favorites", label: "즐겨찾기", href: "page/favorites.html" },
  { key: "cart", label: "장바구니", href: "page/cart.html" },
  { key: "bootstrap", label: "부트스트랩", href: "page/bootstrap.html" },
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
};

const root = document.getElementById("app");

// Header is included statically in public/*.html now — no need to render it from JS

const renderHomeHero = () => `
  <section class="home-hero">
    <div class="home-hero__eyebrow">WEEKLY HOT</div>
    <h1 class="home-hero__title">취향 맞춤 쇼핑을 시작해 보세요.</h1>
    <p class="home-hero__desc">
      검색창에서 원하는 브랜드나 키워드를 입력하고, 즐겨찾기와 장바구니를 통해 나만의 목록을 관리할 수 있습니다.
    </p>
    <div class="home-hero__actions">
      <button class="primary-btn" type="button">오늘의 특가 보기</button>
      <button class="ghost-btn" type="button">카테고리 탐색</button>
    </div>
  </section>
`;

const isPageKey = (value: string): value is PageKey => value in PAGE_CONTENT;

const detectPage = (): PageKey => {
  if (!root) return "home";

  const datasetPage = root.getAttribute("data-page");
  if (datasetPage && isPageKey(datasetPage)) {
    return datasetPage;
  }

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
};

if (root) {
  const currentPage = detectPage();
  const { badge, title, description, accent } = PAGE_CONTENT[currentPage];
  // site-nav removed — no nav links to update from JS

  // highlight header action links (info / favorites / cart)
  const headerActions = Array.from(document.querySelectorAll<HTMLAnchorElement>(".header-action"));
  headerActions.forEach((a) => {
    const href = a.getAttribute("href") ?? "";
    const match = NAV_LINKS.find((link) => link.href === href);
    a.classList.toggle("is-active", match?.key === currentPage);
  });

  if (currentPage === "home") {
    root.innerHTML = `
      ${renderHomeHero()}
    `;
  } else {
    root.innerHTML = `
      <main class="test-card" style="--accent: ${accent}">
        <span class="test-card__badge">${badge}</span>
        <h1>${title}</h1>
        <p>${description}</p>
      </main>
    `;
    // 페이지별로 필요한 초기화 함수 호출 (페이지 전용 코드 실행)
    if (currentPage === "info") initInfo();
    if (currentPage === "favorites") initFavorites();
    if (currentPage === "cart") initCart();
    if (currentPage === "bootstrap") initBootstrap();
  }
}
