import { produce } from "immer";
import { create } from "zustand/react";
import { persist, createJSONStorage } from "zustand/middleware";

export type SimulatedError = {
  name: string;
  status: string | number;
  body: Record<string, any>;
};

export type Application = {
  /**
   * The name of the application. Set by plugin-devtools.
   * @example "my-application"
   */
  name: string;
  /**
   * The environment of the application. Set by plugin-devtools.
   * @example "development", "production", "backend", "frontend" etc.
   */
  environment: string;

  /**
   * The adapter name of the application. Set by plugin-devtools.
   */
  adapterName: string;

  /**
   * The url of the application. Set by plugin-devtools.
   */
  url: string;

  /**
   * The settings of the application.
   */
  settings: {
    simulatedErrors: Record<string, SimulatedError>;
    maxRequestsHistorySize: number;
  };
};

export const defaultSimulatedError: SimulatedError = {
  name: "Default",
  status: 400,
  body: {
    message: "This is error simulated by HyperFetch Devtools",
  },
};

export type ApplicationStore = {
  applications: { [key: string]: Application };
  addApplication: (application: Application) => void;
  removeApplication: (applicationName: string) => void;
  updateApplication: (application: Application) => void;
  setSettings: (applicationName: string, settings: Partial<Application["settings"]>) => void;
  setSimulatedErrors: (applicationName: string, simulatedErrors: Record<string, SimulatedError>) => void;
};

/* -------------------------------------------------------------------------------------------------
 * PERSISTED STORE
 * -----------------------------------------------------------------------------------------------*/

export const useApplications = create<ApplicationStore>()(
  persist(
    (set) => ({
      applications: {},
      addApplication: (application: Application) => {
        set(
          produce((draft) => {
            const existingApplication = draft.applications[application.name];
            draft.applications[application.name] = application;
            draft.applications[application.name].settings = {
              ...application.settings,
              ...existingApplication?.settings,
              simulatedErrors: {
                ...application.settings.simulatedErrors,
                ...existingApplication?.settings.simulatedErrors,
                Default: defaultSimulatedError,
              },
            };
          }),
        );
      },
      removeApplication: (applicationName: string) => {
        set((state) =>
          produce(state, (draft) => {
            delete draft.applications[applicationName];
          }),
        );
      },
      updateApplication: (application: Application) => {
        set((state) =>
          produce(state, (draft) => {
            draft.applications[application.name] = application;
          }),
        );
      },
      setSettings: (applicationName: string, settings: Partial<Application["settings"]>) => {
        set((state) =>
          produce(state, (draft) => {
            draft.applications[applicationName].settings = {
              ...draft.applications[applicationName].settings,
              ...settings,
              simulatedErrors: {
                ...draft.applications[applicationName].settings.simulatedErrors,
                ...settings.simulatedErrors,
                Default: defaultSimulatedError,
              },
            };
          }),
        );
      },
      setSimulatedErrors: (applicationName: string, simulatedErrors: Record<string, SimulatedError>) => {
        set((state) =>
          produce(state, (draft) => {
            draft.applications[applicationName].settings.simulatedErrors = {
              ...simulatedErrors,
              Default: defaultSimulatedError,
            };
          }),
        );
      },
    }),
    {
      name: "applications",
      storage: createJSONStorage(() => {
        return {
          getItem: (key) => {
            return window.electron.store.get(key);
          },
          setItem: (key, value) => {
            window.electron.store.set(key, value);
          },
          removeItem: (key) => {
            window.electron.store.delete(key);
          },
        };
      }),
    },
  ),
);
