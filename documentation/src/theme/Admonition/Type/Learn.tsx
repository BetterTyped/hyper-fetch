/* eslint-disable react/destructuring-assignment */
import React, { type ReactNode } from "react";
import clsx from "clsx";
import Translate from "@docusaurus/Translate";
import type { Props } from "@theme/Admonition/Type/Note";
import AdmonitionLayout from "@theme/Admonition/Layout";

import IconLearn from "../Icon/Learn";

const infimaClassName = "alert alert--learn";

const defaultProps = {
  icon: <IconLearn />,
  title: (
    <Translate id="theme.admonition.note" description="The default label used for the Note admonition (:::note)">
      note
    </Translate>
  ),
};

// eslint-disable-next-line import/no-default-export
export default function AdmonitionTypeLearn(props: Props): ReactNode {
  return (
    <AdmonitionLayout {...defaultProps} {...props} className={clsx(infimaClassName, props.className)}>
      {props.children}
    </AdmonitionLayout>
  );
}
