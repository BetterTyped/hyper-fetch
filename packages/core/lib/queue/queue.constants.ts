export enum QueueRequestType {
  oneByOne = "one-by-one",
  allAtOnce = "all-at-once",
  previousCanceled = "previous-canceled",
  deduplicated = "deduplicated",
}
