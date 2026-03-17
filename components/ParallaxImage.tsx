'use client';

import { useEffect, useRef } from 'react';

interface ParallaxImageProps {
  src: string;
  alt: string;
  speed?: number; // 0.1 = subtle, 0.3 = medium
  className?: string;
}

export default function ParallaxImage({ src, alt, speed = 0.15, className = '' }: ParallaxImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    let raf: number;
    function onScroll() {
      raf = requestAnimationFrame(() => {
        const rect = container!.getBoundingClientRect();
        const windowH = window.innerHeight;
        // Element visibility ratio: -1 to 1 (0 = centered in viewport)
        const ratio = (rect.top + rect.height / 2 - windowH / 2) / windowH;
        const offset = ratio * speed * 100;
        img!.style.transform = `translate3d(0, ${offset}px, 0) scale(1.1)`;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial position
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [speed]);

  return (
    <div ref={containerRef} className={`parallax-container ${className}`}>
      <img ref={imgRef} src={src} alt={alt} className="parallax-img" loading="lazy" />
    </div>
  );
}
