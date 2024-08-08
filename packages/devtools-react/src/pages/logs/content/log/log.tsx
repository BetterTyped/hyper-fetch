import { useMemo } from "react";
import { LogType } from "@hyper-fetch/core";

const baseStyle = {
  fontWeight: 300,
  fontSize: "14px",
  padding: "4px 5px",
};

export const Log = ({ item }: { item: LogType }) => {
  const color = useMemo(() => {
    switch (item.severity) {
      case 0:
        return "#9e9e9e";
      case 1:
        return "#fff";
      case 2:
        return "#00bcd4";
      case 3:
        return "#ed7281";
      default:
        return "#fff";
    }
  }, [item.severity]);

  const severity = useMemo(() => {
    switch (item.severity) {
      case 0:
        return "Debug";
      case 1:
        return "Log";
      case 2:
        return "Info";
      case 3:
        return "Error";
      default:
        return "Log";
    }
  }, [item.severity]);

  const message = useMemo(() => {
    if (typeof item.message === "string") {
      return item.message;
    }
    return JSON.stringify(item.message);
  }, [item.message]);

  return (
    <tr className="hf-tr-active">
      <td style={{ ...baseStyle, color, paddingLeft: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span>{message}</span>
        </div>
      </td>
      <td style={{ ...baseStyle, color }}>{severity}</td>
    </tr>
  );
};
