import { useEffect, useState } from "react";
import { ClientInstance } from "@hyper-fetch/core";
import { DocsCard } from "@site/src/components";
import { Wifi, XCircle } from "lucide-react";

export const OnlineWidget = ({ client }: { client: ClientInstance }) => {
  const [isOnline, setIsOnline] = useState(client.appManager.isOnline);

  useEffect(() => {
    client.appManager.events.onOnline(() => {
      setIsOnline(true);
    });
    client.appManager.events.onOffline(() => {
      setIsOnline(false);
    });
  }, [client.appManager]);

  return (
    <DocsCard className="py-2 pl-3 pr-4 min-w-[90px] max-w-xs shadow relative overflow-hidden">
      <div className="flex flex-row items-center gap-1">
        {/* Status dot */}
        <span className="relative flex h-3 w-3 items-center justify-center mr-1">
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${
              isOnline ? "bg-green-400 opacity-60 animate-ping" : "bg-red-400 opacity-30"
            }`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-2 w-2 border ${
              isOnline ? "bg-green-500 border-green-400" : "bg-red-500 border-red-400"
            }`}
          ></span>
        </span>
        {/* Icon and text */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <span
              className={`font-bold text-xs transition-colors duration-300 ${
                isOnline ? "text-green-600" : "text-red-600"
              }`}
            >
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </div>
    </DocsCard>
  );
};
