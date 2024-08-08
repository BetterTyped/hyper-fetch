export const Toolbar = ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => {
  return (
    <div
      {...props}
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "5px",
        borderBottom: "1px solid #3d424a",
        padding: "0px 10px",
        background: "rgba(0, 0, 0, 0.1)",
      }}
    >
      {children}
    </div>
  );
};
