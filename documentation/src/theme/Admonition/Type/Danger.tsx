/* eslint-disable react/destructuring-assignment */
import React, { type ReactNode } from "react";
import clsx from "clsx";
import Translate from "@docusaurus/Translate";
import type { Props } from "@theme/Admonition/Type/Danger";
import AdmonitionLayout from "@theme/Admonition/Layout";
import IconDanger from "@theme/Admonition/Icon/Danger";

const infimaClassName = "alert alert--danger";

const defaultProps = {
  icon: <IconDanger />,
  title: (
    <Translate id="theme.admonition.danger" description="The default label used for the Danger admonition (:::danger)">
      danger
    </Translate>
  ),
};

// eslint-disable-next-line import/no-default-export
export default function AdmonitionTypeDanger(props: Props): ReactNode {
  return (
    <AdmonitionLayout {...defaultProps} {...props} className={clsx(infimaClassName, props.className)}>
      {props.children}
    </AdmonitionLayout>
  );
}
