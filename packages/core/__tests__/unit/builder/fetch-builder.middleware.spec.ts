import { resetInterceptors, startServer, stopServer } from "../../server";
import { createBuilder, createCommand, middlewareCallback } from "../../utils";
import { testCallbacksExecution } from "../../shared";

describe("FetchBuilder [ Middleware ]", () => {
  let builder = createBuilder();
  let command = createCommand(builder);

  beforeAll(() => {
    startServer();
  });

  afterEach(() => {
    builder = createBuilder();
    command = createCommand(builder);
    resetInterceptors();
  });

  afterAll(() => {
    stopServer();
  });

  describe("When middleware callbacks being added", () => {
    it("should assign onAuth middleware", async () => {
      const callback = middlewareCallback();
      builder.onAuth(callback).onAuth(callback);

      expect(builder.__onAuthCallbacks).toHaveLength(2);
      expect(builder.__onAuthCallbacks[0]).toEqual(callback);
      expect(builder.__onAuthCallbacks[1]).toEqual(callback);
    });
    it("should assign onRequest middleware", async () => {
      const callback = middlewareCallback();
      builder.onRequest(callback).onRequest(callback);

      expect(builder.__onRequestCallbacks).toHaveLength(2);
      expect(builder.__onRequestCallbacks[0]).toEqual(callback);
      expect(builder.__onRequestCallbacks[1]).toEqual(callback);
    });
  });

  describe("When middleware callbacks go into the execution loop", () => {
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    const spy3 = jest.fn();

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should trigger __modifyAuth async loop", async () => {
      const callbackFirst = middlewareCallback({ callback: spy1, sleepTime: 20 });
      const callbackMiddle = middlewareCallback({ callback: spy2 });
      const callbackLast = middlewareCallback({ callback: spy3, sleepTime: 10 });

      builder.onAuth(callbackFirst).onAuth(callbackMiddle).onAuth(callbackLast);
      await builder.__modifyAuth(command);

      testCallbacksExecution([spy1, spy2, spy3]);
    });
    it("should trigger __modifyRequest async loop", async () => {
      const callbackFirst = middlewareCallback({ callback: spy1, sleepTime: 20 });
      const callbackMiddle = middlewareCallback({ callback: spy2 });
      const callbackLast = middlewareCallback({ callback: spy3, sleepTime: 10 });

      builder.onRequest(callbackFirst).onRequest(callbackMiddle).onRequest(callbackLast);
      await builder.__modifyRequest(command);

      testCallbacksExecution([spy1, spy2, spy3]);
    });
  });
});

// describe("When using Builder methods", () => {
//   it("should trigger onRequest method before making request", async () => {
//     const methodFn = jest.fn();

//     interceptGetBase(200);

//     const builder = new FetchBuilder({ baseUrl }).setHttpOptions(options).onRequest((command) => {
//       methodFn();
//       return command;
//     });
//     const command = builder.createCommand()({
//       endpoint: "/something",
//     });

//     await command.send();

//     expect(methodFn).toBeCalled();
//   });

//   it("should throw onRequest method when command is not returned", async () => {
//     const methodFn = jest.fn();

//     interceptGetBase(200);

//     const builder = new FetchBuilder({ baseUrl }).setHttpOptions(options).onRequest((command) => {
//       methodFn();
//       return undefined as unknown as typeof command;
//     });
//     const command = builder.createCommand()({
//       endpoint: "/something",
//     });

//     expect(builder.__modifyRequest(command)).rejects.toThrow();
//   });

//   it("should trigger onResponse method after making request", async () => {
//     const methodFn = jest.fn();

//     interceptGetBase(200);

//     const builder = new FetchBuilder({ baseUrl }).setHttpOptions(options).onResponse((response) => {
//       methodFn();
//       return response;
//     });
//     const command = builder.createCommand()({
//       endpoint: "/something",
//     });

//     await command.send();

//     expect(methodFn).toBeCalled();
//   });

//   it("should throw onResponse method when command is not returned", async () => {
//     const methodFn = jest.fn();

//     interceptGetBase(200);

//     const builder = new FetchBuilder({ baseUrl }).setHttpOptions(options).onResponse((command) => {
//       methodFn();
//       return undefined as unknown as typeof command;
//     });
//     const command = builder.createCommand()({
//       endpoint: "/something",
//     });

//     expect(builder.__modifyResponse([undefined, null, 200], command)).rejects.toThrow();
//   });
// });
