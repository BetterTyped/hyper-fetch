import { useState } from "react";

import { Badge } from "frontend/components/ui/badge";
import { Card, CardContent } from "frontend/components/ui/card";
import { Label } from "frontend/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "frontend/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "frontend/components/ui/radio-group";
import { Button } from "frontend/components/ui/button";

interface Environment {
  name: string;
  isOnline: boolean;
}

interface EnvironmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  environments: Environment[];
  currentEnvironment: string;
  onEnvironmentChange: (environment: string) => void;
}

export const EnvironmentDialog = ({
  open,
  onOpenChange,
  environments,
  currentEnvironment,
  onEnvironmentChange,
}: EnvironmentDialogProps) => {
  const [selectedEnvironment, setSelectedEnvironment] = useState(currentEnvironment);

  const handleEnvironmentChange = (value: string) => {
    setSelectedEnvironment(value);
    onEnvironmentChange(value);
  };

  const handleConfirm = () => {
    onOpenChange(false);
  };

  const onlineEnvironments = environments.filter((env) => env.isOnline);
  const offlineEnvironments = environments.filter((env) => !env.isOnline);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Environment</DialogTitle>
        </DialogHeader>
        <RadioGroup value={selectedEnvironment} onValueChange={handleEnvironmentChange}>
          <div className="space-y-4">
            {onlineEnvironments.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500">Online Environments</Label>
                <div className="space-y-2">
                  {onlineEnvironments.map((env) => (
                    <Card
                      key={env.name}
                      className="cursor-pointer hover:bg-gray-500/20"
                      onClick={() => handleEnvironmentChange(env.name)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value={env.name} id={env.name} />
                            <Label htmlFor={env.name} className="font-medium">
                              {env.name}
                            </Label>
                          </div>
                          <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            Online
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {offlineEnvironments.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500">Offline Environments</Label>
                <div className="space-y-2">
                  {offlineEnvironments.map((env) => (
                    <Card
                      key={env.name}
                      className="cursor-pointer hover:bg-gray-500/20 opacity-70"
                      onClick={() => handleEnvironmentChange(env.name)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value={env.name} id={env.name} />
                            <Label htmlFor={env.name} className="font-medium">
                              {env.name}
                            </Label>
                          </div>
                          <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200">
                            Offline
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </RadioGroup>
        <DialogFooter>
          <Button variant="default" onClick={handleConfirm} disabled={!selectedEnvironment}>
            Select Environment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
