import products from "../../data/products.json";

export type Product = {
  id?: string; // 상품 고유 ID
  title: string; // 상품명
  price: string; // 가격
  desc: string; // 설명
  thumb?: string; // 썸네일 이모지
  popularity?: number; // 인기순 정렬용 숫자
  createdAt?: string; // 신규상품 정렬용 날짜 문자열
  category?: string; // 카테고리
};

const CATEGORIES = [
  "tv-audio",
  "laptop",
  "mobile",
  "pc",
  "gaming",
  "home",
  "kitchen",
  "accessory",
  "deal",
];

export function initProducts(): void {
  if (typeof window === "undefined") return;

  const grids = Array.from(
    document.querySelectorAll<HTMLElement>(".products-grid")
  );
  if (!grids.length) return;

  grids.forEach((grid) => {
    const section = grid.closest("section");
    const matchedCategory = section
      ? CATEGORIES.find((c) => section.classList.contains(c)) ?? null
      : null;

    applyGridListStyle(grid);
    grid.innerHTML = "";

    // 필터링
    const source = matchedCategory
      ? (products as Product[]).filter((x) => x.category === matchedCategory)
      : (products as Product[]);

    const selectEl = section?.querySelector<HTMLSelectElement>(".shop-sort"); // 정렬 select 엘리먼트
    const initialMode = selectEl?.value ?? "popular";
    renderList(grid, sortProducts(source, initialMode));

    if (selectEl) {
      selectEl.addEventListener("change", () => {
        const mode = selectEl.value;
        renderList(grid, sortProducts(source, mode));
      });
    }
  });
}

function applyGridListStyle(grid: HTMLElement) {
  // grid.classList.remove("products-grid--card");
  grid.classList.add("products-grid--list");
  grid.style.setProperty("display", "grid", "important");
  grid.style.setProperty("grid-template-columns", "1fr", "important");
  grid.style.setProperty("max-height", "54vh", "important");
  grid.style.setProperty("overflow", "auto", "important");
}

function renderList(grid: HTMLElement, list: Product[]) {
  applyGridListStyle(grid);
  grid.innerHTML = "";
  const frag = document.createDocumentFragment();
  list.forEach((p) => {
    const article = createEl("article", "product-card");

    if (p.id) article.dataset.id = p.id;
    if (p.title) article.dataset.title = p.title;
    if (p.price) article.dataset.price = p.price;
    if (p.desc) article.dataset.desc = p.desc;
    if (p.thumb) article.dataset.thumb = p.thumb;

    // tag, className, text
    const thumb = createEl("div", "product-thumb", p.thumb ?? "📦");
    thumb.setAttribute("aria-hidden", "true");

    const meta = createEl("div", "product-meta");

    const title = createEl("div", "product-title", p.title);
    const desc = createEl("div", "product-desc", p.desc);

    const bottom = createEl("div", "product-bottom");
    const price = createEl("div", "price", p.price);
    const btn = createEl(
      "button",
      "primary-btn quick-view",
      "상세보기"
    ) as HTMLButtonElement;
    btn.type = "button";

    bottom.appendChild(price);
    bottom.appendChild(btn);

    meta.appendChild(title);
    meta.appendChild(desc);
    meta.appendChild(bottom);

    article.appendChild(thumb);
    article.appendChild(meta);

    frag.appendChild(article);
  });

  grid.appendChild(frag);
  /*
    <div class="products-grid products-grid--list">
  <article
    class="product-card"
    data-id="p001"
    data-title="게이밍 노트북"
    data-price="1,500,000원"
    data-desc="고성능 게이밍 노트북"
    data-thumb="💻">
    <div class="product-thumb" aria-hidden="true">
      💻
    </div>

    <div class="product-meta">
      <div class="product-title">게이밍 노트북</div>
      <div class="product-desc">고성능 게이밍 노트북</div>

      <div class="product-bottom">
        <div class="price">1,500,000원</div>
        <button type="button" class="primary-btn quick-view">
          상세보기
        </button>
      </div>
    </div>
  </article>
</div>

  */
}

function sortProducts(list: Product[], mode?: string): Product[] {
  // 인기순, 신규순, 가격높은순, 가격낮은순
  const items = [...list];
  if (!mode || mode === "popular") {
    return items.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  }
  if (mode === "new") {
    return items.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  }
  if (mode === "price-asc")
    return items.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
  if (mode === "price-desc")
    return items.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
  return items;
}

function parsePrice(raw?: string): number {
  if (!raw) return 0;
  const digits = raw.replace(/[^0-9]/g, "");
  return parseInt(digits || "0", 10);
}

// 간단한 엘리먼트 생성 유틸 함수
function createEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

export default initProducts;
