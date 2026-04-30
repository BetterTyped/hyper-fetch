/* eslint-disable @typescript-eslint/no-unused-vars */
import { expectFunctionParametersType, expectNotFunctionParametersType } from "@hyper-fetch/testing";
import type { ResponseSuccessType } from "adapter";
import { Client } from "client";
import type { HttpAdapterType } from "http-adapter";
import { xhrExtra } from "http-adapter";
import type { ResponseDetailsType } from "managers";

import { createCache } from "../../utils";

interface UserResponse {
  id: number;
  name: string;
}

interface UserError {
  code: string;
  message: string;
}

const client = new Client({ url: "http://localhost:3000" });

const userRequest = client.createRequest<{ response: UserResponse; error: UserError }>()({
  method: "GET",
  endpoint: "/users/:id",
});

const anyRequest = client.createRequest<{ response: any }>()({
  method: "GET",
  endpoint: "/any",
});

const cache = createCache(client);

const successResponse: ResponseSuccessType<UserResponse, HttpAdapterType> & ResponseDetailsType = {
  data: { id: 1, name: "John" },
  error: null,
  status: 200,
  success: true,
  extra: xhrExtra,
  requestTimestamp: Date.now(),
  responseTimestamp: Date.now(),
  retries: 0,
  addedTimestamp: Date.now(),
  triggerTimestamp: Date.now(),
  isCanceled: false,
  isOffline: false,
  willRetry: false,
};

describe("Cache [Types]", () => {
  describe("when using cache.set", () => {
    it("should allow setting correct response type for a typed request", () => {
      expectFunctionParametersType(cache.set).assert([userRequest, successResponse]);
    });

    it("should allow setting response with null data", () => {
      expectFunctionParametersType(cache.set).assert([
        userRequest,
        {
          ...successResponse,
          data: null,
          error: { code: "ERR", message: "fail" },
          success: false as const,
        },
      ]);
    });

    it("should not allow setting response with wrong data type", () => {
      expectNotFunctionParametersType(cache.set).assert([
        userRequest,
        {
          ...successResponse,
          data: "wrong-type",
        },
      ]);
    });

    it("should not allow setting response with wrong error type", () => {
      expectNotFunctionParametersType(cache.set).assert([
        userRequest,
        {
          ...successResponse,
          data: null,
          error: "string-error",
          success: false as const,
        },
      ]);
    });

    it("should allow setting response with correct error type", () => {
      expectFunctionParametersType(cache.set).assert([
        userRequest,
        {
          ...successResponse,
          data: null,
          error: { code: "NOT_FOUND", message: "User not found" },
          success: false as const,
        },
      ]);
    });

    it("should allow any data type when request has response: any", () => {
      expectFunctionParametersType(cache.set).assert([
        anyRequest,
        {
          ...successResponse,
          data: "string-data",
        },
      ]);

      expectFunctionParametersType(cache.set).assert([
        anyRequest,
        {
          ...successResponse,
          data: { anything: true },
        },
      ]);
    });
  });

  describe("when using cache.update", () => {
    it("should allow partial response update for a typed request", () => {
      expectFunctionParametersType(cache.update).assert([userRequest, { data: { id: 2, name: "Jane" } }]);
    });

    it("should allow partial update with only error field", () => {
      expectFunctionParametersType(cache.update).assert([userRequest, { error: { code: "ERR", message: "fail" } }]);
    });

    it("should not allow partial update with wrong data type", () => {
      expectNotFunctionParametersType(cache.update).assert([userRequest, { data: "wrong-type" }]);
    });

    it("should not allow partial update with wrong error type", () => {
      expectNotFunctionParametersType(cache.update).assert([userRequest, { error: "string-error" }]);
    });

    it("should allow partial update with correct error type", () => {
      expectFunctionParametersType(cache.update).assert([userRequest, { error: { code: "ERR", message: "fail" } }]);
    });

    it("should allow updating only metadata fields", () => {
      expectFunctionParametersType(cache.update).assert([userRequest, { success: true as const }]);
    });
  });
});
