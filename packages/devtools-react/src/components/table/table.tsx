const baseStyle = {
  width: "100%",
  flex: "1 1 auto",
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
