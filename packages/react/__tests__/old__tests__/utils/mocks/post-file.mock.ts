import { DateInterval } from "@better-typed/hyper-fetch";
import { createInterceptor, ErrorCodesType, testBuilder } from "../server";
import { buildMock } from ".";

export const postFile = testBuilder.createCommand<number, FormData>()({
  endpoint: "/",
  options: {
    timeout: DateInterval.second * 1,
  },
});

export const postFileMock = buildMock(postFile, 1);

export const interceptPostFile = <StatusType extends number | ErrorCodesType>(status: StatusType, delay?: number) =>
  createInterceptor(postFileMock, status, delay);
