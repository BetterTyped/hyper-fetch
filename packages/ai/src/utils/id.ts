let counter = 0;

/** Random-enough unique id for messages, parts and runs. Uses `crypto.randomUUID` when available. */
export const generateId = (prefix = ""): string => {
  const random =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID().replaceAll("-", "").slice(0, 16)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  counter += 1;
  return `${prefix}${random}${counter.toString(36)}`;
};
