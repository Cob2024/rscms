import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F5B] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:opacity-75",
  {
    variants: {
      variant: {
        default: "bg-[#087F5B] text-white hover:bg-[#066849] shadow-xs active:bg-[#055038]",
        destructive: "bg-[#B42318] text-white hover:bg-[#991B1B] shadow-xs active:bg-[#7F1D1D]",
        outline: "border border-[#CBD5E1] bg-white text-[#102A43] hover:bg-slate-50 hover:text-[#102A43] shadow-xs",
        secondary: "border border-[#CBD5E1] bg-white text-[#102A43] hover:bg-slate-50 hover:text-[#102A43] shadow-xs",
        ghost: "text-[#102A43] hover:bg-slate-100/80 hover:text-[#102A43]",
        link: "text-[#087F5B] underline-offset-4 hover:underline font-semibold",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

