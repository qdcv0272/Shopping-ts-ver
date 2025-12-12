import products from "../../data/products.json";

type Product = {
  id?: string;
  title: string;
  price: string;
  desc: string;
  thumb?: string;
  popularity?: number;
  createdAt?: string;
  category?: string;
};

export function initProducts(): void {
  if (typeof window === "undefined") return;

  const grids = Array.from(
    document.querySelectorAll<HTMLElement>(".products-grid")
  );
  if (!grids.length) return;

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

  grids.forEach((grid) => {
    // determine this grid's category by walking up to nearest section and matching classes
    const section = grid.closest("section");
    let matchedCategory: string | null = null;
    if (section) {
      for (const c of CATEGORIES) {
        if (section.classList.contains(c)) {
          matchedCategory = c;
          break;
        }
      }
    }
    // clear any existing content (we will render from data.json)
    grid.innerHTML = "";
    // default to list layout (one item per row) to match initial mock (image 1)
    grid.classList.remove("products-grid--card");
    grid.classList.add("products-grid--list");
    // enforce inline layout properties so wrappers (OverlayScrollbars etc.)
    // don't change the host to a horizontal/flex layout and to ensure
    // a vertical scroll appears when content overflows.
    grid.style.setProperty("display", "grid", "important");
    grid.style.setProperty("grid-template-columns", "1fr", "important");
    grid.style.setProperty("max-height", "54vh", "important");
    grid.style.setProperty("overflow", "auto", "important");

    // filter products for this grid: match category if present, otherwise show full list
    const source = matchedCategory
      ? (products as Product[]).filter((x) => x.category === matchedCategory)
      : (products as Product[]);

    function parsePrice(raw?: string) {
      if (!raw) return 0;
      const digits = raw.replace(/[^0-9]/g, "");
      return parseInt(digits || "0", 10);
    }

    function sortProducts(list: Product[], mode?: string) {
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

    // render the provided product list into the grid
    function renderList(list: Product[]) {
      // ensure we render in vertical list mode by default
      grid.classList.remove("products-grid--card");
      grid.classList.add("products-grid--list");
      // re-apply inline defensive styles to the host so scrollbars are visible
      grid.style.setProperty("display", "grid", "important");
      grid.style.setProperty("grid-template-columns", "1fr", "important");
      grid.style.setProperty("max-height", "54vh", "important");
      grid.style.setProperty("overflow", "auto", "important");

      grid.innerHTML = "";
      const frag = document.createDocumentFragment();
      list.forEach((p) => {
        const article = document.createElement("article");
        article.className = "product-card";

        if (p.id) article.dataset.id = p.id;
        if (p.title) article.dataset.title = p.title;
        if (p.price) article.dataset.price = p.price;
        if (p.desc) article.dataset.desc = p.desc;
        if (p.thumb) article.dataset.thumb = p.thumb;

        const thumb = document.createElement("div");
        thumb.className = "product-thumb";
        thumb.setAttribute("aria-hidden", "true");
        thumb.textContent = p.thumb ?? "📦";

        const meta = document.createElement("div");
        meta.className = "product-meta";

        const title = document.createElement("div");
        title.className = "product-title";
        title.textContent = p.title;

        const desc = document.createElement("div");
        desc.className = "product-desc";
        desc.textContent = p.desc;

        const bottom = document.createElement("div");
        bottom.className = "product-bottom";

        const price = document.createElement("div");
        price.className = "price";
        price.textContent = p.price;

        const btn = document.createElement("button");
        btn.className = "primary-btn quick-view";
        btn.type = "button";
        btn.textContent = "상세보기";

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
    }

    // wire select control inside the same section (if present) to sort this grid
    const selectEl = section?.querySelector<HTMLSelectElement>(".shop-sort");
    const initialMode = selectEl?.value ?? "popular";
    renderList(sortProducts(source, initialMode));
    if (selectEl) {
      selectEl.addEventListener("change", () => {
        // Keep the product list vertical (single-column) as requested —
        // do not toggle layout on sort changes. Just re-render sorted items.
        grid.classList.remove("products-grid--card");
        grid.classList.add("products-grid--list");

        const mode = selectEl.value;
        renderList(sortProducts(source, mode));
      });
    }

    // continue (we already rendered via renderList)
    return;

    // fallback: if no select logic used, fall back to original source rendering
  });
}

export default initProducts;
