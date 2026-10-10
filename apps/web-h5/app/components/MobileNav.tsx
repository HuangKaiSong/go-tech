import { Briefcase, Home, MessageCircle, Sparkles } from 'lucide-react';
import Link from '@/app/components/Link';
import { usePathname } from '@/i18n/navigation';

const quickNav = [
  ['/', Home, '首頁'],
  ['/core-advantages', Sparkles, '核心優勢'],
  ['/service-plan', Briefcase, '服務計劃'],
  ['/contact', MessageCircle, '聯絡我們']
] as const;

const MobileNav = () => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="手機導航"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur border-t shadow-[0_-2px_10px_hsl(var(--foreground)/0.08)] grid grid-cols-4 pb-[env(safe-area-inset-bottom)]"
    >
      {quickNav.map(([href, Icon, label]) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileNav;
