import { ArrowUpRight, Cloud, CloudOff } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "frontend/components/ui/avatar";
import { Badge } from "frontend/components/ui/badge";
import { Button } from "frontend/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "frontend/components/ui/card";

interface ProjectCardProps {
  id: string;
  name: string;
  connectionType: string;
  isConnected: boolean;
  lastUpdated?: string;
  logoUrl?: string;
  onOpenClick: () => void;
  onConnectClick: () => void;
}

// Map connection types to colors
const colors = {
  http: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  graphql: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  rest: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export function ProjectCard({
  id,
  name,
  connectionType,
  isConnected,
  lastUpdated = "2 hours ago",
  logoUrl,
  onOpenClick,
  onConnectClick,
}: ProjectCardProps) {
  const color = colors[connectionType as keyof typeof colors] || colors.other;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-0">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={logoUrl} alt={`${name} logo`} />
              <AvatarFallback className="text-lg font-semibold bg-primary/5 text-primary">
                {name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-3 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-lg leading-none pt-1">{name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${color} border-0 font-medium uppercase text-xs shrink-0`}>
                  {connectionType}
                </Badge>
                <p className="text-xs text-muted-foreground">Updated {lastUpdated}</p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardFooter className="flex gap-2">
        <Button size="sm" className="flex-1 h-8" onClick={onOpenClick}>
          View Project
          <ArrowUpRight className="ml-1 h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant={isConnected ? "outline" : "secondary"}
          className={`flex-1 h-8 ${isConnected ? "border-green-500 text-green-600" : ""}`}
          onClick={onConnectClick}
        >
          {isConnected ? (
            <>
              <Cloud className="mr-1 h-3 w-3 text-green-500" />
              Connected
            </>
          ) : (
            <>
              <CloudOff className="mr-1 h-3 w-3" />
              Connect
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
