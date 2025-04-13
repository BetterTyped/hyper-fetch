import { FC } from "react";
import { CloudIcon, FolderOpen } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { useConnections } from "frontend/context/projects/connection/connection";
import { Avatar } from "./avatar";

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
      <CardFooter className="pt-2">
        <Button onClick={onOpen} size="lg" className="w-full max-w-3xs">
          Open Project
        </Button>
      </CardFooter>
    </Card>
  );
};
