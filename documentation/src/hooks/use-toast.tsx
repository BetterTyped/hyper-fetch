/* eslint-disable default-case */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-shadow */

// Inspired by react-hot-toast library
import * as React from "react";
import type { ToastProps } from "@site/src/components/ui/toast";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 3000;

type ToasterToast = ToastProps & {
  id: string;
  message?: React.ReactNode;
  timestamp: number;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

const memoryState: Record<string, State> = {};
const listeners: Record<string, Array<(state: State) => void>> = {};
const toastTimeouts: Record<string, Map<string, ReturnType<typeof setTimeout>>> = {};

const addToRemoveQueue = (id: string, toastId: string) => {
  if (!toastTimeouts[id]) {
    toastTimeouts[id] = new Map();
  }

  if (toastTimeouts[id].has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts[id].delete(toastId);
    dispatch(id, {
      type: "REMOVE_TOAST",
      toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts[id].set(toastId, timeout);
};

export const reducer = (instanceId: string, state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(instanceId, toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(instanceId, toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

function dispatch(instanceId: string, action: Action) {
  if (!memoryState[instanceId]) {
    memoryState[instanceId] = { toasts: [] };
  }
  if (!listeners[instanceId]) {
    listeners[instanceId] = [];
  }

  memoryState[instanceId] = reducer(instanceId, memoryState[instanceId], action);
  listeners[instanceId].forEach((listener) => {
    listener(memoryState[instanceId]);
  });
}

type Toast = Omit<ToasterToast, "id"> & { instanceId: string };

function toast({ instanceId, ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch(instanceId, {
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch(instanceId, { type: "DISMISS_TOAST", toastId: id });

  dispatch(instanceId, {
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });
  return {
    id,
    dismiss,
    update,
  };
}

function useToast() {
  const { id } = useToasterId();
  const [state, setState] = React.useState<State>(memoryState[id]);

  React.useEffect(() => {
    if (!listeners[id]) {
      listeners[id] = [];
    }
    listeners[id].push(setState);
    return () => {
      const index = listeners[id].indexOf(setState);
      if (index > -1) {
        listeners[id].splice(index, 1);
      }
    };
  }, []); // Only subscribe/unsubscribe on mount/unmount

  return {
    ...state,
    toast: (props: ToastProps) =>
      toast({ ...props, instanceId: id, timestamp: Date.now() + props.duration || TOAST_REMOVE_DELAY }),
    dismiss: (toastId?: string) => dispatch(id, { type: "DISMISS_TOAST", toastId }),
  };
}

// Toaster Context
const ToasterIdContext = React.createContext<{ id: string }>({ id: "" });

const { Provider } = ToasterIdContext;

interface ToasterProviderProps {
  children: React.ReactNode;
  id?: string;
}

export function ToasterProvider({ children, id }: ToasterProviderProps) {
  const generatedId = React.useId();
  const value = { id: id ?? generatedId };
  return <Provider value={value}>{children}</Provider>;
}

function useToasterId() {
  const contextId = React.useContext(ToasterIdContext);
  return contextId;
}

export { useToast, toast };
