import { Info } from "lucide-react";

import { Card, CardDescription, CardTitle } from "frontend/components/ui/card";

export const Tutorial = () => {
  return (
    <Card
      className="w-full hover:shadow-md transition-shadow duration-300 flex items-center justify-center cursor-pointer border-dashed border-2 border-spacing-4 border-gray-200/10"
      // onClick={() => setShowNewWorkspaceDialog(true)}
    >
      <div className="flex flex-col items-center justify-center py-2">
        <div className="h-12 w-12 rounded-full bg-gray-400/20 flex items-center justify-center mb-2">
          <Info className="h-6 w-6 text-gray-300" />
        </div>
        <CardTitle className="opacity-70 mb-2 mt-3">Cannot see your project?</CardTitle>
        <CardDescription className="opacity-70">Learn how to connect your project</CardDescription>
      </div>
    </Card>
  );
};
