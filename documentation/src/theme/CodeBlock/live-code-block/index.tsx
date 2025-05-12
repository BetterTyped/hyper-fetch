import { useState } from "react";
import type { Props as CodeBlockProps } from "@theme/CodeBlock";
import { cn } from "@site/src/lib/utils";
import { Play, RotateCcw } from "lucide-react";
import { ShineBorder } from "@site/src/components/ui/shine-beam";

import { Editor } from "./editor/editor";
import { Playground } from "./playground/playground";
import { ShinyButton } from "@site/src/components/ui/shiny-btn";
import { DotPattern } from "@site/src/components/ui/dot-pattern";

export const LiveCodeBlock = ({
  children,
  className,
  clickToRun = false,
  defaultTab,
}: CodeBlockProps & { clickToRun?: boolean; defaultTab?: "playground" | "requests" }) => {
  const [key, setKey] = useState(0);
  const [code, setCode] = useState(String(children));
  const [isRunning, setIsRunning] = useState(false);

  return (
    <div
      className={cn(
        "live-code-block relative",
        "w-full flex flex-col border border-gray-500/60 bg-zinc-800 rounded-md",
        "overflow-hidden",
        className,
      )}
    >
      <ShineBorder duration={12} shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
      <div className="api-playground__header">
        <span className="text-sm font-bold">Live results</span>
        <div className="api-playground__controls">
          <button
            type="button"
            className="flex items-center gap-1 text-xs hover:underline focus:underline"
            onClick={() => {
              setKey((prev) => prev + 1);
              setIsRunning(false);
            }}
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2">
        <Editor code={code} setCode={setCode} />
        <div className="api_playground_wrapper relative">
          <DotPattern
            className={cn("[mask-image:radial-gradient(300px_circle_at_center,white,transparent)] opacity-50")}
          />
          <div className="relative z-10">
            {clickToRun && !isRunning ? (
              <div className="api-playground__run-example min-h-[400px] w-full flex items-center justify-center">
                <ShinyButton onClick={() => setIsRunning(true)}>
                  <Play className="w-4 h-4" /> Run Example
                </ShinyButton>
              </div>
            ) : (
              <Playground code={code} key={key} defaultTab={defaultTab} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
