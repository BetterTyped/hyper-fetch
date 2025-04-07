/* eslint-disable @typescript-eslint/no-use-before-define */
import { useMemo } from "react";
import { Treemap, ResponsiveContainer } from "recharts";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "frontend/components/ui/tooltip";
import { cn } from "frontend/lib/utils";
import { formatBytes } from "frontend/utils/size.utils";

const getDistributionFillColor = (cacheSize: number, totalCacheSize: number) => {
  // more than 50% of the total cache size
  if (cacheSize > totalCacheSize / 2) return "#1e40af";
  // more than 25% of the total cache size
  if (cacheSize > totalCacheSize / 4) return "#3b82f6";
  // more than 15% of the total cache size
  if (cacheSize > totalCacheSize / 6) return "#6fa4f9";
  // less than 15% of the total cache size
  return "#94bbf9";
};

export const ChartCache = ({
  data,
  totalSize,
  className,
}: {
  data: { name: string; size: number }[];
  totalSize: number;
  className?: string;
}) => {
  const chartData = useMemo(() => {
    const children = data.map((item) => ({
      ...item,
      size: formatBytes(item.size),
      fill: getDistributionFillColor(item.size, totalSize),
    }));
    return [
      {
        name: "Cache",
        children,
      },
    ];
  }, [data, totalSize]);

  return (
    <ResponsiveContainer className={cn("w-full h-full", className)}>
      <Treemap
        width={400}
        height={200}
        data={chartData}
        nameKey="name"
        dataKey="size"
        className="fill-blue-500"
        aspectRatio={4 / 3}
        animationDuration={0}
        content={<Content depth={0} x={0} y={0} width={0} height={0} name="" fill="" size={0} />}
      />
    </ResponsiveContainer>
  );
};

function Content(props: {
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  fill: string;
  size: number;
}) {
  const { depth, x, y, width, height, name, fill, size } = props;

  return (
    <g>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent className="flex flex-col gap-1 p-2 border-gray-200 dark:border-gray-800 border !text-sm">
            <div className={cn("border-b border-inherit px-4 py-2")}>
              <p
                className={cn(
                  // base
                  "font-medium",
                  // text color
                  "text-gray-900 dark:text-gray-50",
                )}
              >
                {name}
              </p>
            </div>
            <div className={cn("space-y-1 px-4 py-2")}>
              <div className="flex items-center justify-between space-x-8">
                <div className="flex items-center space-x-2">
                  <span
                    aria-hidden="true"
                    className={cn("h-[3px] w-3.5 shrink-0 rounded-full")}
                    style={{
                      backgroundColor: fill,
                    }}
                  />
                  <p
                    className={cn(
                      // base
                      "whitespace-nowrap text-right",
                      // text color
                      "text-gray-700 dark:text-gray-300",
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
                    "text-gray-900 dark:text-gray-50",
                  )}
                >
                  {size} KB
                </p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {width > 50 && height > 20 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
          dominantBaseline="middle"
        >
          {size} KB
        </text>
      )}
    </g>
  );
}
