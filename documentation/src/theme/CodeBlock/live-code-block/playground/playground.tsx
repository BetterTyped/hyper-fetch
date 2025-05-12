import React from "react";
import { LiveProvider, LiveError, LivePreview } from "react-live";
import { createClient } from "@hyper-fetch/core";
import { cn } from "@site/src/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@site/src/components/ui/tabs";

import { globalScope } from "./global-scope";
import { createGlobalRequests } from "./create-global-requests";
import { ClientRequests } from "../components/client-requests";

const RENDER_PREFIX = "render(";

// Utility to deep clone an object (handles functions and nested objects)
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(deepClone) as unknown as T;
  const cloned: any = {};
  Object.keys(obj).forEach((key) => {
    const value = (obj as any)[key];
    cloned[key] = typeof value === "object" && value !== null ? deepClone(value) : value;
  });
  return cloned as T;
}

// Removes all import statements (default and named) from the code string
export const removeImports = (code: string): string => {
  // Matches ES6 import statements (default, named, namespace, side-effect)
  return code.replace(/(^|\n)\s*import\s+[^;]+;?/g, "");
};

export const transformCode = (code: string): string => {
  if (code.includes(RENDER_PREFIX)) return code;

  // Regex to find function declarations or arrow functions with uppercase first letter
  const componentRegex = /(?:function|const|let|var)\s+([A-Z][A-Za-z0-9_]*)\s*(=|\()/;
  const match = code.match(componentRegex);

  if (match) {
    const componentName = match[1];
    // Check if render(ComponentName) is already present
    const renderRegex = new RegExp(`render\\(\\s*<?${componentName}\\s*.*>?\\s*\\)`);
    if (renderRegex.test(code)) {
      return code;
    }
    // Append render(<ComponentName />) at the end
    return `${code}\n\nrender(<${componentName} />)`;
  }

  // If no component found, wrap code in render(() => { ... }) with console.log override
  return `render(() => {
    const [logs, setLogs] = React.useState<Array<Array<any>>>([]);
    const originalLog = console.log;
    
    React.useEffect(() => {
      console.log = (...args) => {
        setLogs(logs => [...logs, [...args]]);
        originalLog(...args);
      };

      (async () => {
        ${code}
      })()

      return () => {
        console.log = originalLog;
      };
    }, []);

    return (
      <div className="w-full h-full">
        <div className="text-lg font-semibold text-zinc-400 mb-2">Output:</div>
        {!logs?.length && (
          <div className="api-playground__no-logs flex items-center gap-2">
            <TinyLoader />
            No console output yet, waiting for logs to appear here.
          </div>
        )}
        {logs.map((log, index) => (
          <div key={index} className="api-playground__log-row flex gap-1">
            <div className="api-playground__log-row__index">
              <div className="text-xs text-zinc-400">
                {index}
              </div>
            </div>
            <pre>
              {log.map((arg, i) => {
                let formatted;
                if (typeof arg === 'string') {
                  formatted = arg;
                } else if (typeof arg === 'number' || typeof arg === 'boolean' || arg === null || arg === undefined) {
                  formatted = String(arg);
                } else {
                  try {
                    formatted = JSON.stringify(arg, null, 2);
                  } catch {
                    formatted = String(arg);
                  }
                }
                return (
                  <Highlight
                    key={i}
                    code={formatted}
                    language="tsx"
                    theme={themes.vsDark}
                  >
                    {({ className, style, tokens, getLineProps, getTokenProps }) => (
                      <>
                        {tokens.map((line, j) => (
                          <span key={j} {...getLineProps({ line })}>
                            {line.map((token, key) => (
                              <span key={key} {...getTokenProps({ token })} />
                            ))}
                            <br />
                          </span>
                        ))}
                      </>
                    )}
                  </Highlight>
                );
              })}
            </pre>
          </div>
        ))}
      </div>
    );
  })`;
};

const pipeline = [removeImports, transformCode];
export const Playground = ({ code, defaultTab }: { code: string; defaultTab?: "playground" | "requests" }) => {
  const stringifiedCode = pipeline.reduce((transformedCode, fn) => fn(transformedCode), code);

  const client = createClient({
    url: "http://localhost:3000",
  });

  const requests = createGlobalRequests(client);

  const isLog = stringifiedCode.includes("const [logs, setLogs] = React.useState<Array<Array<any>>>([]);");
  const tab = defaultTab ?? (isLog ? "requests" : "playground");

  return (
    <Tabs defaultValue={tab} className={cn("api-playground w-full relative")}>
      <TabsList className="ml-3 mt-2">
        <TabsTrigger value="playground">{isLog ? "Console" : "Playground"}</TabsTrigger>
        <TabsTrigger value="requests">Requests</TabsTrigger>
      </TabsList>
      <TabsContent value="playground" className="w-full data-[state=inactive]:hidden" forceMount>
        <LiveProvider
          code={transformCode(stringifiedCode)}
          scope={{
            ...globalScope,
            ...requests,
            client,
            // So console.log can be used in the playground and override to render logs
            // This way we are isolating the console.log to the playground
            console: deepClone(window.console),
          }}
          noInline
        >
          <LivePreview className={cn("api-playground__preview", isLog && "api-playground__preview--log")} />
          <LiveError className="api-playground__error" />
        </LiveProvider>
      </TabsContent>
      <TabsContent value="requests" className="w-full data-[state=inactive]:hidden" forceMount>
        <ClientRequests client={client} />
      </TabsContent>
    </Tabs>
  );
};
