import { produce } from "immer";
import { create } from "zustand/react";
import { persist, createJSONStorage } from "zustand/middleware";

export type Project = {
  name: string;
  connected: boolean;
  settings: {
    simulatedErrors: Record<string, Error>;
    maxRequestsHistorySize: number;
  };
};

export type ProjectStore = {
  projects: { [key: string]: Project };
  addProject: (project: Project) => void;
  removeProject: (projectName: string) => void;
  updateProject: (project: Project) => void;
  setConnected: (projectName: string, connected: boolean) => void;
  setSettings: (projectName: string, settings: Partial<Project["settings"]>) => void;
};

/* -------------------------------------------------------------------------------------------------
 * PERSISTED STORE
 * -----------------------------------------------------------------------------------------------*/

export const useProjects = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: {},
      addProject: (project: Project) => {
        const { projects } = get();
        if (projects[project.name]) {
          return;
        }
        set(
          produce((draft) => {
            if (!draft.projects[project.name]) {
              draft.projects[project.name] = project;
            }

            draft.projects[project.name].settings.simulatedErrors = {
              ...project.settings.simulatedErrors,
              Default: new Error("This is error simulated by HyperFetch Devtools"),
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
      setConnected: (projectName: string, connected: boolean) => {
        set((state) =>
          produce(state, (draft) => {
            draft.projects[projectName].connected = connected;
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
                Default: new Error("This is error simulated by HyperFetch Devtools"),
              },
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
