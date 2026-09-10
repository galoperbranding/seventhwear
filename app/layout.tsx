import type { Metadata } from 'next';
import './globals.css';
import ConditionalShell from '@/components/ConditionalShell';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import PageTransition from '@/components/PageTransition';

export const metadata: Metadata = {
  title: 'SEVENTHWEAR — StreetRideWear',
  description: 'SEVENTHWEAR — La fusión del streetwear y el ridewear. Ropa para los que viven entre el asfalto urbano y los caminos de tierra.',
  icons: {
    icon: '/img/seventhwear_logo_negro.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <PageTransition />
              <ConditionalShell>
                {children}
              </ConditionalShell>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
