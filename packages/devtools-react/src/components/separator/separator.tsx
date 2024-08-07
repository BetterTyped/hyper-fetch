export const Separator = (props: React.HTMLProps<HTMLDivElement>) => {
  const { style } = props;
  return <div {...props} style={{ width: "1px", height: "100%", background: "rgb(61, 66, 74)", ...style }} />;
};
