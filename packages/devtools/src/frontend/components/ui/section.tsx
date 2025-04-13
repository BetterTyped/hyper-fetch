import { useDidMount } from "@reins/hooks";
import { createContext, memo, useContext, useMemo, useState } from "react";

import { cn } from "frontend/lib/utils";
import { Avatar } from "./avatar";

export const SectionContext = createContext<{
  id: string;
  icon: null | React.ReactNode;
  setIcon: (icon: React.ReactNode) => void;
} | null>(null);

export const Section = ({ children, className, ...props }: React.ComponentProps<"section"> & { id: string }) => {
  const [icon, setIcon] = useState<React.ReactNode>(null);

  const value = useMemo(() => ({ id: props.id, icon, setIcon }), [props.id, icon]);

  return (
    <SectionContext.Provider value={value}>
      <section className={cn("", className)} {...props}>
        {children}
      </section>
    </SectionContext.Provider>
  );
};

export const SectionHeader = ({ children, className, ...props }: React.ComponentProps<"div">) => {
  const context = useContext(SectionContext);
  return (
    <div className="relative flex flex-row items-center gap-4 py-4">
      {context?.icon}
      <div className={cn("flex flex-col", className)} {...props}>
        {children}
      </div>
    </div>
  );
};

export const SectionTitle = ({ children, className, ...props }: React.ComponentProps<"h3">) => {
  return (
    <h3 className={cn("text-lg font-medium mb-0", className)} {...props}>
      {children}
    </h3>
  );
};

export const SectionDescription = ({ children, className, ...props }: React.ComponentProps<"p">) => {
  return (
    <p className={cn("text-sm text-gray-500", className)} {...props}>
      {children}
    </p>
  );
};

export const SectionIcon = memo(({ children, className, ...props }: React.ComponentProps<"div">) => {
  const context = useContext(SectionContext);

  useDidMount(() => {
    if (children) {
      context?.setIcon(
        <Avatar
          className={cn(
            "h-12 w-12 rounded-lg overflow-hidden",
            "flex items-center justify-center bg-gray-700",
            className,
          )}
          {...props}
        >
          {children}
        </Avatar>,
      );
    }
  });

  return null;
});
