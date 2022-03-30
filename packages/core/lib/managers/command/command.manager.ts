import EventEmitter from "events";

import { getCommandManagerEvents } from "managers";

/**
 * **Command Manager** is used to emit `command lifecycle events` like - request start, request end, upload and download progress.
 * It is also the place of `request aborting` system, here we store all the keys and controllers that are isolated for each builder instance.
 */
export class CommandManager {
  emitter = new EventEmitter();
  events = getCommandManagerEvents(this.emitter);

  abortControllers = new Map<string, Map<string, AbortController>>();

  addAbortController = (abortKey: string, requestId: string) => {
    let abortGroup = this.abortControllers.get(abortKey);
    if (!abortGroup) {
      const newAbortGroup = new Map();
      abortGroup = newAbortGroup;
      this.abortControllers.set(abortKey, newAbortGroup);
    }

    const abortController = abortGroup.get(requestId);
    if (!abortController || abortController.signal.aborted) {
      abortGroup.set(requestId, new AbortController());
    }
  };

  getAbortController = (abortKey: string, requestId: string) => {
    return this.abortControllers.get(abortKey)?.get(requestId);
  };

  removeAbortController = (abortKey: string, requestId: string) => {
    this.abortControllers.get(abortKey)?.delete(requestId);
  };

  // Aborting

  abortByKey = (abortKey: string) => {
    const controllers = this.abortControllers.get(abortKey);
    controllers?.forEach((controller) => controller.abort());
  };

  abortByRequestId = (abortKey: string, requestId: string) => {
    this.abortControllers.get(abortKey)?.get(requestId)?.abort();
  };

  abortAll = () => {
    this.abortControllers.forEach((group) => group.forEach((controller) => controller.abort()));
  };
}
