import { AppWindowMac } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Title } from "../ui/title";

export const EmptyState = ({
  title,
  description,
  icon: Icon = AppWindowMac,
  children,
  size = "md",
  className = "",
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  // Size variant classes
  const sizeClasses = {
    sm: {
      container: "w-12 h-12",
      icon: "w-6 h-6",
      title: "!text-xl",
      description: "!text-base",
    },
    md: {
      container: "w-16 h-16",
      icon: "w-8 h-8",
      title: "!text-2xl",
      description: "!text-lg",
    },
    lg: {
      container: "w-20 h-20",
      icon: "w-10 h-10",
      title: "!text-3xl",
      description: "!text-xl",
    },
  };

  return (
    <div className={cn(`flex flex-col items-center justify-center h-full px-8 py-10 text-center mx-auto`, className)}>
      <Avatar className={cn(sizeClasses[size].container)}>
        <AvatarFallback className="bg-gradient-to-br from-zinc-600/90 to-zinc-800/90">
          <Icon className={`text-zinc-500 dark:text-zinc-400 ${sizeClasses[size].icon}`} />
        </AvatarFallback>
      </Avatar>

      <Title className={cn(`font-bold text-zinc-900 dark:text-zinc-100/70 mt-3 mb-1`, sizeClasses[size].title)}>
        {title}
      </Title>
      {description && <p className={cn("text-zinc-300/90 max-w-md", sizeClasses[size].description)}>{description}</p>}
      {children}
    </div>
  );
};
