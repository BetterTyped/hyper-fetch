import React, { type ReactNode } from "react";
import DocsRoot from "@theme-original/DocsRoot";
import type DocsRootType from "@theme/DocsRoot";
import type { WrapperProps } from "@docusaurus/types";

import { Cookies } from "../../components/cookies/cookies";

type Props = WrapperProps<typeof DocsRootType>;

// eslint-disable-next-line import/no-default-export
export default function DocsRootWrapper(props: Props): ReactNode {
  return (
    <>
      <DocsRoot {...props} />
      <Cookies />
    </>
  );
}
