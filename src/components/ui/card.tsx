import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * El patrón real de "card" en SarSan (ver docs/design-system.md) es
 * `rounded-2xl border border-border bg-card p-4` directo en un <section>,
 * no la card de shadcn por defecto. Este componente encapsula ese patrón.
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-2xl border border-border bg-card p-4", className)} {...props} />
  ),
);
Card.displayName = "Card";

export { Card };
