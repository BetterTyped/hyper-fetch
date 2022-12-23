export type UseSocketStateType<DataType = any> = {
  data: DataType | null;
  connected: boolean;
  connecting: boolean;
  timestamp: number | null;
};

export type UseSocketStateProps = {
  dependencyTracking?: boolean;
};
