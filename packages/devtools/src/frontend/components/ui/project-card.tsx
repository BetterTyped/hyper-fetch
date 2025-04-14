import { FC, useState } from "react";
import { AppWindowIcon, FolderOpen, MoreVertical, Trash2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { useConnections } from "frontend/context/projects/connection/connection";
import { Avatar } from "./avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { useProjects } from "frontend/store/project/projects.store";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";
import { AdapterIcon } from "./adapter-icon";

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
      <Card
        className={`w-full hover:shadow-md transition-shadow duration-300 gap-2 justify-between ${!connected ? "opacity-70" : ""} group`}
      >
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12 rounded-lg overflow-hidden flex items-center justify-center bg-gray-700">
              {iconUrl ? (
                <img src={iconUrl} alt={`${name} icon`} className="w-full h-full object-cover" />
              ) : (
                <FolderOpen className="h-6 w-6 text-gray-400" />
              )}
            </Avatar>
            <div className="space-y-1.5 overflow-hidden flex-1">
              <h3 className="font-semibold text-lg leading-none break-words">{name}</h3>
            </div>
            <div className="-mr-2 -mt-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-8 h-8 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [&[data-state=open]]:opacity-100 transition-opacity"
                  >
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-2">
          {connected && <CardDescription>Project is currently running</CardDescription>}
          {!connected && <CardDescription>Project was last connected 2 hours ago</CardDescription>}
          <div className="flex items-center gap-2 mt-2 mb-3">
            <Badge
              variant={connected ? "default" : "outline"}
              className={`font-medium flex items-center gap-1.5 ${
                connected
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-gray-100 text-gray-500 border-gray-200"
              }`}
            >
              <span className={`relative flex h-2 w-2 ${connected ? "animate-pulse" : ""}`}>
                <span
                  className={`absolute inline-flex h-full w-full rounded-full ${
                    connected ? "bg-emerald-400" : "bg-gray-400"
                  } opacity-75`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    connected ? "bg-emerald-500" : "bg-gray-500"
                  }`}
                />
              </span>
              {connected ? "Online" : "Offline"}
            </Badge>
            <Badge variant="secondary" className="font-medium">
              <AdapterIcon name={adapterName} />
              {adapterName}
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={onOpen} size="lg" className="flex-1">
            <AppWindowIcon className="h-4 w-4" />
            Open Project
          </Button>
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
