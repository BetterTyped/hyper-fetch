export const getSocketUrl = (url: string, queryParams: string) => {
  const fullUrl = `${url}${queryParams}`;
  return fullUrl;
};
