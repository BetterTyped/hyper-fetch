import { DateInterval } from "constants/time.constants";
import {
  setClientHeaders,
  getClientPayload,
  handleClientError,
  handleClientSuccess,
  setClientOptions,
  setRequestProgress,
  setResponseProgress,
} from "./fetch.client.utils";
import { ClientResponseType, ClientType } from "./fetch.client.types";

export const fetchClient: ClientType = async (command, requestId) => {
  if (!XMLHttpRequest) {
    throw new Error("There is no XMLHttpRequest, make sure it's provided to use React-Fetch built-in client.");
  }

  const { builder, abortKey, queueKey } = command;
  const { baseUrl, commandManager, loggerManager, clientOptions, stringifyQueryParams } = builder;

  const logger = loggerManager.init("Client");
  const options = clientOptions;

  const xhr = new XMLHttpRequest();

  xhr.timeout = DateInterval.second * 5;

  let requestStartTimestamp: null | number = null;
  let responseStartTimestamp: null | number = null;

  logger.debug(`Starting request modification`);

  let commandInstance = command;
  commandInstance = await builder.__modifyRequest(commandInstance);

  if (commandInstance.auth) {
    commandInstance = await builder.__modifyAuth(commandInstance);
  }

  const { endpoint, queryParams, data, method } = commandInstance;

  const url = baseUrl + endpoint + stringifyQueryParams(queryParams);
  const effects = builder.effects.filter((effect) => command.effects.includes(effect.getName()));
  const abortController = commandManager.getAbortController(abortKey, requestId);

  // "Trigger" Effect lifecycle
  effects.forEach((effect) => effect.onTrigger(command));

  const abort = () => xhr.abort();

  return new Promise<ClientResponseType<unknown, unknown>>((resolve) => {
    requestStartTimestamp = +new Date();
    responseStartTimestamp = null;

    // Setup Request
    setClientOptions(commandInstance, xhr);

    xhr.open(method, url, true);

    setClientHeaders(commandInstance, xhr, options?.headerMapper);
    abortController?.signal.addEventListener("abort", abort);
    logger.debug(`Request setup finished`);

    // Request listeners
    commandManager.events.emitRequestStart(queueKey, { requestId, command });
    setRequestProgress(queueKey, requestId, commandInstance, requestStartTimestamp || +new Date(), {
      total: 1,
      loaded: 0,
    });

    if (xhr.upload) {
      xhr.upload.onprogress = (e): void => {
        setRequestProgress(queueKey, requestId, commandInstance, requestStartTimestamp || +new Date(), e);
      };
    }

    // Response listeners
    xhr.onprogress = (e): void => {
      requestStartTimestamp = null;
      setRequestProgress(queueKey, requestId, commandInstance, requestStartTimestamp || +new Date(), {
        total: 1,
        loaded: 1,
      });

      setResponseProgress(
        queueKey,
        requestId,
        commandInstance,
        responseStartTimestamp || +new Date(),
        e as ProgressEvent<XMLHttpRequest>,
      );
    };

    xhr.onloadstart = (): void => {
      responseStartTimestamp = +new Date();
      commandManager.events.emitResponseStart(queueKey, { requestId, command });
    };

    // Error listeners
    xhr.onabort = (e): void => {
      handleClientError(commandInstance, effects, resolve, e as ProgressEvent<XMLHttpRequest>, "abort");
    };
    xhr.ontimeout = (e): void => {
      handleClientError(commandInstance, effects, resolve, e as ProgressEvent<XMLHttpRequest>, "timeout");
    };
    xhr.onerror = (e): void => {
      handleClientError(commandInstance, effects, resolve, e as ProgressEvent<XMLHttpRequest>);
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
        handleClientSuccess(commandInstance, effects, event, resolve);
      } else {
        handleClientError(commandInstance, effects, resolve, event);
      }
      abortController?.signal.removeEventListener("abort", abort);
    };

    // Send request
    logger.debug(`Starting request`);
    xhr.send(getClientPayload(data));

    // "Start" Action lifecycle
    effects.forEach((action) => action.onStart(command));
  });
};
