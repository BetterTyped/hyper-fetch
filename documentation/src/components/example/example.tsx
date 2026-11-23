import BrowserOnly from "@docusaurus/BrowserOnly";
import { useLocation } from "@docusaurus/router";
import { cn } from "@site/src/lib/utils";
import CodeBlock from "@theme/CodeBlock";
import copy from "copy-text-to-clipboard";
import { Check, Copy, ExternalLink, Github, Play } from "lucide-react";
import React, { lazy, Suspense, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { getCodesandboxUrl, getDownloadCommand, getGithubUrl, getLanguage, getStackblitzUrl } from "./example.utils";
import { useExamples } from "./examples-catalog";

export type ExampleProps = {
  /**
   * Source files shown on the page, keyed by their path inside the example. Import each one from the example itself
   * so the page always shows the code CI builds: `import app from "!!raw-loader!@examples/react/basic/src/App.tsx"`.
   */
  files: Record<string, string>;
  /**
   * Folder of the example inside `examples/`, for example `react/basic`. Defaults to `sidebar_custom_props.path` of
   * the page, which is where it should normally be set.
   */
  path?: string;
  /** File opened when the example opens in StackBlitz or CodeSandbox. Defaults to the last entry of `files`. */
  file?: string;
  /** Height of the code and preview panes in pixels. */
  height?: number;
};

const PREVIEW_TAB = "__preview__";

// Sandpack is large, so it loads only on pages whose preview starts.
const ExampleSandbox = lazy(() => import("./example-sandbox"));

const linkClassName = cn(
  "inline-flex items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-medium",
  "!text-zinc-200 !no-underline transition-colors hover:border-zinc-500 hover:bg-zinc-800",
);

const trimSlash = (value: string) => value.replace(/\/$/, "");

/**
 * Renders an example from `examples/`: a live preview, its source files, links to open it elsewhere and the command to
 * copy it locally. Browser-only examples run in the page with Sandpack. Examples with a server need Node, so their
 * preview links to StackBlitz.
 */
export const Example = ({ files, path: pathProp, file, height = 560 }: ExampleProps) => {
  const { pathname } = useLocation();
  const examples = useExamples();
  const meta = examples.find((example) => trimSlash(example.permalink) === trimSlash(pathname));
  const path = pathProp ?? meta?.path;
  const runsInPage = examples.some((example) => example.path === path && example.preview);

  const fileNames = Object.keys(files);
  const openFile = file ?? fileNames[fileNames.length - 1];
  const [tab, setTab] = useState(PREVIEW_TAB);
  const [copied, setCopied] = useState(false);

  if (!path) {
    throw new Error("<Example> needs `sidebar_custom_props.path` in the page front matter or a `path` prop.");
  }

  const command = getDownloadCommand(path);
  const stackblitzUrl = getStackblitzUrl(path, openFile);
  const loading = (
    <div style={{ height }} className="flex items-center justify-center text-sm text-zinc-400">
      Loading the example...
    </div>
  );

  return (
    <div className="my-6">
      <div className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2">
            <TabsList className="h-auto flex-wrap justify-start bg-transparent p-0">
              <TabsTrigger value={PREVIEW_TAB} className="gap-1.5">
                <Play className="size-3.5" aria-hidden /> Preview
              </TabsTrigger>
              {fileNames.map((name) => (
                <TabsTrigger key={name} value={name} className="font-mono text-xs">
                  {name}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex flex-wrap items-center gap-2">
              <a className={linkClassName} href={stackblitzUrl} target="_blank" rel="noreferrer">
                StackBlitz <ExternalLink className="size-3" aria-hidden />
              </a>
              <a className={linkClassName} href={getCodesandboxUrl(path, openFile)} target="_blank" rel="noreferrer">
                CodeSandbox <ExternalLink className="size-3" aria-hidden />
              </a>
              <a className={linkClassName} href={getGithubUrl(path)} target="_blank" rel="noreferrer">
                <Github className="size-3.5" aria-hidden /> Source
              </a>
            </div>
          </div>

          <TabsContent value={PREVIEW_TAB} className="mt-0" forceMount hidden={tab !== PREVIEW_TAB}>
            {runsInPage ? (
              <BrowserOnly fallback={loading}>
                {() => (
                  <Suspense fallback={loading}>
                    <ExampleSandbox path={path} height={height} />
                  </Suspense>
                )}
              </BrowserOnly>
            ) : (
              <div style={{ height }} className="flex flex-col items-center justify-center gap-4 px-6 text-center">
                <a
                  href={stackblitzUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-5 py-2.5 text-sm font-semibold !text-zinc-950 !no-underline transition-colors hover:bg-yellow-400"
                >
                  <Play className="size-4" aria-hidden /> Run in StackBlitz{" "}
                  <ExternalLink className="size-4" aria-hidden />
                </a>
                <p className="m-0 max-w-md text-sm text-zinc-400">
                  This example runs a server next to the app, so it needs Node. StackBlitz runs it in a new tab and the
                  first start installs packages.
                </p>
              </div>
            )}
          </TabsContent>

          {fileNames.map((name) => (
            <TabsContent key={name} value={name} className="mt-0">
              <div
                style={{ maxHeight: height }}
                className="overflow-auto [&_.theme-code-block]:!m-0 [&_.theme-code-block]:!rounded-none"
              >
                <CodeBlock language={getLanguage(name)} showLineNumbers>
                  {files[name].trimEnd()}
                </CodeBlock>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex items-center gap-2 border-t border-zinc-800 px-3 py-2 text-xs text-zinc-400">
          <span className="shrink-0">Run locally</span>
          <code className="min-w-0 flex-1 truncate !border-0 !bg-transparent !p-0 text-zinc-300">{command}</code>
          <button
            type="button"
            aria-label="Copy command"
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-zinc-700 bg-transparent px-2 py-1 text-xs text-zinc-300 hover:border-zinc-500"
            onClick={() => {
              copy(command);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
};
