/* eslint-disable @typescript-eslint/no-use-before-define */
import { useMemo } from "react";
import { Tally4 } from "lucide-react";
import { Treemap, ResponsiveContainer } from "recharts";

import { Method } from "../ui/method";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/utils/size.utils";

const getDistributionFillColor = (cacheSize: number, totalCacheSize: number) => {
  // more than 50% of the total cache size
  if (cacheSize > totalCacheSize / 2) return "#1234a4";
  // more than 25% of the total cache size
  if (cacheSize > totalCacheSize / 4) return "#1e40af";
  // more than 15% of the total cache size
  if (cacheSize > totalCacheSize / 6) return "#2c52cc";
  // less than 15% of the total cache size
  return "#3374dd";
};

type ChartCacheData = {
  name: string;
  endpoint: string;
  method: string;
  totalSize: number;
  totalEntries: number;
};

export const ChartCache = ({
  data,
  totalSize,
  className,
}: {
  data: ChartCacheData[];
  totalSize: number;
  className?: string;
}) => {
  const chartData = useMemo(() => {
    const children = data.map((item) => ({
      ...item,
      fill: getDistributionFillColor(item.totalSize, totalSize),
    }));
    return [
      {
        name: "Cache",
        children,
      },
    ];
  }, [data, totalSize]);

  const nameKey: keyof ChartCacheData = "name";
  const dataKey: keyof ChartCacheData = "totalSize";

  return (
    <ResponsiveContainer className={cn("w-full h-full", className)}>
      <Treemap
        width={400}
        height={200}
        data={chartData}
        nameKey={nameKey}
        dataKey={dataKey}
        className="fill-blue-500"
        aspectRatio={4 / 3}
        animationDuration={0}
        content={
          <Content
            depth={0}
            x={0}
            y={0}
            width={0}
            height={0}
            // Empty props - they will be filled when the content is rendered
            name=""
            fill=""
            totalSize={0}
            totalEntries={0}
            endpoint=""
            method=""
          />
        }
      />
    </ResponsiveContainer>
  );
};

function Content(
  props: {
    depth: number;
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
  } & ChartCacheData,
) {
  const { depth, x, y, width, height, name, fill, totalSize, totalEntries, method, endpoint } = props;

  const formattedName = useMemo(() => {
    if (name === "Cache") return name;

    return (
      <div className="flex items-center gap-2">
        <Method method={method} />
        <span className="text-xs text-muted-foreground">{endpoint}</span>
      </div>
    );
  }, [name, method, endpoint]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <g>
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              style={{
                fill,
                strokeWidth: 2 / (depth + 1e-10),
                strokeOpacity: 1 / (depth + 1e-10),
              }}
              className={name === "Cache" ? "stroke-transparent" : "stroke-white"}
            />
            {width > 50 && height > 20 && (
              <text
                x={x + width / 2}
                y={y + height / 2}
                textAnchor="middle"
                fill="#fff"
                fontSize={12}
                dominantBaseline="middle"
              >
                {formatBytes(totalSize)}
              </text>
            )}
          </g>
        </TooltipTrigger>
        <TooltipContent className="flex flex-col gap-1 p-2 border-zinc-200 dark:border-zinc-800 border !text-sm">
          <div className={cn("border-b border-inherit px-4 py-2")}>
            <p
              className={cn(
                // base
                "font-medium",
                // text color
                "text-zinc-900 dark:text-zinc-50",
              )}
            >
              {formattedName}
            </p>
          </div>
          <div className={cn("space-y-1 px-4 py-2")}>
            <div className="flex items-center justify-between space-x-8">
              <div className="flex items-center space-x-2">
                <span
                  aria-hidden="true"
                  className={cn("h-3.5 w-3.5 shrink-0 rounded-xs")}
                  style={{
                    backgroundColor: fill,
                  }}
                />
                <p
                  className={cn(
                    // base
                    "whitespace-nowrap text-right",
                    // text color
                    "text-zinc-700 dark:text-zinc-300",
                  )}
                >
                  Cache Size
                </p>
              </div>
              <p
                className={cn(
                  // base
                  "whitespace-nowrap text-right font-medium tabular-nums",
                  // text color
                  "text-zinc-900 dark:text-zinc-50",
                )}
              >
                {formatBytes(totalSize)}
              </p>
            </div>
            <div className="flex items-center justify-between space-x-8">
              <div className="flex items-center space-x-2">
                <Tally4 className="w-3.5 h-3.5 shrink-0" />
                <p
                  className={cn(
                    // base
                    "whitespace-nowrap text-right",
                    // text color
                    "text-zinc-700 dark:text-zinc-300",
                  )}
                >
                  Total Entries
                </p>
              </div>
              <p
                className={cn(
                  // base
                  "whitespace-nowrap text-right font-medium tabular-nums",
                  // text color
                  "text-zinc-900 dark:text-zinc-50",
                )}
              >
                {totalEntries}
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
