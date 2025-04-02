import { AppWindowMac } from "lucide-react";

import { cn } from "frontend/lib/utils";

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
      title: "text-xl",
    },
    md: {
      container: "w-16 h-16",
      icon: "w-8 h-8",
      title: "text-2xl",
    },
    lg: {
      container: "w-20 h-20",
      icon: "w-10 h-10",
      title: "text-3xl",
    },
  };

  return (
    <div className={cn(`flex flex-col items-center justify-center h-full p-8 text-center`, className)}>
      <div
        className={`flex items-center justify-center mb-4 rounded-full bg-gray-100 dark:bg-gray-800 ${sizeClasses[size].container}`}
      >
        <Icon className={`text-gray-500 dark:text-gray-400 ${sizeClasses[size].icon}`} />
      </div>

      <h2 className={`font-bold text-gray-900 dark:text-gray-100/70 mb-2 ${sizeClasses[size].title}`}>{title}</h2>
      {description && <p className="text-gray-500 dark:text-gray-400/80 max-w-md">{description}</p>}
      {children}
    </div>
  );
};
