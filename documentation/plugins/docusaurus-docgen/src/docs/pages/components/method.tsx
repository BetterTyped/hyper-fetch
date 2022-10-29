import React from "react";

import { PagePropsType } from "types/page.types";
import { getSignature } from "../utils/parsing.utils";
import { Description } from "./description";
import { Name } from "./name";
import { Parameters } from "./parameters";
import { Preview } from "./preview";
import { Returns } from "./returns";
import { Section } from "./section";

export const Method: React.FC<PagePropsType> = (props) => {
  const { reflection } = props;
  const { name } = reflection;
  const methodSignature = getSignature(reflection);

  return (
    <div className="api-docs__method">
      <Name
        {...props}
        reflection={{ ...reflection, name: (<code>{name}()</code>) as unknown as string }}
        headingSize="h3"
      />
      <Section headingSize="h4">Preview</Section>
      <Preview {...props} reflection={methodSignature || reflection} />
      <Section headingSize="h4">Description</Section>
      <Description {...props} reflection={methodSignature || reflection} />
      <Section headingSize="h4">Parameters</Section>
      <Parameters {...props} />
      <Section headingSize="h4">Return</Section>
      <Returns {...props} />
      <hr />
    </div>
  );
};
