import { ClientType, FetchClientXHR } from "client";
import { FetchBuilder } from "builder";
import { FetchCommand } from "command";
import { LoggerManager } from "managers";
import { interceptBase } from "../../utils/mocks";
import { resetMocks, startServer, stopServer } from "../../utils/server";

const baseUrl = "some-url";
const options: FetchClientXHR = { timeout: 1000 };

describe("FetchBuilder", () => {
  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    resetMocks();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When initializing the builder", () => {
    it("should assign provided props", async () => {
      const builder = new FetchBuilder({ baseUrl, options })
        .setDebug(true)
        .setLogger((b) => new LoggerManager(b, { logger: () => null }))
        .build();

      expect(builder.options).toStrictEqual(options);
      expect(builder.baseUrl).toBe(baseUrl);
      expect(builder.debug).toBe(true);
    });

    it("should initialize with applied methods", async () => {
      const builder = new FetchBuilder({ baseUrl, options })
        .onError(() => [null, null, 0])
        .onError(() => [null, null, 0])
        .onSuccess(() => [null, null, 0])
        .onSuccess(() => [null, null, 0])
        .onAuth((command) => command)
        .onAuth((command) => command)
        .onRequest((command) => command)
        .onRequest((command) => command)
        .onResponse(() => [null, null, 0])
        .onResponse(() => [null, null, 0])
        .build();

      expect(builder.__onRequestCallbacks).toHaveLength(2);
      expect(builder.__onResponseCallbacks).toHaveLength(2);
      expect(builder.__onErrorCallbacks).toHaveLength(2);
      expect(builder.__onSuccessCallbacks).toHaveLength(2);
      expect(builder.__onAuthCallbacks).toHaveLength(2);
    });
  });

  describe("When using built in methods", () => {
    it("should apply custom client", async () => {
      const customHttpClient: ClientType<any, any> = () => Promise.resolve([null, null, 0]);

      const builder = new FetchBuilder({ baseUrl, options }).setClient(() => customHttpClient).build();

      expect(builder.client).toBe(customHttpClient);
    });

    it("should call the methods", async () => {
      const headersCall = jest.fn();
      const errorCall = jest.fn();
      const requestCall = jest.fn();
      const responseCall = jest.fn();

      const testHeaders = { Auth: "test" };

      const builder = new FetchBuilder({ baseUrl })
        .onAuth((command) => {
          headersCall(command);
          return command.setHeaders(testHeaders);
        })
        .onError((error) => {
          errorCall(error);
          return error;
        })
        .onRequest((command) => {
          requestCall(command);
          return command;
        })
        .onResponse((response, command) => {
          responseCall(response, command);
          return [null, null, 0];
        })
        .build();

      const command = builder.createCommand()({
        endpoint: "/",
      });

      interceptBase(400);

      await command.send();

      expect((await builder.__modifyAuth(command)).headers).toBe(testHeaders);
      expect(headersCall.mock.calls[0][0] instanceof FetchCommand).toBeTruthy();
      expect(headersCall.mock.calls[0][0] instanceof FetchCommand).toBeTruthy();
      expect(errorCall.mock.calls[0][0]).toEqual([null, { message: "Error" }, 400]);
      expect(errorCall.mock.calls[0][0]).toEqual([null, { message: "Error" }, 400]);
      expect(requestCall.mock.calls[0][0] instanceof FetchCommand).toBeTruthy();
      expect(requestCall.mock.calls[0][0] instanceof FetchCommand).toBeTruthy();
      expect(responseCall.mock.calls[0][0]).toEqual([null, { message: "Error" }, 400]);
      expect(responseCall.mock.calls[0][1] instanceof FetchCommand).toBeTruthy();
      expect(responseCall.mock.calls[0][1] instanceof FetchCommand).toBeTruthy();
    });

    it("should allow to create FetchCommand", async () => {
      const builder = new FetchBuilder({ baseUrl, options }).build();

      const command = builder.createCommand()({ endpoint: "some-endpoint" });

      expect(command instanceof FetchCommand).toBeTruthy();
      expect(command instanceof FetchCommand).toBeTruthy();
    });
  });

  describe("When using Builder methods", () => {
    it("should trigger onRequest method before making request", async () => {
      const methodFn = jest.fn();

      interceptBase(200);

      const builder = new FetchBuilder({ baseUrl, options })
        .onRequest((command) => {
          methodFn();
          return command;
        })
        .build();

      const command = builder.createCommand()({
        endpoint: "/",
      });

      await command.send();

      expect(methodFn).toBeCalled();
    });

    it("should throw onRequest method when command is not returned", async () => {
      const methodFn = jest.fn();

      interceptBase(200);

      const builder = new FetchBuilder({ baseUrl, options })
        .onRequest((command) => {
          methodFn();
          return undefined as unknown as typeof command;
        })
        .build();

      const command = builder.createCommand()({
        endpoint: "/",
      });

      expect(builder.__modifyRequest(command)).rejects.toThrow();
    });

    it("should trigger onResponse method after making request", async () => {
      const methodFn = jest.fn();

      interceptBase(200);

      const builder = new FetchBuilder({ baseUrl, options })
        .onResponse((response) => {
          methodFn();
          return response;
        })
        .build();

      const command = builder.createCommand()({
        endpoint: "/",
      });

      await command.send();

      expect(methodFn).toBeCalled();
    });

    it("should throw onResponse method when command is not returned", async () => {
      const methodFn = jest.fn();

      interceptBase(200);

      const builder = new FetchBuilder({ baseUrl, options })
        .onResponse((command) => {
          methodFn();
          return undefined as unknown as typeof command;
        })
        .build();

      const command = builder.createCommand()({
        endpoint: "/",
      });

      expect(builder.__modifyResponse([undefined, null, 200], command)).rejects.toThrow();
    });
  });
});
