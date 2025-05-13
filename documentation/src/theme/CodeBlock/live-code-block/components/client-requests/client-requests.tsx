import { ClientInstance } from "@hyper-fetch/core";
import { Title } from "@site/src/components";
import { Toaster } from "@site/src/components/ui/toast";

import { OnlineWidget } from "../online-widget";
import { Events } from "./components/events";

export const ClientRequests = ({ client }: { client: ClientInstance }) => {
  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div className="flex items-center !m-0 gap-2 justify-between">
        <Title size="none" className="&>*:text-lg font-semibold flex items-center">
          Requests:
        </Title>
        <OnlineWidget client={client} />
      </div>
      <Events client={client} />
      <Toaster />
    </div>
  );
};
