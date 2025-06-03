export const isBrowser = () => {
  try {
    return typeof window !== "undefined";
  } catch (err) {
    return false;
  }
};
