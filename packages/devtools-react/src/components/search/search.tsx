const baseStyle = {
  backgroundColor: "transparent",
  fontSize: "14px",
  color: "#fff",
  padding: "2px 2px 2px 22px",
  outline: "none",
  minWidth: "80px",
  borderRadius: "4px",
  border: "1px solid rgb(77, 78, 79)",
};

export const Search = ({
  ...props
}: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>) => {
  return (
    <div style={{ display: "flex", gap: "2px", position: "relative" }}>
      <svg
        version="1.1"
        id="fi_149852"
        xmlns="http://www.w3.org/2000/svg"
        x="0px"
        y="0px"
        viewBox="0 0 56.966 56.966"
        xmlSpace="preserve"
        height="100%"
        width="14px"
        style={{
          position: "absolute",
          pointerEvents: "none",
          marginLeft: "5px",
        }}
      >
        <path
          fill="#757575"
          d="M55.146,51.887L41.588,37.786c3.486-4.144,5.396-9.358,5.396-14.786c0-12.682-10.318-23-23-23s-23,10.318-23,23
	s10.318,23,23,23c4.761,0,9.298-1.436,13.177-4.162l13.661,14.208c0.571,0.593,1.339,0.92,2.162,0.92
	c0.779,0,1.518-0.297,2.079-0.837C56.255,54.982,56.293,53.08,55.146,51.887z M23.984,6c9.374,0,17,7.626,17,17s-7.626,17-17,17
	s-17-7.626-17-17S14.61,6,23.984,6z"
        />
      </svg>
      <input type="text" {...props} style={{ ...baseStyle, ...props.style }} />
    </div>
  );
};
