import React, { memo, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { LiveProvider, LiveError, LivePreview } from "react-live";
import { ClientInstance, createClient } from "@hyper-fetch/core";
import { cn } from "@site/src/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@site/src/components/ui/tabs";
import { useDebounce } from "@better-hooks/performance";
import { Toaster } from "@site/src/components/ui/toast";

import { globalScope } from "./global-scope";
import { createGlobalRequests } from "./create-global-requests";
import { ClientRequests } from "../components/client-requests/client-requests";
import { ToasterProvider, usePreviewToast } from "../../../../hooks/use-toast";
import { MessageEvent } from "../components/client-requests/components/message-event";

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

const isComponent = (code: string) => {
  // Regex to find function declarations or arrow functions with uppercase first letter
  const componentRegex = /(?:function|const|let|var)\s+([A-Z][A-Za-z0-9_]*)\s*(=|\()/;
  const match = code.match(componentRegex);
  return match;
};

// Removes all import statements (default and named) from the code string
export const removeImports = (code: string): string => {
  // Matches ES6 import statements (default, named, namespace, side-effect)
  return code.replace(/(^|\n)\s*import\s+[^;]+;?/g, "");
};

export const transformCode = (code: string): string => {
  if (code.includes(RENDER_PREFIX)) return code;

  const match = isComponent(code);
  if (match) {
    const componentName = match[1];
    // Check if render(ComponentName) is already present
    const renderRegex = new RegExp(`render\\(\\s*<?${componentName}\\s*.*>?\\s*\\)`);
    if (renderRegex.test(code)) {
      return code;
    }
    // Append render(<ComponentName />) at the end
    return `
      ${code}
      render(<${componentName} />);
    `;
  }

  // If no component found, wrap code in render(() => { ... }) with console.log override
  return `render(() => {
    const [logs, setLogs] = React.useState<Array<Array<any>>>([]);
    const [error, setError] = useState<Error | null>(null);
    const originalLog = console.log;


    useEffect(() => {
      if(error) {
        throw error;
      }
    }, [error]);


    useEffect(() => {
      console.log = (...args) => {
        setLogs(logs => [...logs, [...args]]);
        onNewLog();
        originalLog(...args);
      };

      const execute = async () => {
        try {
          ${code}
        } catch (error) {
          setError(error);
        }
      };
      
      execute()

      return () => {
        console.log = originalLog;
      };
    }, []);

    return (
      <div className="w-full h-full">
        {!logs?.length && (
          <div className="api-playground__no-logs flex items-center gap-2 px-4">
            <AppWindowMac className="size-6 text-zinc-400" /> No console output yet.
          </div>
        )}
        {logs.map((log, index) => (
          <div key={"log"+index} className="api-playground__log-row flex gap-1">
            <div className="api-playground__log-row__index">
              <div className="text-xs text-zinc-400">
                <Terminal className="size-4" />
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
                    key={"row"+i}
                    code={formatted}
                    language="tsx"
                    theme={themes.vsDark}
                  >
                    {({ className, style, tokens, getLineProps, getTokenProps }) => (
                      <>
                        {tokens.map((line, j) => (
                          <span key={"line"+j} {...getLineProps({ line })}>
                            {line.map((token, key) => (
                              <span key={"token"+key} {...getTokenProps({ token })} />
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

const Content = memo(({ code, scope, isLog }: { code: string; scope: any; isLog: boolean }) => {
  const toast = usePreviewToast();

  const values = useMemo(() => {
    const handleToast = ({
      title = "New notification",
      message,
      type = "default",
    }: {
      title?: string;
      message: string;
      type?: "default" | "success" | "error";
    }) => {
      toast({
        message: <MessageEvent name={title} message={message} type={type} />,
      });
    };
    return {
      ...scope,
      toast: handleToast,
    };
  }, [scope, toast]);

  return (
    <LiveProvider code={code} scope={values} noInline>
      <LivePreview className={cn("api-playground__preview", isLog && "api-playground__preview--log")} />
      <LiveError className="api-playground__error" />
      {!isLog && <Toaster />}
    </LiveProvider>
  );
});

export const Playground = ({
  code,
  defaultTab,
  setOuterTab,
}: {
  code: string;
  defaultTab?: "playground" | "requests";
  setOuterTab: (tab: "playground" | "requests" | "console") => void;
}) => {
  const { debounce } = useDebounce({
    delay: 200,
  });
  const [stringifiedCode, setStringifiedCode] = useState("");
  const [codeKey, setCodeKey] = useState(0);
  const isLog = !isComponent(code);

  const [unreadLogs, setUnreadLogs] = useState(0);
  const [tab, setTab] = useState(defaultTab ?? (isLog ? "requests" : "playground"));
  const [client, setClient] = useState<ClientInstance | null>(
    createClient({
      url: "http://localhost:3000",
    }),
  );

  const scope = useMemo(() => {
    const requests = createGlobalRequests(client as ClientInstance);

    const onNewLog = () => {
      setUnreadLogs((prev) => prev + 1);
    };

    return {
      ...globalScope,
      ...requests,
      client,
      onNewLog,
      // So console.log can be used in the playground and override to render logs
      // This way we are isolating the console.log to the playground
      console: deepClone(window.console),
    };
  }, [client]);

  const onTabChange = (value: "playground" | "requests") => {
    setOuterTab(isLog && value === "playground" ? "console" : value);
    setTab(value);
    // Change to zero when switching to or out of console tab
    setUnreadLogs(0);
  };

  useEffect(() => {
    if (codeKey) {
      setUnreadLogs(0);
      client?.clear();
      setClient(
        createClient({
          url: "http://localhost:3000",
        }),
      );
    }
  }, [codeKey]);

  useLayoutEffect(() => {
    if (!stringifiedCode) {
      setStringifiedCode(pipeline.reduce((transformedCode, fn) => fn(transformedCode), code));
    } else {
      debounce(() => {
        client?.clear();
        setCodeKey((prev) => prev + 1);
        setStringifiedCode(pipeline.reduce((transformedCode, fn) => fn(transformedCode), code));
      });
    }
  }, [code]);

  useLayoutEffect(() => {
    setOuterTab(isLog && tab === "playground" ? "console" : tab);
  }, []);

  return (
    <ToasterProvider>
      <Tabs
        className={cn("api-playground w-full relative")}
        value={tab}
        onValueChange={(value) => onTabChange(value as "playground" | "requests")}
      >
        <TabsList className="ml-3 mt-2">
          <TabsTrigger value="playground" className="relative">
            {isLog ? (
              <>
                Console
                <span
                  className={cn(
                    "absolute -top-0 right-1 flex items-center justify-center rounded-full",
                    "text-white text-xs w-2 h-2 shadow-md z-10 bg-orange-500",
                    unreadLogs > 0 && tab !== "playground" ? "opacity-100" : "!opacity-0",
                    "animate-pulse transition-opacity duration-300",
                  )}
                />
              </>
            ) : (
              "Playground"
            )}
          </TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>
        <TabsContent
          value="playground"
          className="api-playground__content w-full data-[state=inactive]:hidden"
          forceMount
        >
          {stringifiedCode && <Content key={codeKey} code={stringifiedCode} scope={scope} isLog={isLog} />}
        </TabsContent>
        <TabsContent
          value="requests"
          className="api-playground__content w-full data-[state=inactive]:hidden"
          forceMount
        >
          <ClientRequests key={codeKey} client={client} />
        </TabsContent>
      </Tabs>
    </ToasterProvider>
  );
};
