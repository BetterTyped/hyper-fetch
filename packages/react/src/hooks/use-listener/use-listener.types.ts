export type UseListenerOptionsType<DataType = any, TSelected = DataType> = {
  /** When true (default), only re-renders when accessed state properties change */
  dependencyTracking?: boolean;
  /**
   * Pick or transform the part of the message data used by the component.
   * With a selector the `data` value updates only when the selected value changes,
   * so components reading `data` rerender only for the relevant messages.
   */
  select?: (data: DataType) => TSelected;
  /**
   * Keep references of the unchanged parts of the selected data between messages (default true).
   * Applies to the `select` result - without a selector every message updates the data.
   */
  structuralSharing?: boolean;
};
