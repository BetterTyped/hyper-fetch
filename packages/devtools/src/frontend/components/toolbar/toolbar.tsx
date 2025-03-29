import { Wifi, WifiOff } from "lucide-react";

import { Button } from "frontend/components/ui/button";
import { useDevtools } from "frontend/context/projects/devtools/use-devtools";

export const Toolbar = ({ children }: { children: React.ReactNode }) => {
  const {
    setIsOnline,
    state: { isOnline },
  } = useDevtools();

  return (
    <div className="flex items-center p-2 border-b">
      {/* {!!workspaces?.length && (
        <Select defaultValue={activeWorkspace} onValueChange={setActiveWorkspace}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select workspace" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {workspaces.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )} */}
      <div className="flex items-center flex-1 gap-1">{children}</div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => setIsOnline(!isOnline)}>
          {isOnline ? <Wifi className="text-green-500" /> : <WifiOff />}
        </Button>
      </div>
    </div>
  );
};
