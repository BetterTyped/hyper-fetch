import { useDidMount } from "@better-hooks/lifecycle";
import { createContext, memo, useContext, useMemo, useState } from "react";

import { Avatar } from "./avatar";

import { cn } from "@/lib/utils";

export const SectionContext = createContext<{
  id: string;
  icon: null | React.ReactNode;
  setIcon: (icon: React.ReactNode) => void;
  actions: null | React.ReactNode;
  setActions: (actions: React.ReactNode) => void;
} | null>(null);

export const Section = ({ children, className, ...props }: React.ComponentProps<"section"> & { id: string }) => {
  const [icon, setIcon] = useState<React.ReactNode>(null);
  const [actions, setActions] = useState<React.ReactNode>(null);
  const value = useMemo(() => {
    return { id: props.id, icon, setIcon, actions, setActions };
  }, [props.id, icon, actions]);

  return (
    <SectionContext.Provider value={value}>
      <section className={cn("", className)} {...props}>
        {children}
      </section>
    </SectionContext.Provider>
  );
};

export const SectionHeader = ({
  children,
  className,
  sticky = false,
  ...props
}: React.ComponentProps<"div"> & { sticky?: boolean }) => {
  const context = useContext(SectionContext);
  return (
    <div
      className={cn("relative flex flex-row items-center gap-4 py-4", sticky && "sticky top-0 z-10", className)}
      {...props}
    >
      {sticky && (
        <div className="-z-10 absolute -bottom-[6px] -left-4 -right-4 h-[14px] bg-gradient-to-b from-sidebar to-transparent pointer-events-none" />
      )}
      {sticky && <div className="-z-10 absolute top-0 -left-4 -right-4 bottom-[4px] bg-sidebar pointer-events-none" />}
      {context?.icon}
      <div className={cn("flex flex-col flex-1")}>{children}</div>
      {context?.actions}
    </div>
  );
};

export const SectionGroup = ({ children, className, ...props }: React.ComponentProps<"div">) => {
  return (
    <div className={cn("flex flex-col py-4", className)} {...props}>
      {children}
    </div>
  );
};

export const SectionTitle = ({ children, className, ...props }: React.ComponentProps<"h3">) => {
  return (
    <h3
      className={cn(
        "text-lg font-medium mb-1 leading-none break-words bg-clip-text text-transparent bg-gradient-to-tr from-zinc-300 via-zinc-100 to-zinc-500",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
};

export const SectionDescription = ({ children, className, ...props }: React.ComponentProps<"p">) => {
  return (
    <p className={cn("text-sm text-zinc-500", className)} {...props}>
      {children}
    </p>
  );
};

export const SectionSubtitle = ({ children, className, ...props }: React.ComponentProps<"h4">) => {
  return (
    <h4 className={cn("text-lg font-medium", className)} {...props}>
      {children}
    </h4>
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
            "flex items-center justify-center bg-zinc-700",
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

export const SectionActions = memo(({ children, className, ...props }: React.ComponentProps<"div">) => {
  const context = useContext(SectionContext);

  useDidMount(() => {
    if (children) {
      context?.setActions(
        <div className={cn("flex flex-row gap-2", className)} {...props}>
          {children}
        </div>,
      );
    }
  });

  return null;
});
