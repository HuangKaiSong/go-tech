import { type ReactNode } from "react";
import BottomNav from "./BottomNav";

const MobileLayout = ({ children, title }: { children: ReactNode; title?: string }) => {
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      {title && (
        <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-center h-14 px-4">
            <h1 className="text-base font-semibold text-foreground">{title}</h1>
          </div>
        </header>
      )}
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  );
};

export default MobileLayout;
