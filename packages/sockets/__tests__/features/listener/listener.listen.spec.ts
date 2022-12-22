import { createListener } from "../../utils/listener.utils";
import { createSocket } from "../../utils/socket.utils";
import { sendWsEvent, constructEventData, createWsServer } from "../../websocket/websocket.server";

type DataType = { name: string; age: number };

describe("Listener [ Listen ]", () => {
  let socket = createSocket();
  let listener = createListener<DataType>(socket);

  beforeEach(() => {
    createWsServer();
    socket = createSocket();
    listener = createListener<DataType>(socket);
    jest.resetAllMocks();
  });

  it("should listen to given event name", async () => {
    const spy = jest.fn();
    const message = { name: "Maciej", age: 99 };
    listener.listen((data) => spy(data));
    sendWsEvent(listener, message);

    const expectedResponse = constructEventData(listener, message);
    expect(spy).toHaveBeenCalledOnceWith(expectedResponse);
  });

  it("should allow to remove given listener", async () => {
    const spy = jest.fn();
    const [removeListener] = listener.listen((data) => spy(data));
    const message = { name: "Maciej", age: 99 };
    sendWsEvent(listener, message);
    expect(spy).toHaveBeenCalledOnce();
    removeListener();
    sendWsEvent(listener, message);
    sendWsEvent(listener, message);
    sendWsEvent(listener, message);
    expect(spy).toHaveBeenCalledOnce();
  });
});
