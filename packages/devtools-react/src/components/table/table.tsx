const baseStyle = {
  width: "100%",
  borderSpacing: "0",
};

export const Table = (props: React.HTMLProps<HTMLTableElement>) => {
  const { style } = props;
  return (
    <div style={{ overflow: "auto" }}>
      <table {...props} style={{ ...baseStyle, ...style }} />
    </div>
  );
};
