import { Info } from "lucide-react";

import { Card, CardDescription, CardTitle } from "frontend/components/ui/card";

export const Tutorial = () => {
  const handleClick = () => {
    window.open("https://hyperfetch.bettertyped.com/docs/guides/devtools/getting-started", "_blank");
  };

  return (
    <Card
      className="relative w-full hover:shadow-md hover:brightness-110 transition-all duration-300 flex items-center justify-center cursor-pointer min-h-[190px]"
      onClick={handleClick}
    >
      <div className="flex flex-col items-center justify-center py-2">
        <div className="h-12 w-12 rounded-full bg-gray-400/20 flex items-center justify-center mb-2">
          <Info className="h-6 w-6 text-gray-300" />
        </div>
        <CardTitle className="opacity-70 mb-2 mt-3">Cannot see your project?</CardTitle>
        <CardDescription className="opacity-70">Learn how to connect it to the DevTools</CardDescription>
      </div>
    </Card>
  );
};
