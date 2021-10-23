export type ClientResponseType<GenericDataType, GenericErrorType> = [
  GenericDataType | null,
  GenericErrorType | null,
  number,
];
