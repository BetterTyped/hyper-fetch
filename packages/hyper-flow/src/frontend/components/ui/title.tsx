import { HTMLProps } from "react";

import { cn } from "@/lib/utils";

export const Title = ({ children, ...props }: HTMLProps<HTMLHeadingElement>) => {
  return (
    <h2
      {...props}
      className={cn(
        "text-xl md:text-3xl text-left animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-zinc-200),var(--color-zinc-300),var(--color-zinc-50),var(--color-zinc-400),var(--color-zinc-200))] bg-[length:200%_auto] bg-clip-text font-semibold text-transparent",
        props.className,
      )}
    >
      {children}
    </h2>
  );
};
