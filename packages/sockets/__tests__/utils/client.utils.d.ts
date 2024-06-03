import { SocketInstance } from "socket";
export declare const createAdapter: <T extends SocketInstance>(socket: T, options?: T["options"]["adapterOptions"]) => {
    open: boolean;
    reconnectionAttempts: number;
    listeners: Map<string, Map<import("../../src").ListenerCallbackType<import("adapter").SocketAdapterInstance, any>, VoidFunction>>;
    listen: (listener: import("../../src").Listener<any, any, import("adapter").SocketAdapterType<import("adapter").WSAdapterOptionsType, MessageEvent<import("adapter").SocketData<any>>, never, never>, false>, callback: import("../../src").ListenerCallbackType<import("adapter").SocketAdapterType<import("adapter").WSAdapterOptionsType, MessageEvent<import("adapter").SocketData<any>>, never, never>, any>) => import("adapter").RemoveListenerCallbackType;
    removeListener: (endpoint: string, callback: (...args: any) => void) => void;
    emit: (eventMessageId: string, emitter: import("../../src").EmitterInstance) => void;
    connecting: boolean;
    connect: () => void;
    reconnect: () => void;
    disconnect: () => void;
};
//# sourceMappingURL=client.utils.d.ts.map