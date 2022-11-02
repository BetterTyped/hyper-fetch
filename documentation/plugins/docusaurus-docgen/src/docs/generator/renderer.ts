import React from "react";

import { PagePropsType } from "types/page.types";
import { transformMarkdown } from "../../utils/md.utils";

/**
 * Rendering
 * @param props
 * @param component
 * @returns
 */
export const renderer = <T extends React.FC<PagePropsType>>(props: PagePropsType, component: T) => {
  return transformMarkdown(component(props) as React.ReactElement);
};
