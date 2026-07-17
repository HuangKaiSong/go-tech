'use client';
import { useEffect } from 'react';

export default function GoogleTranslate() {
  useEffect(() => {
    (window as any).googleTranslateElementInit = () => {
      // oxlint-disable-next-line no-new
      new (window as any).google.translate.TranslateElement({ pageLanguage: 'zh-HK' }, 'google_translate_element');
    };
    if (!document.getElementById('google-translate-script')) {
      const s = document.createElement('script');
      s.id = 'google-translate-script';
      s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(s);
    }
  }, []);

  return <div id="google_translate_element" suppressHydrationWarning />;
}
