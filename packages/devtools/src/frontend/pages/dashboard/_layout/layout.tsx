import { Card } from "frontend/components/ui/card";
import { DashboardSidebar } from "./sidebar/sidebar";

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full w-full p-3">
      <Card className="grid grid-cols-[250px_1fr] h-full w-full p-0 gap-0">
        <DashboardSidebar />
        <div className="border-l-2 p-4">{children}</div>
      </Card>
    </div>
  );
};
