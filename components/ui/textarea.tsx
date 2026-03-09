import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-xl border-[1.5px] border-[#E8EAF0] bg-[#F8F9FC] px-4 py-3 text-[0.9375rem] text-[#0A0C14] placeholder:text-[#9199B1] transition-all duration-150 focus-visible:border-[#3B6FE8] focus-visible:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(59,111,232,0.1)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
