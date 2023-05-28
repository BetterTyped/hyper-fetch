export const onSnapshotTestSuite = () =>
  // adapterFunction: () => ReturnType<typeof firebaseAdapter> | ReturnType<typeof firebaseAdminAdapter>,
  {
    // describe("onSnapshot", () => {
    //   it("should return data available for collection", async () => {
    //     const client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
    //     const req = client.createRequest<Tea[]>()({
    //       endpoint: "",
    //       method: "onSnapshot",
    //     });
    //
    //     const { data, extra, status, success, error } = await req.send();
    //
    //     expect(data).toHaveLength(10);
    //     expect(extra).toHaveProperty("snapshot");
    //     expect(extra).toHaveProperty("unsubscribe");
    //     expect(extra).toHaveProperty("ref");
    //     expect(status).toBe("success");
    //     expect(success).toBe(true);
    //     expect(error).toBe(null);
    //
    //     extra.unsubscribe();
    //   });
    //   it("should inform about changes when groupByChangeType option is added", async () => {
    //     const newTeaData = {
    //       origin: "Poland",
    //       type: "Green",
    //       year: 2043,
    //       name: "Pou Ran Do Cha",
    //       amount: 100,
    //     } as Tea;
    //     const client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
    //     const req = client.createRequest<Tea[]>()({
    //       endpoint: "",
    //       method: "onSnapshot",
    //       options: { groupByChangeType: true },
    //     });
    //
    //     const { data, extra, status, success, error } = await req.send();
    //
    //     const addTeaReq = client
    //       .createRequest<Tea, Tea>()({
    //         endpoint: "",
    //         method: "addDoc",
    //       })
    //       .setData(newTeaData);
    //
    //     await addTeaReq.send();
    //     const afterAdded = req.client.cache.get(req.cacheKey);
    //
    //     const updateTeaReq = client
    //       .createRequest<Tea, Tea>()({
    //         endpoint: ":teaId",
    //         method: "updateDoc",
    //       })
    //       .setData(newTeaData);
    //
    //     await updateTeaReq.send({ params: { teaId: 1 } });
    //     const afterUpdated = req.client.cache.get(req.cacheKey);
    //
    //     const removeReq = client
    //       .createRequest<Tea>()({
    //         endpoint: ":teaId",
    //         method: "deleteDoc",
    //       })
    //       .setParams({ teaId: 1 });
    //     await removeReq.send();
    //     const afterRemoved = req.client.cache.get(req.cacheKey);
    //
    //     expect(data).toHaveLength(10);
    //     expect(extra.groupedResult.added).toHaveLength(10);
    //     expect(status).toBe("success");
    //     expect(success).toBe(true);
    //     expect(error).toBe(null);
    //
    //     expect(afterAdded.extra.groupedResult).toStrictEqual({
    //       added: [newTeaData],
    //       removed: [],
    //       modified: [],
    //     });
    //     expect(afterUpdated.extra.groupedResult).toStrictEqual({
    //       added: [],
    //       removed: [],
    //       modified: [newTeaData],
    //     });
    //     expect(afterRemoved.extra.groupedResult).toStrictEqual({
    //       added: [],
    //       removed: [newTeaData],
    //       modified: [],
    //     });
    //
    //     extra.unsubscribe();
    //   });
    //   it("should return data available for doc", async () => {
    //     const client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
    //     const req = client
    //       .createRequest<Tea[]>()({
    //         endpoint: ":teaId",
    //         method: "onSnapshot",
    //       })
    //       .setParams({ teaId: 1 });
    //     const { data, extra, status, success, error } = await req.send();
    //
    //     expect(data).toStrictEqual({ amount: 150, name: "Taiping Hou Kui", origin: "China", type: "Green", year: 2023 });
    //     expect(extra).toHaveProperty("snapshot");
    //     expect(extra).toHaveProperty("unsubscribe");
    //     expect(extra).toHaveProperty("ref");
    //     expect(status).toBe("success");
    //     expect(success).toBe(true);
    //     expect(error).toBe(null);
    //
    //     extra.unsubscribe();
    //   });
    //   it("should return emptyResource status for non existing resource", async () => {
    //     const client = new Client({ url: "bees/" }).setAdapter(adapterFunction);
    //     const req = client
    //       .createRequest<Tea[]>()({
    //         endpoint: ":teaId",
    //         method: "onSnapshot",
    //       })
    //       .setParams({ teaId: 1 });
    //     const { data, extra, status, success, error } = await req.send();
    //
    //     expect(data).toStrictEqual(null);
    //     expect(extra).toHaveProperty("snapshot");
    //     expect(extra).toHaveProperty("unsubscribe");
    //     expect(extra).toHaveProperty("ref");
    //     expect(status).toBe("emptyResource");
    //     expect(success).toBe(true);
    //     expect(error).toBe(null);
    //
    //     extra.unsubscribe();
    //   });
    //   it("should allow for listening to multiple documents and change HF cache if data is changed in firebase after onSnapshot listener creation", async () => {
    //     const cacheKey = "onSnapshot_?constraints[]=where_type%3D%3DGreen";
    //     const initialCache = [
    //       {
    //         amount: 50,
    //         year: 2022,
    //         origin: "China",
    //         name: "Bi Luo Chun",
    //         type: "Green",
    //       },
    //       {
    //         amount: 150,
    //         year: 2023,
    //         origin: "China",
    //         name: "Taiping Hou Kui",
    //         type: "Green",
    //       },
    //       {
    //         amount: 25,
    //         year: 2021,
    //         origin: "Japan",
    //         name: "Hon.yama Sencha",
    //         type: "Green",
    //       },
    //     ];
    //     const newData = {
    //       origin: "Poland",
    //       type: "Green",
    //       year: 2043,
    //       name: "Pou Ran Do Cha",
    //       amount: 100,
    //     };
    //     const afterUpdateCache = [...initialCache, newData];
    //     const client = new Client({ url: "teas/" }).setAdapter(adapterFunction);
    //     const onSnapshotReq = client.createRequest<Tea[]>()({
    //       endpoint: "",
    //       method: "onSnapshot",
    //     });
    //     // Should listen for changes only for Green teas
    //     const {
    //       extra: { unsubscribe },
    //     } = await onSnapshotReq.send({ queryParams: { constraints: [$where("type", "==", "Green")] } });
    //
    //     const afterOnSnapshotCache = onSnapshotReq.client.cache.get(cacheKey);
    //
    //     const shouldCacheData = newData as Tea;
    //     const shouldNotCacheData = {
    //       ...newData,
    //       type: "Oolong",
    //     } as Tea;
    //
    //     const shouldCacheAddDocRequest = client
    //       .createRequest<Tea, Tea>()({
    //         endpoint: "",
    //         method: "addDoc",
    //       })
    //       .setData(shouldCacheData);
    //     const shouldNotCacheAddDocRequest = client
    //       .createRequest<Tea, Tea>()({
    //         endpoint: "",
    //         method: "addDoc",
    //       })
    //       .setData(shouldNotCacheData);
    //
    //     await shouldCacheAddDocRequest.send();
    //     await shouldNotCacheAddDocRequest.send();
    //
    //     const { data: afterAddDocCache } = onSnapshotReq.client.cache.get(cacheKey);
    //
    //     if (unsubscribe) {
    //       unsubscribe();
    //     }
    //
    //     await shouldCacheAddDocRequest.send();
    //
    //     const { data: afterUnsubCache } = onSnapshotReq.client.cache.get(cacheKey);
    //
    //     expect(afterOnSnapshotCache.data).toIncludeSameMembers(initialCache);
    //     expect(afterAddDocCache).toIncludeSameMembers(afterUpdateCache);
    //     expect(afterUnsubCache).toIncludeSameMembers(afterUpdateCache);
    //   });
    // });
  };
