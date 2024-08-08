export const RowInfo = ({ label, value }: { label: string; value: string }) => {
  return (
    <tr style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <td>{label}</td>
      <td>{value}</td>
    </tr>
  );
};
