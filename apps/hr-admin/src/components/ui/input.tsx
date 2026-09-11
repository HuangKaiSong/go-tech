import * as React from "react";

import { cn } from "@/lib/utils";

/** 原生日期/时间类输入：点击框内任意处即弹出选择器（默认仅点右侧图标才弹） */
const PICKER_TYPES = ["date", "month", "week", "time", "datetime-local"];

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onClick, ...props }, ref) => {
    const isPicker = typeof type === "string" && PICKER_TYPES.includes(type);
    const handleClick: React.MouseEventHandler<HTMLInputElement> = (e) => {
      onClick?.(e);
      if (isPicker && !props.disabled && !props.readOnly) {
        // showPicker 需用户手势；重复调用/不支持时忽略
        try { (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.(); } catch { /* noop */ }
      }
    };
    return (
      <input
        type={type}
        onClick={handleClick}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          isPicker && "cursor-pointer",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
