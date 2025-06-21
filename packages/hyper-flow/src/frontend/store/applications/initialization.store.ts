import { create } from "zustand/react";

type InitializerStore = {
  applications: {
    [application: string]: {
      initialized: boolean;
    };
  };
  initialize: (applicationName: string) => void;
};

export const useInitializerStore = create<InitializerStore>((set) => ({
  applications: {},
  initialize: (application: string) => {
    set((state) => ({
      applications: {
        ...state.applications,
        [application]: { initialized: true },
      },
    }));
  },
}));
