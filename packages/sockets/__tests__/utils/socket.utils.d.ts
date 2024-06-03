import { Socket, SocketOptionsType } from "socket";
import { SocketAdapterInstance, WebsocketAdapterType } from "adapter";
export declare const createSocket: <T extends SocketAdapterInstance = WebsocketAdapterType>(config?: Partial<SocketOptionsType<T>>) => Socket<T>;
//# sourceMappingURL=socket.utils.d.ts.map