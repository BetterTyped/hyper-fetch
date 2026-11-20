import { Client } from "@hyper-fetch/core";
/* eslint-disable max-params */
import { Socket } from "@hyper-fetch/sockets";
import type {
  FirebaseAdminAdapterTypes,
  FirebaseAdminSocketAdapterTypes,
  RealtimeAdminSocketAdapterType,
} from "adapter";
import { $limitToFirst, $orderByChild } from "constraints";
import waitForExpect from "wait-for-expect";

import type { Tea } from "../../../../utils";

export const onValueTestSuite = (
  db: Promise<any>,
  seedDb: (initializedDb: any) => Promise<void>,
  socketsAdapter: (database: any) => FirebaseAdminSocketAdapterTypes<any>,
  coreAdapter: (database: any) => FirebaseAdminAdapterTypes<any>,
) => {
  describe("when using onValue method", () => {
    let initializedCoreAdapter: any;
    let initializedDb: any;
    let spy = vi.fn();
    const newData = { origin: "Poland", type: "Green", year: 2043, name: "Pou Ran Do Cha", amount: 100 } as Tea;

    beforeAll(async () => {
      initializedDb = await db;
      initializedCoreAdapter = coreAdapter(initializedDb);
    });

    beforeEach(async () => {
      await seedDb(initializedDb);
    });

    const initialize = async () => {
      const client = new Client({ url: "teas/" }).setAdapter(initializedCoreAdapter);
      const socket = new Socket({
        url: "teas/",
        adapter: socketsAdapter(initializedDb) as RealtimeAdminSocketAdapterType,
      });
      const pushReq = client
        .createRequest<{ response: Tea; payload: Tea }>()({
          endpoint: "",
          method: "push",
        })
        .setPayload(newData);
      const socketBees = new Socket({ url: "bees/", adapter: socketsAdapter(initializedDb) });

      return { client, socket, pushReq, socketBees };
    };

    beforeEach(() => {
      vi.resetAllMocks();
      vi.clearAllMocks();
      spy = vi.fn();
    });

    it("should return unmount function", async () => {
      const { socket } = await initialize();
      const onValueReq = socket.createListener<Tea[]>()({
        topic: "",
      });
      const unmount = onValueReq.listen(spy);
      expect(typeof unmount).toBe("function");
      unmount();
    });

    it("should deliver each snapshot to the listener once", async () => {
      const { socket, pushReq } = await initialize();
      const onValueReq = socket.createListener<Tea[]>()({
        topic: "",
      });

      const received: (Tea[] | null)[] = [];
      const unmount = onValueReq.listen(({ data }) => {
        received.push(data);
      });

      await waitForExpect(async () => {
        expect(received.length).toBeGreaterThan(0);
      });
      expect(received).toHaveLength(1);

      const { data: added } = await pushReq.send();

      await waitForExpect(async () => {
        expect(received.at(-1)).toEqual(expect.arrayContaining([{ ...newData, __key: added?.__key }]));
      });
      expect(received).toHaveLength(2);

      unmount();
    });

    it("should unmount listeners", async () => {
      const { socket, pushReq } = await initialize();
      const onValueReq = socket.createListener<Tea[]>()({
        topic: "",
      });
      const unmount = onValueReq.listen(spy);

      await waitForExpect(async () => {
        expect(spy).toHaveBeenCalledTimes(1);
      });

      unmount();

      await pushReq.send();
      await pushReq.send();

      await waitForExpect(async () => {
        expect(spy).toHaveBeenCalledTimes(1);
      }, 1000);

      expect(socket.adapter.listeners.get(onValueReq.topic)?.size).toBe(0);
    });

    it("should keep other listeners on the same path when one unmounts", async () => {
      const { socket, pushReq } = await initialize();
      const { socket: otherSocket } = await initialize();
      const onValueReq = socket.createListener<Tea[]>()({ topic: "" });
      const otherOnValueReq = otherSocket.createListener<Tea[]>()({ topic: "" });

      const received: (Tea[] | null)[] = [];
      const otherReceived: (Tea[] | null)[] = [];
      const unmount = onValueReq.listen(({ data }) => {
        received.push(data);
      });
      const otherUnmount = otherOnValueReq.listen(({ data }) => {
        otherReceived.push(data);
      });

      await waitForExpect(async () => {
        expect(received).toHaveLength(1);
        expect(otherReceived).toHaveLength(1);
      });

      unmount();
      const { data: added } = await pushReq.send();

      await waitForExpect(async () => {
        expect(otherReceived.at(-1)).toEqual(expect.arrayContaining([{ ...newData, __key: added?.__key }]));
      });
      expect(received).toHaveLength(1);

      otherUnmount();
    });

    it("should filter with the listener's query params", async () => {
      const { socket } = await initialize();
      const onFirstTeas = socket
        .createListener<Tea[]>()({ topic: "" })
        .setQueryParams((c) => c.orderByChild("year").limitToFirst(2));

      const received: Tea[][] = [];
      const unmount = onFirstTeas.listen(({ data }) => {
        received.push(data);
      });

      await waitForExpect(async () => {
        expect(received).toHaveLength(1);
      });
      expect(received[0].map((tea) => tea.year)).toStrictEqual([1980, 2011]);

      unmount();
    });

    it("should keep the deprecated options.constraints working", async () => {
      const { socket } = await initialize();
      const onFirstTeas = socket.createListener<Tea[]>()({
        topic: "",
        options: { constraints: [$orderByChild("year"), $limitToFirst(2)] },
      });

      const received: Tea[][] = [];
      const unmount = onFirstTeas.listen(({ data }) => {
        received.push(data);
      });

      await waitForExpect(async () => {
        expect(received).toHaveLength(1);
      });
      expect(received[0].map((tea) => tea.year)).toStrictEqual([1980, 2011]);

      unmount();
    });

    it("should return emptyResource status", async () => {
      const { socketBees } = await initialize();
      const onValueReq = socketBees.createListener<Tea[]>()({
        topic: "",
        options: { onlyOnce: false },
      });

      let receivedData: any;
      let receivedExtra: any;

      const unmount = onValueReq.listen(({ data, extra }) => {
        spy();
        receivedData = data;
        receivedExtra = extra;
      });

      await waitForExpect(async () => {
        expect(spy).toHaveBeenCalled();
        expect(receivedData).toBeNull();
        expect(receivedExtra.status).toBe("emptyResource");
      });

      unmount();
    });

    it("should be called once with onlyOnce option", async () => {
      const { socket, pushReq } = await initialize();
      const onValueReq = socket.createListener<Tea[]>()({
        topic: "",
        options: { onlyOnce: true },
      });

      const unmount = onValueReq.listen(spy);

      await pushReq.send();

      await waitForExpect(async () => {
        expect(spy).toHaveBeenCalledTimes(1);
      });

      unmount();
    });

    it("should receive updates", async () => {
      const { socket, pushReq } = await initialize();

      const onValueReq = socket.createListener<Tea[]>()({
        topic: "",
        options: { onlyOnce: false },
      });

      let receivedData: Tea[] | null;
      let receivedExtra: any;

      const unmount = onValueReq.listen(({ data, extra }) => {
        spy();
        receivedData = data;
        receivedExtra = extra;
      });

      const { data } = await pushReq.send();

      await waitForExpect(async () => {
        expect(receivedData).toEqual(expect.arrayContaining([{ ...newData, __key: data?.__key }]));
        expect(receivedExtra).toHaveProperty("snapshot");
        expect(receivedExtra).toHaveProperty("status");
        expect(receivedExtra).toHaveProperty("ref");
        expect(receivedExtra.status).toBe("success");
      });

      unmount();
    });

    it("should return data available for doc", async () => {
      const { socket } = await initialize();
      const onValueReq = socket
        .createListener<Tea[]>()({
          topic: ":teaId",
        })
        .setParams({ teaId: 1 });

      let receivedData: any;
      let receivedExtra: any;
      const unmount = onValueReq.listen(({ data, extra }) => {
        spy();
        receivedData = data;
        receivedExtra = extra;
      });

      await waitForExpect(async () => {
        expect(receivedData).toStrictEqual({
          __key: "1",
          amount: 150,
          name: "Taiping Hou Kui",
          origin: "China",
          type: "Green",
          year: 2023,
        });
        expect(receivedExtra).toHaveProperty("snapshot");
        expect(receivedExtra).toHaveProperty("ref");
        expect(receivedExtra.status).toBe("success");
      });

      unmount();
    });
  });
};
