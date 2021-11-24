import { DateInterval } from "index";
import { createInterceptor, ErrorCodesType, testMiddleware } from "../server";
import { buildMock } from ".";

export const getBase = testMiddleware()({
  endpoint: "/",
  options: {
    timeout: DateInterval.second * 1,
  },
});

export const getBaseMock = buildMock(getBase, []);

export const interceptBase = <StatusType extends number | ErrorCodesType>(status: StatusType, delay?: number) =>
  createInterceptor(getBaseMock, status, delay);
