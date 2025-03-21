import { Card } from "frontend/components/ui/card";
// import { Devtools } from "../_context/devtools";
import { ProjectSidebar } from "./sidebar/sidebar";

export const ProjectLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid grid-cols-[70px_1fr] h-full w-full py-2 px-1">
      <ProjectSidebar />
      <Card className="h-full w-full p-0 gap-0 bg-sidebar">{children}</Card>
    </div>
  );
};
