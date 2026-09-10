'use client';

import { useEffect } from 'react';

const REVEAL_SELECTOR = [
  '.reveal', '.reveal-left', '.reveal-right',
  '.reveal-scale', '.reveal-clip', '.reveal-blur',
  '.reveal-title', '.reveal-stagger', '.reveal-stagger-scale',
].join(', ');

const NOT_VISIBLE = [
  '.reveal:not(.visible)', '.reveal-left:not(.visible)', '.reveal-right:not(.visible)',
  '.reveal-scale:not(.visible)', '.reveal-clip:not(.visible)', '.reveal-blur:not(.visible)',
  '.reveal-title:not(.visible)', '.reveal-stagger:not(.visible)', '.reveal-stagger-scale:not(.visible)',
].join(', ');

function createObserver() {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );
}

let observer: IntersectionObserver;

export default function ScrollReveal() {
  useEffect(() => {
    observer = createObserver();
    const reveals = document.querySelectorAll(REVEAL_SELECTOR);
    if (reveals.length === 0) return;
    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Re-observe on route changes (new content)
  useEffect(() => {
    const mutationObserver = new MutationObserver(() => {
      const reveals = document.querySelectorAll(NOT_VISIBLE);
      if (reveals.length === 0) return;

      const obs = createObserver();
      reveals.forEach((el) => obs.observe(el));
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => mutationObserver.disconnect();
  }, []);

  return null;
}
