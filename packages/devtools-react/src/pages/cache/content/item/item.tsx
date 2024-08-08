import { DevtoolsCacheEvent } from "devtools.types";
import { useDevtoolsContext } from "devtools.context";

const baseStyle = {
  fontWeight: 300,
  fontSize: "14px",
  padding: "4px 5px",
  color: "#fff",
};

export const Item = ({ item }: { item: DevtoolsCacheEvent }) => {
  const { setDetailsCacheKey } = useDevtoolsContext("DevtoolsNetworkRequest");

  return (
    <tr onClick={() => setDetailsCacheKey(item.cacheKey)} className="hf-tr-active">
      <td style={{ ...baseStyle, paddingLeft: "10px" }}>
        <span>{item.cacheKey}</span>
      </td>
      <td style={{ ...baseStyle, paddingRight: "10px" }}>
        {!!item.data?.timestamp && <div>{new Date(item.data.timestamp).toLocaleTimeString()} </div>}
      </td>
    </tr>
  );
};
