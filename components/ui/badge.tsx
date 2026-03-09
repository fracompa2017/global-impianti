import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-[0.01em] transition-colors before:block before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:animate-[pulse-dot_2s_infinite]",
  {
    variants: {
      variant: {
        default: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
        secondary: "border-[#E5E7EB] bg-[#F3F4F6] text-[#4A5068]",
        outline: "border-[#E8EAF0] bg-white text-[#4A5068]",
        success: "border-[#A7F3D0] bg-[#ECFDF5] text-[#059669]",
        warning: "border-[#FDE68A] bg-[#FFFBEB] text-[#D97706]",
        danger: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
        critical: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] shadow-[0_0_0_1px_rgba(220,38,38,0.05)]",
        high: "border-[#FED7AA] bg-[#FFF7ED] text-[#EA580C]",
        medium: "border-[#FDE68A] bg-[#FFFBEB] text-[#D97706]",
        low: "border-[#A7F3D0] bg-[#ECFDF5] text-[#059669]",
        open: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
        assigned: "border-[#C7D2FE] bg-[#EEF2FF] text-[#4338CA]",
        working: "border-[#FDE68A] bg-[#FFFBEB] text-[#D97706]",
        resolved: "border-[#A7F3D0] bg-[#ECFDF5] text-[#059669]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
