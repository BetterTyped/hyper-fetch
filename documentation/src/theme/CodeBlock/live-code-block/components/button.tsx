import { ButtonHTMLAttributes } from "react";
import { cn } from "@site/src/lib/utils";
import { Loader2 } from "lucide-react";

export const Button = ({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "bg-blue-500 text-white text-sm p-2 rounded-md flex justify-center items-center gap-2",
        props.loading && "cursor-not-allowed opacity-70",
        props.className,
      )}
      disabled={props.disabled || props.loading}
    >
      {props.loading ? <Loader2 className="animate-spin" /> : null}
      {children}
    </button>
  );
};
