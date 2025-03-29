import { FC } from "react";
import { CloudIcon, FolderOpen } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { useConnections } from "frontend/context/projects/connection/connection";

interface ProjectCardProps {
  name: string;
  iconUrl: string;
  onOpen: () => void;
}

export const ProjectCard: FC<ProjectCardProps> = ({ name, iconUrl, onOpen }) => {
  const { connections } = useConnections("ProjectCard");
  const { connected } = connections[name] || { connected: false };
  const adapterName = "HTTP";

  return (
    <Card className={`w-full hover:shadow-md transition-shadow duration-300 ${!connected ? "opacity-60" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-4">
          <div className="h-14 w-14 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
            {iconUrl ? (
              <img src={iconUrl} alt={`${name} icon`} className="w-full h-full object-cover" />
            ) : (
              <FolderOpen className="h-7 w-7 text-gray-400" />
            )}
          </div>
          <div className="space-y-1.5">
            <h3 className="font-semibold text-lg leading-none">{name}</h3>
            <div className="flex items-center gap-2">
              <Badge variant={connected ? "default" : "outline"} className="font-medium">
                <CloudIcon className="h-3 w-3 mr-1" />
                {connected ? "Online" : "Offline"}
              </Badge>
              <Badge variant="secondary" className="font-medium">
                {adapterName}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-gray-500">Connected via {adapterName} adapter</CardContent>
      <CardFooter className="pt-2">
        <Button onClick={onOpen} className="w-full">
          <FolderOpen className="mr-2 h-4 w-4" />
          Open Project
        </Button>
      </CardFooter>
    </Card>
  );
};
