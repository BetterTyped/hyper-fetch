import React from "react";

import { PagePropsType } from "types/page.types";
import { getSignature } from "../utils/parsing.utils";
import { Description } from "./description";
import { Type } from "./type";

export const Parameters: React.FC<PagePropsType> = (props) => {
  const { reflection } = props;
  const signature = getSignature(reflection);

  if (!signature?.parameters) return null;

  const { parameters } = signature;

  return (
    <div className="api-docs__parameters">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((param, index) => {
            return (
              <tr key={index}>
                <th>{param.name}</th>
                <th>
                  <code>
                    <Type {...props} reflection={param.type} />
                  </code>
                </th>
                <th>
                  <Description {...props} reflection={param} />
                </th>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
