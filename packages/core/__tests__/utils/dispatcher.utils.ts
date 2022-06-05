import { Dispatcher, DispatcherOptionsType } from "dispatcher";
import { BuilderInstance } from "builder";

export const createDispatcher = (builder: BuilderInstance, options?: DispatcherOptionsType) => {
  return new Dispatcher(builder, options);
};
