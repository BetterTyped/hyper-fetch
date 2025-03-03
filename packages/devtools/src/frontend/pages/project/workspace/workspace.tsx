import { Check, Cloud, Settings, Users } from "lucide-react";

import { useWorkspaces } from "frontend/context/devtools.context";
import { ProjectLayout } from "../_layout/layout";
import { Badge } from "frontend/components/ui/badge";
import { Button } from "frontend/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "frontend/components/ui/card";
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
import { Separator } from "frontend/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "frontend/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "frontend/components/ui/tooltip";

export const Workspace = () => {
  const { activeWorkspace, workspaces } = useWorkspaces("Workspace");

  const isConnected = true;

  const workspace = workspaces[activeWorkspace!];

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
