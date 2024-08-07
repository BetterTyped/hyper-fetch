const baseStyles = {
  border: "0px",
  borderRadius: "4px",
  padding: "3px 8px",
  fontSize: "12px",
  fontWeight: 500,
};

const styles = {
  blue: {
    background: "#00bcd4",
    color: "#fff",
  },
  green: {
    background: "#4CAF50",
    color: "#fff",
  },
  red: {
    background: "#F44336",
    color: "#fff",
  },
  gray: {
    background: "#607d8b",
    color: "#fff",
  },
  orange: {
    background: "#FF9800",
    color: "#fff",
  },
  inactive: {
    background: "#475055",
    color: "#838181",
  },
};

export const Chip = ({
  children,
  color = "green",
  ...props
}: React.DetailedHTMLProps<React.HTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  color?: keyof typeof styles;
}) => {
  return (
    <button type="button" {...props} style={{ ...baseStyles, ...styles[color], ...props.style }}>
      {children}
    </button>
  );
};
