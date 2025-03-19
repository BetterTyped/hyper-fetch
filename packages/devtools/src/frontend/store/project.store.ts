import { createStore } from "../lib/store/store";

export type ProjectStore = {
  name: string;
};

const { store, useStore } = createStore<ProjectStore>("project", {
  name: "",
});

export const projectStore = store;
export const useProjectStore = useStore;
