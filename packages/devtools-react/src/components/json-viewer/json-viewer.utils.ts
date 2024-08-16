// TODO: Improve immutability

import { KeyPath } from "react-json-tree";

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
