import { useListener } from "@hyper-fetch/react";
import { receiveData, socket } from "./sockets/socket";
import { DevtoolsSocket } from "@hyper-fetch/devtools-react";
import { useEffect } from "react";
import { Client } from "@hyper-fetch/core";

export const DevtoolsWrapper = () => {
  const dummyClient = new Client({ url: "http://localhost.dummyhost:5000" });
  const { onEvent } = useListener(receiveData, {});
  useEffect(() => {
    socket.setQuery({ connectionName: "HF_DEVTOOLS_APP" });
    socket.connect();
  }, []);
  return <DevtoolsSocket socketCallback={onEvent} client={dummyClient} />;
};
