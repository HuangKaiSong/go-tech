// oxlint-disable-next-line import/no-unassigned-import
import 'client-only';
import Link from 'next/link';

const serviceUri = 'https://wa.me/message/MQAWLPIG4YKOL1';

export const WhatsappService = () => {
  return (
    <Link
      href={serviceUri}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 z-50 group md:bottom-6 md:right-6 flex items-center gap-2 rounded-full bg-[hsl(var(--whatsapp))] text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all p-3.5"
      aria-label="WhatsApp 聯絡我們"
    >
      <span className="absolute inset-0 rounded-full bg-[hsl(var(--whatsapp))] opacity-40 animate-ping group-hover:animate-none -z-10" />
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43a9.37 9.37 0 0 1 9.43 9.44c0 5.2-4.24 9.43-9.44 9.43zm8.03-17.46A11.3 11.3 0 0 0 12.05.7C5.79.7.69 5.8.69 12.06c0 2 .52 3.95 1.52 5.67L.6 23.6l6.03-1.58a11.3 11.3 0 0 0 5.42 1.38h.01c6.26 0 11.36-5.1 11.36-11.36 0-3.04-1.18-5.89-3.33-8.03z" />
      </svg>
      <span className="hidden md:inline max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium group-hover:max-w-[8rem] transition-all duration-300">
        WhatsApp
      </span>
    </Link>
  );
};
