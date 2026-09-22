import type { ReactNode } from "react";

export function SectionHeading({ icon, title, meta }: { icon: ReactNode; title: string; meta?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-primary [&_svg]:size-4">{icon}</span>
      <h2 className="font-display font-semibold">{title}</h2>
      {meta && <span className="ml-auto text-xs text-muted-foreground">{meta}</span>}
    </div>
  );
}
