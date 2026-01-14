import { Toaster } from 'sonner';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-950 text-black dark:text-white antialiased">
       <Toaster 
          theme="system"
          className="toaster group"
          position="top-right"
          richColors
        />
      {children}
    </div>
  )
}