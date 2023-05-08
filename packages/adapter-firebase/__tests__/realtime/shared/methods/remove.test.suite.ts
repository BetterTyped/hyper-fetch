import { Client } from "@hyper-fetch/core";

import { firebaseAdminAdapter, firebaseWebAdapter } from "../../../../src";
import { Tea } from "../../../utils/seed.data";

export const removeTestSuite = (
  adapterFunction: () => ReturnType<typeof firebaseWebAdapter> | ReturnType<typeof firebaseAdminAdapter>,
) => {
  it("should allow for removing data", async () => {
    const client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
    const getReq = client
      .createRequest<Tea>()({
        endpoint: ":teaId",
        method: "get",
      })
      .setParams({ teaId: 1 });

    const removeReq = client
      .createRequest<Tea>()({
        endpoint: ":teaId",
        method: "remove",
      })
      .setParams({ teaId: 1 });

    await removeReq.send();
    const { data, additionalData } = await getReq.send();
    expect(data).toBe(null);
    expect(additionalData.snapshot.exists()).toBe(false);
  });
};
