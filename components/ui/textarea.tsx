import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[100px] w-full rounded-[14px] px-4 py-3 text-[0.9375rem] font-medium",
        "bg-[#EAE6DF] border-0 outline-none resize-none",
        "text-[#0C1117] placeholder:text-[#94A3B8] placeholder:font-normal",
        "transition-all duration-150",
        "focus:bg-white focus:ring-[3px] focus:ring-[rgba(43,92,230,0.18)]",
        "focus:shadow-[0_4px_16px_rgba(12,26,58,0.09)]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
