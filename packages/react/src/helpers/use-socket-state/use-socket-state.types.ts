export type UseSocketStateType<DataType = any> = {
  data: DataType | null;
  emitting: boolean;
  listening: boolean;
  connected: boolean;
  connecting: boolean;
  timestamp: Date | null;
};
