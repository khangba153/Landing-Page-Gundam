(() => {
  const products = Array.isArray(window.gundamProducts) ? window.gundamProducts : [];
  const grid = document.querySelector("#product-grid");
  const preview = document.querySelector("#product-preview");
  const paginationPrev = document.querySelector("#product-page-prev");
  const paginationNext = document.querySelector("#product-page-next");
  const paginationPages = document.querySelector("#product-pagination-pages");
  const cardStateTimers = new WeakMap();
  const ITEMS_PER_PAGE = 3;

  if (!grid || !preview || products.length === 0 || !paginationPrev || !paginationNext || !paginationPages) {
    return;
  }

  const previewRefs = {
    headerName: document.querySelector("#preview-header-name"),
    iframe: document.querySelector("#preview-iframe"),
    viewerShell: document.querySelector("#preview-viewer-shell"),
    viewerHint: document.querySelector("#preview-viewer-hint"),
    image: document.querySelector("#preview-image"),
    imageWrap: document.querySelector("#preview-image-wrap"),
    fallbackNote: document.querySelector("#preview-fallback-note"),
    source: document.querySelector("#preview-source"),
    sourceModel: document.querySelector("#preview-source-model"),
    sourceAuthor: document.querySelector("#preview-source-author"),
    tag: document.querySelector("#preview-tag"),
    name: document.querySelector("#preview-name"),
    description: document.querySelector("#preview-description"),
    price: document.querySelector("#preview-price"),
    grade: document.querySelector("#preview-grade"),
    series: document.querySelector("#preview-series"),
    highlight: document.querySelector("#preview-highlight"),
    buy: document.querySelector("#preview-buy"),
    frame: document.querySelector(".product-preview__frame")
  };

  let activeProductId = products[0].id;
  let currentPage = 1;
  let previewAnimationTimer = null;
  let pageAnimationTimer = null;
  let filteredProducts = products.slice();

  function getFilteredProducts() {
    return filteredProducts;
  }

  function getTotalPages() {
    return Math.max(1, Math.ceil(getFilteredProducts().length / ITEMS_PER_PAGE));
  }

  function buildSketchfabAutostartUrl(embedUrl) {
    try {
      const url = new URL(embedUrl, window.location.href);
      url.searchParams.set("autostart", "1");
      url.searchParams.set("preload", "1");
      url.searchParams.set("ui_hint", "0");
      return url.toString();
    } catch (error) {
      return embedUrl;
    }
  }

  function buildCard(product) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "product-card";
    button.dataset.productId = product.id;
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-controls", "product-preview");
    button.style.setProperty("--card-accent", product.accent);
    button.style.setProperty("--card-accent-soft", product.accentSoft);

    button.innerHTML = `
      <span class="product-card__media" aria-hidden="true">
        <img class="product-card__image" src="${product.image}" alt="${product.imageAlt}" loading="lazy">
      </span>
      <span class="product-card__body">
        <span class="product-card__tag">${product.tag}</span>
        <strong class="product-card__name">${product.name}</strong>
        <span class="product-card__price">${product.priceLabel}</span>
      </span>
    `;

    return button;
  }

  function getProductsByPage(page) {
    const list = getFilteredProducts();
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    return list.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }

  function syncCardActiveState() {
    grid.querySelectorAll(".product-card").forEach((card) => {
      const isActive = card.dataset.productId === activeProductId;
      card.classList.toggle("is-active", isActive);
      card.setAttribute("aria-pressed", String(isActive));
    });
  }

  function updatePaginationUi() {
    const total = getTotalPages();
    paginationPrev.disabled = currentPage <= 1;
    paginationNext.disabled = currentPage >= total;

    paginationPages.querySelectorAll(".product-pagination__page").forEach((pageButton) => {
      const page = Number(pageButton.dataset.page);
      const isCurrent = page === currentPage;
      pageButton.classList.toggle("is-current", isCurrent);
      pageButton.setAttribute("aria-current", isCurrent ? "page" : "false");
    });
  }

  function animatePage(direction) {
    grid.classList.remove("is-page-switching", "is-forward", "is-backward");
    void grid.offsetWidth;
    grid.classList.add("is-page-switching", direction === "forward" ? "is-forward" : "is-backward");

    window.clearTimeout(pageAnimationTimer);
    pageAnimationTimer = window.setTimeout(() => {
      grid.classList.remove("is-page-switching", "is-forward", "is-backward");
    }, 340);
  }

  function renderPage(page, options = {}) {
    const total = getTotalPages();
    const nextPage = Math.min(Math.max(page, 1), total);
    const previousPage = currentPage;
    currentPage = nextPage;

    const pageProducts = getProductsByPage(currentPage);
    const hasActiveInPage = pageProducts.some((product) => product.id === activeProductId);

    if (!hasActiveInPage && pageProducts.length > 0) {
      const fallbackProduct = pageProducts[0];
      updatePreview(fallbackProduct, options.shouldAnimatePreview === true);
    }

    const cardElements = pageProducts.map(buildCard);
    grid.replaceChildren(...cardElements);
    syncCardActiveState();
    updatePaginationUi();

    if (options.shouldAnimatePage === true) {
      animatePage(currentPage >= previousPage ? "forward" : "backward");
    }
  }

  function releaseCardFeedback(card) {
    window.clearTimeout(cardStateTimers.get(card));
    card.classList.remove("is-pressing");
  }

  function triggerCardFeedback(card, event) {
    const rect = card.getBoundingClientRect();
    const pointerX = typeof event.clientX === "number" ? event.clientX : rect.left + rect.width / 2;
    const pointerY = typeof event.clientY === "number" ? event.clientY : rect.top + rect.height / 2;

    card.style.setProperty("--ripple-x", `${pointerX - rect.left}px`);
    card.style.setProperty("--ripple-y", `${pointerY - rect.top}px`);
    card.classList.remove("is-rippling");
    void card.offsetWidth;
    card.classList.add("is-rippling", "is-pressing");

    window.clearTimeout(cardStateTimers.get(card));
    const timeoutId = window.setTimeout(() => {
      card.classList.remove("is-rippling", "is-pressing");
      cardStateTimers.delete(card);
    }, 240);

    cardStateTimers.set(card, timeoutId);
  }

  function animatePreview(direction) {
    preview.classList.remove("is-switching");
    preview.dataset.direction = direction;
    void preview.offsetWidth;
    preview.classList.add("is-switching");

    window.clearTimeout(previewAnimationTimer);
    previewAnimationTimer = window.setTimeout(() => {
      preview.classList.remove("is-switching");
    }, 560);
  }

  function updateViewer(product) {
    const viewer = product.sketchfab;
    const hasViewer = Boolean(viewer && viewer.embedUrl);
    const embedUrl = hasViewer ? buildSketchfabAutostartUrl(viewer.embedUrl) : "";

    preview.classList.toggle("is-3d-active", hasViewer);
    previewRefs.viewerShell.hidden = !hasViewer;
    previewRefs.source.hidden = !hasViewer;
    previewRefs.imageWrap.hidden = hasViewer;
    previewRefs.fallbackNote.hidden = hasViewer;

    previewRefs.image.src = product.image;
    previewRefs.image.alt = product.imageAlt;

    if (!hasViewer) {
      previewRefs.iframe.removeAttribute("src");
      delete previewRefs.iframe.dataset.currentSrc;
      previewRefs.iframe.title = `Ảnh tham chiếu ${product.name}`;
      return;
    }

    if (previewRefs.iframe.dataset.currentSrc !== embedUrl) {
      previewRefs.iframe.src = embedUrl;
      previewRefs.iframe.dataset.currentSrc = embedUrl;
    }

    previewRefs.iframe.title = `Mô hình 3D ${product.name} trên Sketchfab`;
    previewRefs.sourceModel.textContent = viewer.title;
    previewRefs.sourceModel.href = viewer.modelUrl;
    previewRefs.sourceAuthor.textContent = viewer.author;
    previewRefs.sourceAuthor.href = viewer.authorUrl || viewer.modelUrl;
    previewRefs.viewerHint.textContent = "Kéo để xoay mô hình • Cuộn để zoom • Bấm fullscreen để xem toàn màn hình";
  }

  function updatePreview(product, shouldAnimate) {
    const previousIndex = products.findIndex((item) => item.id === activeProductId);
    const nextIndex = products.findIndex((item) => item.id === product.id);
    activeProductId = product.id;

    syncCardActiveState();

    previewRefs.headerName.textContent = product.name;
    updateViewer(product);
    previewRefs.tag.textContent = product.tag;
    previewRefs.name.textContent = product.name;
    previewRefs.description.textContent = product.description;
    previewRefs.price.textContent = product.priceLabel;
    previewRefs.grade.textContent = product.grade;
    previewRefs.series.textContent = product.series;
    previewRefs.highlight.textContent = product.highlight;
    previewRefs.buy.setAttribute("aria-label", `Mua ngay mẫu ${product.name}`);
    previewRefs.frame.style.setProperty("--preview-accent", product.accent);
    previewRefs.frame.style.setProperty("--preview-accent-soft", product.accentSoft);
    previewRefs.frame.style.setProperty("--preview-warm-soft", product.warmSoft);

    if (shouldAnimate) {
      animatePreview(nextIndex >= previousIndex ? "forward" : "backward");
    }
  }

  function rebuildPagination() {
    paginationPages.innerHTML = '';
    const total = getTotalPages();
    for (let page = 1; page <= total; page += 1) {
      const pageButton = document.createElement("button");
      pageButton.type = "button";
      pageButton.className = "product-pagination__page";
      pageButton.dataset.page = String(page);
      pageButton.setAttribute("role", "listitem");
      pageButton.setAttribute("aria-label", `Trang ${page}`);
      pageButton.textContent = String(page);
      paginationPages.appendChild(pageButton);
    }
  }

  rebuildPagination();

  grid.addEventListener("pointerdown", (event) => {
    const card = event.target.closest(".product-card");

    if (!card) {
      return;
    }

    triggerCardFeedback(card, event);
  });

  grid.addEventListener("pointerup", (event) => {
    const card = event.target.closest(".product-card");

    if (!card) {
      return;
    }

    releaseCardFeedback(card);
  });

  grid.addEventListener("pointercancel", (event) => {
    const card = event.target.closest(".product-card");

    if (!card) {
      return;
    }

    releaseCardFeedback(card);
  });

  grid.addEventListener("click", (event) => {
    const card = event.target.closest(".product-card");

    if (!card) {
      return;
    }

    if (card.dataset.productId === activeProductId) {
      triggerCardFeedback(card, event);
      return;
    }

    const selectedProduct = products.find((product) => product.id === card.dataset.productId);

    if (!selectedProduct) {
      return;
    }

    updatePreview(selectedProduct, true);
  });

  paginationPrev.addEventListener("click", () => {
    if (currentPage <= 1) {
      return;
    }

    renderPage(currentPage - 1, { shouldAnimatePage: true, shouldAnimatePreview: false });
  });

  paginationNext.addEventListener("click", () => {
    if (currentPage >= getTotalPages()) {
      return;
    }

    renderPage(currentPage + 1, { shouldAnimatePage: true, shouldAnimatePreview: false });
  });

  paginationPages.addEventListener("click", (event) => {
    const pageButton = event.target.closest(".product-pagination__page");

    if (!pageButton) {
      return;
    }

    const targetPage = Number(pageButton.dataset.page);

    if (!Number.isInteger(targetPage) || targetPage === currentPage) {
      return;
    }

    renderPage(targetPage, { shouldAnimatePage: true, shouldAnimatePreview: false });
  });

  preview.dataset.direction = "forward";
  updatePreview(products[0], false);
  renderPage(1, { shouldAnimatePage: false, shouldAnimatePreview: false });

  /* ── Grade Filter Integration ── */
  document.addEventListener('gradeFilter', (e) => {
    const grade = e.detail.grade;
    filteredProducts = grade === 'all' ? products.slice() : products.filter((p) => p.grade === grade);
    currentPage = 1;
    rebuildPagination();

    if (filteredProducts.length > 0) {
      updatePreview(filteredProducts[0], true);
    }
    renderPage(1, { shouldAnimatePage: true, shouldAnimatePreview: false });
  });
})();
