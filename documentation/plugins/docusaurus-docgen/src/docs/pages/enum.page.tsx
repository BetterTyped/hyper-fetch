import React from "react";

import { PagePropsType } from "types/page.types";
import { Definition } from "./components/definition";
import { Description } from "./components/description";
import { Name } from "./components/name";
import { Preview } from "./components/preview";
import { Section } from "./components/section";
import { Separator } from "./components/separator";
import { Sources } from "./components/sources";

export const EnumPage: React.FC<PagePropsType> = (props) => {
  return (
    <>
      <Name {...props} />
      <Separator />
      <Sources {...props} />
      <Section title="Preview">
        <Preview {...props} />
      </Section>
      <Section title="Description">
        <Description {...props} />
        <Definition {...props} />
      </Section>
    </>
  );
};
