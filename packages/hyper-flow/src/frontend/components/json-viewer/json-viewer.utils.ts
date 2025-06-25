import type { Theme } from "react-base16-styling";
import { KeyPath } from "react-json-tree";

export const theme: Theme = {
  scheme: "modern-vscode",
  base00: "transparent",
  base01: "#1e1e1e",
  base02: "#2d2d30",
  base03: "#858585",
  base04: "#d4d4d4",
  base05: "#e2e2e2",
  base06: "#f0f0f0",
  base07: "#ffffff",
  base08: "#ff6b6b",
  base09: "#e6b673",
  base0A: "#f9d649",
  base0B: "#7bd88f",
  base0C: "#5cc5c0",
  base0D: "#6ab0f3",
  base0E: "#d466a9",
  base0F: "#e85858",
  // eslint-disable-next-line max-params
  nestedNode: ({ style }) => {
    return {
      style: {
        ...style,
        transform: "translateX(10px)",
      },
    };
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateValue = <S extends object>(target: S, path: KeyPath, value: any): S => {
  const keys = [...path].reverse();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reference: any = typeof target === "object" ? new Proxy(target, {}) : target;
  if (typeof target === "object" && target !== null) {
    keys.forEach((key, index) => {
      if (keys.length - 2 >= index && key in reference) {
        reference = reference[key];
      }
    });
    if (keys[keys.length - 1] in reference) {
      reference[keys[keys.length - 1]] = value;
    }
  } else {
    return value;
  }
  return target;
};

export const getRaw = (target: any, path: KeyPath): any => {
  const keys = path;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reference: any = target;
  if (typeof target === "object" && target !== null) {
    keys.forEach((key, index) => {
      if (keys.length - 1 >= index && key in reference) {
        reference = reference[key];
      }
    });
  }
  return reference;
};
