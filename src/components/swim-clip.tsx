"use client";

import { useEffect, useRef } from "react";

export function SwimClip() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.4 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-navy">
      <video
        ref={ref}
        className="absolute inset-0 h-full w-full object-cover"
        width={1920}
        height={1080}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Fish swimming"
      >
        <source src="/videos/swimming.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
