import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center whitespace-nowrap",
    "font-bold tracking-[-0.01em] transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(43,92,230,0.18)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "rounded-[999px]", // pill shape always
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "border-0 text-white",
          "bg-[linear-gradient(135deg,#2B5CE6_0%,#4A78F5_100%)]",
          "shadow-[0_4px_16px_rgba(43,92,230,0.38),0_1px_4px_rgba(43,92,230,0.22)]",
          "hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(43,92,230,0.50)]",
          "active:translate-y-0 active:scale-[0.98]",
          // glow blob under
          "after:pointer-events-none after:absolute after:-bottom-2.5 after:left-[15%] after:right-[15%]",
          "after:h-5 after:rounded-full after:blur-[14px] after:opacity-50",
          "after:bg-[linear-gradient(135deg,#2B5CE6,#4A78F5)]",
          "after:transition-all after:duration-200",
          "hover:after:-bottom-3.5 hover:after:opacity-70",
          "active:after:opacity-25 active:after:-bottom-1",
        ].join(" "),
        orange: [
          "border-0 text-white",
          "bg-[linear-gradient(135deg,#F97316_0%,#FB923C_100%)]",
          "shadow-[0_4px_16px_rgba(249,115,22,0.38),0_1px_4px_rgba(249,115,22,0.22)]",
          "hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(249,115,22,0.50)]",
          "active:translate-y-0 active:scale-[0.98]",
          "after:pointer-events-none after:absolute after:-bottom-2.5 after:left-[15%] after:right-[15%]",
          "after:h-5 after:rounded-full after:blur-[14px] after:opacity-50",
          "after:bg-[linear-gradient(135deg,#F97316,#FB923C)]",
          "after:transition-all after:duration-200",
          "hover:after:-bottom-3.5 hover:after:opacity-70",
          "active:after:opacity-25",
        ].join(" "),
        secondary: [
          "bg-white text-[#0C1117]",
          "border-[1.5px] border-[#DDD9D2]",
          "shadow-[0_2px_8px_rgba(12,26,58,0.07)]",
          "hover:-translate-y-0.5 hover:border-[#2B5CE6] hover:text-[#2B5CE6]",
          "hover:shadow-[0_6px_20px_rgba(12,26,58,0.10)]",
          "active:translate-y-0",
        ].join(" "),
        outline: [
          "bg-[#EBF1FF] text-[#2B5CE6]",
          "border-[1.5px] border-[#D6E3FF]",
          "hover:-translate-y-0.5 hover:bg-[#DDE8FF] hover:border-[#2B5CE6]",
        ].join(" "),
        ghost: [
          "border-0 bg-transparent text-[#475569] shadow-none",
          "hover:bg-[#EAE6DF] hover:text-[#0C1117]",
          "active:bg-[#DDD9D2]",
        ].join(" "),
        destructive: [
          "border-0 text-white",
          "bg-[linear-gradient(135deg,#EF4444_0%,#DC2626_100%)]",
          "shadow-[0_4px_16px_rgba(239,68,68,0.35)]",
          "hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(239,68,68,0.48)]",
          "after:pointer-events-none after:absolute after:-bottom-2.5 after:left-[15%] after:right-[15%]",
          "after:h-5 after:rounded-full after:blur-[14px] after:opacity-50",
          "after:bg-[linear-gradient(135deg,#EF4444,#DC2626)]",
          "after:transition-all after:duration-200",
        ].join(" "),
        icon: [
          "rounded-[14px] bg-white border-[1.5px] border-[#DDD9D2] text-[#475569] p-0",
          "shadow-[0_2px_8px_rgba(12,26,58,0.07)]",
          "hover:-translate-y-0.5 hover:border-[#2B5CE6] hover:bg-[#EBF1FF] hover:text-[#2B5CE6]",
          "hover:shadow-[0_4px_14px_rgba(43,92,230,0.20)]",
        ].join(" "),
        fab: [
          "fixed bottom-6 right-5 z-40 rounded-[18px] border-0 text-white p-0",
          "bg-[linear-gradient(135deg,#2B5CE6_0%,#4A78F5_100%)]",
          "shadow-[0_8px_28px_rgba(43,92,230,0.45)]",
          "hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(43,92,230,0.55)]",
          "after:pointer-events-none after:absolute after:-bottom-2 after:left-2 after:right-2",
          "after:h-5 after:rounded-full after:blur-[14px] after:opacity-55",
          "after:bg-[linear-gradient(135deg,#2B5CE6,#4A78F5)]",
        ].join(" "),
      },
      size: {
        default: "h-11 px-7 py-2.5 text-[0.9375rem]",
        sm:      "h-9 px-5 py-2 text-sm",
        lg:      "h-13 px-9 py-3 text-base",
        icon:    "h-10 w-10",
        fab:     "h-14 w-14",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
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
