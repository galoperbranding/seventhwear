'use client';

import { useEffect, useRef, useState } from 'react';

interface TextRevealProps {
  children: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  className?: string;
  delay?: number;
  splitBy?: 'word' | 'char';
}

export default function TextReveal({
  children,
  as: Tag = 'h2',
  className = '',
  delay = 0,
  splitBy = 'word',
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const units = splitBy === 'char'
    ? children.split('')
    : children.split(' ');

  return (
    <Tag ref={ref as React.Ref<HTMLHeadingElement>} className={`text-reveal ${className}`}>
      {units.map((unit, i) => (
        <span key={i} className="text-reveal-wrap">
          <span
            className={`text-reveal-unit ${visible ? 'visible' : ''}`}
            style={{ transitionDelay: `${delay + i * 0.04}s` }}
          >
            {unit}{splitBy === 'word' && i < units.length - 1 ? '\u00A0' : ''}
          </span>
        </span>
      ))}
    </Tag>
  );
}
