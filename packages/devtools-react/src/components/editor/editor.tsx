import React, { useLayoutEffect } from "react";
import MonacoEditor, { EditorProps } from "@monaco-editor/react";
import { editor } from "monaco-editor";

import { useDevtoolsContext } from "../../devtools.context";

editor.defineTheme("light", {
  base: "hc-light",
  inherit: true,
  rules: [
    {
      token: "identifier",
      foreground: "9CDCFE",
    },
    {
      token: "identifier.function",
      foreground: "DCDCAA",
    },
    {
      token: "type",
      foreground: "1AAFB0",
    },
  ],
  colors: {},
});

editor.defineTheme("dark", {
  base: "vs-dark",
  inherit: true,
  rules: [
    {
      token: "identifier",
      foreground: "9CDCFE",
    },
    {
      token: "identifier.function",
      foreground: "DCDCAA",
    },
    {
      token: "type",
      foreground: "1AAFB0",
    },
  ],
  colors: {},
});

export const Editor = (props: EditorProps) => {
  const { theme } = useDevtoolsContext("DevtoolsEditor");

  useLayoutEffect(() => {
    editor.setTheme(theme === "light" ? "light" : "dark");
  }, [theme]);

  return (
    <MonacoEditor
      options={{
        scrollBeyondLastLine: false,
      }}
      height="300px"
      defaultLanguage="JSON"
      {...props}
    />
  );
};
