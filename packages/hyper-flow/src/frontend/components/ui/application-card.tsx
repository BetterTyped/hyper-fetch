import { FC, useState } from "react";
import { FolderOpen, MoreVertical, Trash2, ChevronRight } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { Avatar } from "./avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";
import { AdapterIcon } from "./adapter-icon";
import { ShineBorder } from "./shine-border";

import { useApplications } from "@/store/applications/apps.store";
import { useConnectionStore } from "@/store/applications/connection.store";

interface ApplicationCardProps {
  name: string;
  iconUrl: string;
  adapterName: string;
  url: string;
  onOpen: () => void;
}

export const ApplicationCard: FC<ApplicationCardProps> = ({ name, iconUrl, adapterName, url, onOpen }) => {
  const { connections, removeConnection } = useConnectionStore();
  const removeApplication = useApplications((state) => state.removeApplication);
  const { connected } = connections[name] || { connected: false };
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleRemove = () => {
    removeConnection(name);
    removeApplication(name);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Card
        data-testid={`application-link-card-${name}`}
        className="group relative w-full hover:shadow-xl transition-all duration-300 gap-2 justify-between group bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
        onClick={onOpen}
      >
        {connected && <ShineBorder duration={12} shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />}
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-11 w-11 rounded-lg overflow-hidden flex items-center justify-center bg-zinc-700">
              {iconUrl ? (
                <img src={iconUrl} alt={`${name} icon`} className="w-full h-full object-cover" />
              ) : (
                <FolderOpen className="h-5 w-5 text-zinc-400" />
              )}
            </Avatar>
            <div className="space-y-0.5 mt-1 overflow-hidden flex-1">
              <h3 className="font-medium text-2xl leading-none break-words bg-clip-text text-transparent bg-gradient-to-tr from-zinc-300 via-zinc-100 to-zinc-500 text-ellipsis">
                {name}
              </h3>
              <div className="text-xs text-zinc-400/80 text-ellipsis">{url}</div>
            </div>
            <div className="-mr-2 -mt-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-8 h-8 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [&[data-state=open]]:opacity-100 transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDeleteDialogOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove Application
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-3">
          <div className="pt-1 text-muted-foreground/90">
            {connected && <p className="text-base">Application is currently active and connected</p>}
            {!connected && <p className="text-base">Application is currently offline</p>}
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              <AdapterIcon name={adapterName} />
              {adapterName}
            </Badge>

            <div className="flex items-center gap-2">
              <div
                className={`relative flex items-center justify-center ${connected ? "text-emerald-500" : "text-zinc-400"}`}
              >
                <div
                  className={`absolute h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-500" : "bg-zinc-400"} opacity-20 animate-ping`}
                />
                <div className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-zinc-400"}`} />
              </div>
              <span
                className={`text-xs font-medium ${connected ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"}`}
              >
                {connected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-0 -mt-2">
          <Button
            variant="ghost"
            size="lg"
            className="text-zinc-400 hover:text-zinc-200 group-hover:text-zinc-200 !bg-transparent -mr-4 -mb-2"
            onClick={onOpen}
          >
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the application &quot;{name}&quot;? This action cannot be undone and all
              saved data will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove}>
              Remove Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
