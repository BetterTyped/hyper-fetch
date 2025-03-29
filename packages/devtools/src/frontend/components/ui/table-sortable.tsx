import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon } from "lucide-react";

import { Button } from "frontend/components/ui/button";
import { TableHead } from "frontend/components/ui/table";
import { cn } from "frontend/lib/utils";

interface TableSortableProps extends React.HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  sort: "asc" | "desc" | null;
  onSort: (sort: "asc" | "desc" | null) => void;
}

export function TableSortable({ children, sort, onSort, className, ...props }: TableSortableProps) {
  const handleSort = () => {
    if (sort === null) onSort("asc");
    else if (sort === "asc") onSort("desc");
    else onSort(null);
  };

  return (
    <TableHead className={cn("cursor-pointer select-none", className)} {...props}>
      <Button variant="ghost" onClick={handleSort} className="h-8 px-2 hover:bg-transparent">
        {children}
        {sort === "asc" && <ArrowUpIcon className="ml-2 h-4 w-4" />}
        {sort === "desc" && <ArrowDownIcon className="ml-2 h-4 w-4" />}
        {sort === null && <ArrowUpDownIcon className="ml-2 h-4 w-4 opacity-50" />}
      </Button>
    </TableHead>
  );
}
