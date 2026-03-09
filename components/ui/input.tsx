import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border-[1.5px] border-[#E8EAF0] bg-[#F8F9FC] px-4 py-2 text-[0.9375rem] text-[#0A0C14] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition-all duration-150 placeholder:text-[#9199B1] focus-visible:border-[#3B6FE8] focus-visible:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(59,111,232,0.1)] disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
