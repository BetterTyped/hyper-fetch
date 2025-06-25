import { ExtractSocketExtraType, SocketInstance } from "@hyper-fetch/sockets";

export type UseSocketStateType<Socket extends SocketInstance, DataType = any> = {
  data: DataType | null;
  extra: ExtractSocketExtraType<Socket> | null;
  connected: boolean;
  connecting: boolean;
  timestamp: number | null;
};

export type UseSocketStateProps = {
  dependencyTracking?: boolean;
};
