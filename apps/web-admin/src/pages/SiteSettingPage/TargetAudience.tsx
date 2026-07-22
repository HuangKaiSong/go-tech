import { useRef } from 'react';
import PanlEditor from './PanlEditor';

const TargetAudience = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null!);

  return (
    <div className="h-[calc(100vh-64px-48px-56px-56px)] grid grid-cols-[minmax(0,1fr)_420px] gap-4">
      <div className="h-full rounded-2xl border border-border overflow-hidden bg-background shadow-sm">
        <iframe
          ref={iframeRef}
          src={`${import.meta.env.VITE_H5_SITE_URL}/target-audience`}
          width="100%"
          height="100%"
          frameBorder="0"
          sandbox="allow-scripts allow-top-navigation allow-top-navigation-by-user-activation"
        />
      </div>
      <PanlEditor iframeRef={iframeRef} />
    </div>
  );
};

export default TargetAudience;
