import React, { type ComponentType, type ReactNode } from "react";
import { processAdmonitionProps } from "@docusaurus/theme-common";
import type { Props } from "@theme/Admonition";
import AdmonitionTypes from "@theme/Admonition/Types";

function getAdmonitionTypeComponent(type: string): ComponentType<Props> {
  const component = AdmonitionTypes[type];
  if (component) {
    return component;
  }
  console.warn(`No admonition component found for admonition type "${type}". Using Info as fallback.`);
  return AdmonitionTypes.info!;
}

// eslint-disable-next-line import/no-default-export
export default function Admonition(unprocessedProps: Props): ReactNode {
  const props = processAdmonitionProps(unprocessedProps);
  const AdmonitionTypeComponent = getAdmonitionTypeComponent(props.type);
  return <AdmonitionTypeComponent {...props} />;
}
