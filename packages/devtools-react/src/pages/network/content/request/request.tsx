import { DevtoolsRequestEvent } from "devtools.types";

const baseStyle = {
  fontWeight: 300,
  fontSize: "14px",
  color: "#fff",
};

export const Request = ({
  item,
  onClick,
}: {
  item: DevtoolsRequestEvent;
  onClick: (item: DevtoolsRequestEvent) => void;
}) => {
  const getStatus = () => {
    if (item.isCanceled) {
      return "canceled";
    }
    if (item.isFinished) {
      return item.isSuccess ? "success" : "failed";
    }
    return "in progress";
  };

  return (
    <tr onClick={() => onClick(item)}>
      <td style={{ ...baseStyle, paddingLeft: "10px" }}>{item.request.endpoint}</td>
      <td style={{ ...baseStyle }}>{getStatus()}</td>
      <td style={{ ...baseStyle }}>{String(item.request.method)}</td>
      <td style={{ ...baseStyle, paddingRight: "10px" }}>{String(item.response?.status)}</td>
    </tr>
  );
};
