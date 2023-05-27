import { Socket } from "@hyper-fetch/sockets";
import { waitFor } from "@testing-library/dom";
import { Client } from "@hyper-fetch/core";

import { RealtimeSocketAdapterType } from "sockets";
import { Tea } from "../../../utils/seed.data";
import { firebaseAdminAdapter, firebaseWebAdapter } from "adapter";

export const onValueTestSuite = (
  adapter: RealtimeSocketAdapterType,
  coreAdapter: () => ReturnType<typeof firebaseWebAdapter> | ReturnType<typeof firebaseAdminAdapter>,
) => {
  describe("onValue", () => {
    const spy = jest.fn();

    let client = new Client({ url: "teas/" }).setAdapter(coreAdapter);
    let socket = new Socket({ url: "teas/", adapter });
    // let socketBees = new Socket({ url: "bees/", adapter });
    beforeEach(() => {
      client = new Client({ url: "teas/" }).setAdapter(coreAdapter);
      socket = new Socket({ url: "teas/", adapter });
      // socketBees = new Socket({ url: "bees/", adapter });
      jest.resetAllMocks();
    });

    it("should return unmount function", async () => {
      const req = socket.createListener<Tea[]>()({
        name: "",
      });
      const unmount = await req.listen({ callback: jest.fn() });
      expect(unmount).toBeFunction();
    });
    it("should not change HF cache if method is called with onlyOnce option", async () => {
      const onValueReq = socket.createListener<Tea[]>()({
        name: "",
        options: { onlyOnce: true },
      });
      const newData = { origin: "Poland", type: "Green", year: 2043, name: "Pou Ran Do Cha", amount: 100 } as Tea;
      const pushReq = client
        .createRequest<Tea, Tea>()({
          endpoint: "",
          method: "push",
        })
        .setData(newData);

      const unmount = await onValueReq.listen({
        callback: ({ data, extra }) => {
          spy();
          expect(data).toStrictEqual(newData);
          expect(extra).toHaveProperty("snapshot");
          expect(extra).toHaveProperty("unsubscribe");
          expect(extra).toHaveProperty("ref");
        },
      });

      await pushReq.send();

      await waitFor(async () => {
        expect(spy).toBeCalledTimes(1);
      });

      unmount();
    });
  });
};
