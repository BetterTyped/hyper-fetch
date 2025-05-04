import { ComponentProps } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@site/src/lib/utils";

const linkCardVariants = cva(
  [
    "relative flex flex-col gap-2 rounded-xl transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2",
    "!no-underline [&:*]:no-underline overflow-hidden border",
    "hover:from-zinc-200 hover:via-zinc-100 hover:to-zinc-50 hover:border-zinc-40 hover:ring-2 hover:ring-zinc-300",
    "dark:hover:from-zinc-700 dark:hover:via-zinc-800 dark:hover:to-zinc-900 dark:hover:border-zinc-500 dark:hover:ring-2 dark:hover:ring-zinc-700",
    "focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-0",
  ],
  {
    variants: {
      variant: {
        default: cn(
          "bg-gradient-to-br from-zinc-50 to-zinc-100 border-zinc-200 text-zinc-900",
          "dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-800 dark:border-zinc-700 dark:text-zinc-100",
        ),
      },
    },
  },
);

/**
 * Used for the docs to be able to manage all of the future and past styles
 * When we will pack something in the versioned docs it will not cause some issues
 */
export const DocsCard = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      // eslint-disable-next-line react/destructuring-assignment
      className={linkCardVariants({ variant: "default", className: props.className })}
    />
  );
};
