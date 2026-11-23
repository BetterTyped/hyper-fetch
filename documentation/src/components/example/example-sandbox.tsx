import { SandpackLayout, SandpackPreview, SandpackProvider } from "@codesandbox/sandpack-react";
import React, { useEffect, useState } from "react";

import type { ExampleSandbox as ExampleSandboxData } from "../../../plugins/examples";
import { getSandboxFileName } from "./example.utils";

export type ExampleSandboxProps = {
  /** Folder of the example inside `examples/`, for example `react/basic`. */
  path: string;
  /** Height of the preview in pixels. */
  height: number;
};

const Message = ({ children, height }: { children: React.ReactNode; height: number }) => (
  <div style={{ height }} className="flex items-center justify-center px-6 text-center text-sm text-zinc-400">
    {children}
  </div>
);

/**
 * Runs a browser-only example in the page with Sandpack. Its files and dependencies come from the data file the
 * examples plugin writes at build time, so the preview runs the same code CI builds. Sandpack bundles it in the
 * browser and installs packages from npm, so it needs no WebContainer, no cross-origin isolation and works in every
 * browser.
 */
const ExampleSandbox = ({ path, height }: ExampleSandboxProps) => {
  const [sandbox, setSandbox] = useState<ExampleSandboxData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setSandbox(null);
    setFailed(false);
    import(`@generated/hyper-fetch-examples/default/${getSandboxFileName(path)}`)
      .then((module: { default: ExampleSandboxData }) => active && setSandbox(module.default))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [path]);

  if (failed) return <Message height={height}>This example could not be loaded. Open it in StackBlitz instead.</Message>;
  if (!sandbox) return <Message height={height}>Loading the example...</Message>;

  return (
    <SandpackProvider
      key={path}
      template="react-ts"
      theme="dark"
      files={sandbox.files}
      customSetup={{ entry: sandbox.entry, dependencies: sandbox.dependencies }}
      options={{ initMode: "user-visible", autorun: true }}
    >
      <SandpackLayout style={{ border: 0, borderRadius: 0 }}>
        <SandpackPreview style={{ height }} showOpenInCodeSandbox={false} showRefreshButton />
      </SandpackLayout>
    </SandpackProvider>
  );
};

export default ExampleSandbox;
