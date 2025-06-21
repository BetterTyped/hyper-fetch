import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Content = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <Card
      className={cn(
        "h-[calc(100vh-60px)] max-h-[calc(100vh-50px)] w-full p-0 gap-0 bg-sidebar overflow-hidden rounded-md",
        className,
      )}
    >
      {children}
    </Card>
  );
};
