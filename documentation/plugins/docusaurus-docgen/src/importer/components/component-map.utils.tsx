import React from "react";

import { PagePropsType } from "types/page.types";
import { Definition } from "../../docs/pages/components/definition";
import { Returns } from "../../docs/pages/components/returns";
import { Generics } from "../../docs/pages/components/generics";
import { Import } from "../../docs/pages/components/import";
import { Method } from "../../docs/pages/components/method";
import { Methods } from "../../docs/pages/components/methods";
import { Name } from "../../docs/pages/components/name";
import { Parameter } from "../../docs/pages/components/parameter";
import { Parameters } from "../../docs/pages/components/parameters";
import { Preview } from "../../docs/pages/components/preview";
import { Properties } from "../../docs/pages/components/properties";
import { Property } from "../../docs/pages/components/property";
import { Description } from "../../docs/pages/components/description";
import { Signature } from "../../docs/pages/components/signature";
import { Sources } from "../../docs/pages/components/sources";
import { Type } from "../../docs/pages/components/type";

export const getComponent = (component: string): React.FC<PagePropsType> => {
  switch (component.charAt(0).toUpperCase() + component.slice(1)) {
    case "definition": {
      return Definition;
    }
    case "description": {
      return Description;
    }
    case "generics": {
      return Generics;
    }
    case "import": {
      return Import;
    }
    case "method": {
      return Method;
    }
    case "methods": {
      return Methods;
    }
    case "name": {
      return Name;
    }
    case "parameter": {
      return Parameter;
    }
    case "parameters": {
      return Parameters;
    }
    case "preview": {
      return Preview;
    }
    case "property": {
      return Property;
    }
    case "properties": {
      return Properties;
    }
    case "returns": {
      return Returns;
    }
    case "signature": {
      return Signature;
    }
    case "sources": {
      return Sources;
    }
    case "type": {
      return Type as React.FC<PagePropsType>;
    }
    default: {
      throw new Error("Component type not found");
    }
  }
};
