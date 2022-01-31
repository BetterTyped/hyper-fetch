export type MdOptions = {
  hasHeading?: boolean;
  headingSize?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
  descriptionSize?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
};

export type ParamOptions = {
  type: "link" | "preview" | "simple" | "complex";
  headingSize?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
  descriptionSize?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
};

export type MethodOptions = {
  type: "link" | "preview" | "simple" | "complex";
  headingSize?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
  paramsHeadingSize?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
  descriptionSize?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
};
