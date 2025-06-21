import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";

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
          <DialogTitle className="text-2xl font-bold">Select Environment</DialogTitle>
        </DialogHeader>
        <RadioGroup value={selectedEnvironment} onValueChange={handleEnvironmentChange}>
          <div className="space-y-6">
            {onlineEnvironments.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Online Environments
                </Label>
                <div className="space-y-3">
                  {onlineEnvironments.map((env) => (
                    <Card
                      key={env.name}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md p-0 ${
                        selectedEnvironment === env.name ? "ring-2 ring-amber-500" : ""
                      }`}
                      onClick={() => handleEnvironmentChange(env.name)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={env.name} id={env.name} />
                            <Label htmlFor={env.name} className="text-[17px] font-medium capitalize">
                              {env.name}
                            </Label>
                          </div>
                          <Badge
                            variant="default"
                            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
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
              <div className="space-y-3">
                <Label className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-zinc-400" />
                  Offline Environments
                </Label>
                <div className="space-y-3">
                  {offlineEnvironments.map((env) => (
                    <Card
                      key={env.name}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md p-0 opacity-70 ${
                        selectedEnvironment === env.name ? "ring-2 ring-zinc-400" : ""
                      }`}
                      onClick={() => handleEnvironmentChange(env.name)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={env.name} id={env.name} />
                            <Label htmlFor={env.name} className="text-[17px] font-medium capitalize">
                              {env.name}
                            </Label>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-zinc-100 text-zinc-500 border-zinc-200 flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
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
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={!selectedEnvironment}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
          >
            Select Environment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
