import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import type {Props} from '@theme/MDXComponents/A';

export default function MDXA(props: Props): ReactNode {
  return <Link {...props} />;
}
