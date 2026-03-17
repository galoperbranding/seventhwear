'use client';

import { useRef, useCallback, useEffect } from 'react';

interface ProductCarouselProps {
  children: React.ReactNode;
}

export default function ProductCarousel({ children }: ProductCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const velocity = useRef(0);
  const lastX = useRef(0);
  const rafId = useRef<number>(0);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const track = trackRef.current;
    if (!track) return;
    isDragging.current = true;
    startX.current = e.clientX;
    lastX.current = e.clientX;
    scrollLeft.current = track.scrollLeft;
    velocity.current = 0;
    cancelAnimationFrame(rafId.current);
    track.style.scrollBehavior = 'auto';
    track.style.cursor = 'grabbing';
    track.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const track = trackRef.current;
    if (!track || !isDragging.current) return;
    isDragging.current = false;
    track.style.cursor = 'grab';
    track.style.scrollBehavior = 'smooth';
    track.releasePointerCapture(e.pointerId);

    // Momentum scrolling
    const decel = () => {
      velocity.current *= 0.92;
      if (Math.abs(velocity.current) > 0.5) {
        track.scrollLeft -= velocity.current;
        rafId.current = requestAnimationFrame(decel);
      }
    };
    if (Math.abs(velocity.current) > 2) {
      rafId.current = requestAnimationFrame(decel);
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const track = trackRef.current;
    if (!track) return;
    const dx = e.clientX - lastX.current;
    velocity.current = dx;
    lastX.current = e.clientX;
    const walk = e.clientX - startX.current;
    track.scrollLeft = scrollLeft.current - walk;
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  return (
    <div className="product-carousel reveal">
      <div
        className="product-carousel-track"
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerMove={handlePointerMove}
        style={{ cursor: 'grab' }}
      >
        {children}
      </div>
    </div>
  );
}
