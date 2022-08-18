import { FetchProgressType, ClientResponseType, getErrorMessage } from "client";
import { ClientProgressEvent, CommandInstance, CommandDump, FetchType } from "command";
import { HttpMethodsEnum } from "constants/http.constants";
import { canRetryRequest, Dispatcher, isFailedRequest } from "dispatcher";
import { ExtractError, ExtractResponse } from "types";

export const stringifyKey = (value: unknown): string => {
  try {
    if (typeof value === "string") return value;
    if (value === undefined || value === null) return "";
    const data = JSON.stringify(value);
    if (typeof data !== "string") throw new Error();
    return data;
  } catch (_) {
    return "";
  }
};

export const getProgressValue = ({ loaded, total }: ClientProgressEvent): number => {
  if (!loaded || !total) return 0;
  return Number(((loaded * 100) / total).toFixed(0));
};

export const getRequestEta = (
  startDate: Date,
  progressDate: Date,
  { total, loaded }: ClientProgressEvent,
): { sizeLeft: number; timeLeft: number | null } => {
  const timeElapsed = +progressDate - +startDate || 1;
  const uploadSpeed = loaded / timeElapsed;
  const totalValue = Math.max(total, loaded);
  const sizeLeft = totalValue - loaded;
  const estimatedTimeValue = uploadSpeed ? sizeLeft / uploadSpeed : null;
  const timeLeft = totalValue === loaded ? 0 : estimatedTimeValue;

  return { timeLeft, sizeLeft };
};

export const getProgressData = (
  requestStartTime: Date,
  progressDate: Date,
  progressEvent: ClientProgressEvent,
): FetchProgressType => {
  const { total, loaded } = progressEvent;
  if (Number.isNaN(total) || Number.isNaN(loaded)) {
    return {
      progress: 0,
      timeLeft: 0,
      sizeLeft: 0,
      total: 0,
      loaded: 0,
      startTimestamp: +requestStartTime,
    };
  }

  const { timeLeft, sizeLeft } = getRequestEta(requestStartTime, progressDate, progressEvent);

  return {
    progress: getProgressValue(progressEvent),
    timeLeft,
    sizeLeft,
    total,
    loaded,
    startTimestamp: +requestStartTime,
  };
};

// Keys
export const getSimpleKey = (command: CommandInstance | CommandDump<CommandInstance>): string => {
  return `${command.method}_${command.commandOptions.endpoint}_${command.cancelable}`;
};

/**
 * Cache instance for individual command that collects individual requests responses from
 * the same endpoint (they may differ base on the custom key, endpoint params etc)
 * @param command
 * @param useInitialValues
 * @returns
 */
export const getCommandKey = (
  command: CommandInstance | CommandDump<CommandInstance>,
  useInitialValues?: boolean,
): string => {
  /**
   * Below stringified values allow to match the response by method, endpoint and query params.
   * That's because we have shared endpoint, but data with queryParams '?user=1' will not match regular request without queries.
   * We want both results to be cached in separate places to not override each other.
   *
   * Values to be stringified:
   *
   * endpoint: string;
   * queryParams: string;
   * params: string;
   */
  const methodKey = stringifyKey(command.method);
  const endpointKey = useInitialValues ? command.commandOptions.endpoint : stringifyKey(command.endpoint);

  return `${methodKey}_${endpointKey}`;
};

export const getCommandDispatcher = <Command extends CommandInstance>(
  command: Command,
  dispatcherType: "auto" | "fetch" | "submit" = "auto",
): [Dispatcher, boolean] => {
  const { fetchDispatcher, submitDispatcher } = command.builder;
  const isGet = command.method === HttpMethodsEnum.get;
  const isFetchDispatcher = (dispatcherType === "auto" && isGet) || dispatcherType === "fetch";
  const dispatcher = isFetchDispatcher ? fetchDispatcher : submitDispatcher;

  return [dispatcher, isFetchDispatcher];
};

export const commandSendRequest = <Command extends CommandInstance>(command: Command, options?: FetchType<Command>) => {
  const { commandManager } = command.builder;
  const [dispatcher] = getCommandDispatcher(command, options?.dispatcherType);

  return new Promise<ClientResponseType<ExtractResponse<Command>, ExtractError<Command>>>((resolve) => {
    const requestId = dispatcher.add(command);
    options?.onSettle?.(requestId, command);

    const unmountRequestStart = commandManager.events.onRequestStartById<Command>(requestId, (...props) =>
      options?.onRequestStart?.(...props),
    );

    const unmountResponseStart = commandManager.events.onResponseStartById<Command>(requestId, (...props) =>
      options?.onResponseStart?.(...props),
    );

    const unmountUpload = commandManager.events.onUploadProgressById<Command>(requestId, (...props) =>
      options?.onUploadProgress?.(...props),
    );

    const unmountDownload = commandManager.events.onDownloadProgressById<Command>(requestId, (...props) =>
      options?.onDownloadProgress?.(...props),
    );

    // When resolved
    const unmountResponse = commandManager.events.onResponseById<ExtractResponse<Command>, ExtractError<Command>>(
      requestId,
      (response, details) => {
        const isFailed = isFailedRequest(response);
        const isOfflineStatus = command.offline && details.isOffline;
        const willRetry = canRetryRequest(details.retries, command.retry);

        // When going offline we can't handle the request as it will be postponed to later resolve
        if (isFailed && isOfflineStatus) return;

        // When command is in retry mode we need to listen for retries end
        if (isFailed && willRetry) return;

        options?.onResponse?.(response, details);
        resolve(response);

        // Unmount Listeners
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        umountAll();
      },
    );

    // When removed from queue storage we need to clean event listeners and return proper error
    const unmountRemoveQueueElement = commandManager.events.onRemoveById<Command>(requestId, (...props) => {
      options?.onRemove?.(...props);
      resolve([null, getErrorMessage("deleted") as unknown as ExtractError<Command>, 0]);

      // Unmount Listeners
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      umountAll();
    });

    function umountAll() {
      unmountRequestStart();
      unmountResponseStart();
      unmountUpload();
      unmountDownload();
      unmountResponse();
      unmountRemoveQueueElement();
    }
  });
};
