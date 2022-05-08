import { FetchBuilderInstance } from "builder";
import { DateInterval } from "constants/time.constants";
import { createInterceptor, ErrorCodesType } from "../server";
import { buildMock } from ".";
import { testBuilder } from "../server/server.constants";

interface LoginResponse {
  refreshToken: string;
  token: string;
}

export const getRefreshToken = <T extends FetchBuilderInstance>(builder: T) =>
  builder.createCommand<LoginResponse, Pick<LoginResponse, "refreshToken">>()({
    endpoint: "/refresh-token",
    options: {
      timeout: DateInterval.second * 1,
    },
  });

export const getRefreshTokenMock = buildMock(getRefreshToken(testBuilder), {
  token: "test",
  refreshToken: "refresh_test",
});

export const interceptRefreshToken = <StatusType extends number | ErrorCodesType>(status: StatusType, delay?: number) =>
  createInterceptor(getRefreshTokenMock, status, delay);
