'use client';
import { useEffect } from 'react';

export default function Gtranslate() {
  useEffect(() => {
    (window as any).gtranslateSettings = {
      default_language: 'zh-TW',
      languages: ['zh-TW', 'en', 'zh-CN'],
      wrapper_selector: '.gtranslate_wrapper',
      horizontal_position: 'right',
      vertical_position: 'top'
    };
    const el = document.getElementById('g-translate-script');
    if (!el) {
      const s = document.createElement('script');
      s.id = 'g-translate-script';
      s.src = 'https://cdn.gtranslate.net/widgets/latest/lc.js';
      s.defer = true;
      document.body.appendChild(s);
    }
    return () => {
      if (el) {
        el.remove();
      }
    };
  }, []);

  return <div className="gtranslate_wrapper" suppressHydrationWarning />;
}
