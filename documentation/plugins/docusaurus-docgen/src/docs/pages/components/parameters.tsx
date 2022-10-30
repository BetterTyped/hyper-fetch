import React from "react";

import { PagePropsType } from "types/page.types";
import { getSignature } from "../utils/parsing.utils";
import { Code } from "./code";
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
            <th>Default</th>
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
                  <b>{param.name} </b>
                  <Code fenced={false}>{param.flags.isOptional ? "Optional" : "Required"}</Code>
                </td>
                <td className="api-docs__param-type">
                  <Code fenced={false}>
                    <Type {...props} reflection={param.type} />
                  </Code>
                </td>
                <td className="api-docs__param-default">{param.defaultValue}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
