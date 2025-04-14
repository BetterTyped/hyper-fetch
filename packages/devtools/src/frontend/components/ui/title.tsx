import { HTMLProps } from "react";

import { cn } from "frontend/lib/utils";

export const Title = ({ children, ...props }: HTMLProps<HTMLHeadingElement>) => {
  return (
    <h2
      {...props}
      className={cn(
        "text-xl md:text-3xl text-left animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text font-nacelle font-semibold text-transparent",
        props.className,
      )}
    >
      {children}
    </h2>
  );
};
