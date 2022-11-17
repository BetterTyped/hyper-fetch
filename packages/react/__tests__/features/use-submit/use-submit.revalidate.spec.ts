import { act } from "@testing-library/react";

import { startServer, resetInterceptors, stopServer, createRequestInterceptor } from "../../server";
import { testErrorState, testSuccessState } from "../../shared";
import { builder, createCommand, renderUseFetch, renderUseSubmit } from "../../utils";

describe("useFetch [ Revalidate ]", () => {
  let commandSubmit = createCommand<null, null>({ method: "POST" });
  let commandFetch = createCommand({ endpoint: "fetch-test" });

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  beforeEach(() => {
    jest.resetModules();
    builder.clear();
    commandSubmit = createCommand({ method: "POST" });
    commandFetch = createCommand({ endpoint: "fetch-test" });
  });

  it("should allow to revalidate other command on finished", async () => {
    const submitMock = createRequestInterceptor(commandSubmit);
    const errorFetchMock = createRequestInterceptor(commandFetch, { status: 400 });
    const responseSubmit = renderUseSubmit(commandSubmit);
    const responseFetch = renderUseFetch(commandFetch);

    await testErrorState(errorFetchMock, responseFetch);
    const fetchMock = createRequestInterceptor(commandFetch);

    act(() => {
      responseSubmit.result.current.onSubmitFinished(() => {
        responseSubmit.result.current.revalidate(commandFetch);
      });
      responseSubmit.result.current.submit();
    });

    await testSuccessState(submitMock, responseSubmit);
    await testSuccessState(fetchMock, responseFetch);
  });
  it("should allow to revalidate by Command", async () => {
    const spy = jest.spyOn(builder.cache, "revalidate");

    const { result } = renderUseSubmit(commandSubmit);

    act(() => {
      result.current.revalidate(commandSubmit);
    });

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(commandSubmit.cacheKey);
  });
  it("should allow to revalidate by RegExp", async () => {
    const spy = jest.spyOn(builder.cache, "revalidate");

    const { result } = renderUseSubmit(commandSubmit);

    act(() => {
      result.current.revalidate(new RegExp(commandSubmit.cacheKey));
    });

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(new RegExp(commandSubmit.cacheKey));
  });
  it("should allow to revalidate by cacheKey", async () => {
    const spy = jest.spyOn(builder.cache, "revalidate");

    const { result } = renderUseSubmit(commandSubmit);

    act(() => {
      result.current.revalidate(commandSubmit.cacheKey);
    });

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(commandSubmit.cacheKey);
  });
  it("should allow to revalidate by cacheKey", async () => {
    const spy = jest.spyOn(builder.cache, "revalidate");

    const { result } = renderUseSubmit(commandSubmit);

    act(() => {
      result.current.revalidate([commandSubmit.cacheKey]);
    });

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith(commandSubmit.cacheKey);
  });
  it("should not allow to revalidate without key", async () => {
    const spy = jest.spyOn(builder.cache, "revalidate");

    const { result } = renderUseSubmit(commandSubmit);

    act(() => {
      result.current.revalidate(undefined as string);
    });

    expect(spy).toBeCalledTimes(0);
  });
});
