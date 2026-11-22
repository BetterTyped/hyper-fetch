/** Why a write was dropped: an earlier write it was built on failed */
export class DependencyError extends Error {
  constructor(readonly transactionId: string) {
    super(`An earlier write this one depends on (${transactionId}) failed`);
    this.name = "DependencyError";
  }
}
