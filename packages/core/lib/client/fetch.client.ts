import { getAbortController } from "command";
import { DateInterval } from "constants/time.constants";
import {
  setClientHeaders,
  getClientPayload,
  handleClientError,
  handleClientSuccess,
  setClientOptions,
  setRequestProgress,
  setResponseProgress,
  stringifyQueryParams,
} from "./fetch.client.utils";
import { ClientResponseType, ClientType } from "./fetch.client.types";

export const fetchClient: ClientType<any, any> = async (command, options) => {
  if (!XMLHttpRequest) {
    throw new Error("There is no XMLHttpRequest, make sure it's provided to use React-Fetch built-in client.");
  }

  const logger = command.builder.loggerManager.init("Client");

  const xhr = new XMLHttpRequest();

  xhr.timeout = DateInterval.second * 4;

  let requestStartTimestamp: null | number = null;
  let responseStartTimestamp: null | number = null;

  logger.debug(`Starting request modification`);

  let commandInstance = command;
  commandInstance = await command.builder.__modifyAuth(commandInstance);
  commandInstance = await command.builder.__modifyRequest(commandInstance);

  const { builder, endpoint, queryParams, data, method } = commandInstance;

  const url = builder.baseUrl + endpoint + stringifyQueryParams(queryParams, options?.queryParams);

  const actions = command.builder.actions.filter((action) => command.actions.includes(action.getName()));

  // "Trigger" Action lifecycle
  actions.forEach((action) => action.onTrigger(command));

  return new Promise<ClientResponseType<unknown, unknown>>((resolve) => {
    requestStartTimestamp = +new Date();
    responseStartTimestamp = null;

    // Setup Request
    setClientOptions(commandInstance, xhr);

    xhr.open(method, url, true);

    setClientHeaders(commandInstance, xhr, options?.headerMapper);
    getAbortController(command)?.signal.addEventListener("abort", xhr.abort);
    logger.debug(`Request setup finished`);

    // Request listeners
    command.builder.commandManager.events.emitRequestStart(command.queueKey, command);
    setRequestProgress(command.queueKey, commandInstance, requestStartTimestamp || +new Date(), {
      total: 1,
      loaded: 0,
    });

    if (xhr.upload) {
      xhr.upload.onprogress = (e): void => {
        setRequestProgress(command.queueKey, commandInstance, requestStartTimestamp || +new Date(), e);
      };
    }

    // Response listeners
    xhr.onprogress = (e): void => {
      requestStartTimestamp = null;
      setRequestProgress(command.queueKey, commandInstance, requestStartTimestamp || +new Date(), {
        total: 1,
        loaded: 1,
      });

      setResponseProgress(
        command.queueKey,
        commandInstance,
        responseStartTimestamp || +new Date(),
        e as ProgressEvent<XMLHttpRequest>,
      );
    };

    xhr.onloadstart = (): void => {
      responseStartTimestamp = +new Date();
      command.builder.commandManager.events.emitResponseStart(command.queueKey, command);
    };

    // Error listeners
    xhr.onabort = (e): void => {
      handleClientError(commandInstance, actions, resolve, e as ProgressEvent<XMLHttpRequest>, "abort");
    };
    xhr.ontimeout = (e): void => {
      handleClientError(commandInstance, actions, resolve, e as ProgressEvent<XMLHttpRequest>, "timeout");
    };
    xhr.onerror = (e): void => {
      handleClientError(commandInstance, actions, resolve, e as ProgressEvent<XMLHttpRequest>);
    };

    // State listeners
    xhr.onloadend = (): void => {
      responseStartTimestamp = null;
    };

    xhr.onreadystatechange = (e) => {
      const event = e as ProgressEvent<XMLHttpRequest>;
      const finishedState = 4;

      const readyState = event.target?.readyState || 0;
      const status = event.target?.status?.toString() || "";

      if (readyState !== finishedState || !event.target) {
        return;
      }

      const isSuccess = status.startsWith("2") || status.startsWith("3");

      if (isSuccess) {
        handleClientSuccess(commandInstance, actions, event, resolve);
      } else {
        handleClientError(commandInstance, actions, resolve, event);
      }
      getAbortController(command)?.signal.removeEventListener("abort", xhr.abort);
    };

    logger.debug(`Starting request`);
    // Send request
    xhr.send(getClientPayload(data));

    // "Start" Action lifecycle
    actions.forEach((action) => action.onStart(command));
  });
};
