import type { Theme } from "react-base16-styling";
import type { KeyPath } from "react-json-tree";

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

type DataKeys = (string | number)[];

/**
 * react-json-tree key paths go from the leaf up. With the root shown they end with its "root" label, with `hideRoot`
 * they don't. Returns the keys from the top of the data down to the leaf.
 */
export const toDataKeys = (path: KeyPath, hideRoot: boolean): DataKeys => {
  const keys = hideRoot ? [...path] : [...path].slice(0, -1);
  return keys.toReversed();
};

const isContainer = (value: unknown): value is Record<string | number, unknown> => {
  return typeof value === "object" && value !== null;
};

/** Set the value at the given keys. Keys that don't exist in the data leave it unchanged. */
export const updateValue = <S extends object>(target: S, keys: DataKeys, value: unknown): S => {
  const lastKey = keys.at(-1);
  if (lastKey === undefined) {
    return target;
  }

  let reference: unknown = target;
  for (const key of keys.slice(0, -1)) {
    if (!isContainer(reference) || !(key in reference)) {
      return target;
    }
    reference = reference[key];
  }

  if (isContainer(reference) && lastKey in reference) {
    reference[lastKey] = value;
  }
  return target;
};

/** Read the value at the given keys, `undefined` when it does not exist. */
export const getRaw = (target: unknown, keys: DataKeys): unknown => {
  let reference: unknown = target;
  for (const key of keys) {
    if (!isContainer(reference) || !(key in reference)) {
      return undefined;
    }
    reference = reference[key];
  }
  return reference;
};
