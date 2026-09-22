import type { ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Sheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 mx-auto flex w-full max-w-[390px] items-end bg-overlay">
      <section className="sheet-enter relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[24px] bg-background px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <Button variant="ghost" size="iconSm" className="absolute right-4 top-4" onClick={onClose} aria-label="Cerrar">
          <X />
        </Button>
        {children}
      </section>
    </div>
  );
}
