import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Project = {
  name: string;
  settings: {
    simulatedErrors: Record<string, Error>;
    maxRequestsHistorySize: number;
  };
};

export type ProjectStore = {
  projects: { [key: string]: Project };
  addProject: (project: Project) => void;
  removeProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  setConnected: (projectName: string, connected: boolean) => void;
  setSettings: (projectName: string, settings: Partial<Project["settings"]>) => void;
};

export const useProjects = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: {},
      addProject: (project: Project) => {
        const { projects } = get();
        if (projects[project.name]) {
          return;
        }
        set((state: ProjectStore) => ({
          projects: {
            ...state.projects,
            [project.name]: {
              ...project,
              settings: {
                ...project.settings,
                simulatedErrors: {
                  ...project.settings.simulatedErrors,
                  Default: new Error("This is error simulated by HyperFetch Devtools"),
                },
              },
            },
          },
        }));
      },
      removeProject: (project: Project) => {
        set((state: ProjectStore) => {
          const { [project.name]: removedProject, ...rest } = state.projects;
          return { projects: rest };
        });
      },
      updateProject: (project: Project) => {
        set((state: ProjectStore) => ({
          projects: { ...state.projects, [project.name]: project },
        }));
      },
      setConnected: (projectName: string, connected: boolean) => {
        set((state: ProjectStore) => ({
          projects: { ...state.projects, [projectName]: { ...state.projects[projectName], connected } },
        }));
      },
      setSettings: (projectName: string, settings: Partial<Project["settings"]>) => {
        set((state: ProjectStore) => ({
          projects: {
            ...state.projects,
            [projectName]: {
              ...state.projects[projectName],
              settings: {
                ...state.projects[projectName].settings,
                ...settings,
                simulatedErrors: {
                  ...state.projects[projectName].settings.simulatedErrors,
                  ...settings.simulatedErrors,
                  Default: new Error("This is error simulated by HyperFetch Devtools"),
                },
              },
            },
          },
        }));
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
