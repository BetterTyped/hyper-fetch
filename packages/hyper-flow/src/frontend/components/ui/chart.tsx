import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    color?: string;
  };
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

/** Gives tooltips and legends the chart's config, `ChartContainer` sets it up */
function ChartConfigProvider({ config, children }: { config: ChartConfig; children: React.ReactNode }) {
  const value = React.useMemo(() => ({ config }), [config]);
  return <ChartContext.Provider value={value}>{children}</ChartContext.Provider>;
}

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replaceAll(":", "")}`;

  return (
    <ChartConfigProvider config={config}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartConfigProvider>
  );
}

/** Exposes each configured color as `--color-<key>` for the chart */
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colors = Object.entries(config).filter(([, item]) => item.color);

  if (colors.length === 0) {
    return null;
  }

  const variables = colors.map(([key, item]) => `  --color-${key}: ${item.color};`).join("\n");
  return <style dangerouslySetInnerHTML={{ __html: `[data-chart=${id}] {\n${variables}\n}` }} />;
};

const ChartTooltip = RechartsPrimitive.Tooltip;

type ChartItem = { name?: string | number; dataKey?: unknown; value?: unknown; color?: string; payload?: unknown };

/** The config entry of a chart item: by its name, its data key, or the name its data carries */
const getItemConfig = (config: ChartConfig, item: ChartItem) => {
  const data = (typeof item.payload === "object" && item.payload !== null ? item.payload : {}) as Record<
    string,
    unknown
  >;
  const keys = [item.name, item.dataKey, data.name].filter((key): key is string => typeof key === "string");
  const key = keys.find((candidate) => candidate in config);
  return key ? config[key] : undefined;
};

function ChartTooltipContent({
  active,
  payload,
  className,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> & React.ComponentProps<"div">) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      role="tooltip"
      className={cn(
        "border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
        className,
      )}
    >
      {payload.map((item) => {
        const itemConfig = getItemConfig(config, item);
        const data = item.payload as { fill?: string } | undefined;
        const color = data?.fill ?? item.color;
        return (
          <div key={String(item.dataKey ?? item.name)} className="flex w-full items-center gap-2">
            <div className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
            <span className="text-muted-foreground flex-1">{itemConfig?.label ?? item.name}</span>
            {item.value !== undefined && (
              <span className="text-foreground font-mono font-medium tabular-nums">{item.value.toLocaleString()}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
  className,
  payload,
  verticalAlign = "bottom",
}: React.ComponentProps<"div"> & Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign">) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div className={cn("flex items-center justify-center gap-4", verticalAlign === "top" ? "pb-3" : "pt-3", className)}>
      {payload.map((item) => (
        <div key={String(item.value)} className="flex items-center gap-1.5">
          <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
          {/* A series without its own config entry is named after itself */}
          {getItemConfig(config, item)?.label ?? item.value}
        </div>
      ))}
    </div>
  );
}

export {
  ChartConfigProvider,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
