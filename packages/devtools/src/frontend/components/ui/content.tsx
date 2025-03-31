import { Card } from "frontend/components/ui/card";
import { cn } from "frontend/lib/utils";

export const Content = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <Card className={cn("h-full max-h-[calc(100vh-60px)] w-full p-0 gap-0 bg-sidebar overflow-auto", className)}>
      {children}
    </Card>
  );
};
