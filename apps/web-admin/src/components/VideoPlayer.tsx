import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  url: string;
}

export default function VideoPlayer({ url }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const play = () => {
      if (document.visibilityState !== "visible") return;
      void video.play().catch(() => {
        // Browser autoplay policy can reject play(); muted video normally passes.
      });
    };

    const handleEnded = () => {
      video.currentTime = 0;
      play();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        video.pause();
        return;
      }

      play();
    };

    video.addEventListener("ended", handleEnded);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    play();

    return () => {
      video.removeEventListener("ended", handleEnded);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [url]);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full object-cover"
      src={url}
      autoPlay
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
    />
  );
}
