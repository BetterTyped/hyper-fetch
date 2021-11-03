import { createInterceptor } from "tests/server";
import { ErrorCodesType } from "tests/server/server.constants";
import { testMiddleware, buildMock } from "./mocking";

export type GetOneResponseType = {
  name: string;
  age: number;
};

export const getOneRequest = testMiddleware<GetOneResponseType>()({ endpoint: "/get-one" });

export const getOneMock = buildMock(getOneRequest, { name: "Kacper", age: 321 });

export const interceptGetOne = <StatusType extends number | ErrorCodesType>(status: StatusType) =>
  createInterceptor(getOneMock, status);
