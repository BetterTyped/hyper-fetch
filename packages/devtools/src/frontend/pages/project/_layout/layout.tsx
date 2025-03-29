import { Outlet } from "@reins/router";
import { Cloud, Users } from "lucide-react";

import { Button } from "frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "frontend/components/ui/dialog";
import { Card } from "frontend/components/ui/card";
// import { useRoute } from "frontend/routing/router";
import { Input } from "frontend/components/ui/input";
import { Label } from "frontend/components/ui/label";
import { ProjectSidebar } from "./sidebar/sidebar";

export const ProjectLayout = () => {
  // const {
  //   params: { projectName },
  // } = useRoute("project");
  // const { workspaces } = useWorkspaces();

  // const workspace = workspaces.find((w) => w.id === projectName);
  // const isConnected = true;

  return (
    <div className="grid grid-cols-[70px_1fr] h-full w-full py-2 px-1">
      <ProjectSidebar />
      <Card className="h-full w-full p-0 gap-0 bg-sidebar">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b px-6">
          <div className="flex items-center gap-2">
            {/* <h1 className="text-xl font-semibold">{workspace?.name} </h1> */}
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-1" size="sm">
                  <Users className="h-4 w-4" />
                  Invite Members
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite team members</DialogTitle>
                  <DialogDescription>Invite team members to collaborate on this project.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input id="email" placeholder="example@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <select className="w-full rounded-md border p-2">
                      <option>Viewer</option>
                      <option>Developer</option>
                      <option>Admin</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Send Invite</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="secondary"
              className="gap-1"
              size="sm"
              // onClick={() => setIsConnected(!isConnected)}
            >
              <Cloud className="h-4 w-4" />
              {/* {isConnected ? "Connected to Cloud" : "Connect to Cloud"} */}
            </Button>
          </div>
        </header>
        <Outlet />
      </Card>
    </div>
  );
};
