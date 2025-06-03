import { useId, useRef, useState } from "react";
import type { Props as CodeBlockProps } from "@theme/CodeBlock";
import { cn } from "@site/src/lib/utils";
import { FileCode, Play, RotateCcw } from "lucide-react";
import { ShineBorder } from "@site/src/components/ui/shine-beam";
import { ShinyButton } from "@site/src/components/ui/shiny-btn";
import { DotPattern } from "@site/src/components/ui/dot-pattern";

import { Editor } from "./editor/editor";
import { Playground } from "./playground/playground";

export const LiveCodeBlock = ({
  children,
  className,
  clickToRun = false,
  defaultTab,
  size,
  title,
}: CodeBlockProps & { clickToRun?: boolean; defaultTab?: "playground" | "requests"; size?: "sm" | "md" | "lg" }) => {
  const id = useId();
  const [key, setKey] = useState(0);
  const [code, setCode] = useState(String(children));
  const [isRunning, setIsRunning] = useState(false);
  const [outerTab, setOuterTab] = useState<"playground" | "requests" | "console">("playground");

  const initialCode = useRef(code);

  const onCodeChange = (value: string) => {
    setCode(value);
  };

  const onReset = () => {
    setKey((prev) => prev + 1);
    setCode(initialCode.current);
    setIsRunning(false);
    setOuterTab("playground");
  };

  return (
    <div
      id={id}
      className={cn(
        "live-code-block relative",
        "w-full flex flex-col border border-gray-500/60 bg-zinc-800 rounded-md",
        "overflow-hidden",
        `live-code-block-size-${size}`,
        className,
      )}
    >
      <ShineBorder duration={12} shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
      <div className="api-playground__header">
        <div className="text-sm flex items-center gap-1">
          <FileCode className="w-4 h-4" />
          <span className="!text-[rgba(255,255,255,0.7)] text-[0.9rem] font-semibold">{title || "Live results"}</span>
        </div>
        <div className="api-playground__controls">
          <button
            type="button"
            className="flex items-center gap-1 text-xs hover:underline focus:underline"
            onClick={() => {
              onReset();
            }}
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2">
        <Editor code={code} setCode={onCodeChange} />
        <div className="api_playground_wrapper relative">
          <DotPattern
            className={cn(
              "[mask-image:radial-gradient(300px_circle_at_center,white,transparent)] opacity-50 transition-opacity duration-300",
              outerTab === "console" && "opacity-0",
            )}
          />
          {clickToRun && !isRunning ? (
            <div className="api-playground__run-example w-full flex items-center justify-center">
              <ShinyButton onClick={() => setIsRunning(true)}>
                <Play className="w-4 h-4" /> Run Example
              </ShinyButton>
            </div>
          ) : (
            <Playground key={key} code={code} defaultTab={defaultTab} setOuterTab={setOuterTab} />
          )}
        </div>
      </div>
    </div>
  );
};
