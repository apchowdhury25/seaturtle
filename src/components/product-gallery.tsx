"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type GalleryImage = { src: string | null; alt: string };

export function ProductGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const list = images.length ? images : [{ src: null, alt: name }];
  const [open, setOpen] = useState<number | null>(null);
  const current = open === null ? null : list[open];

  useEffect(() => {
    if (open === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="grid gap-3">
      {list.map((image, index) => (
        <button
          key={`${image.src ?? "empty"}-${index}`}
          type="button"
          className="relative aspect-[3/4] bg-sand text-left"
          onClick={() => image.src && setOpen(index)}
          disabled={!image.src}
          aria-label={image.src ? `Enlarge image of ${image.alt || name}` : undefined}
        >
          {image.src ? <Image src={image.src} alt={image.alt || name} fill className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" /> : null}
        </button>
      ))}
      {current?.src ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy/85 p-4" role="dialog" aria-modal="true" aria-label="Enlarged product image">
          <button type="button" className="absolute top-4 right-4 h-11 border border-ivory px-4 text-sm text-ivory" onClick={() => setOpen(null)}>Close</button>
          <div className="relative h-[80vh] w-full max-w-3xl">
            <Image src={current.src} alt={current.alt || name} fill className="object-contain" sizes="100vw" priority />
          </div>
        </div>
      ) : null}
    </div>
  );
}
