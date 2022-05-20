import { RenderHookResult } from "@testing-library/react-hooks/dom";

export const getCurrentState = <T extends RenderHookResult<any, any, any>>(
  render: T,
): T extends RenderHookResult<any, infer State, any> ? State : never => {
  return render.result?.current || {};
};
