export type UseSocketStateType<DataType = any> = {
  data: DataType | null;
  connected: boolean;
  connecting: boolean;
  timestamp: Date | null;
};
