export const getStatus = (res: any): "success" | "emptyResource" => {
  // Deliberate == instead of ===
  return (Array.isArray(res) && res.length === 0) || res == null ? "emptyResource" : "success";
};

export const isDocOrQuery = (fullUrl: string): string => {
  const withoutSurroundingSlashes = fullUrl.replace(/^\/|\/$/g, "");
  const pathElements = withoutSurroundingSlashes.split("/").length;
  return pathElements % 2 === 0 ? "doc" : "query";
};
