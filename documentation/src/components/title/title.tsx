import { Children, forwardRef } from "react";

export const Title = forwardRef(
  (
    props: Omit<React.HTMLProps<HTMLHeadingElement>, "size"> & {
      as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span";
      size?: "lg" | "md" | "sm" | "none";
      wrapperClass?: string;
    },
    ref,
  ) => {
    const { as = "h2", className = "", wrapperClass = "", size = "md", ...rest } = props;

    const colorClass =
      "from-zinc-800/60 via-zinc-800 to-zinc-800/60 dark:from-zinc-200/60 dark:via-zinc-200 dark:to-zinc-200/60";

    const sizeClass = {
      lg: "text-4xl sm:text-5xl md:text-5xl lg:text-6xl",
      md: "text-4xl sm:text-4xl md:text-5xl lg:text-5xl",
      sm: "text-3xl sm:text-3xl md:text-4xl lg:text-4xl",
      xs: "text-xl",
      none: "",
    }[size];

    const Component = as;
    const newChildren = Children.map(props.children, (child) => {
      if (typeof child === "string") {
        return child
          .split(" ")
          .map((part) => (
            <span
              className={`!text-transparent font-extrabold bg-clip-text bg-gradient-to-b ${colorClass} ${sizeClass} ${className} `}
            >
              {part}{" "}
            </span>
          ));
      }
      return child;
    });

    return (
      <Component
        {...rest}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ref={ref}
        className={`title ${colorClass} ${sizeClass} leading-tight !text-transparent font-bold gap-1 ${wrapperClass}`}
      >
        {newChildren}
      </Component>
    );
  },
);
