const baseStyles = {
  border: "0px",
  borderRadius: "4px",
  padding: "3px 8px",
  fontSize: "12px",
  fontWeight: 500,
};

const styles = {
  blue: {
    color: "#00bbd4",
    background: "transparent",
    border: "1px solid rgb(61, 66, 74)",
  },
  green: {
    color: "#4CAF50",
    background: "transparent",
    border: "1px solid rgb(61, 66, 74)",
  },
  red: {
    color: "#F44336",
    background: "transparent",
    border: "1px solid rgb(61, 66, 74)",
  },
  gray: {
    color: "#607d8b",
    background: "transparent",
    border: "1px solid rgb(61, 66, 74)",
  },
  orange: {
    color: "#FF9800",
    background: "transparent",
    border: "1px solid rgb(61, 66, 74)",
  },
  inactive: {
    color: "#475055",
    background: "transparent",
    border: "1px solid rgb(61, 66, 74)",
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
