import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center whitespace-nowrap rounded-[14px] border text-[0.9375rem] font-semibold tracking-[-0.01em] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(59,111,232,0.16)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[linear-gradient(135deg,#3B6FE8_0%,#6B4FE8_100%)] text-white shadow-[0_12px_28px_rgba(59,111,232,0.26)] hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(59,111,232,0.4)] active:translate-y-0 after:pointer-events-none after:absolute after:-bottom-2 after:left-[10%] after:right-[10%] after:h-5 after:rounded-full after:bg-[linear-gradient(135deg,#3B6FE8_0%,#6B4FE8_100%)] after:opacity-50 after:blur-[12px] after:transition-all after:duration-200 hover:after:-bottom-3 hover:after:opacity-70 active:after:-bottom-1 active:after:opacity-40",
        secondary:
          "border-[1.5px] border-[#E8EAF0] bg-white text-[#0A0C14] shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:border-[#3B6FE8] hover:text-[#3B6FE8] hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)]",
        outline:
          "border-[1.5px] border-[#DCE8FF] bg-[#EEF3FF] text-[#2D5ED4] hover:-translate-y-0.5 hover:border-[#3B6FE8] hover:bg-[#E7EEFF]",
        ghost:
          "border-transparent bg-transparent text-[#4A5068] shadow-none hover:bg-[#F2F4F8] hover:text-[#0A0C14]",
        destructive:
          "border-transparent bg-[linear-gradient(135deg,#EF4444_0%,#DC2626_100%)] text-white shadow-[0_12px_28px_rgba(239,68,68,0.25)] hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(239,68,68,0.36)] after:pointer-events-none after:absolute after:-bottom-2 after:left-[10%] after:right-[10%] after:h-5 after:rounded-full after:bg-[linear-gradient(135deg,#EF4444_0%,#DC2626_100%)] after:opacity-50 after:blur-[12px] after:transition-all after:duration-200 hover:after:-bottom-3 hover:after:opacity-70",
        icon: "h-10 w-10 rounded-xl border-[1.5px] border-[#E8EAF0] bg-white p-0 text-[#4A5068] shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:border-[#3B6FE8] hover:bg-[#EEF3FF] hover:text-[#3B6FE8] hover:shadow-[0_4px_12px_rgba(59,111,232,0.2)]",
        fab: "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-[18px] border-transparent bg-[linear-gradient(135deg,#3B6FE8_0%,#6B4FE8_100%)] p-0 text-white shadow-[0_8px_24px_rgba(59,111,232,0.4)] after:pointer-events-none after:absolute after:-bottom-2 after:left-2 after:right-2 after:h-5 after:rounded-full after:bg-[linear-gradient(135deg,#3B6FE8_0%,#6B4FE8_100%)] after:opacity-60 after:blur-[14px]",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-4 py-2 text-sm",
        lg: "h-12 px-8 py-3",
        icon: "h-10 w-10 p-0",
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
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
