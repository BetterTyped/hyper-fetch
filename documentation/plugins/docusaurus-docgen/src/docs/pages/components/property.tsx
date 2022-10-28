import React from "react";

import { PagePropsType } from "types/page.types";
import { getSignature } from "../utils/parsing.utils";
import { Description } from "./description";
import { Name } from "./name";
import { Type } from "./type";

export const Property: React.FC<PagePropsType> = (props) => {
  const { reflection } = props;
  const { name, type } = reflection;
  const methodSignature = getSignature(reflection);

  return (
    <div className="api-docs__property">
      <code>
        <Name {...props} reflection={{ ...reflection, name: `${name}()` }} headingSize="h3" />
      </code>
      <Description {...props} reflection={methodSignature || reflection} />
      <code>
        Type: <Type {...props} reflection={type} />
      </code>
      <hr />
    </div>
  );
};
