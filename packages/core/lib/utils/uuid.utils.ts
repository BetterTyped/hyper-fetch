export const getUniqueRequestId = (key: string) => {
  return `${key}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2)}`;
};
