import EventEmitter from "events";

import { getCommandManagerEvents } from "managers";

/**
 * **Command Manager** is used to emit `command lifecycle events` like - request start, request end, upload and download progress.
 * It is also the place of `request aborting` system, here we store all the keys and controllers that are isolated for each builder instance.
 */
export class CommandManager {
  emitter = new EventEmitter();
  events = getCommandManagerEvents(this.emitter);

  abortControllers = new Map<string, AbortController>();
}
