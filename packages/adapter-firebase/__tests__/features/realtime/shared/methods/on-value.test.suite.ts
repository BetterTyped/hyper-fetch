import { Socket } from "@hyper-fetch/sockets";
import { Client } from "@hyper-fetch/core";
import waitForExpect from "wait-for-expect";

import { FirebaseBrowserAdapterTypes, FirebaseBrowserSocketAdapterTypes } from "adapter/index.browser";
import { FirebaseAdminAdapterTypes, FirebaseAdminSocketAdapterTypes } from "adapter/index.server";
import { Tea } from "../../../../utils";

export const onValueTestSuite = (
  db: Promise<any>,
  seedDb: (initializedDb) => Promise<void>,
  socketsAdapter: (database) => FirebaseBrowserSocketAdapterTypes<any> | FirebaseAdminSocketAdapterTypes<any>,
  coreAdapter: (database) => () => FirebaseBrowserAdapterTypes<any> | FirebaseAdminAdapterTypes<any>,
) => {
  describe("when using onValue method", () => {
    let initializedSocketsAdapter;
    let initializedCoreAdapter;
    let initializedDb;
    let spy = jest.fn();
    const newData = { origin: "Poland", type: "Green", year: 2043, name: "Pou Ran Do Cha", amount: 100 } as Tea;

    beforeAll(async () => {
      initializedDb = await db;
      initializedSocketsAdapter = socketsAdapter(initializedDb);
      initializedCoreAdapter = coreAdapter(initializedDb);
    });

    beforeEach(async () => {
      await seedDb(initializedDb);
    });

    const initialize = async () => {
      const client = new Client({ url: "teas/" }).setAdapter(initializedCoreAdapter);
      const socket = new Socket({ url: "teas/", adapter: initializedSocketsAdapter });
      const pushReq = client
        .createRequest<Tea, Tea>()({
          endpoint: "",
          method: "push",
        })
        .setData(newData);
      const socketBees = new Socket({ url: "bees/", adapter: initializedSocketsAdapter });

      return { client, socket, pushReq, socketBees };
    };

    beforeEach(() => {
      jest.resetAllMocks();
      jest.clearAllMocks();
      spy = jest.fn();
    });

    it("should return unmount function", async () => {
      const { socket } = await initialize();
      const onValueReq = socket.createListener<Tea[]>()({
        endpoint: "",
      });
      const unmount = onValueReq.listen({ callback: spy });
      expect(unmount).toBeFunction();
    });

    it("should unmount listeners", async () => {
      const { socket, pushReq } = await initialize();
      const onValueReq = socket.createListener<Tea[]>()({
        endpoint: "",
      });
      const unmount = onValueReq.listen({ callback: spy });

      await waitForExpect(async () => {
        expect(spy).toBeCalledTimes(1);
      });

      unmount();

      await pushReq.send();
      await pushReq.send();

      await waitForExpect(async () => {
        expect(spy).toBeCalledTimes(1);
      }, 1000);

      expect(socket.adapter.listeners.get(onValueReq.endpoint).size).toBe(0);
    });

    it("should return emptyResource status", async () => {
      const { socketBees } = await initialize();
      const onValueReq = socketBees.createListener<Tea[]>()({
        endpoint: "",
        options: { onlyOnce: false },
      });

      let receivedData;
      let receivedExtra;

      const unmount = onValueReq.listen({
        callback: ({ data, extra }) => {
          spy();
          receivedData = data;
          receivedExtra = extra;
        },
      });

      await waitForExpect(async () => {
        expect(spy).toBeCalled();
        expect(receivedData).toBeNull();
        expect(receivedExtra.status).toBe("emptyResource");
      });

      unmount();
    });

    it("should be called once with onlyOnce option", async () => {
      const { socket, pushReq } = await initialize();
      const onValueReq = socket.createListener<Tea[]>()({
        endpoint: "",
        options: { onlyOnce: true },
      });

      const unmount = onValueReq.listen({
        callback: spy,
      });

      await pushReq.send();

      await waitForExpect(async () => {
        expect(spy).toBeCalledTimes(1);
      });

      unmount();
    });

    it("should receive updates", async () => {
      const { socket, pushReq } = await initialize();

      const onValueReq = socket.createListener<Tea[]>()({
        endpoint: "",
        options: { onlyOnce: false },
      });

      let receivedData;
      let receivedExtra;

      const unmount = onValueReq.listen({
        callback: ({ data, extra }) => {
          spy();
          receivedData = data;
          receivedExtra = extra;
        },
      });

      await pushReq.send();

      await waitForExpect(async () => {
        expect(receivedData).toIncludeAllMembers([newData]);
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
          endpoint: ":teaId",
        })
        .setParams({ teaId: 1 });

      let receivedData;
      let receivedExtra;
      const unmount = onValueReq.listen({
        callback: ({ data, extra }) => {
          spy();
          receivedData = data;
          receivedExtra = extra;
        },
      });

      await waitForExpect(async () => {
        expect(receivedData).toStrictEqual({
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
