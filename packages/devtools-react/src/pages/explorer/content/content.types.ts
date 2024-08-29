import { RequestInstance } from "@hyper-fetch/core";

export type DevtoolsExplorerRequest = {
  type: "request";
  name: string;
  request: RequestInstance;
};
export type DevtoolsExplorerFolder = {
  type: "folder";
  name: string;
  canDelete: boolean;
};

export type DevtoolsExplorerItem = DevtoolsExplorerRequest | DevtoolsExplorerFolder;
