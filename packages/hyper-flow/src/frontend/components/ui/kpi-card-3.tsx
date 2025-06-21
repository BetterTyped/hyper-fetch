import { cn } from "@/lib/utils";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";

interface KpiCard3Props {
  value: React.ReactNode;
  label: React.ReactNode;
  change?: React.ReactNode;
  positive?: boolean;
}

export const KpiCard3 = ({ value, label, change, positive }: KpiCard3Props) => {
  return (
    <Card className="gap-0">
      <CardHeader className="flex flex-row items-start justify-between">
        <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 -mt-1">{value}</span>
        {change && (
          <span
            className={cn(
              positive
                ? "text-emerald-700 dark:text-emerald-500 bg-emerald-500/20 rounded-md px-1.5 py-0.5"
                : "text-red-700 dark:text-red-500 bg-red-500/20 rounded-md px-1.5 py-0.5  ",
              "text-xs font-light",
            )}
          >
            {change}
          </span>
        )}
      </CardHeader>
      <CardFooter className="mt-1 text-sm font-light text-zinc-600 dark:text-zinc-400">{label}</CardFooter>
    </Card>
  );
};
