import { cn } from "@/lib/utils";

export function Progress({ value = 0, className }: { value?: number; className?: string }) {
  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-[#EEF3FF] shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]",
        className
      )}
    >
      <div
        className="h-full bg-[linear-gradient(135deg,#3B6FE8_0%,#6B4FE8_100%)] transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
