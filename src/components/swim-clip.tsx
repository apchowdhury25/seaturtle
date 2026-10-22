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
    <div className="relative aspect-[960/944] w-full overflow-hidden bg-navy">
      <video
        ref={ref}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent), linear-gradient(to bottom, transparent, #000 12%, #000 88%, transparent)",
          maskImage:
            "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent), linear-gradient(to bottom, transparent, #000 12%, #000 88%, transparent)",
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
        }}
        width={960}
        height={944}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Sea turtles swimming among fish"
      >
        <source src="/videos/swimming.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
