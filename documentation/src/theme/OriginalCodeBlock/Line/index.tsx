import React, { type ReactNode } from "react";
import clsx from "clsx";
import type { Props } from "@theme/CodeBlock/Line";

import styles from "./styles.module.css";

// eslint-disable-next-line import/no-default-export
export default function CodeBlockLine({
  line,
  classNames,
  showLineNumbers,
  getLineProps,
  getTokenProps,
}: Props): ReactNode {
  if (line.length === 1 && line[0]!.content === "\n") {
    // eslint-disable-next-line no-param-reassign
    line[0]!.content = "";
  }

  const lineProps = getLineProps({
    line,
    className: clsx(classNames, showLineNumbers && styles.codeLine),
  });

  // eslint-disable-next-line react/no-array-index-key
  const lineTokens = line.map((token, key) => <span key={key} {...getTokenProps({ token })} />);

  return (
    <span {...lineProps}>
      {showLineNumbers ? (
        <>
          <span className={styles.codeLineNumber} />
          <span className={styles.codeLineContent}>{lineTokens}</span>
        </>
      ) : (
        lineTokens
      )}
      <br />
    </span>
  );
}
