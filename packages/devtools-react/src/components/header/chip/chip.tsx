const baseStyles = {
  border: "0px",
  borderRadius: "4px",
  padding: "3px 8px",
  fontSize: "12px",
  fontWeight: 500,
};

const styles = {
  blue: {
    background: "rgb(88 196 220)",
    color: "#fff",
  },
  green: {
    background: "rgb(12 198 112)",
    color: "#fff",
  },
  red: {
    background: "rgb(255 61 61)",
    color: "#fff",
  },
  gray: {
    background: "rgb(149 163 171)",
    color: "#fff",
  },
  orange: {
    background: "rgb(230 168 8)",
    color: "#fff",
  },
};

export const Chip = ({
  children,
  color = "green",
  ...props
}: React.DetailedHTMLProps<React.HTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  color?: "green" | "red" | "blue" | "gray" | "orange";
}) => {
  return (
    <button type="button" {...props} style={{ ...baseStyles, ...styles[color], ...props.style }}>
      {children}
    </button>
  );
};
