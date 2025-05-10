/* eslint-disable react/no-array-index-key */
import EditorImport from "react-simple-code-editor";
import { Highlight, themes } from "prism-react-renderer";

import CopyButton from "../../../OriginalCodeBlock/CopyButton";
import styles from "../../../OriginalCodeBlock/Content/styles.module.css";

const highlightLines = (input: string) => {
  const theme = themes.vsDark;
  return (
    <Highlight code={input} theme={theme} language="tsx">
      {({ tokens, getLineProps, getTokenProps }) => (
        <>
          {tokens.map((line, lineIndex) => (
            <span key={`line-${lineIndex}`} {...getLineProps({ line })}>
              {line
                .filter((token) => !token.empty)
                .map((token, tokenIndex) => (
                  <span key={`token-${tokenIndex}`} {...getTokenProps({ token })} />
                ))}
              <br />
            </span>
          ))}
        </>
      )}
    </Highlight>
  );
};

export const Editor = ({ code, setCode }: { code: string; setCode: (code: string) => void }) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const CodeEditor = EditorImport?.default || EditorImport;

  return (
    <div className="p-[1px]">
      <div className="api-playground__editor-wrapper relative">
        <div className={styles.buttonGroup}>
          <div className="!p-2 mt-6">
            <CopyButton code={code} className="clean-btn" />
          </div>
        </div>
        <CodeEditor
          className="api-playground__editor"
          highlight={highlightLines}
          padding={10}
          tabSize={4}
          value={code}
          onValueChange={setCode}
          style={{
            fontFamily: "'Fira Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace",
            fontSize: "12px",
            letterSpacing: 0,
            whiteSpace: "pre",
          }}
        />
      </div>
    </div>
  );
};
