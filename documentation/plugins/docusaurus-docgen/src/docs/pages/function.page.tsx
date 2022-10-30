import React from "react";

import { PagePropsType } from "types/page.types";
import { Definition } from "./components/definition";
import { Description } from "./components/description";
import { Name } from "./components/name";
import { Parameters } from "./components/parameters";
import { Preview } from "./components/preview";
import { Returns } from "./components/returns";
import { Section } from "./components/section";

export const FunctionPage: React.FC<PagePropsType> = (props) => {
  return (
    <>
      <Name {...props} />
      <Section>Preview</Section>
      <Preview {...props} />
      <Section>Description</Section>
      <Description {...props} />
      <Definition {...props} />
      <Section>Parameters</Section>
      <Parameters {...props} />
      <Section>Returns</Section>
      <Returns {...props} />
    </>
  );
};
