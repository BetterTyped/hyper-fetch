import { getRequestManagerEvents } from "managers";
import { EventEmitter } from "utils";

/**
 * **Request Manager** is used to emit `request lifecycle events` like - request start, request end, upload and download progress.
 * It is also the place of `request aborting` system, here we store all the keys and controllers that are isolated for each client instance.
 */
export class RequestManager {
  emitter = new EventEmitter();
  events = getRequestManagerEvents(this.emitter);

  constructor() {
    this.emitter?.setMaxListeners(1000);
  }

  abortControllers = new Map<string, Map<string, AbortController>>();
  /** Controllers aborted through this manager, i.e. by the user and not by an adapter's own timeout */
  private canceledControllers = new WeakSet<AbortController>();

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
    const abortGroup = this.abortControllers.get(abortKey);
    abortGroup?.delete(requestId);

    // Do not keep an empty group for every abortKey (and every scope) that was ever used
    if (abortGroup?.size === 0) {
      this.abortControllers.delete(abortKey);
    }
  };

  // Aborting

  useAbortController = (abortKey: string, requestId: string) => {
    const controller = this.abortControllers.get(abortKey)?.get(requestId);
    if (controller) {
      this.canceledControllers.add(controller);
      controller.abort();
    }
  };

  /**
   * Whether the request was aborted on purpose (`request.abort()`, `abortByKey`...). Tells canceled requests apart
   * from failed ones whatever shape the adapter gives its errors.
   */
  isCanceled = (abortKey: string, requestId: string) => {
    const controller = this.abortControllers.get(abortKey)?.get(requestId);
    return !!controller && this.canceledControllers.has(controller);
  };

  abortByKey = (abortKey: string) => {
    const controllers = this.abortControllers.get(abortKey);

    if (controllers) {
      const entries = [...controllers.entries()];
      entries.forEach(([key]) => {
        this.useAbortController(abortKey, key);
      });
    }
  };

  abortByRequestId = (abortKey: string, requestId: string) => {
    this.useAbortController(abortKey, requestId);
  };

  abortAll = () => {
    const entries = [...this.abortControllers.entries()];
    entries.forEach(([abortKey, value]) => {
      const controllers = [...value.entries()];
      controllers.forEach(([requestId]) => {
        this.useAbortController(abortKey, requestId);
      });
    });
  };
}
