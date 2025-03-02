import { Card } from "frontend/components/ui/card";
import { Devtools } from "../_context/devtools";
import { ProjectSidebar } from "./sidebar/sidebar";

export const ProjectLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Devtools>
      <div className="h-full w-full p-3">
        <Card className="grid grid-cols-[200px_1fr] h-full w-full p-0 gap-0">
          <ProjectSidebar />
          <div className="border-l-2 p-4">{children}</div>
        </Card>
      </div>
    </Devtools>
  );
};
