import { FetchBuilderInstance } from "builder";
import { DateInterval } from "index";
import { createInterceptor, ErrorCodesType, testBuilder } from "../server";
import { buildMock } from ".";

export const getBase = <T extends FetchBuilderInstance>(builder: T) =>
  builder.createCommand()({
    endpoint: "/something",
    options: {
      timeout: DateInterval.second * 1,
    },
  });

export const getBaseMock = buildMock(getBase(testBuilder), []);

export const interceptGetBase = <StatusType extends number | ErrorCodesType>(status: StatusType, delay?: number) =>
  createInterceptor(getBaseMock, status, delay);
