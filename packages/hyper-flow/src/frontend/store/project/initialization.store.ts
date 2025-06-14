import { create } from "zustand/react";

type InitializerStore = {
  projects: {
    [project: string]: {
      initialized: boolean;
    };
  };
  initialize: (projectName: string) => void;
};

export const useInitializerStore = create<InitializerStore>((set) => ({
  projects: {},
  initialize: (project: string) => {
    set((state) => ({
      projects: {
        ...state.projects,
        [project]: { initialized: true },
      },
    }));
  },
}));
