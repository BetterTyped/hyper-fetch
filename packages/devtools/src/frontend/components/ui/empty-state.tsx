import { AppWindowMac } from "lucide-react";

export const EmptyState = ({
  title,
  description,
  icon: Icon = AppWindowMac,
  children,
}: {
  title: string;
  description: string;
  icon?: React.ElementType;
  children?: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800">
        <Icon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100/70 mb-2">{title}</h2>
      <p className="text-gray-500 dark:text-gray-400/80 max-w-md">{description}</p>
      {children}
    </div>
  );
};
