import { Card, CardFooter, CardHeader } from "@/components/ui/card";

interface KpiCard2Props {
  value: React.ReactNode;
  label: React.ReactNode;
}

export const KpiCard2 = ({ value, label }: KpiCard2Props) => {
  return (
    <Card className="gap-0">
      <CardHeader className="flex flex-row items-start justify-between">
        <span className="text-sm font-light text-zinc-600 dark:text-zinc-400">{label}</span>
      </CardHeader>
      <CardFooter className="mt-1 text-sm font-light">
        <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 -mt-1">{value}</span>
      </CardFooter>
    </Card>
  );
};
