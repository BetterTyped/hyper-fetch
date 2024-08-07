const baseStyles = {
  border: "0px",
  padding: "6x 14px",
  fontSize: "14px",
  fontWeight: 500,
  borderRadius: "4px",
};

const styles = {
  primary: {
    background: "#00bcd4",
    color: "#fff",
  },
  secondary: {
    background: "#009688",
    color: "#fff",
  },
  tertiary: {
    background: "#607d8b",
    color: "#fff",
  },
  quaternary: {
    background: "#2196f3",
    color: "#fff",
  },
  warning: {
    background: "#FF9800",
    color: "#fff",
  },
  error: {
    background: "#F44336",
    color: "#fff",
  },
};

export const Button = ({
  children,
  color = "primary",
  ...props
}: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  color?: keyof typeof styles;
}) => {
  return (
    <button type="button" {...props} style={{ ...baseStyles, ...styles[color], ...props.style }}>
      {children}
    </button>
  );
};
