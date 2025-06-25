/* eslint-disable react/destructuring-assignment */
import React, { type ReactNode } from "react";
import clsx from "clsx";
import Translate from "@docusaurus/Translate";
import type { Props } from "@theme/Admonition/Type/Warning";
import AdmonitionLayout from "@theme/Admonition/Layout";
import IconWarning from "@theme/Admonition/Icon/Warning";

const infimaClassName = "alert alert--warning";

const defaultProps = {
  icon: <IconWarning />,
  title: (
    <Translate
      id="theme.admonition.warning"
      description="The default label used for the Warning admonition (:::warning)"
    >
      warning
    </Translate>
  ),
};

// eslint-disable-next-line import/no-default-export
export default function AdmonitionTypeWarning(props: Props): ReactNode {
  return (
    <AdmonitionLayout {...defaultProps} {...props} className={clsx(infimaClassName, props.className)}>
      {props.children}
    </AdmonitionLayout>
  );
}
