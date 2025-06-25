import { ClientInstance } from "@hyper-fetch/core";
import { Toaster } from "@site/src/components/ui/toast";

import { OnlineWidget } from "../online-widget";
import { Events } from "./components/events";

export const ClientRequests = ({ client }: { client: ClientInstance }) => {
  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div className="absolute top-2 left-20 right-4 flex items-center !m-0 gap-2 justify-end">
        <OnlineWidget client={client} />
      </div>
      <Events client={client} />
      <Toaster />
    </div>
  );
};
