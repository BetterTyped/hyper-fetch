import { FC } from "react";
import { CloudIcon, FolderOpen } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";

interface WorkspaceCardProps {
  name: string;
  iconUrl: string;
  isConnectedToCloud: boolean;
  onOpen: () => void;
}

export const WorkspaceCard: FC<WorkspaceCardProps> = ({ name, iconUrl, isConnectedToCloud, onOpen }) => {
  return (
    <Card className="w-full hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 rounded-md overflow-hidden bg-zinc-100 flex items-center justify-center">
            {iconUrl ? (
              <img src={iconUrl} alt={`${name} icon`} className="w-full h-full object-cover" />
            ) : (
              <FolderOpen className="h-6 w-6 text-zinc-400" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-lg">{name}</h3>
            <Badge variant={isConnectedToCloud ? "default" : "outline"} className="mt-1">
              <CloudIcon className="h-3 w-3 mr-1" />
              {isConnectedToCloud ? "Cloud Connected" : "Local Only"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>{/* Add additional workspace details here if needed */}</CardContent>
      <CardFooter className="pt-2">
        <Button onClick={onOpen} className="w-full">
          <FolderOpen className="mr-2 h-4 w-4" />
          Open Workspace
        </Button>
      </CardFooter>
    </Card>
  );
};
