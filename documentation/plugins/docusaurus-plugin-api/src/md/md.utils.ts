export const flattenText = (value: string) => {
  return value.trim().replace(/(\r\n|\n|\r)/gm, "");
};
