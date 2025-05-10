import React, { type ReactNode } from "react";
import type { Props as CodeBlockProps } from "@theme/CodeBlock";

import OriginalCodeBlock from "../OriginalCodeBlock";
import { LiveCodeBlock } from "./live-code-block";

// TODO Docusaurus v4: remove special case
//  see packages/docusaurus-mdx-loader/src/remark/mdx1Compat/codeCompatPlugin.ts
//  we can just use the metastring instead
declare module "@theme/CodeBlock" {
  interface Props {
    live?: boolean;
  }
}

function isLiveCodeBlock(props: CodeBlockProps): boolean {
  return !!props.live;
}

// eslint-disable-next-line import/no-default-export
export default function CodeBlockEnhancer(props: CodeBlockProps): ReactNode {
  const { metastring } = props;
  const clickToRun = metastring?.includes("clickToRun");

  return isLiveCodeBlock(props) ? (
    <LiveCodeBlock {...props} clickToRun={clickToRun} />
  ) : (
    <OriginalCodeBlock {...props} />
  );
}
