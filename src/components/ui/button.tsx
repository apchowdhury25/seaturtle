import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm tracking-wide transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-navy text-ivory hover:bg-ink",
        secondary: "border border-navy bg-transparent text-navy hover:bg-navy hover:text-ivory",
        quiet: "text-navy underline-offset-4 hover:underline",
        danger: "bg-charcoal text-ivory hover:bg-ink",
      },
      size: {
        md: "h-11 px-5",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-7",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
