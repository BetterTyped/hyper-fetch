import { Devtools, useDevtoolsWorkspaces } from "@hyper-fetch/devtools-react";
import { ClientInstance, LoggerMethods } from "@hyper-fetch/core";
import { useListener } from "@hyper-fetch/react";
import { clientSpecificReceiveMessage, sendMessage } from "./socket";
import { useEffect } from "react";
import { BaseMessage, EmitableCoreEvents, EmitableCustomEvents, MessageType } from "../../types/messages.types";

// TODO - standardize emitter events functions to always start with <emit>
// TODO - think of better handling and not passing all arguments
const handleEvent = (
  client: ClientInstance,
  event: BaseMessage,
  logger: LoggerMethods,
  setRequestList: any,
  workspace: string,
) => {
  console.log("RECEIVED EVENT", event);
  const { eventType, eventData } = event.data;
  switch (eventType) {
    case EmitableCoreEvents.ON_REQUEST_START:
      client.requestManager.events.emitRequestStart(eventData);
      return;
    case EmitableCoreEvents.ON_REQUEST_REMOVE:
      client.requestManager.events.emitRemove(eventData);
      return;
    case EmitableCoreEvents.ON_REQUEST_PAUSE:
      client.requestManager.events.emitAbort(eventData);
      return;
    case EmitableCoreEvents.ON_RESPONSE:
      client.requestManager.events.emitResponse(eventData);
      return;
    case EmitableCoreEvents.ON_FETCH_QUEUE_CHANGE: {
      client.fetchDispatcher.events.setQueueChanged(eventData);
      return;
    }
    case EmitableCoreEvents.ON_FETCH_QUEUE_STATUS_CHANGE: {
      client.fetchDispatcher.events.setQueueStatusChanged(eventData);
      return;
    }
    case EmitableCoreEvents.ON_SUBMIT_QUEUE_CHANGE: {
      client.submitDispatcher.events.setQueueChanged(eventData);
      return;
    }
    case EmitableCoreEvents.ON_SUBMIT_QUEUE_STATUS_CHANGE: {
      client.submitDispatcher.events.setQueueStatusChanged(eventData);
      return;
    }
    case EmitableCoreEvents.ON_CACHE_CHANGE: {
      client.cache.events.emitCacheData(eventData);
      return;
    }
    case EmitableCoreEvents.ON_CACHE_INVALIDATE: {
      client.cache.events.emitInvalidation(eventData);
      return;
    }
    case EmitableCoreEvents.ON_CACHE_DELETE: {
      client.cache.events.emitDelete(eventData);
      return;
    }
    case EmitableCustomEvents.REQUEST_CREATED: {
      setRequestList(workspace, eventData);
      return;
    }
    default:
      logger.error({ title: `Unknown event received: ${eventType}`, type: "system", extra: { eventType, eventData } });
  }
};

export const DevtoolsSocketWrapper = ({ workspace, client }: { workspace: string; client: ClientInstance }) => {
  const { setRequestList } = useDevtoolsWorkspaces("Devtools");
  const logger = client.loggerManager.initialize(client, `DevtoolsStandalone`);
  const { onEvent } = useListener(clientSpecificReceiveMessage, {});
  onEvent((eventData) => {
    handleEvent(client, eventData, logger, setRequestList, workspace);
  });
  useEffect(() => {
    sendMessage.emit({ payload: { messageType: MessageType.DEVTOOLS_CLIENT_CONFIRM, connectionName: workspace } });
  }, []);

  return <Devtools workspace={workspace} client={client} initiallyOpen={true} />;
};
