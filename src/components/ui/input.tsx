import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
