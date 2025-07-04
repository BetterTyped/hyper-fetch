/* eslint-disable react/destructuring-assignment */
import React, { type ReactNode } from "react";
import clsx from "clsx";
import Translate from "@docusaurus/Translate";
import type { Props } from "@theme/Admonition/Type/Tip";
import AdmonitionLayout from "@theme/Admonition/Layout";

import IconSuccess from "../Icon/Success";

const infimaClassName = "alert alert--success";

const defaultProps = {
  icon: <IconSuccess />,
  title: (
    <Translate id="theme.admonition.tip" description="The default label used for the Tip admonition (:::tip)">
      tip
    </Translate>
  ),
};

// eslint-disable-next-line import/no-default-export
export default function AdmonitionTypeSuccess(props: Props): ReactNode {
  return (
    <AdmonitionLayout {...defaultProps} {...props} className={clsx(infimaClassName, props.className)}>
      {props.children}
    </AdmonitionLayout>
  );
}
