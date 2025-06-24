import { Info } from "lucide-react";

import { Title } from "../ui/title";
import { Particles } from "../ui/particles";
import { Avatar, AvatarFallback } from "../ui/avatar";

import { cn } from "@/lib/utils";

export const EmptyTable = ({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div className={cn("relative flex-1 w-full h-full", className)}>
      <Particles className="absolute inset-0" />
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
        <Avatar className="w-18 h-18 mb-3">
          <AvatarFallback className="bg-gradient-to-br from-zinc-600/90 to-zinc-800/90">
            <Info className="w-8 h-8" />
          </AvatarFallback>
        </Avatar>
        <Title className="text-3xl md:text-4xl tracking-normal font-semibold text-center">{title}</Title>
        <p className="text-xl md:text-2xl font-light tracking-normal text-zinc-300/90 mt-1 text-center text-shadow-lg pb-6">
          {description}
        </p>
        {children}
      </div>
    </div>
  );
};
