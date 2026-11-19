import { OrpcSocketError } from "../../src/socket";

/** Asserts that the reported error is an `OrpcSocketError` and returns it typed */
export const asSocketError = (error: unknown): OrpcSocketError => {
  expect(error).toBeInstanceOf(OrpcSocketError);
  return error as OrpcSocketError;
};
