'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const slides = [
  { src: '/img/seventhwear_1.jpg', alt: 'SEVENTHWEAR Hero' },
  { src: '/img/seventhwear_2.jpg', alt: 'Ride Collection' },
  { src: '/img/seventhwear_3.jpg', alt: 'Street Collection' },
  { src: '/img/seventhwear_4.jpg', alt: 'SEVENTHWEAR Lifestyle' },
  { src: '/img/seventhwear_5.jpg', alt: 'SEVENTHWEAR Ridewear' },
];

const SLIDE_DURATION = 6000;

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [watermarkKey, setWatermarkKey] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
    setWatermarkKey((k) => k + 1);
  }, []);

  const next = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, goTo]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [next, paused]);

  /* Restart progress bar animation on slide change or pause toggle */
  useEffect(() => {
    const bar = progressRef.current;
    if (!bar) return;
    bar.style.animation = 'none';
    // force reflow
    void bar.offsetWidth;
    bar.style.animation = paused
      ? 'none'
      : `heroProgress ${SLIDE_DURATION}ms linear forwards`;
  }, [current, paused]);

  return (
    <section
      className="hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hero-slider">
        {slides.map((slide, i) => (
          <div key={i} className={`hero-slide ${i === current ? 'active' : ''}`}>
            <img src={slide.src} alt={slide.alt} className="hero-slide-bg" />
          </div>
        ))}
      </div>

      <div className="hero-overlay" />

      <div className="hero-watermark" key={watermarkKey}>
        SEVENTHWEAR
      </div>

      {/* Slide counter */}
      <div className="hero-counter">
        <span className="hero-counter-current">
          {String(current + 1).padStart(2, '0')}
        </span>
        <span className="hero-counter-sep" />
        <span className="hero-counter-total">
          {String(slides.length).padStart(2, '0')}
        </span>
      </div>

      {/* Navigation dots with progress */}
      <div className="hero-slider-nav">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`hero-slider-dot ${i === current ? 'active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          >
            {i === current && (
              <span className="hero-dot-progress" ref={progressRef} />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
