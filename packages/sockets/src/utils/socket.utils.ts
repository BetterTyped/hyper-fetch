export const getSocketUrl = (url: string, queryParams: string) => {
  const queryPrefix = queryParams ? "?" : "";
  const fullUrl = `${url}${queryPrefix}${queryParams}`;
  return fullUrl;
};
