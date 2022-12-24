import { renderHook } from "@testing-library/react";
import { SocketInstance } from "@hyper-fetch/sockets";

import { useEventMessages, UseEventMessagesOptionsType } from "hooks/use-event-messages";

export const renderUseEventMessages = <T extends SocketInstance>(
  socket: T,
  options?: UseEventMessagesOptionsType<any>,
) => {
  return renderHook((rerenderOptions: UseEventMessagesOptionsType<any> & { socket?: SocketInstance }) => {
    const { socket: lst, ...rest } = rerenderOptions || {};
    return useEventMessages(lst || socket, { dependencyTracking: false, ...options, ...rest });
  });
};
