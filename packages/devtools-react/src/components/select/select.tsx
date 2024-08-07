const baseStyles = {
  padding: "12x 14px",
  fontSize: "14px",
  fontWeight: 500,
  borderRadius: "4px",
  background: "transparent",
  color: "rgb(180, 194, 204)",
  height: "22px",
  border: "1px solid rgb(77, 78, 79)",
};

export const Select = (props: React.HTMLProps<HTMLSelectElement> & { options: { value: string; label: string }[] }) => {
  const { options, style, ...selectProps } = props;

  return (
    <select {...selectProps} style={{ ...baseStyles, ...style }}>
      {options.map((option) => (
        <option key={option.value}>{option.label}</option>
      ))}
    </select>
  );
};
