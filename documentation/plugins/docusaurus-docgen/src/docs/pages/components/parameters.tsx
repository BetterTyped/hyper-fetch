import React from "react";

import { HeadingType } from "types/components.types";
import { PagePropsType } from "types/page.types";
import { getSignature } from "../utils/parsing.utils";
import { Code } from "./code";
import { Description } from "./description";
import { Type } from "./type";

export const Parameters: React.FC<PagePropsType & Partial<HeadingType>> = (props) => {
  const { reflection, headingSize = "h3" } = props;
  const signature = getSignature(reflection);

  if (!signature?.parameters) return null;

  const { parameters } = signature;
  const Tag = headingSize;

  return (
    <div className="api-docs__parameters">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((param, index) => {
            return (
              <tr key={index} param-data={param.name}>
                <td
                  className={`api-docs__param-name ${
                    param.flags.isOptional ? "optional" : "required"
                  }`}
                >
                  <Tag>{param.name} </Tag>
                  <Code fenced={false}>{param.flags.isOptional ? "Optional" : "Required"}</Code>
                </td>
                <td className="api-docs__param-type">
                  <Description {...props} reflection={param} />
                  <Code fenced={false}>
                    <Type {...props} reflection={param.type} />
                  </Code>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
