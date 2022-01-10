import { FetchCommandInstance } from "@better-typed/hyper-fetch";

export const mockCommand = (command: FetchCommandInstance, fetchMock: VoidFunction): FetchCommandInstance => {
  const newCommand = command.clone();
  newCommand.send = fetchMock as any;
  return newCommand;
};
