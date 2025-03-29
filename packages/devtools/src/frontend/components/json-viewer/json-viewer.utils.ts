import type { Theme } from "react-base16-styling";
import { KeyPath } from "react-json-tree";

export const getTheme = ({ isLight }: { isLight: boolean }): Theme => {
  if (!isLight) {
    return {
      scheme: "bright",
      base00: "transparent",
      base01: "#444c56",
      base02: "#58626d",
      base03: "#6a737d",
      base04: "#a0a6ab",
      base05: "#c8ccd1",
      base06: "#e2e5e9",
      base07: "#f0f3f6",
      base08: "#ff0000",
      base09: "#ffa500",
      base0A: "#ffc0cb",
      base0B: "#008000",
      base0C: "#0000ff",
      base0D: "#0000ff",
      base0E: "#800080",
      base0F: "#0000ff",
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
  }
  return {
    scheme: "bright",
    base00: "transparent",
    base01: "#444c56",
    base02: "#58626d",
    base03: "#6a737d",
    base04: "#a0a6ab",
    base05: "#c8ccd1",
    base06: "#e2e5e9",
    base07: "#f0f3f6",
    base08: "#ff0000",
    base09: "#ffa500",
    base0A: "#ffc0cb",
    base0B: "#008000",
    base0C: "#0000ff",
    base0D: "#0000ff",
    base0E: "#800080",
    base0F: "#0000ff",
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
