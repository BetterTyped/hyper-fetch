const baseStyles = {
  border: "0px",
  borderRadius: "100%",
  padding: "6px",
  width: "28px",
  height: "28px",
  display: "flex",
  background: "transparent",
};

export const IconButton = ({
  children,
  ...props
}: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => {
  return (
    <button type="button" {...props} style={{ ...baseStyles, ...props.style }}>
      {children}
    </button>
  );
};
