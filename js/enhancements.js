(() => {
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

  /* ── 4. Scroll Progress Bar ── */
  const progressBar = document.querySelector('.scroll-progress');

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
    if (progressBar) {
      progressBar.style.transform = `scaleX(${progress})`;
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

  /* ── 6. Parallax Section Headings ── */
  const parallaxHeadings = document.querySelectorAll('.section-heading');

  function updateParallax() {
    const scrollY = window.scrollY;
    parallaxHeadings.forEach((heading) => {
      const rect = heading.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const viewCenter = window.innerHeight / 2;
      const offset = (center - viewCenter) * 0.04;
      heading.style.transform = `translateY(${offset}px)`;
    });
  }

  /* ── Combined Scroll Handler (throttled via rAF) ── */
  let scrollTicking = false;

  function onScroll() {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        updateProgress();
        updateBackToTop();
        updateParallax();
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

  /* ── 10. Testimonial Carousel (mobile) ── */
  const carouselGrid = document.getElementById('testimonial-grid');
  const dotsContainer = document.getElementById('testimonial-dots');

  if (carouselGrid && dotsContainer) {
    const cards = carouselGrid.querySelectorAll('.quote-card');
    let currentSlide = 0;

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

    dotsContainer.addEventListener('click', (e) => {
      const dot = e.target.closest('.testimonial-dot');
      if (dot) goToSlide(Number(dot.dataset.index));
    });

    let touchStartX = 0;
    carouselGrid.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    carouselGrid.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0 && currentSlide < cards.length - 1) goToSlide(currentSlide + 1);
        else if (diff < 0 && currentSlide > 0) goToSlide(currentSlide - 1);
      }
    }, { passive: true });
  }
})();
