'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

// Pages where the header starts transparent (over hero image/video)
const TRANSPARENT_PAGES = ['/'];

export default function Header() {
  const { cartCount, openCart } = useCart();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isTransparent = TRANSPARENT_PAGES.includes(pathname);

  // Scroll listener — toggle .scrolled
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    document.body.style.overflow = '';
  }, [pathname]);

  // Close user menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [userMenuOpen]);

  const handleLogout = useCallback(async () => {
    setUserMenuOpen(false);
    await logout();
    router.push('/');
  }, [logout, router]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => {
      const next = !prev;
      document.body.style.overflow = next ? 'hidden' : '';
      return next;
    });
  }, []);

  function openSearch() {
    const overlay = document.querySelector('.search-overlay');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const input = document.querySelector('.search-overlay input') as HTMLInputElement;
      input?.focus();
    }, 300);
  }

  const headerClasses = [
    'header',
    isTransparent ? 'header--transparent' : '',
    scrolled ? 'scrolled' : '',
  ].filter(Boolean).join(' ');

  // White logo on transparent pages before scroll; dark logo otherwise
  const showWhiteLogo = isTransparent && !scrolled && !mobileMenuOpen;

  return (
    <header className={headerClasses}>
      <div className="header-top">
        <div className="header-left">
          <button className="header-action-btn search-btn" aria-label="Buscar" onClick={openSearch}>
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        </div>
        <Link href="/" className="logo">
          <img
            src={showWhiteLogo ? '/img/seventhwear_logo_blanco.svg' : '/img/seventhwear_logo_negro.svg'}
            alt="SEVENTHWEAR"
          />
        </Link>
        <div className="header-right">
          {user ? (
            <div className="user-menu-wrap" ref={userMenuRef}>
              <button
                className="header-action-btn"
                aria-label="Cuenta"
                onClick={() => setUserMenuOpen(prev => !prev)}
              >
                <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </button>
              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-name">{user.first_name} {user.last_name}</div>
                  <div className="user-dropdown-email">{user.email}</div>
                  <div className="user-dropdown-divider" />
                  <Link href="/cuenta" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>Mi cuenta</Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)}>Admin Panel</Link>
                  )}
                  <div className="user-dropdown-divider" />
                  <button className="user-dropdown-item user-dropdown-logout" onClick={handleLogout}>Cerrar sesión</button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="header-action-btn" aria-label="Cuenta">
              <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </Link>
          )}
          <button className="header-action-btn cart-btn" aria-label="Carrito" onClick={openCart}>
            <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>
          <button
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            aria-label="Menú"
            onClick={toggleMobileMenu}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
      <nav className={`nav-main ${mobileMenuOpen ? 'open' : ''}`}>
        <Link href="/shop?collection=street-collection" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Street Collection</Link>
        <Link href="/shop?collection=ride-collection" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Ride Collection</Link>
        <Link href="/shop?collection=essentials" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Essentials</Link>
        <Link href="/shop?category=tees" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Streetwear</Link>
        <Link href="/shop?collection=ride-collection" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Ridewear</Link>
        <Link href="/shop" className="nav-link" onClick={() => setMobileMenuOpen(false)}>All Products</Link>
        <Link href="/brand" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Brand</Link>
        <Link href="/shop?badge=sale" className="nav-link nav-link--sale" onClick={() => setMobileMenuOpen(false)}>Sale</Link>
      </nav>
    </header>
  );
}
