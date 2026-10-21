import type { ReactNode } from 'react';
import Footer from '@/app/components/Footer';
import Header from '@/app/components/v2/Header';

export default function ManualLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
