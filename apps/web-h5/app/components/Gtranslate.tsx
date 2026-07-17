'use client';
import { useEffect } from 'react';

export default function Gtranslate() {
  useEffect(() => {
    (window as any).gtranslateSettings = {
      default_language: 'zh-TW',
      native_language_names: true,
      languages: ['zh-TW', 'zh-CN', 'en'],
      globe_color: '#66aaff',
      wrapper_selector: '.gtranslate_wrapper',
      flag_size: 16,
      horizontal_position: 'right',
      vertical_position: 'top',
      alt_flags: { en: 'usa' },
      globe_size: 40
    };

    const el = document.getElementById('g-translate-script');
    if (!el) {
      const s = document.createElement('script');
      s.id = 'g-translate-script';
      s.src = 'https://cdn.gtranslate.net/widgets/latest/globe.js';
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
