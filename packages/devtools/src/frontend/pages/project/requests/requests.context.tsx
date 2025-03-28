import { createContext } from "frontend/utils/context";
import { DevtoolsDataProvider } from "./list/content.state";

export const [ExplorerContext, useExplorer] = createContext("ExplorerContext", {
  treeState: new DevtoolsDataProvider([]),
});
