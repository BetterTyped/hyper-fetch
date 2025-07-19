declare module "*.png" {
  const content: string;
  // eslint-disable-next-line import/no-default-export
  export default content;
}

declare module "*.webp" {
  const content: string;
  // eslint-disable-next-line import/no-default-export
  export default content;
}

declare module "*.mp4" {
  const content: string;
  // eslint-disable-next-line import/no-default-export
  export default content;
}

declare module "*.svg" {
  const content: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  // eslint-disable-next-line import/no-default-export
  export default content;
}
