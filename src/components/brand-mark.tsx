import Image from "next/image";
import { cn } from "@/lib/utils";

const WIDTH = 600;
const HEIGHT = 468;

export function BrandMark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Image
      src={inverted ? "/images/brand/mark-ivory.png" : "/images/brand/mark.png"}
      alt=""
      width={WIDTH}
      height={HEIGHT}
      preload={!inverted}
      className={cn("h-11 w-auto lg:h-12", className)}
    />
  );
}
