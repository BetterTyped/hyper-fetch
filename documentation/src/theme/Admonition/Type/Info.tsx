/* eslint-disable react/destructuring-assignment */
import React, { type ReactNode } from "react";
import clsx from "clsx";
import Translate from "@docusaurus/Translate";
import type { Props } from "@theme/Admonition/Type/Info";
import AdmonitionLayout from "@theme/Admonition/Layout";
import IconInfo from "@theme/Admonition/Icon/Info";

const infimaClassName = "alert alert--info";

const defaultProps = {
  icon: <IconInfo />,
  title: (
    <Translate id="theme.admonition.info" description="The default label used for the Info admonition (:::info)">
      info
    </Translate>
  ),
};

// eslint-disable-next-line import/no-default-export
export default function AdmonitionTypeInfo(props: Props): ReactNode {
  return (
    <AdmonitionLayout {...defaultProps} {...props} className={clsx(infimaClassName, props.className)}>
      {props.children}
    </AdmonitionLayout>
  );
}
