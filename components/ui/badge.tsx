import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-[0.01em] transition-all",
  {
    variants: {
      variant: {
        default:     "bg-[#EBF1FF] text-[#2B5CE6] border border-[#D6E3FF]",
        secondary:   "bg-[#EAE6DF] text-[#475569] border border-[#DDD9D2]",
        destructive: "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]",
        outline:     "bg-transparent text-[#475569] border border-[#DDD9D2]",
        success:     "bg-[#F0FDF4] text-[#15803D] border border-[#A7F3D0]",
        warning:     "bg-[#FEFCE8] text-[#CA8A04] border border-[#FDE68A]",
        orange:      "bg-[#FFF3E8] text-[#EA580C] border border-[#FED7AA]",
        // Cantiere states
        in_corso:    "bg-[#EBF1FF] text-[#2B5CE6] border border-[#BFDBFE]",
        completato:  "bg-[#F0FDF4] text-[#15803D] border border-[#A7F3D0]",
        sospeso:     "bg-[#FEFCE8] text-[#CA8A04] border border-[#FDE68A]",
        pianificato: "bg-[#F4F1EC] text-[#94A3B8] border border-[#DDD9D2]",
        // Priority
        critica:     "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]",
        alta:        "bg-[#FFF3E8] text-[#EA580C] border border-[#FED7AA]",
        media:       "bg-[#FEFCE8] text-[#CA8A04] border border-[#FDE68A]",
        bassa:       "bg-[#F0FDF4] text-[#15803D] border border-[#A7F3D0]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  pulse?: boolean;
}

function Badge({ className, variant, pulse, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {pulse && (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80 animate-pulse" />
      )}
      {props.children}
    </div>
  );
}

export { Badge, badgeVariants };
