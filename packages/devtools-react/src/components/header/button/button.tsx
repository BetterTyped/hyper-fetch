const baseStyles = {
  border: "0px",
  padding: "14px 14px 12px",
  fontSize: "14px",
  fontWeight: 500,
};

const styles = {
  primary: {
    background: "transparent",
    borderBottom: "2px solid rgb(88 196 220)",
    color: "#fff",
  },
  secondary: {
    background: "transparent",
    borderBottom: "2px solid transparent",
    color: "#b4c2cc",
  },
};

export const Button = ({
  children,
  color = "primary",
  ...props
}: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  color?: "primary" | "secondary";
}) => {
  return (
    <button type="button" {...props} style={{ ...baseStyles, ...styles[color], ...props.style }}>
      {children}
    </button>
  );
};
