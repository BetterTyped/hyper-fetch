import React from "react";

import { PagePropsType } from "types/page.types";
import { Definition } from "./components/definition";
import { Description } from "./components/description";
import { Methods } from "./components/methods";
import { Name } from "./components/name";
import { Parameters } from "./components/parameters";
import { Properties } from "./components/properties";
import { Section } from "./components/section";
import { Separator } from "./components/separator";
import { Sources } from "./components/sources";

export const ClassPage: React.FC<PagePropsType> = (props) => {
  return (
    <>
      <Name {...props} />
      <Separator />
      <Sources {...props} />
      <Section title="Description">
        <Description {...props} />
        <Definition {...props} />
      </Section>
      <Section title="Parameters">
        <Parameters {...props} />
      </Section>
      <Section title="Properties">
        <Properties {...props} />
      </Section>
      <Section title="Methods">
        <Methods {...props} />
      </Section>
    </>
  );
};
