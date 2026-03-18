import { useEffect, useRef, useState } from "react";
import PanlEditor from "./PanlEditor";

const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 1080;
const IFRAME_WIDTH = 1920;
const IFRAME_HEIGHT = 1080;
const BASE_SCALE = VIEWPORT_WIDTH / IFRAME_WIDTH;

const HomeContent = () => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const screenRef = useRef<HTMLDivElement | null>(null);
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;

    const updateScale = () => {
      const { width, height } = el.getBoundingClientRect();
      const nextFitScale = Math.min(
        width / VIEWPORT_WIDTH,
        height / VIEWPORT_HEIGHT,
      );
      setFitScale(Number.isFinite(nextFitScale) ? nextFitScale : 1);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="h-[calc(100vh-64px-48px-56px-56px)] grid grid-cols-[minmax(0,1fr)_420px] gap-4">
      <div
        ref={screenRef}
        className="h-full rounded-2xl border border-border overflow-hidden bg-background shadow-sm flex items-center justify-center"
      >
        <div
          style={{
            width: `${IFRAME_WIDTH}px`,
            height: `${IFRAME_HEIGHT}px`,
            transform: `scale(${fitScale})`,
          }}
        >
          <iframe
            ref={iframeRef}
            src={import.meta.env.VITE_H5_SITE_URL}
            width={IFRAME_WIDTH}
            height={IFRAME_HEIGHT}
            frameBorder="0"
          ></iframe>
        </div>
      </div>
      <PanlEditor iframeRef={iframeRef} />
    </div>
  );
};

export default HomeContent;
