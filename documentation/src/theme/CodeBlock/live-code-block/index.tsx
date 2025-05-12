import { useState } from "react";
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
  title,
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
        <div className="text-sm flex items-center gap-1">
          <FileCode className="w-4 h-4" />
          <span className="text-sm font-semibold flex items-center gap-1 !text-transparent bg-clip-text bg-gradient-to-b from-zinc-800/60 via-zinc-800 to-zinc-800/60 dark:from-zinc-200/60 dark:via-zinc-200 dark:to-zinc-200/60">
            {title || "Live results"}
          </span>
        </div>
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
