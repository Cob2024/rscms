import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#087F5B] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#087F5B] text-white hover:bg-[#066849]",
        secondary:
          "border-[#CBD5E1] bg-white text-[#102A43] hover:bg-slate-50",
        destructive:
          "border-[#FECACA] bg-[#FEECEB] text-[#991B1B]",
        outline: "border-[#CBD5E1] bg-white text-[#102A43]",
        success: "border-[#A3E0CE] bg-[#E6F4EF] text-[#066849]",
        warning: "border-[#FDE68A] bg-[#FFF4E5] text-[#92400E]",
        danger: "border-[#FECACA] bg-[#FEECEB] text-[#991B1B]",
        info: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

