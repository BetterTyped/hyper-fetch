import React from "react";

import { PagePropsType } from "types/page.types";
import { Description } from "./description";
import { Name } from "./name";
import { Type } from "./type";

export const Parameter: React.FC<PagePropsType> = (props) => {
  const { reflection } = props;
  const { name, type } = reflection;

  return (
    <div className="api-docs__parameter">
      <code>
        <Name {...props} reflection={{ ...reflection, name: `${name}()` }} headingSize="h3" />
      </code>
      <Description {...props} />
      <code>
        <Type {...props} reflection={type} />
      </code>
      <hr />
    </div>
  );
};
