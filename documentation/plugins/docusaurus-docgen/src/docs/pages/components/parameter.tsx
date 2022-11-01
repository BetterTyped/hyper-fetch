import React from "react";

import { PagePropsType } from "types/page.types";
import { Code } from "./code";
import { Description } from "./description";
import { Name } from "./name";
import { Type } from "./type";

export const Parameter: React.FC<PagePropsType> = (props) => {
  const { reflection } = props;
  const { name, type } = reflection;

  return (
    <div className="api-docs__parameter">
      <Code fenced={false}>
        <Name {...props} reflection={{ ...reflection, name: `${name}()` }} headingSize="h3" />
      </Code>
      <Description {...props} />
      <Code fenced={false}>
        <Type {...props} reflection={type} />
      </Code>
      <hr />
    </div>
  );
};
