import { useState } from "react";
import type { Props as CodeBlockProps } from "@theme/CodeBlock";
import { cn } from "@site/src/lib/utils";
import { Play, RotateCcw } from "lucide-react";
import { ShineBorder } from "@site/src/components/ui/shine-beam";

import { Editor } from "./editor/editor";
import { Playground } from "./playground/playground";

export const LiveCodeBlock = ({
  children,
  className,
  clickToRun = false,
}: CodeBlockProps & { clickToRun?: boolean }) => {
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
      <div className="api-playground__header flex items-center p-2 text-gray-400 justify-between border-b">
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
        {clickToRun && !isRunning ? (
          <div className="api-playground__run-example min-h-[350px] w-full flex items-center justify-center">
            <button
              type="button"
              className="shiny-btn flex gap-2 items-center py-1 px-3"
              onClick={() => setIsRunning(true)}
            >
              <Play className="w-4 h-4" /> Run Example
            </button>
          </div>
        ) : (
          <Playground code={code} key={key} />
        )}
      </div>
    </div>
  );
};
