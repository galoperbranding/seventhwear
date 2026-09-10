'use client';

import { useState, useEffect, useCallback } from 'react';

const slides = [
  { src: '/img/seventhwear_1.jpg', alt: 'SEVENTHWEAR Hero' },
  { src: '/img/seventhwear_2.jpg', alt: 'Ride Collection' },
  { src: '/img/seventhwear_3.jpg', alt: 'Street Collection' },
  { src: '/img/seventhwear_4.jpg', alt: 'SEVENTHWEAR Lifestyle' },
  { src: '/img/seventhwear_5.jpg', alt: 'SEVENTHWEAR Ridewear' },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, paused]);

  return (
    <>
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
        <div className="hero-overlay"></div>
        <div className="hero-watermark">SEVENTHWEAR</div>
      </section>
      <div className="marquee">
        <div className="marquee-track">
          <span className="marquee-item">STREETRIDEWEAR <span>✦</span> SEVENTHWEAR <span>✦</span> BORN FROM THE STREETS <span>✦</span> FUELED BY ADRENALINE <span>✦</span> STREETRIDEWEAR <span>✦</span> SEVENTHWEAR <span>✦</span> BORN FROM THE STREETS <span>✦</span> FUELED BY ADRENALINE</span>
          <span className="marquee-item">STREETRIDEWEAR <span>✦</span> SEVENTHWEAR <span>✦</span> BORN FROM THE STREETS <span>✦</span> FUELED BY ADRENALINE <span>✦</span> STREETRIDEWEAR <span>✦</span> SEVENTHWEAR <span>✦</span> BORN FROM THE STREETS <span>✦</span> FUELED BY ADRENALINE</span>
        </div>
      </div>
    </>
  );
}
