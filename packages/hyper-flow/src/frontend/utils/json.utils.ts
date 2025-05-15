import { parse, stringify } from "superjson";

export const tryParseJson = (json: string) => {
  try {
    return parse(json);
  } catch (error) {
    return null;
  }
};

export const tryStringifyJson = (json: any) => {
  try {
    return stringify(json);
  } catch (error) {
    return null;
  }
};
