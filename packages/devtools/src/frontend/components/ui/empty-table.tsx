import { cn } from "frontend/lib/utils";
import { Title } from "./title";
import { Ripple } from "./ripple";

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
      <Ripple className="absolute inset-0" />
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
        <Title className="text-3xl md:text-[48px] font-semibold text-center">{title}</Title>
        <p className="text-lg md:text-xl font-light text-gray-50/90 mt-1 text-center">{description}</p>
        {children}
      </div>
    </div>
  );
};
