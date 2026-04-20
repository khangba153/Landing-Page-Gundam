(() => {
  const SELECTORS = [
    '.section-heading',
    '.product-showroom',
    '.grade-panel',
    '.benefit-strip',
    '.quote-card',
    '.cta__inner'
  ];

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return;
  }

  const elements = document.querySelectorAll(SELECTORS.join(', '));

  if (!elements.length) {
    return;
  }

  elements.forEach((el) => {
    el.classList.add('reveal');
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach((el) => observer.observe(el));
})();
