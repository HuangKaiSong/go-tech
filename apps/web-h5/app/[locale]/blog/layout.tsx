import type { ReactNode } from 'react';
import Footer from '@/app/components/Footer';
import Header from '@/app/components/v2/Header';
import styles from './blog.module.css';

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${styles.theme} min-h-screen flex flex-col bg-background`}>
      <Header />
      {children}
      <Footer />
    </div>
  );
}
