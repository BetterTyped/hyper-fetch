import { produce } from "immer";
import { create } from "zustand/react";
import { persist, createJSONStorage } from "zustand/middleware";

export type SimulatedError = {
  name: string;
  status: string | number;
  body: Record<string, any>;
};

export type Project = {
  /**
   * The name of the project. Set by plugin-devtools.
   * @example "my-project"
   */
  name: string;
  /**
   * The environment of the project. Set by plugin-devtools.
   * @example "development", "production", "backend", "frontend" etc.
   */
  environment: string;

  /**
   * The adapter name of the project. Set by plugin-devtools.
   */
  adapterName: string;

  /**
   * The url of the project. Set by plugin-devtools.
   */
  url: string;

  /**
   * The settings of the project.
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

export type ProjectStore = {
  projects: { [key: string]: Project };
  addProject: (project: Project) => void;
  removeProject: (projectName: string) => void;
  updateProject: (project: Project) => void;
  setSettings: (projectName: string, settings: Partial<Project["settings"]>) => void;
  setSimulatedErrors: (projectName: string, simulatedErrors: Record<string, SimulatedError>) => void;
};

/* -------------------------------------------------------------------------------------------------
 * PERSISTED STORE
 * -----------------------------------------------------------------------------------------------*/

export const useProjects = create<ProjectStore>()(
  persist(
    (set) => ({
      projects: {},
      addProject: (project: Project) => {
        set(
          produce((draft) => {
            draft.projects[project.name] = project;
            draft.projects[project.name].settings.simulatedErrors = {
              ...project.settings.simulatedErrors,
              Default: defaultSimulatedError,
            };
          }),
        );
      },
      removeProject: (projectName: string) => {
        set((state) =>
          produce(state, (draft) => {
            delete draft.projects[projectName];
          }),
        );
      },
      updateProject: (project: Project) => {
        set((state) =>
          produce(state, (draft) => {
            draft.projects[project.name] = project;
          }),
        );
      },
      setSettings: (projectName: string, settings: Partial<Project["settings"]>) => {
        set((state) =>
          produce(state, (draft) => {
            draft.projects[projectName].settings = {
              ...draft.projects[projectName].settings,
              ...settings,
              simulatedErrors: {
                ...draft.projects[projectName].settings.simulatedErrors,
                ...settings.simulatedErrors,
                Default: defaultSimulatedError,
              },
            };
          }),
        );
      },
      setSimulatedErrors: (projectName: string, simulatedErrors: Record<string, SimulatedError>) => {
        set((state) =>
          produce(state, (draft) => {
            draft.projects[projectName].settings.simulatedErrors = {
              ...simulatedErrors,
              Default: defaultSimulatedError,
            };
          }),
        );
      },
    }),
    {
      name: "projects",
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
