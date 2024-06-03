import { SocketInstance } from "socket";
import { EmitterOptionsType } from "emitter";
export declare const createEmitter: <PayloadType = any, ResponseDataType = any>(socket: SocketInstance, options?: Partial<EmitterOptionsType<any, any>>) => import("emitter").Emitter<PayloadType, ResponseDataType, any, any, false, false>;
//# sourceMappingURL=emitter.utils.d.ts.map