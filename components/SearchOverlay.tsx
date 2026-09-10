'use client';

import { useEffect, useRef } from 'react';

export default function SearchOverlay() {
  const inputRef = useRef<HTMLInputElement>(null);

  function closeSearch() {
    const overlay = document.querySelector('.search-overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') closeSearch();
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = inputRef.current?.value?.trim();
    if (query) {
      window.location.href = `/shop?search=${encodeURIComponent(query)}`;
      closeSearch();
    }
  }

  return (
    <div className="search-overlay">
      <button className="search-overlay-close" onClick={closeSearch}>×</button>
      <form className="search-form" onSubmit={handleSearch}>
        <div className="search-input-wrapper">
          <input type="text" placeholder="Buscar..." ref={inputRef} />
          <button type="submit">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        </div>
      </form>
    </div>
  );
}
