(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. Dark Mode Toggle ── */
  const themeToggle = document.getElementById('theme-toggle');
  const storedTheme = localStorage.getItem('gundam-theme');
  const prefersDark = true;

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('gundam-theme', theme);
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối');
    }
  }

  setTheme(storedTheme || (prefersDark ? 'dark' : 'light'));

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    });
  }

  /* ── 2. Hamburger Menu ── */
  const hamburger = document.getElementById('hamburger');
  const mainNav = document.getElementById('main-nav');

  if (hamburger && mainNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      hamburger.classList.toggle('is-active', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    mainNav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        mainNav.classList.remove('is-open');
        hamburger.classList.remove('is-active');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });

    /* Escape key closes mobile nav */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
        mainNav.classList.remove('is-open');
        hamburger.classList.remove('is-active');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.focus();
      }
    });
  }

  /* ── 3. Active Nav Highlight on Scroll ── */
  const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');
  const sections = [];

  navLinks.forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    const section = document.getElementById(id);
    if (section) sections.push({ link, section });
  });

  if (sections.length > 0) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const match = sections.find((s) => s.section === entry.target);
          if (match) {
            match.link.classList.toggle('is-active', entry.isIntersecting);
          }
        });
      },
      { threshold: 0.2, rootMargin: '-72px 0px -40% 0px' }
    );

    sections.forEach((s) => navObserver.observe(s.section));
  }

  /* ── 4. Scroll Progress Bar + Ring ── */
  const progressBar = document.querySelector('.scroll-progress');
  const scrollRing = document.getElementById('scroll-ring');
  const RING_CIRCUMFERENCE = 2 * Math.PI * 22; // r=22

  function getScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
  }

  function updateProgress() {
    const progress = getScrollProgress();
    if (progressBar) {
      progressBar.style.transform = `scaleX(${progress})`;
    }
    if (scrollRing) {
      const offset = RING_CIRCUMFERENCE * (1 - progress);
      scrollRing.style.strokeDashoffset = offset;
    }
  }

  /* ── 5. Back-to-Top Button ── */
  const backToTop = document.getElementById('back-to-top');

  function updateBackToTop() {
    if (backToTop) {
      backToTop.classList.toggle('is-visible', window.scrollY > 400);
    }
  }

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── 6. Parallax Section Headings + Image Parallax ── */
  const parallaxHeadings = document.querySelectorAll('.section-heading');
  const parallaxImages = document.querySelectorAll('.grade-panel__bg img, .benefit-strip__bg img');

  function updateParallax() {
    parallaxHeadings.forEach((heading) => {
      const rect = heading.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const viewCenter = window.innerHeight / 2;
      const offset = (center - viewCenter) * 0.04;
      heading.style.transform = `translateY(${offset}px)`;
    });

    /* Image parallax for grade panels & benefit strips */
    parallaxImages.forEach((img) => {
      const rect = img.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const ratio = (rect.top + rect.height / 2) / window.innerHeight;
      const shift = (ratio - 0.5) * 30; // -15px to +15px
      img.style.transform = `translateY(${shift}px) scale(1.08)`;
    });
  }

  /* ── Combined Scroll Handler (throttled via rAF) ── */
  let scrollTicking = false;

  function onScroll() {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        updateProgress();
        updateBackToTop();
        if (!prefersReducedMotion) updateParallax();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  updateProgress();
  updateBackToTop();

  /* ── 7. Keyboard Navigation for Product Grid ── */
  const productGrid = document.getElementById('product-grid');

  if (productGrid) {
    productGrid.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();

      const cards = Array.from(productGrid.querySelectorAll('.product-card'));
      const focused = document.activeElement;
      const idx = cards.indexOf(focused);

      let next;
      if (e.key === 'ArrowDown') {
        next = idx < cards.length - 1 ? idx + 1 : 0;
      } else {
        next = idx > 0 ? idx - 1 : cards.length - 1;
      }

      cards[next]?.focus();
    });
  }

  /* ── 8. Product Grade Filter ── */
  const filterContainer = document.getElementById('product-filter');

  if (filterContainer && window.gundamProducts) {
    filterContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.product-filter__btn');
      if (!btn) return;

      filterContainer.querySelectorAll('.product-filter__btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const grade = btn.dataset.grade;

      window.__gundamFilterGrade = grade;
      const event = new CustomEvent('gradeFilter', { detail: { grade } });
      document.dispatchEvent(event);
    });
  }

  /* ── 9. Skeleton Loaders ── */
  function hideSkeleton(iframeId, skeletonId) {
    const iframe = document.getElementById(iframeId);
    const skeleton = document.getElementById(skeletonId);
    if (!iframe || !skeleton) return;

    iframe.addEventListener('load', () => {
      skeleton.classList.add('is-loaded');
    });

    setTimeout(() => {
      skeleton.classList.add('is-loaded');
    }, 8000);
  }

  hideSkeleton('preview-iframe', 'preview-skeleton');

  const heroIframe = document.querySelector('.hero__showcase-iframe');
  const heroSkeleton = document.getElementById('hero-skeleton');
  if (heroIframe && heroSkeleton) {
    heroIframe.addEventListener('load', () => heroSkeleton.classList.add('is-loaded'));
    setTimeout(() => heroSkeleton.classList.add('is-loaded'), 8000);
  }

  /* ── 10. Testimonial Carousel (mobile) + Auto-play ── */
  const carouselGrid = document.getElementById('testimonial-grid');
  const dotsContainer = document.getElementById('testimonial-dots');

  if (carouselGrid && dotsContainer) {
    const cards = carouselGrid.querySelectorAll('.quote-card');
    let currentSlide = 0;
    let autoPlayTimer = null;

    cards.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'testimonial-dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', `Đánh giá ${i + 1}`);
      dot.dataset.index = String(i);
      dotsContainer.appendChild(dot);
    });

    function goToSlide(index) {
      currentSlide = index;
      carouselGrid.style.transform = `translateX(-${index * 100}%)`;
      dotsContainer.querySelectorAll('.testimonial-dot').forEach((d, i) => {
        d.classList.toggle('is-active', i === index);
      });
    }

    function startAutoPlay() {
      stopAutoPlay();
      autoPlayTimer = setInterval(() => {
        const next = currentSlide < cards.length - 1 ? currentSlide + 1 : 0;
        goToSlide(next);
      }, 5000);
    }

    function stopAutoPlay() {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    }

    dotsContainer.addEventListener('click', (e) => {
      const dot = e.target.closest('.testimonial-dot');
      if (dot) {
        goToSlide(Number(dot.dataset.index));
        startAutoPlay(); // restart timer
      }
    });

    let touchStartX = 0;
    carouselGrid.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      stopAutoPlay();
    }, { passive: true });

    carouselGrid.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0 && currentSlide < cards.length - 1) goToSlide(currentSlide + 1);
        else if (diff < 0 && currentSlide > 0) goToSlide(currentSlide - 1);
      }
      startAutoPlay(); // resume after swipe
    }, { passive: true });

    /* Start auto-play when carousel becomes visible on mobile */
    const carouselObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && window.innerWidth <= 820) {
          startAutoPlay();
        } else {
          stopAutoPlay();
        }
      });
    }, { threshold: 0.3 });

    carouselObserver.observe(carouselGrid);
  }

  /* ── 11. Cursor Glow Effect on Cards ── */
  if (!prefersReducedMotion) {
    function setupCursorGlow(container, selector) {
      const items = container.querySelectorAll(selector);
      items.forEach((item) => {
        const glow = document.createElement('div');
        glow.className = 'cursor-glow';
        item.style.position = item.style.position || 'relative';
        item.appendChild(glow);

        item.addEventListener('mousemove', (e) => {
          const rect = item.getBoundingClientRect();
          const x = e.clientX - rect.left - 100;
          const y = e.clientY - rect.top - 100;
          glow.style.left = x + 'px';
          glow.style.top = y + 'px';
          glow.classList.add('is-active');
        });

        item.addEventListener('mouseleave', () => {
          glow.classList.remove('is-active');
        });
      });
    }

    const showroomPanel = document.querySelector('.product-showroom__grid-panel');
    if (showroomPanel) {
      // Re-apply glow on card changes via MutationObserver
      const gridEl = document.getElementById('product-grid');
      if (gridEl) {
        const glowObserver = new MutationObserver(() => {
          setupCursorGlow(gridEl, '.product-card');
        });
        glowObserver.observe(gridEl, { childList: true });
        setupCursorGlow(gridEl, '.product-card');
      }
    }

    setupCursorGlow(document, '.quote-card');
    setupCursorGlow(document, '.grade-panel');
  }

  /* ── 12. Count-Up Animation for Hero Stats ── */
  if (!prefersReducedMotion) {
    const heroStats = document.querySelectorAll('.hero__stat strong');
    let statsCounted = false;

    function animateCountUp(el) {
      const text = el.textContent.trim();
      const match = text.match(/^([\d,.]+)(\+?)(.*)$/);
      if (!match) return;

      const rawNum = match[1].replace(/[.,]/g, '');
      const target = parseInt(rawNum, 10);
      const suffix = (match[2] || '') + (match[3] || '');
      if (isNaN(target)) return;

      const isFraction = text.includes('/');
      if (isFraction) {
        // e.g. "1/60"
        const parts = text.split('/');
        const num = parseInt(parts[0], 10);
        const den = parseInt(parts[1], 10);
        let current = 0;
        const duration = 1200;
        const start = performance.now();

        function step(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          current = Math.round(eased * den);
          el.textContent = `${num}/${current}`;
          if (progress < 1) requestAnimationFrame(step);
        }
        el.textContent = `${num}/0`;
        requestAnimationFrame(step);
        return;
      }

      let current = 0;
      const duration = 1400;
      const start = performance.now();
      const formatter = text.includes('.') || text.includes(',');

      function formatNum(n) {
        if (formatter) return n.toLocaleString('vi-VN');
        return String(n);
      }

      function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        current = Math.round(eased * target);
        el.textContent = formatNum(current) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }

      el.textContent = '0' + suffix;
      requestAnimationFrame(step);
    }

    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !statsCounted) {
          statsCounted = true;
          heroStats.forEach((stat, i) => {
            setTimeout(() => animateCountUp(stat), i * 150);
          });
          statsObserver.disconnect();
        }
      });
    }, { threshold: 0.5 });

    const statsBar = document.querySelector('.hero__stats-bar');
    if (statsBar) statsObserver.observe(statsBar);
  }

  /* ── 13. Staggered Letter Animation for Section Headings ── */
  if (!prefersReducedMotion) {
    const headingElements = document.querySelectorAll('.section-heading h2');

    function splitIntoLetters(el) {
      const text = el.textContent;
      el.innerHTML = '';
      el.setAttribute('aria-label', text);

      text.split('').forEach((char, i) => {
        const span = document.createElement('span');
        span.className = 'heading-letter' + (char === ' ' ? ' is-space' : '');
        span.textContent = char === ' ' ? '\u00a0' : char;
        span.style.animationDelay = `${i * 0.025}s`;
        span.setAttribute('aria-hidden', 'true');
        el.appendChild(span);
      });
    }

    const headingObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
          entry.target.dataset.animated = 'true';
          splitIntoLetters(entry.target);
          headingObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3, rootMargin: '0px 0px -60px 0px' });

    headingElements.forEach((h) => headingObserver.observe(h));
  }

  /* ── 14. Grade Panel → Filter Link ── */
  const gradePanels = document.querySelectorAll('.grade-panel[data-grade]');

  gradePanels.forEach((panel) => {
    panel.addEventListener('click', () => {
      const grade = panel.dataset.grade;
      if (!grade) return;

      /* Trigger the grade filter */
      const filterBtn = document.querySelector(`.product-filter__btn[data-grade="${grade}"]`);
      if (filterBtn) {
        filterBtn.click();
      }

      /* Scroll to featured section */
      const featured = document.getElementById('featured');
      if (featured) {
        featured.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        panel.click();
      }
    });
  });

  /* ── 15. Quick-View Modal ── */
  const overlay = document.getElementById('quickview-overlay');
  const closeBtn = document.getElementById('quickview-close');
  const qvName = document.getElementById('quickview-name');
  const qvDesc = document.getElementById('quickview-desc');
  const qvPrice = document.getElementById('quickview-price');
  const qvViewer = document.getElementById('quickview-viewer');

  function openQuickView(product) {
    if (!overlay || !product) return;

    qvName.textContent = product.name;
    qvDesc.textContent = product.description;

    if (product.originalPrice) {
      qvPrice.innerHTML = `<span class="quickview-modal__price-old">${product.originalPrice}</span> ${product.priceLabel}`;
    } else {
      qvPrice.textContent = product.priceLabel;
    }

    if (product.sketchfab && product.sketchfab.embedUrl) {
      const url = new URL(product.sketchfab.embedUrl, window.location.href);
      url.searchParams.set('autostart', '1');
      url.searchParams.set('preload', '1');
      url.searchParams.set('ui_hint', '0');
      qvViewer.innerHTML = `<iframe src="${url.toString()}" title="3D ${product.name}" allowfullscreen></iframe>`;
    } else {
      qvViewer.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;"><img src="${product.image}" alt="${product.name}" style="max-height:100%;object-fit:contain;"></div>`;
    }

    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeQuickView() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    qvViewer.innerHTML = '';
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeQuickView);
  }

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeQuickView();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
        closeQuickView();
      }
    });
  }

  /* Double-click on product card opens quick view */
  if (productGrid && window.gundamProducts) {
    productGrid.addEventListener('dblclick', (e) => {
      const card = e.target.closest('.product-card');
      if (!card) return;
      const product = window.gundamProducts.find((p) => p.id === card.dataset.productId);
      if (product) openQuickView(product);
    });
  }

  /* ── 16. Magnetic Button Effect ── */
  if (!prefersReducedMotion) {
    const magneticBtns = document.querySelectorAll('.button--magnetic');

    magneticBtns.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * 0.18;
        const dy = (e.clientY - cy) * 0.18;
        btn.style.transform = `translate(${dx}px, ${dy}px) scale(1.03)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }
})();
