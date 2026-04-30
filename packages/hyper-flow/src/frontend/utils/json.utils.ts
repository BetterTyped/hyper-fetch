import { parse, stringify } from "superjson";

export const tryParseJson = (json: string) => {
  try {
    return parse(json);
  } catch {
    return null;
  }
};

export const tryStringifyJson = (json: any) => {
  try {
    return stringify(json);
  } catch {
    return null;
  }
};
