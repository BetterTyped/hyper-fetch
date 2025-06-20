import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";

export const EntriesDocs = ({ className, ...props }: React.HTMLProps<HTMLDivElement>) => {
  return (
    <div {...props} className={cn("space-y-2 max-w-xl p-2", className)}>
      <p className="text-xl font-medium">What are entries?</p>
      <Separator />
      <p>Number of unique cache keys for this endpoint.</p>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Why multiple entries?</p>
        <p className="text-sm">Multiple entries can exist for a single endpoint due to:</p>
        <ul className="text-sm list-disc pl-4 space-y-1">
          <li>Dynamic parameters</li>
          <li>Query parameters</li>
        </ul>
      </div>
      <Separator />
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Example:</p>
        <p className="text-sm">
          For endpoint <code className="bg-muted px-1 rounded">/api/users/:id</code> there could be multiple entries:
        </p>
        <ul className="text-sm list-disc pl-4 space-y-1">
          <li>
            <code className="bg-muted px-1 rounded">/api/users/123</code>
          </li>
          <li>
            <code className="bg-muted px-1 rounded">/api/users/4</code>
          </li>
          <li>
            <code className="bg-muted px-1 rounded">/api/users/99</code>
          </li>
        </ul>
        <p className="text-sm">The entries count will be 3.</p>
      </div>
    </div>
  );
};
