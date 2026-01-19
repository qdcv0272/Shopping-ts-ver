# 쇼핑몰 (TypeScript 버전) 👩‍💻🛍️

> 프론트엔드 취업 준비생 관점에서 정리한 개인 학습 프로젝트입니다.

## 한 줄 소개

간단한 전자상거래 UI를 TypeScript + Webpack 환경에서 구현한 연습용 프로젝트입니다. 로컬 JSON 기반으로 상품 목록, 정렬, 퀵뷰, 즐겨찾기, 장바구니 등의 기능을 제공합니다.

## 데모 💻

- 라이브 데모: https://shoppingts.netlify.app/

---

## 주요 기능 ✅

- 상품 목록 렌더링 (카테고리 필터링 포함)

```ts
// src/ts/index.ts
import { initProducts } from "./module/products";
initProducts();
```

- 정렬 옵션: 인기순 / 신규순 / 가격 오름/내림

```ts
// src/ts/module/products.ts - sortProducts (요약)
function sortProducts(list: Product[], mode?: string): Product[] {
  const items = [...list];
  if (!mode || mode === "popular")
    return items.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  if (mode === "new")
    return items.sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    );
  if (mode === "price-asc")
    return items.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
  if (mode === "price-desc")
    return items.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
  return items;
}
```

- 상품 퀵뷰 (상세보기 모달)

```ts
// src/ts/module/product.ts - 퀵뷰 열기 (요약)
document.addEventListener("click", (e) => {
  const el = e.target as HTMLElement;
  if (el.closest(".quick-view")) {
    const card = el.closest(".product-card") as HTMLElement;
    const data = {
      id: card.dataset.id,
      title: card.dataset.title,
      desc: card.dataset.desc,
      price: card.dataset.price,
    };
    open(data); // 모달을 연다
  }
});
```

- 즐겨찾기, 장바구니 페이지 구조(로컬 스토리지 기반으로 확장 가능)

```ts
// src/ts/module/product.ts (요약)
function setFavorites(items: string[]) {
  storage.setItemPrefer("favorites", JSON.stringify(items));
}

function getCartItems(): CartItem[] {
  const raw = storage.getItemPrefer("cartItems");
  return raw ? JSON.parse(raw) : [];
}
```

- 반응형 레이아웃, 사용자 인터랙션(스와이퍼, 오버레이 스크롤바 등)

## 사용 기술 🔧

- 언어: **TypeScript**
- 번들러: **Webpack**
- UI 라이브러리: **Swiper**, **OverlayScrollbars**, **GSAP**(애니메이션 일부)
- 스타일: 순수 CSS (src/css)
- 데이터: 로컬 JSON (`src/data/products.json`)

## 폴더 구조 (요약) 📁

- `src/ts/` - 앱 진입점 및 페이지/모듈별 코드
  - `module/` - 상품, 카테고리, 인증, 스토리지 등 재사용 가능한 모듈
  - `page/` - 각 페이지 초기화 로직
  - `function/` - 공통 유틸(로그, swiper 초기화 등)
- `src/css/` - 전역 및 페이지별 스타일
- `public/` - 정적 HTML 템플릿 (index.html, page/\*.html)
- `src/data/products.json` - 샘플 상품 데이터

4. 빌드 산출물은 `dist/`에 생성됩니다. (배포 전 확인)

## 학습 포인트 ✍️

- TypeScript 기반으로 DOM 조작과 모듈화를 경험했습니다.
- Webpack 설정을 통해 CSS/이미지/HTML 템플릿을 번들링하는 과정을 학습했습니다.
- 실제 서비스 연동 전까지의 프론트엔드 구조(데이터는 JSON로 모킹)를 설계해 보았습니다.

## 개선하고 싶은 점 / TODO ⚠️

- 실제 API 연동 및 백엔드 연동 테스트 추가
- 유닛/통합 테스트 (Jest, Playwright 등) 도입
- 접근성(ARIA) 및 반응형 세부 튜닝
- ESLint/Prettier, CI (GitHub Actions) 추가

---

## 마무리 ✨

이 프로젝트로 **TypeScript + 모듈화 + 번들링** 기본기를 다졌습니다. 채용 과정에서 기술 면접이나 포트폴리오로 보여주기 좋게 정리해 두었고, 피드백이나 같이 개선해볼 분은 PR/Issue 언제나 환영합니다.

감사합니다 🙏
