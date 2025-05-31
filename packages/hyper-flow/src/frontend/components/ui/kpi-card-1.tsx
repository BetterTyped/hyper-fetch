import { Card, CardFooter, CardHeader } from "frontend/components/ui/card";

interface KpiCard2Props {
  value: React.ReactNode;
  label: React.ReactNode;
}

export const KpiCard2 = ({ value, label }: KpiCard2Props) => {
  return (
    <Card className="gap-0">
      <CardHeader className="flex flex-row items-start justify-between">
        <span className="text-sm font-light text-gray-600 dark:text-gray-400">{label}</span>
      </CardHeader>
      <CardFooter className="mt-1 text-sm font-light">
        <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100 -mt-1">{value}</span>
      </CardFooter>
    </Card>
  );
};
