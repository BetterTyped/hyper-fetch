import { render, screen } from "@testing-library/react";

import type { ChartConfig } from "@/components/ui/chart";
import { ChartConfigProvider, ChartContainer, ChartLegendContent, ChartTooltipContent } from "@/components/ui/chart";

const config: ChartConfig = {
  GET: { label: "Get requests", color: "#00ff00" },
  POST: { label: "Post requests", color: "#0000ff" },
};

describe("Chart", () => {
  describe("given the tooltip", () => {
    it("should list each value with its configured label and color", () => {
      render(
        <ChartConfigProvider config={config}>
          <ChartTooltipContent
            active
            payload={[
              {
                name: "avgResponseTime",
                dataKey: "avgResponseTime",
                value: 1234,
                payload: { method: "GET", name: "GET", fill: "#00ff00" },
              },
            ]}
          />
        </ChartConfigProvider>,
      );

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveTextContent("Get requests");
      expect(tooltip).toHaveTextContent((1234).toLocaleString());
      expect(tooltip.querySelector<HTMLDivElement>("[style]")?.style.backgroundColor).toBe("rgb(0, 255, 0)");
    });

    it("should name a series without a config entry after itself", () => {
      render(
        <ChartConfigProvider config={config}>
          <ChartTooltipContent active payload={[{ name: "Latency", dataKey: "latency", value: 5, color: "#123456" }]} />
        </ChartConfigProvider>,
      );

      expect(screen.getByRole("tooltip")).toHaveTextContent("Latency");
    });

    it("should list values without a data key", () => {
      render(
        <ChartConfigProvider config={config}>
          <ChartTooltipContent active payload={[{ name: "POST", value: 2, color: "#0000ff" }]} />
        </ChartConfigProvider>,
      );

      expect(screen.getByRole("tooltip")).toHaveTextContent("Post requests");
    });

    it("should render nothing when the pointer is not over a value", () => {
      const { container } = render(
        <ChartConfigProvider config={config}>
          <ChartTooltipContent active={false} payload={[{ name: "GET", value: 1 }]} />
          <ChartTooltipContent active payload={[]} />
        </ChartConfigProvider>,
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("given the legend", () => {
    it("should label series by their config, else by their name", () => {
      render(
        <ChartConfigProvider config={config}>
          <ChartLegendContent
            verticalAlign="top"
            payload={[
              { value: "GET", dataKey: "GET", color: "#00ff00", type: "square" },
              { value: "Average response time (ms)", dataKey: "avgResponseTime", color: "#ff0000", type: "square" },
            ]}
          />
        </ChartConfigProvider>,
      );

      expect(screen.getByText("Get requests")).toBeInTheDocument();
      expect(screen.getByText("Average response time (ms)")).toBeInTheDocument();
    });

    it("should space a legend below the chart", () => {
      const { container } = render(
        <ChartConfigProvider config={config}>
          <ChartLegendContent payload={[{ value: "GET", color: "#00ff00", type: "square" }]} />
        </ChartConfigProvider>,
      );

      expect(container.firstElementChild).toHaveClass("pt-3");
    });

    it("should render nothing without series", () => {
      const { container } = render(
        <ChartConfigProvider config={config}>
          <ChartLegendContent payload={[]} />
        </ChartConfigProvider>,
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("given the container", () => {
    it("should expose the configured colors to the chart", () => {
      const { container } = render(
        <ChartContainer config={config} id="methods">
          <div />
        </ChartContainer>,
      );

      const style = container.querySelector("style")?.innerHTML ?? "";
      expect(style).toContain("[data-chart=chart-methods]");
      expect(style).toContain("--color-GET: #00ff00;");
      expect(style).toContain("--color-POST: #0000ff;");
    });

    it("should not add styles without colors", () => {
      const { container } = render(
        <ChartContainer config={{ GET: { label: "Get" } }}>
          <div />
        </ChartContainer>,
      );

      expect(container.querySelector("style")).toBeNull();
    });

    it("should need a chart around tooltips", () => {
      vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => render(<ChartTooltipContent active payload={[{ name: "x", value: 1 }]} />)).toThrow(
        /ChartContainer/,
      );
    });
  });
});
