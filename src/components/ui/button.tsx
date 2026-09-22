import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[.98]",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        pill: "rounded-full border border-border bg-card px-3 text-muted-foreground hover:text-foreground",
        pillActive: "rounded-full bg-foreground px-3 text-background",
        energy: "rounded-full bg-primary-soft text-primary",
        energyBand: "flex-col gap-1.5 rounded-none bg-transparent text-foreground",
        chip: "rounded-full border border-border bg-card text-muted-foreground",
        check: "shrink-0 rounded-full border border-border bg-background",
        checkActive: "shrink-0 rounded-full bg-success text-success-foreground",
        soft: "bg-primary-soft text-primary hover:bg-primary/15",
        tile: "h-12 whitespace-normal border border-border bg-card px-2 text-xs hover:border-primary",
        segment: "flex-1 bg-transparent text-muted-foreground",
        segmentActive: "flex-1 bg-card text-foreground",
        dock: "flex-col gap-1 rounded-xl bg-transparent text-[10px] text-muted-foreground",
        dockActive: "flex-col gap-1 rounded-xl bg-transparent text-[10px] text-primary",
        pencil: "flex-col gap-1 rounded-xl bg-transparent text-[10px] text-muted-foreground",
        mic: "rounded-full bg-primary text-primary-foreground ring-8 ring-primary-soft",
        choice: "h-14 whitespace-normal border border-border bg-card px-2 text-center",
        choiceActive: "h-14 whitespace-normal border border-primary bg-primary-soft px-2 text-center text-primary",
        emoji: "border border-border bg-card text-lg",
        emojiActive: "border border-primary bg-primary-soft text-lg",
        swatch: "rounded-full border-2 border-background",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        iconSm: "h-8 min-w-8 px-2",
        dock: "h-14 w-14 px-1",
        mic: "h-14 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
