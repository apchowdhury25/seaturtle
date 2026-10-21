import { cn } from "@/lib/utils";

export function BrandMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  const ink = inverted ? "#f7f3ec" : "#0e2433";
  const paper = inverted ? "#0e2433" : "#f7f3ec";
  return (
    <svg viewBox="0 0 64 64" className={cn("h-9 w-9", className)} role="img" aria-label="Sea Turtle Apparel emblem">
      <rect width="64" height="64" fill={ink} />
      <path
        fill={paper}
        d="M32 12c7.2 0 14.2 4.4 16.6 11.6 2.2 6.6-.4 13.2-5.6 17.2-3.2 2.4-4.8 5.2-5.2 8.4h-11.6c-.4-3.2-2-6-5.2-8.4-5.2-4-7.8-10.6-5.6-17.2C17.8 16.4 24.8 12 32 12z"
      />
      <path fill="#1f6b4a" d="M32 22.5c5.2 1.2 8.5 5.4 8.5 9.8S37.2 41 32 42.4 23.5 38 23.5 32.3s3.3-8.6 8.5-9.8z" />
      <path fill={ink} d="M32 27.2 35.2 32 32 36.8 28.8 32z" />
    </svg>
  );
}
