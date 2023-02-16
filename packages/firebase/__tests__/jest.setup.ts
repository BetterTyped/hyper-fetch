/**
 * @jest-environment jsdom
 */

import { setImmediate } from "timers";

global.setImmediate = setImmediate;
