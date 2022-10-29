import React from "react";

import { PagePropsType } from "types/page.types";
import { Description } from "./components/description";
import { Name } from "./components/name";
import { Preview } from "./components/preview";
import { Section } from "./components/section";

export const VarPage: React.FC<PagePropsType> = (props) => {
  return (
    <>
      <Name {...props} />
      <Section>Preview</Section>
      <Preview {...props} />
      <Section>Description</Section>
      <Description {...props} />
    </>
  );
};
