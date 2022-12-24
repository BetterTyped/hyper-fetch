import { Socket } from "@hyper-fetch/sockets";

import { wsUrl } from "../websocket/websocket.server";

export const socket = new Socket({ url: wsUrl });
