import { RenderHookResult } from "@testing-library/react";

export const getCurrentState = <T extends RenderHookResult<any, any>>(
  render: T,
): T extends RenderHookResult<any, infer State> ? State : never => {
  return render.result?.current || {};
};
