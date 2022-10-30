import React from "react";

import { PagePropsType } from "types/page.types";
import { Definition } from "./components/definition";
import { Description } from "./components/description";
import { Methods } from "./components/methods";
import { Name } from "./components/name";
import { Parameters } from "./components/parameters";
import { Properties } from "./components/properties";
import { Section } from "./components/section";

export const ClassPage: React.FC<PagePropsType> = (props) => {
  return (
    <>
      <Name {...props} />
      <Section>Description</Section>
      <Description {...props} />
      <Definition {...props} />
      <Section>Parameters</Section>
      <Parameters {...props} />
      <Section>Properties</Section>
      <Properties {...props} />
      <Section>Methods</Section>
      <Methods {...props} />
    </>
  );
};
