import { createBuilder, createCommand } from "../../utils";
import { resetInterceptors, startServer, stopServer } from "../../server";
import { Builder, ClientQueryParamsType } from "../../../src";

describe("Fetch Client [ Base ]", () => {
  let builder = createBuilder();
  let command = createCommand(builder);
  beforeAll(() => {
    startServer();
  });

  beforeEach(() => {
    builder = createBuilder();
    command = createCommand(builder);
    resetInterceptors();
    jest.resetAllMocks();
  });

  afterAll(() => {
    stopServer();
  });

  it("should allow for setting custom header", async () => {
    // The queue should receive command with the appropriate header
    const spy = jest.fn(builder.fetchDispatcher.add);
    jest.spyOn(builder.fetchDispatcher, "add").mockImplementation(spy);
    const header = { it: "works" };
    const c = command.setHeaders(header);

    await c.send();

    expect(c.headers).toEqual(header);
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].headers).toEqual(header);
  });

  it("should allow for setting auth", async () => {
    // The queue should receive command with the appropriate header
    const spy = jest.fn(builder.fetchDispatcher.add);
    jest.spyOn(builder.fetchDispatcher, "add").mockImplementation(spy);

    expect(command.auth).toBe(true);

    const c = command.setAuth(false);

    await c.send();

    expect(c.auth).toBe(false)
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].auth).toBe(false)
  });

  it("should allow for setting custom params", async () => {
    // The queue should receive command with the appropriate header
    const command = builder.createCommand<unknown, unknown, any, ClientQueryParamsType>()({
      endpoint: "/some-endpoint/:shopId/:productId",
    });
    const spy = jest.fn(builder.fetchDispatcher.add);
    jest.spyOn(builder.fetchDispatcher, "add").mockImplementation(spy);
    const params = {shopId: 11, productId: 1}

    const c = command.setParams(params);

    await c.send();

    expect(c.params).toEqual(params)
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].params).toEqual(params)
  });

  it("should allow for setting data to the command", async () => {
    const spy = jest.fn(builder.fetchDispatcher.add);
    jest.spyOn(builder.fetchDispatcher, "add").mockImplementation(spy);
    const data = {
      userId: 11,
      role: 'ADMIN'
    }
    const c = command.setData(data);

    await c.send();

    expect(c.data).toStrictEqual(data)
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].data).toEqual(data)
  });

  it("should allow for setting data mapper", async () => {
    const comm = createCommand<typeof builder, {}, {userId: number, role: string}>(builder)
    const spy = jest.fn(builder.fetchDispatcher.add);
    jest.spyOn(builder.fetchDispatcher, "add").mockImplementation(spy);
    const data = {
      userId: 11,
      role: 'ADMIN'
    }
    function dataMapper({role, userId}: {role: string, userId: number}): string {
      return `${userId}_${role}`
    }

    const commandMapped = comm.setDataMapper(dataMapper)
    const commandSetData = commandMapped.setData(data);


    await commandSetData.send();

    expect(commandSetData.data).toStrictEqual(`${data.userId}_${data.role}`)
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].data).toStrictEqual(`${data.userId}_${data.role}`)
  })

  it('Should allow for setting queryParams', async () => {
    const queryParams = {userId: 11}
    const command = builder.createCommand<unknown, unknown, any, ClientQueryParamsType>()({
      endpoint: "/some-endpoint/",
    });
    const spy = jest.fn(builder.fetchDispatcher.add);
    jest.spyOn(builder.fetchDispatcher, "add").mockImplementation(spy);

    const commandQueryParams = command.setQueryParams(queryParams)
    commandQueryParams.send()

    expect(commandQueryParams.queryParams).toStrictEqual(queryParams)
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].queryParams).toStrictEqual(queryParams)

  })
});
