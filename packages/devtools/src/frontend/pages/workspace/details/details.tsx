import { Cloud, Users } from "lucide-react";

// import { useOnlineProjects } from "frontend/context/devtools.context";
import { ProjectLayout } from "../_layout/layout";
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
import { Input } from "frontend/components/ui/input";
import { Label } from "frontend/components/ui/label";
import { useRoute } from "frontend/routing/router";
import { useWorkspaces } from "frontend/store/workspaces.store";
import { EmptyState } from "frontend/components/ui/empty-state";

export const Details = () => {
  const {
    params: { workspaceId },
    navigate,
  } = useRoute("workspace");
  const { workspaces } = useWorkspaces();
  // const { projects } = useOnlineProjects("Details");

  const isConnected = true;
  const workspace = workspaces.find((w) => w.id === workspaceId);

  if (!workspace) {
    return (
      <EmptyState title="Workspace not found" description="Please create a workspace first">
        <Button onClick={() => navigate({ to: "dashboard" })}>Create Workspace</Button>
      </EmptyState>
    );
  }

  return (
    <ProjectLayout>
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b px-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{workspace.name}</h1>
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
            {isConnected ? "Connected to Cloud" : "Connect to Cloud"}
          </Button>
        </div>
      </header>
    </ProjectLayout>
  );
};
