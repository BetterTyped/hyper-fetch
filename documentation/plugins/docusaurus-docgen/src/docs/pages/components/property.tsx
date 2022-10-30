import React from "react";

import { PagePropsType } from "types/page.types";
import { getSignature } from "../utils/parsing.utils";
import { Code } from "./code";
import { Definition } from "./definition";
import { Description } from "./description";
import { Name } from "./name";
import { Section } from "./section";
import { Sources } from "./sources";
import { Type } from "./type";

export const Property: React.FC<PagePropsType> = (props) => {
  const { reflection } = props;
  const { name, type } = reflection;
  const methodSignature = getSignature(reflection);

  return (
    <div className="api-docs__property" property-data={name}>
      <Name
        {...props}
        reflection={{ ...reflection, name: (<code>{name}</code>) as unknown as string }}
        headingSize="h3"
      />
      <Sources {...props} />
      <Section headingSize="h4" title="Description">
        <Description {...props} reflection={methodSignature || reflection} />
        <Definition {...props} reflection={reflection} />
      </Section>
      <Section headingSize="h4" title="Type">
        <div className="api-docs__property-type">
          <Code>
            <Type {...props} reflection={type} />
          </Code>
        </div>
      </Section>
      <hr />
    </div>
  );
};
