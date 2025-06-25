import { SparkAreaChart } from "./spark-chart";

import { cn } from "@/lib/utils";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";

interface KpiCard3Props<T extends Record<string, any>> {
  value: React.ReactNode;
  label: React.ReactNode;
  variant?: "primary" | "secondary";
  data: T[];
  name: keyof T;
  icon?: React.ReactNode;
}

export const KpiCardFeed = <T extends Record<string, any>>({
  value,
  label,
  variant,
  data,
  name,
  icon,
}: KpiCard3Props<T>) => {
  return (
    <Card className="gap-0 pb-1 pt-5">
      <CardHeader className="text-sm font-light text-zinc-600 dark:text-zinc-400 -mt-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <dt className="text-sm font-semibold text-zinc-900 dark:text-white">{label}</dt>
          </div>
          <span
            className={cn(
              variant === "primary"
                ? "text-yellow-700 dark:text-yellow-500 bg-yellow-500/20 rounded-md px-1.5 py-0.5"
                : "text-blue-700 dark:text-blue-500 bg-blue-500/20 rounded-md px-1.5 py-0.5  ",
              "text-xs font-light",
            )}
          >
            {value}
          </span>
        </div>
      </CardHeader>
      <CardFooter className="-mt-1.5 text-sm font-light text-zinc-600 dark:text-zinc-400">
        <SparkAreaChart
          data={data}
          index="date"
          categories={[name as string]}
          colors={variant === "primary" ? ["emerald"] : ["blue"]}
          className="mt-4 h-10 w-full"
          minValue={0}
          maxValue={30}
        />
      </CardFooter>
    </Card>
  );
};
