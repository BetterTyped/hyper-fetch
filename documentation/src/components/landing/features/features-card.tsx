import { cn } from "@site/src/lib/utils";

import { ShineBorder } from "../../ui/shine-beam";
import { Box } from "./box";

export const FeaturesCard = ({
  children,
  bgColor = "#ff840040",
  right = false,
}: {
  children: React.ReactNode;
  bgColor?: string;
  right?: boolean;
}) => {
  return (
    <div className="relative min-h-[400px] w-full flex items-center justify-center">
      <div
        className={cn(
          "absolute -z-[1] w-[300px] h-[300px] top-12 blur-lg rounded-full opacity-20",
          right ? "-right-5" : "-left-5",
        )}
        style={{ backgroundColor: bgColor }}
      />
      <div className="relative z-[1] h-full w-full shadow-[0_-1px_#ffdbdf1f,0_0_0_1px_#ffffff0f] p-6 rounded-lg backdrop-blur-md">
        <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
        <Box className="h-full w-full">{children}</Box>
      </div>
    </div>
  );
};
