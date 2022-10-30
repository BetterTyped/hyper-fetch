import React from "react";

import { PagePropsType } from "types/page.types";
import { getSignature } from "../utils/parsing.utils";
import { Definition } from "./definition";
import { Description } from "./description";
import { Name } from "./name";
import { Parameters } from "./parameters";
import { Preview } from "./preview";
import { Returns } from "./returns";
import { Section } from "./section";
import { Sources } from "./sources";

export const Method: React.FC<PagePropsType> = (props) => {
  const { reflection } = props;
  const { name } = reflection;
  const methodSignature = getSignature(reflection);

  return (
    <div className="api-docs__method" method-data={name}>
      <Name
        {...props}
        reflection={{ ...reflection, name: (<code>{name}()</code>) as unknown as string }}
        headingSize="h3"
      />
      <Sources {...props} />
      <Section headingSize="h4" title="Preview">
        <Preview {...props} reflection={methodSignature || reflection} />
      </Section>
      <Section headingSize="h4" title="Description">
        <Description {...props} reflection={methodSignature || reflection} />
        <Definition {...props} reflection={reflection} />
      </Section>
      <Section headingSize="h4" title="Parameters">
        <Parameters {...props} />
      </Section>
      <Section headingSize="h4" title="Return">
        <Returns {...props} />
      </Section>
      <hr />
    </div>
  );
};
