import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Workspace = {
  id: string;
  name: string;
  icon: string;
};

export type WorkspaceStore = {
  workspaces: Workspace[];
  addWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (workspace: Workspace) => void;
};

/* -------------------------------------------------------------------------------------------------
 * PERSISTED STORE
 * -----------------------------------------------------------------------------------------------*/

export const useWorkspaces = create<WorkspaceStore>()(
  persist(
    (set) => ({
      workspaces: [],
      addWorkspace: (workspace: Workspace) => {
        set((state: WorkspaceStore) => ({ workspaces: [...state.workspaces, workspace] }));
      },
      removeWorkspace: (workspace: Workspace) => {
        set((state: WorkspaceStore) => ({ workspaces: state.workspaces.filter((w) => w.id !== workspace.id) }));
      },
      updateWorkspace: (workspace: Workspace) => {
        set((state: WorkspaceStore) => ({
          workspaces: state.workspaces.map((w) => (w.id === workspace.id ? workspace : w)),
        }));
      },
    }),
    {
      name: "workspaces",
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
