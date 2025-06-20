import { useState } from "react";
import { Atom } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EnvironmentDialog } from "./environment-dialog";

export const Environments = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentEnvironment, setCurrentEnvironment] = useState("development");

  // TODO: we should get this from the backend
  // Mock environments data - in a real app this would come from your backend/state management
  const environments = [
    { name: "development", isOnline: true },
    { name: "staging", isOnline: true },
    { name: "production", isOnline: false },
    { name: "testing", isOnline: false },
  ];

  const handleEnvironmentChange = (environment: string) => {
    setCurrentEnvironment(environment);
  };

  return (
    <div>
      <Button variant="secondary" className="capitalize" onClick={() => setIsDialogOpen(true)}>
        <Atom className="w-4 h-4" />
        {currentEnvironment}
      </Button>
      <EnvironmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        environments={environments}
        currentEnvironment={currentEnvironment}
        onEnvironmentChange={handleEnvironmentChange}
      />
    </div>
  );
};
