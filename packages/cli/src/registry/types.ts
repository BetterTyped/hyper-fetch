export type Meta = {
  name: string;
  description: string;
  url: string;
};

export type SDK = {
  meta: Meta;
  versions: {
    version: string;
    path: string;
  }[];
};
