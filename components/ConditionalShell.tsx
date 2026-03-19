'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartSidebar from '@/components/CartSidebar';
import SearchOverlay from '@/components/SearchOverlay';
import ContactPopup from '@/components/ContactPopup';
import ScrollReveal from '@/components/ScrollReveal';

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <CartSidebar />
      <SearchOverlay />
      <ContactPopup />
      <ScrollReveal />
    </>
  );
}
