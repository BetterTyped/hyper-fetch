import React from "react";
import { cn } from "@site/src/lib/utils";
import Link from "@docusaurus/Link";
import HyperFlowIcon from "@site/static/img/hyper-flow.svg";

interface RainbowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  navbarIcon?: boolean;
}

const style = {
  color: "white",
};

export const RainbowButton = React.forwardRef<HTMLButtonElement, RainbowButtonProps>(
  ({ children, className, navbarIcon, ...props }, ref) => {
    const Component = navbarIcon ? Link : "button";

    return (
      <Component
        ref={ref as any}
        type="button"
        style={style}
        className={cn(
          "text-sm px-5 py-2 !text-primary-foreground !no-underline",
          "group relative inline-flex h-9 animate-rainbow cursor-pointer items-center justify-center rounded-md border-0 bg-[length:200%] font-medium transition-colors [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.08*1rem)_solid_transparent] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          // before styles
          "before:absolute before:bottom-[-20%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))] before:[filter:blur(calc(0.8*1rem))]",
          // light mode colors
          "bg-[linear-gradient(#141415,#141415),linear-gradient(#141415_50%,rgba(32,32,34,0.6)_80%,rgba(32,32,34,0)),linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))]",
          "hover:brightness-150",
          // dark mode colors
          // "dark:bg-[linear-gradient(#fff,#fff),linear-gradient(#fff_50%,rgba(255,255,255,0.6)_80%,rgba(0,0,0,0)),linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))]",
          className,
        )}
        href={navbarIcon ? "/docs/hyper-flow" : undefined}
        {...(props as any)}
      >
        {children}
        {navbarIcon && <HyperFlowIcon className="size-5 ml-2 -mr-2" />}
      </Component>
    );
  },
);

RainbowButton.displayName = "RainbowButton";
