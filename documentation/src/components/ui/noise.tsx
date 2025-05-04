import { cn } from "@site/src/lib/utils";
import noise from "@site/static/img/noise.webp";
import { ComponentProps } from "react";

const visibilityMap = {
  low: "dark:opacity-[0.02] opacity-[0.1] brightness-[0.4] dark:brightness-[1]",
  medium: "dark:opacity-[0.05] opacity-[0.15] brightness-[0.4] dark:brightness-[1]",
  high: "dark:opacity-[0.1] opacity-[0.2] brightness-[0.4] dark:brightness-[1]",
};

export const Noise = (props: ComponentProps<"div"> & { visibility?: keyof typeof visibilityMap }) => {
  const { visibility = "low" } = props;

  return (
    <div
      {...props}
      className={cn(
        "absolute inset-0 w-full h-full scale-[1.2] transform",
        visibilityMap[visibility],
        "[mask-image:radial-gradient(#fff,transparent,75%)]",
        "pointer-events-none",
        // eslint-disable-next-line react/destructuring-assignment
        props.className || "",
      )}
      style={{
        backgroundImage: `url(${noise})`,
        backgroundSize: "30%",
      }}
    />
  );
};
