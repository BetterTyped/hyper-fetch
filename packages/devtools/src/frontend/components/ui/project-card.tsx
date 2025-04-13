import { FC, useState } from "react";
import { CloudIcon, FolderOpen, MoreVertical, Trash2 } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { useConnections } from "frontend/context/projects/connection/connection";
import { Avatar } from "./avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { useProjects } from "frontend/store/project/projects.store";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";

interface ProjectCardProps {
  name: string;
  iconUrl: string;
  onOpen: () => void;
}

export const ProjectCard: FC<ProjectCardProps> = ({ name, iconUrl, onOpen }) => {
  const { connections, setConnections } = useConnections("ProjectCard");
  const removeProject = useProjects((state) => state.removeProject);
  const { connected } = connections[name] || { connected: false };
  const adapterName = "HTTP";
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleRemove = () => {
    setConnections((prev) => {
      const newConnections = { ...prev };
      delete newConnections[name];
      return newConnections;
    });
    removeProject(name);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Card className={`w-full hover:shadow-md transition-shadow duration-300 gap-2 ${!connected ? "opacity-70" : ""}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12 rounded-lg overflow-hidden flex items-center justify-center bg-gray-700">
              {iconUrl ? (
                <img src={iconUrl} alt={`${name} icon`} className="w-full h-full object-cover" />
              ) : (
                <FolderOpen className="h-6 w-6 text-gray-400" />
              )}
            </Avatar>
            <div className="space-y-1.5 overflow-hidden">
              <h3 className="font-semibold text-lg leading-none break-words">{name}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={connected ? "default" : "outline"} className="font-medium">
              <CloudIcon className="h-3 w-3 mr-1" />
              {connected ? "Online" : "Offline"}
            </Badge>
            <Badge variant="secondary" className="font-medium">
              {adapterName}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-gray-500">Connected via {adapterName} adapter</CardContent>
        <CardFooter className="pt-2 flex gap-2">
          <Button onClick={onOpen} size="lg" className="flex-1">
            Open Project
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="lg" className="flex-1 max-w-14">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Remove Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the project &quot;{name}&quot;? This action cannot be undone and all saved
              data will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove}>
              Remove Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
