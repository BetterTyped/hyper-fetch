import EventEmitter from "events";

import { getCommandManagerEvents } from "managers";

export class CommandManager {
  emitter = new EventEmitter();
  events = getCommandManagerEvents(this.emitter);

  abortControllers = new Map<string, AbortController>();
}
