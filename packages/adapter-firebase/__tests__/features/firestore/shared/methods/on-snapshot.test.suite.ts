import { Client } from "@hyper-fetch/core";
import { Socket } from "@hyper-fetch/sockets";
import waitForExpect from "wait-for-expect";

import { FirebaseAdapterTypes, FirebaseSocketAdapterTypes } from "adapter";
import { $where } from "constraints";
import { Tea } from "../../../../utils";

export const onSnapshotTestSuite = (
  adapter: FirebaseSocketAdapterTypes<any>,
  coreAdapter: () => FirebaseAdapterTypes<any>,
) => {
  const newData = { origin: "Poland", type: "Green", year: 2043, name: "Pou Ran Do Cha", amount: 100 } as Tea;
  let spy = jest.fn();
  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
    spy = jest.fn();
  });
  const initialize = async () => {
    const client = new Client({ url: "teas/" }).setAdapter(coreAdapter);
    const socket = new Socket({ url: "teas/", adapter });
    const pushReq = client
      .createRequest<Tea, Tea>()({
        endpoint: "",
        method: "addDoc",
      })
      .setPayload(newData);
    const socketBees = new Socket({ url: "bees/", adapter });

    return { client, socket, socketBees, pushReq };
  };
  describe("onSnapshot", () => {
    it("should return unmount function", async () => {
      const { socket } = await initialize();
      const onSnapshotReq = socket.createListener<Tea[]>()({
        endpoint: "",
      });
      const unmount = onSnapshotReq.listen({ callback: spy });
      expect(unmount).toBeFunction();
    });
    it("should unmount listeners", async () => {
      const { socket, pushReq } = await initialize();
      const onSnapshotReq = socket.createListener<Tea[]>()({
        endpoint: "",
      });
      const unmount = onSnapshotReq.listen({ callback: spy });

      await waitForExpect(async () => {
        expect(spy).toHaveBeenCalledTimes(1);
      });

      unmount();
      await pushReq.send();
      await pushReq.send();

      await waitForExpect(async () => {
        expect(spy).toHaveBeenCalledTimes(1);
      }, 1000);

      expect(socket.adapter.listeners.get(onSnapshotReq.endpoint).size).toBe(0);
    });
    it("should return emptyResource status", async () => {
      const { socketBees } = await initialize();
      const onSnapshotReq = socketBees.createListener<Tea[]>()({
        endpoint: "",
      });

      let receivedData;
      let receivedExtra;
      let ref;

      const unmount = onSnapshotReq.listen({
        callback: ({ data, extra }) => {
          spy();
          receivedData = data;
          receivedExtra = extra;
          ref = extra.ref;
        },
      });

      await waitForExpect(async () => {
        expect(spy).toHaveBeenCalled();
        expect(ref).toBeDefined();
        expect(receivedData).toBeNull();
        expect(receivedExtra.status).toBe("emptyResource");
      });

      unmount();
    });

    it("should return data available for collection", async () => {
      const { socket } = await initialize();
      const onSnapshotReq = socket.createListener<Tea[]>()({
        endpoint: "",
      });

      let receivedData;
      let receivedExtra;
      const unmount = onSnapshotReq.listen({
        callback: ({ data, extra }) => {
          spy();
          receivedData = data;
          receivedExtra = extra;
        },
      });

      await waitForExpect(async () => {
        expect(receivedData).toHaveLength(10);
        expect(receivedExtra).toHaveProperty("snapshot");
        expect(receivedExtra).toHaveProperty("ref");
        expect(receivedExtra.status).toBe("success");
      });

      unmount();
    });
    it("should inform about changes when groupByChangeType option is added", async () => {
      const newTeaData = {
        origin: "Poland",
        type: "Green",
        year: 2043,
        name: "Pou Ran Do Cha",
        amount: 100,
      } as Tea;
      const { socket, client } = await initialize();
      const onSnapshotReq = socket.createListener<Tea[]>()({
        endpoint: "",
        options: { groupByChangeType: true },
      });

      const receivedData = [];
      const receivedExtra = [];
      const unmount = onSnapshotReq.listen({
        callback: ({ data, extra }) => {
          spy();
          receivedData.push(data);
          receivedExtra.push(extra);
        },
      });

      await waitForExpect(async () => {
        expect(receivedData).toHaveLength(1);
        expect(receivedData[0]).toHaveLength(10);
      }, 1000);

      const addTeaReq = client
        .createRequest<Tea, Tea>()({
          endpoint: "",
          method: "addDoc",
        })
        .setPayload(newTeaData);

      await addTeaReq.send();

      const updateTeaReq = client
        .createRequest<Tea, Tea>()({
          endpoint: ":teaId",
          method: "updateDoc",
        })
        .setPayload(newTeaData);

      await updateTeaReq.send({ params: { teaId: 1 } });

      const removeReq = client
        .createRequest<Tea>()({
          endpoint: ":teaId",
          method: "deleteDoc",
        })
        .setParams({ teaId: 1 });
      await removeReq.send();

      await waitForExpect(async () => {
        expect(receivedData).toHaveLength(4);
        const [, afterAdd, afterModify, afterRemove] = receivedData;
        const [, afterAddExtra, afterModifyExtra, afterRemoveExtra] = receivedExtra;
        expect(afterAdd).toHaveLength(11);
        expect(afterModify).toHaveLength(11);
        expect(afterRemove).toHaveLength(10);
        expect(afterAddExtra.groupedResult.added).toHaveLength(1);
        expect(afterModifyExtra.groupedResult.added).toHaveLength(0);
        expect(afterModifyExtra.groupedResult.modified).toHaveLength(1);
        expect(afterModifyExtra.groupedResult.removed).toHaveLength(0);
        expect(afterRemoveExtra.groupedResult.added).toHaveLength(0);
        expect(afterRemoveExtra.groupedResult.modified).toHaveLength(0);
        expect(afterRemoveExtra.groupedResult.removed).toHaveLength(1);
      });

      unmount();
    });
    it("should return data available for doc", async () => {
      const { socket } = await initialize();
      const onSnapshotReq = socket
        .createListener<Tea[]>()({
          endpoint: ":teaId",
        })
        .setParams({ teaId: 1 });

      let receivedData;
      const unmount = onSnapshotReq.listen({
        callback: ({ data }) => {
          spy();
          receivedData = data;
        },
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
      });

      unmount();
    });
    it("should allow for listening to multiple documents and change HF cache if data is changed in firebase after onSnapshot listener creation", async () => {
      const { socket, client } = await initialize();
      const initialCache = [
        {
          __key: "0",
          amount: 50,
          year: 2022,
          origin: "China",
          name: "Bi Luo Chun",
          type: "Green",
        },
        {
          __key: "1",
          amount: 150,
          year: 2023,
          origin: "China",
          name: "Taiping Hou Kui",
          type: "Green",
        },
        {
          __key: "2",
          amount: 25,
          year: 2021,
          origin: "Japan",
          name: "Hon.yama Sencha",
          type: "Green",
        },
      ];

      // Should listen for changes only for Green teas
      const onSnapshotReq = socket.createListener<Tea[]>()({
        endpoint: "",
        options: { constraints: [$where("type", "==", "Green")] },
      });

      const receivedData = [];
      const unmount = onSnapshotReq.listen({
        callback: ({ data }) => {
          spy();
          receivedData.push(data);
        },
      });

      await waitForExpect(async () => {
        expect(receivedData).toHaveLength(1);
        expect(receivedData[0]).toIncludeSameMembers(initialCache);
      }, 1000);

      const shouldCacheData = newData as Tea;
      const shouldNotCacheData = {
        ...newData,
        type: "Oolong",
      } as Tea;

      const shouldCacheAddDocRequest = client
        .createRequest<Tea, Tea>()({
          endpoint: "",
          method: "addDoc",
        })
        .setPayload(shouldCacheData);
      const shouldNotCacheAddDocRequest = client
        .createRequest<Tea, Tea>()({
          endpoint: "",
          method: "addDoc",
        })
        .setPayload(shouldNotCacheData);

      const { data } = await shouldCacheAddDocRequest.send();

      await shouldNotCacheAddDocRequest.send();

      unmount();

      await shouldCacheAddDocRequest.send();

      await waitForExpect(async () => {
        expect(receivedData).toHaveLength(2);
        expect(receivedData[1]).toIncludeSameMembers([...initialCache, data]);
      });
    });
  });
};
