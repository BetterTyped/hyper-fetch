/**
 * Callbacks, listeners, plugins and optimistic handlers are the code of the user running inside of the request
 * lifecycle. Their error can't break it, and it can't get lost either - it is thrown from a timer, outside of the
 * lifecycle, so it reaches the error handlers of the environment (`window.onerror`, `uncaughtException`).
 * @internal
 * @param error value thrown by the user code
 */
export const throwOutsideLifecycle = (error: unknown): void => {
  setTimeout(() => {
    throw error;
  });
};

/**
 * Runs the code of the user in the middle of the request lifecycle. When it throws, the lifecycle goes on
 * and the error is thrown outside of it.
 * @internal
 * @param callback code of the user to run
 * @returns `true` when the callback finished, `false` when it threw
 */
export const runUserCode = (callback: VoidFunction): boolean => {
  try {
    callback();
    return true;
  } catch (error) {
    throwOutsideLifecycle(error);
    return false;
  }
};
