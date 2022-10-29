import React from "react";

import { PagePropsType } from "types/page.types";
import { getProperties } from "../utils/parsing.utils";
import { Description } from "./description";
import { Type } from "./type";

export const Properties: React.FC<PagePropsType> = (props) => {
  const { reflection } = props;
  const { children } = reflection;

  if (!children) return null;

  const properties = getProperties(reflection);

  return (
    <div className="api-docs__properties">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((prop, index) => {
            return (
              <tr key={index}>
                <th>{prop.name}</th>
                <th>
                  <code>
                    <Type {...props} reflection={prop} />
                  </code>
                </th>
                <th>
                  <Description {...props} reflection={prop} />
                </th>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
