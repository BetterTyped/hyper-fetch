/* oxlint-disable max-lines -- a generated fixture of 50 collections */
/* A db of 50 collections that uses every typed feature. `scripts/type-budget.mjs` type-checks it and fails when
 * the instantiations grow past the budget, so a type change that slows `tsc` for large apps is caught in CI. */
import { Client } from "@hyper-fetch/core";
import { and, collection, createDb, eq, gt, inArray, op, rowType } from "@hyper-fetch/db";

const client = new Client({ url: "http://localhost:5000" });

type Row0 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f0: boolean;
};
type Row1 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f1: boolean;
};
type Row2 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f2: boolean;
};
type Row3 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f3: boolean;
};
type Row4 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f4: boolean;
};
type Row5 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f5: boolean;
};
type Row6 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f6: boolean;
};
type Row7 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f7: boolean;
};
type Row8 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f8: boolean;
};
type Row9 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f9: boolean;
};
type Row10 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f10: boolean;
};
type Row11 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f11: boolean;
};
type Row12 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f12: boolean;
};
type Row13 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f13: boolean;
};
type Row14 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f14: boolean;
};
type Row15 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f15: boolean;
};
type Row16 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f16: boolean;
};
type Row17 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f17: boolean;
};
type Row18 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f18: boolean;
};
type Row19 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f19: boolean;
};
type Row20 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f20: boolean;
};
type Row21 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f21: boolean;
};
type Row22 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f22: boolean;
};
type Row23 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f23: boolean;
};
type Row24 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f24: boolean;
};
type Row25 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f25: boolean;
};
type Row26 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f26: boolean;
};
type Row27 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f27: boolean;
};
type Row28 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f28: boolean;
};
type Row29 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f29: boolean;
};
type Row30 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f30: boolean;
};
type Row31 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f31: boolean;
};
type Row32 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f32: boolean;
};
type Row33 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f33: boolean;
};
type Row34 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f34: boolean;
};
type Row35 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f35: boolean;
};
type Row36 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f36: boolean;
};
type Row37 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f37: boolean;
};
type Row38 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f38: boolean;
};
type Row39 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f39: boolean;
};
type Row40 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f40: boolean;
};
type Row41 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f41: boolean;
};
type Row42 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f42: boolean;
};
type Row43 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f43: boolean;
};
type Row44 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f44: boolean;
};
type Row45 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f45: boolean;
};
type Row46 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f46: boolean;
};
type Row47 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f47: boolean;
};
type Row48 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f48: boolean;
};
type Row49 = {
  id: number;
  teamId: number;
  parentId: number | null;
  title: string;
  likes: number;
  createdAt: string;
  f49: boolean;
};

const list0 = client.createRequest<{
  response: { items: Row0[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c0" });
const one0 = client.createRequest<{ response: Row0 }>()({
  endpoint: "/c0/:id",
});
const save0 = client.createRequest<{
  response: Row0;
  payload: Partial<Row0>;
}>()({ endpoint: "/c0/:id", method: "PATCH" });
const C0 = collection(rowType<Row0>(), { key: "id" })
  .load(list0, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one0, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save0,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list1 = client.createRequest<{
  response: { items: Row1[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c1" });
const one1 = client.createRequest<{ response: Row1 }>()({
  endpoint: "/c1/:id",
});
const save1 = client.createRequest<{
  response: Row1;
  payload: Partial<Row1>;
}>()({ endpoint: "/c1/:id", method: "PATCH" });
const C1 = collection(rowType<Row1>(), { key: "id" })
  .load(list1, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one1, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save1,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list2 = client.createRequest<{
  response: { items: Row2[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c2" });
const one2 = client.createRequest<{ response: Row2 }>()({
  endpoint: "/c2/:id",
});
const save2 = client.createRequest<{
  response: Row2;
  payload: Partial<Row2>;
}>()({ endpoint: "/c2/:id", method: "PATCH" });
const C2 = collection(rowType<Row2>(), { key: "id" })
  .load(list2, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one2, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save2,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list3 = client.createRequest<{
  response: { items: Row3[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c3" });
const one3 = client.createRequest<{ response: Row3 }>()({
  endpoint: "/c3/:id",
});
const save3 = client.createRequest<{
  response: Row3;
  payload: Partial<Row3>;
}>()({ endpoint: "/c3/:id", method: "PATCH" });
const C3 = collection(rowType<Row3>(), { key: "id" })
  .load(list3, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one3, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save3,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list4 = client.createRequest<{
  response: { items: Row4[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c4" });
const one4 = client.createRequest<{ response: Row4 }>()({
  endpoint: "/c4/:id",
});
const save4 = client.createRequest<{
  response: Row4;
  payload: Partial<Row4>;
}>()({ endpoint: "/c4/:id", method: "PATCH" });
const C4 = collection(rowType<Row4>(), { key: "id" })
  .load(list4, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one4, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save4,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list5 = client.createRequest<{
  response: { items: Row5[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c5" });
const one5 = client.createRequest<{ response: Row5 }>()({
  endpoint: "/c5/:id",
});
const save5 = client.createRequest<{
  response: Row5;
  payload: Partial<Row5>;
}>()({ endpoint: "/c5/:id", method: "PATCH" });
const C5 = collection(rowType<Row5>(), { key: "id" })
  .load(list5, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one5, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save5,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list6 = client.createRequest<{
  response: { items: Row6[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c6" });
const one6 = client.createRequest<{ response: Row6 }>()({
  endpoint: "/c6/:id",
});
const save6 = client.createRequest<{
  response: Row6;
  payload: Partial<Row6>;
}>()({ endpoint: "/c6/:id", method: "PATCH" });
const C6 = collection(rowType<Row6>(), { key: "id" })
  .load(list6, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one6, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save6,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list7 = client.createRequest<{
  response: { items: Row7[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c7" });
const one7 = client.createRequest<{ response: Row7 }>()({
  endpoint: "/c7/:id",
});
const save7 = client.createRequest<{
  response: Row7;
  payload: Partial<Row7>;
}>()({ endpoint: "/c7/:id", method: "PATCH" });
const C7 = collection(rowType<Row7>(), { key: "id" })
  .load(list7, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one7, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save7,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list8 = client.createRequest<{
  response: { items: Row8[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c8" });
const one8 = client.createRequest<{ response: Row8 }>()({
  endpoint: "/c8/:id",
});
const save8 = client.createRequest<{
  response: Row8;
  payload: Partial<Row8>;
}>()({ endpoint: "/c8/:id", method: "PATCH" });
const C8 = collection(rowType<Row8>(), { key: "id" })
  .load(list8, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one8, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save8,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list9 = client.createRequest<{
  response: { items: Row9[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c9" });
const one9 = client.createRequest<{ response: Row9 }>()({
  endpoint: "/c9/:id",
});
const save9 = client.createRequest<{
  response: Row9;
  payload: Partial<Row9>;
}>()({ endpoint: "/c9/:id", method: "PATCH" });
const C9 = collection(rowType<Row9>(), { key: "id" })
  .load(list9, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one9, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save9,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list10 = client.createRequest<{
  response: { items: Row10[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c10" });
const one10 = client.createRequest<{ response: Row10 }>()({
  endpoint: "/c10/:id",
});
const save10 = client.createRequest<{
  response: Row10;
  payload: Partial<Row10>;
}>()({ endpoint: "/c10/:id", method: "PATCH" });
const C10 = collection(rowType<Row10>(), { key: "id" })
  .load(list10, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one10, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save10,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list11 = client.createRequest<{
  response: { items: Row11[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c11" });
const one11 = client.createRequest<{ response: Row11 }>()({
  endpoint: "/c11/:id",
});
const save11 = client.createRequest<{
  response: Row11;
  payload: Partial<Row11>;
}>()({ endpoint: "/c11/:id", method: "PATCH" });
const C11 = collection(rowType<Row11>(), { key: "id" })
  .load(list11, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one11, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save11,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list12 = client.createRequest<{
  response: { items: Row12[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c12" });
const one12 = client.createRequest<{ response: Row12 }>()({
  endpoint: "/c12/:id",
});
const save12 = client.createRequest<{
  response: Row12;
  payload: Partial<Row12>;
}>()({ endpoint: "/c12/:id", method: "PATCH" });
const C12 = collection(rowType<Row12>(), { key: "id" })
  .load(list12, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one12, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save12,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list13 = client.createRequest<{
  response: { items: Row13[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c13" });
const one13 = client.createRequest<{ response: Row13 }>()({
  endpoint: "/c13/:id",
});
const save13 = client.createRequest<{
  response: Row13;
  payload: Partial<Row13>;
}>()({ endpoint: "/c13/:id", method: "PATCH" });
const C13 = collection(rowType<Row13>(), { key: "id" })
  .load(list13, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one13, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save13,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list14 = client.createRequest<{
  response: { items: Row14[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c14" });
const one14 = client.createRequest<{ response: Row14 }>()({
  endpoint: "/c14/:id",
});
const save14 = client.createRequest<{
  response: Row14;
  payload: Partial<Row14>;
}>()({ endpoint: "/c14/:id", method: "PATCH" });
const C14 = collection(rowType<Row14>(), { key: "id" })
  .load(list14, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one14, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save14,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list15 = client.createRequest<{
  response: { items: Row15[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c15" });
const one15 = client.createRequest<{ response: Row15 }>()({
  endpoint: "/c15/:id",
});
const save15 = client.createRequest<{
  response: Row15;
  payload: Partial<Row15>;
}>()({ endpoint: "/c15/:id", method: "PATCH" });
const C15 = collection(rowType<Row15>(), { key: "id" })
  .load(list15, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one15, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save15,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list16 = client.createRequest<{
  response: { items: Row16[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c16" });
const one16 = client.createRequest<{ response: Row16 }>()({
  endpoint: "/c16/:id",
});
const save16 = client.createRequest<{
  response: Row16;
  payload: Partial<Row16>;
}>()({ endpoint: "/c16/:id", method: "PATCH" });
const C16 = collection(rowType<Row16>(), { key: "id" })
  .load(list16, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one16, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save16,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list17 = client.createRequest<{
  response: { items: Row17[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c17" });
const one17 = client.createRequest<{ response: Row17 }>()({
  endpoint: "/c17/:id",
});
const save17 = client.createRequest<{
  response: Row17;
  payload: Partial<Row17>;
}>()({ endpoint: "/c17/:id", method: "PATCH" });
const C17 = collection(rowType<Row17>(), { key: "id" })
  .load(list17, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one17, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save17,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list18 = client.createRequest<{
  response: { items: Row18[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c18" });
const one18 = client.createRequest<{ response: Row18 }>()({
  endpoint: "/c18/:id",
});
const save18 = client.createRequest<{
  response: Row18;
  payload: Partial<Row18>;
}>()({ endpoint: "/c18/:id", method: "PATCH" });
const C18 = collection(rowType<Row18>(), { key: "id" })
  .load(list18, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one18, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save18,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list19 = client.createRequest<{
  response: { items: Row19[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c19" });
const one19 = client.createRequest<{ response: Row19 }>()({
  endpoint: "/c19/:id",
});
const save19 = client.createRequest<{
  response: Row19;
  payload: Partial<Row19>;
}>()({ endpoint: "/c19/:id", method: "PATCH" });
const C19 = collection(rowType<Row19>(), { key: "id" })
  .load(list19, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one19, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save19,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list20 = client.createRequest<{
  response: { items: Row20[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c20" });
const one20 = client.createRequest<{ response: Row20 }>()({
  endpoint: "/c20/:id",
});
const save20 = client.createRequest<{
  response: Row20;
  payload: Partial<Row20>;
}>()({ endpoint: "/c20/:id", method: "PATCH" });
const C20 = collection(rowType<Row20>(), { key: "id" })
  .load(list20, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one20, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save20,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list21 = client.createRequest<{
  response: { items: Row21[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c21" });
const one21 = client.createRequest<{ response: Row21 }>()({
  endpoint: "/c21/:id",
});
const save21 = client.createRequest<{
  response: Row21;
  payload: Partial<Row21>;
}>()({ endpoint: "/c21/:id", method: "PATCH" });
const C21 = collection(rowType<Row21>(), { key: "id" })
  .load(list21, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one21, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save21,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list22 = client.createRequest<{
  response: { items: Row22[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c22" });
const one22 = client.createRequest<{ response: Row22 }>()({
  endpoint: "/c22/:id",
});
const save22 = client.createRequest<{
  response: Row22;
  payload: Partial<Row22>;
}>()({ endpoint: "/c22/:id", method: "PATCH" });
const C22 = collection(rowType<Row22>(), { key: "id" })
  .load(list22, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one22, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save22,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list23 = client.createRequest<{
  response: { items: Row23[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c23" });
const one23 = client.createRequest<{ response: Row23 }>()({
  endpoint: "/c23/:id",
});
const save23 = client.createRequest<{
  response: Row23;
  payload: Partial<Row23>;
}>()({ endpoint: "/c23/:id", method: "PATCH" });
const C23 = collection(rowType<Row23>(), { key: "id" })
  .load(list23, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one23, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save23,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list24 = client.createRequest<{
  response: { items: Row24[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c24" });
const one24 = client.createRequest<{ response: Row24 }>()({
  endpoint: "/c24/:id",
});
const save24 = client.createRequest<{
  response: Row24;
  payload: Partial<Row24>;
}>()({ endpoint: "/c24/:id", method: "PATCH" });
const C24 = collection(rowType<Row24>(), { key: "id" })
  .load(list24, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one24, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save24,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list25 = client.createRequest<{
  response: { items: Row25[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c25" });
const one25 = client.createRequest<{ response: Row25 }>()({
  endpoint: "/c25/:id",
});
const save25 = client.createRequest<{
  response: Row25;
  payload: Partial<Row25>;
}>()({ endpoint: "/c25/:id", method: "PATCH" });
const C25 = collection(rowType<Row25>(), { key: "id" })
  .load(list25, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one25, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save25,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list26 = client.createRequest<{
  response: { items: Row26[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c26" });
const one26 = client.createRequest<{ response: Row26 }>()({
  endpoint: "/c26/:id",
});
const save26 = client.createRequest<{
  response: Row26;
  payload: Partial<Row26>;
}>()({ endpoint: "/c26/:id", method: "PATCH" });
const C26 = collection(rowType<Row26>(), { key: "id" })
  .load(list26, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one26, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save26,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list27 = client.createRequest<{
  response: { items: Row27[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c27" });
const one27 = client.createRequest<{ response: Row27 }>()({
  endpoint: "/c27/:id",
});
const save27 = client.createRequest<{
  response: Row27;
  payload: Partial<Row27>;
}>()({ endpoint: "/c27/:id", method: "PATCH" });
const C27 = collection(rowType<Row27>(), { key: "id" })
  .load(list27, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one27, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save27,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list28 = client.createRequest<{
  response: { items: Row28[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c28" });
const one28 = client.createRequest<{ response: Row28 }>()({
  endpoint: "/c28/:id",
});
const save28 = client.createRequest<{
  response: Row28;
  payload: Partial<Row28>;
}>()({ endpoint: "/c28/:id", method: "PATCH" });
const C28 = collection(rowType<Row28>(), { key: "id" })
  .load(list28, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one28, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save28,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list29 = client.createRequest<{
  response: { items: Row29[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c29" });
const one29 = client.createRequest<{ response: Row29 }>()({
  endpoint: "/c29/:id",
});
const save29 = client.createRequest<{
  response: Row29;
  payload: Partial<Row29>;
}>()({ endpoint: "/c29/:id", method: "PATCH" });
const C29 = collection(rowType<Row29>(), { key: "id" })
  .load(list29, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one29, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save29,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list30 = client.createRequest<{
  response: { items: Row30[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c30" });
const one30 = client.createRequest<{ response: Row30 }>()({
  endpoint: "/c30/:id",
});
const save30 = client.createRequest<{
  response: Row30;
  payload: Partial<Row30>;
}>()({ endpoint: "/c30/:id", method: "PATCH" });
const C30 = collection(rowType<Row30>(), { key: "id" })
  .load(list30, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one30, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save30,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list31 = client.createRequest<{
  response: { items: Row31[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c31" });
const one31 = client.createRequest<{ response: Row31 }>()({
  endpoint: "/c31/:id",
});
const save31 = client.createRequest<{
  response: Row31;
  payload: Partial<Row31>;
}>()({ endpoint: "/c31/:id", method: "PATCH" });
const C31 = collection(rowType<Row31>(), { key: "id" })
  .load(list31, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one31, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save31,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list32 = client.createRequest<{
  response: { items: Row32[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c32" });
const one32 = client.createRequest<{ response: Row32 }>()({
  endpoint: "/c32/:id",
});
const save32 = client.createRequest<{
  response: Row32;
  payload: Partial<Row32>;
}>()({ endpoint: "/c32/:id", method: "PATCH" });
const C32 = collection(rowType<Row32>(), { key: "id" })
  .load(list32, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one32, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save32,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list33 = client.createRequest<{
  response: { items: Row33[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c33" });
const one33 = client.createRequest<{ response: Row33 }>()({
  endpoint: "/c33/:id",
});
const save33 = client.createRequest<{
  response: Row33;
  payload: Partial<Row33>;
}>()({ endpoint: "/c33/:id", method: "PATCH" });
const C33 = collection(rowType<Row33>(), { key: "id" })
  .load(list33, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one33, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save33,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list34 = client.createRequest<{
  response: { items: Row34[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c34" });
const one34 = client.createRequest<{ response: Row34 }>()({
  endpoint: "/c34/:id",
});
const save34 = client.createRequest<{
  response: Row34;
  payload: Partial<Row34>;
}>()({ endpoint: "/c34/:id", method: "PATCH" });
const C34 = collection(rowType<Row34>(), { key: "id" })
  .load(list34, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one34, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save34,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list35 = client.createRequest<{
  response: { items: Row35[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c35" });
const one35 = client.createRequest<{ response: Row35 }>()({
  endpoint: "/c35/:id",
});
const save35 = client.createRequest<{
  response: Row35;
  payload: Partial<Row35>;
}>()({ endpoint: "/c35/:id", method: "PATCH" });
const C35 = collection(rowType<Row35>(), { key: "id" })
  .load(list35, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one35, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save35,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list36 = client.createRequest<{
  response: { items: Row36[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c36" });
const one36 = client.createRequest<{ response: Row36 }>()({
  endpoint: "/c36/:id",
});
const save36 = client.createRequest<{
  response: Row36;
  payload: Partial<Row36>;
}>()({ endpoint: "/c36/:id", method: "PATCH" });
const C36 = collection(rowType<Row36>(), { key: "id" })
  .load(list36, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one36, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save36,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list37 = client.createRequest<{
  response: { items: Row37[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c37" });
const one37 = client.createRequest<{ response: Row37 }>()({
  endpoint: "/c37/:id",
});
const save37 = client.createRequest<{
  response: Row37;
  payload: Partial<Row37>;
}>()({ endpoint: "/c37/:id", method: "PATCH" });
const C37 = collection(rowType<Row37>(), { key: "id" })
  .load(list37, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one37, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save37,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list38 = client.createRequest<{
  response: { items: Row38[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c38" });
const one38 = client.createRequest<{ response: Row38 }>()({
  endpoint: "/c38/:id",
});
const save38 = client.createRequest<{
  response: Row38;
  payload: Partial<Row38>;
}>()({ endpoint: "/c38/:id", method: "PATCH" });
const C38 = collection(rowType<Row38>(), { key: "id" })
  .load(list38, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one38, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save38,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list39 = client.createRequest<{
  response: { items: Row39[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c39" });
const one39 = client.createRequest<{ response: Row39 }>()({
  endpoint: "/c39/:id",
});
const save39 = client.createRequest<{
  response: Row39;
  payload: Partial<Row39>;
}>()({ endpoint: "/c39/:id", method: "PATCH" });
const C39 = collection(rowType<Row39>(), { key: "id" })
  .load(list39, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one39, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save39,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list40 = client.createRequest<{
  response: { items: Row40[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c40" });
const one40 = client.createRequest<{ response: Row40 }>()({
  endpoint: "/c40/:id",
});
const save40 = client.createRequest<{
  response: Row40;
  payload: Partial<Row40>;
}>()({ endpoint: "/c40/:id", method: "PATCH" });
const C40 = collection(rowType<Row40>(), { key: "id" })
  .load(list40, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one40, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save40,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list41 = client.createRequest<{
  response: { items: Row41[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c41" });
const one41 = client.createRequest<{ response: Row41 }>()({
  endpoint: "/c41/:id",
});
const save41 = client.createRequest<{
  response: Row41;
  payload: Partial<Row41>;
}>()({ endpoint: "/c41/:id", method: "PATCH" });
const C41 = collection(rowType<Row41>(), { key: "id" })
  .load(list41, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one41, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save41,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list42 = client.createRequest<{
  response: { items: Row42[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c42" });
const one42 = client.createRequest<{ response: Row42 }>()({
  endpoint: "/c42/:id",
});
const save42 = client.createRequest<{
  response: Row42;
  payload: Partial<Row42>;
}>()({ endpoint: "/c42/:id", method: "PATCH" });
const C42 = collection(rowType<Row42>(), { key: "id" })
  .load(list42, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one42, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save42,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list43 = client.createRequest<{
  response: { items: Row43[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c43" });
const one43 = client.createRequest<{ response: Row43 }>()({
  endpoint: "/c43/:id",
});
const save43 = client.createRequest<{
  response: Row43;
  payload: Partial<Row43>;
}>()({ endpoint: "/c43/:id", method: "PATCH" });
const C43 = collection(rowType<Row43>(), { key: "id" })
  .load(list43, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one43, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save43,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list44 = client.createRequest<{
  response: { items: Row44[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c44" });
const one44 = client.createRequest<{ response: Row44 }>()({
  endpoint: "/c44/:id",
});
const save44 = client.createRequest<{
  response: Row44;
  payload: Partial<Row44>;
}>()({ endpoint: "/c44/:id", method: "PATCH" });
const C44 = collection(rowType<Row44>(), { key: "id" })
  .load(list44, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one44, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save44,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list45 = client.createRequest<{
  response: { items: Row45[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c45" });
const one45 = client.createRequest<{ response: Row45 }>()({
  endpoint: "/c45/:id",
});
const save45 = client.createRequest<{
  response: Row45;
  payload: Partial<Row45>;
}>()({ endpoint: "/c45/:id", method: "PATCH" });
const C45 = collection(rowType<Row45>(), { key: "id" })
  .load(list45, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one45, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save45,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list46 = client.createRequest<{
  response: { items: Row46[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c46" });
const one46 = client.createRequest<{ response: Row46 }>()({
  endpoint: "/c46/:id",
});
const save46 = client.createRequest<{
  response: Row46;
  payload: Partial<Row46>;
}>()({ endpoint: "/c46/:id", method: "PATCH" });
const C46 = collection(rowType<Row46>(), { key: "id" })
  .load(list46, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one46, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save46,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list47 = client.createRequest<{
  response: { items: Row47[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c47" });
const one47 = client.createRequest<{ response: Row47 }>()({
  endpoint: "/c47/:id",
});
const save47 = client.createRequest<{
  response: Row47;
  payload: Partial<Row47>;
}>()({ endpoint: "/c47/:id", method: "PATCH" });
const C47 = collection(rowType<Row47>(), { key: "id" })
  .load(list47, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one47, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save47,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list48 = client.createRequest<{
  response: { items: Row48[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c48" });
const one48 = client.createRequest<{ response: Row48 }>()({
  endpoint: "/c48/:id",
});
const save48 = client.createRequest<{
  response: Row48;
  payload: Partial<Row48>;
}>()({ endpoint: "/c48/:id", method: "PATCH" });
const C48 = collection(rowType<Row48>(), { key: "id" })
  .load(list48, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one48, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save48,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });
const list49 = client.createRequest<{
  response: { items: Row49[]; next: string | null };
  queryParams?: { cursor?: string; q?: string; likes?: number };
}>()({ endpoint: "/teams/:teamId/c49" });
const one49 = client.createRequest<{ response: Row49 }>()({
  endpoint: "/c49/:id",
});
const save49 = client.createRequest<{
  response: Row49;
  payload: Partial<Row49>;
}>()({ endpoint: "/c49/:id", method: "PATCH" });
const C49 = collection(rowType<Row49>(), { key: "id" })
  .load(list49, {
    rows: (response) => response.items,
    cursor: (response) => response.next,
    page: (cursor) => ({ queryParams: { cursor } }),
    where: {
      teamId: { eq: (teamId) => ({ params: { teamId } }), required: true },
      likes: { gt: (likes) => ({ queryParams: { likes } }) },
      title: { search: (q: string) => ({ queryParams: { q } }) },
    },
    orderBy: { createdAt: true },
  })
  .load(one49, { byKey: (id) => ({ params: { id } }) })
  .mutate({
    update: {
      request: save49,
      map: (key, changes) => ({ params: { id: key }, payload: changes }),
    },
  });

export const db = createDb(
  {
    c0: C0,
    c1: C1,
    c2: C2,
    c3: C3,
    c4: C4,
    c5: C5,
    c6: C6,
    c7: C7,
    c8: C8,
    c9: C9,
    c10: C10,
    c11: C11,
    c12: C12,
    c13: C13,
    c14: C14,
    c15: C15,
    c16: C16,
    c17: C17,
    c18: C18,
    c19: C19,
    c20: C20,
    c21: C21,
    c22: C22,
    c23: C23,
    c24: C24,
    c25: C25,
    c26: C26,
    c27: C27,
    c28: C28,
    c29: C29,
    c30: C30,
    c31: C31,
    c32: C32,
    c33: C33,
    c34: C34,
    c35: C35,
    c36: C36,
    c37: C37,
    c38: C38,
    c39: C39,
    c40: C40,
    c41: C41,
    c42: C42,
    c43: C43,
    c44: C44,
    c45: C45,
    c46: C46,
    c47: C47,
    c48: C48,
    c49: C49,
  },
  {
    orderBy: (field, direction) => ({
      queryParams: { sort: `${field}:${direction}` },
    }),
  },
);

export const q0 = db.c0
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c1, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one0Query = db.c0.findOne(1).join("children", db.c1, { by: (row) => row.id, on: "parentId" });
export const local0 = db.c0.local().where((row) => inArray(row.id, [1, 2]));
export const write0 = () => db.c0.update(1, { title: "t" });
export const q1 = db.c1
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c2, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one1Query = db.c1.findOne(1).join("children", db.c2, { by: (row) => row.id, on: "parentId" });
export const local1 = db.c1.local().where((row) => inArray(row.id, [1, 2]));
export const write1 = () => db.c1.update(1, { title: "t" });
export const q2 = db.c2
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c3, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one2Query = db.c2.findOne(1).join("children", db.c3, { by: (row) => row.id, on: "parentId" });
export const local2 = db.c2.local().where((row) => inArray(row.id, [1, 2]));
export const write2 = () => db.c2.update(1, { title: "t" });
export const q3 = db.c3
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c4, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one3Query = db.c3.findOne(1).join("children", db.c4, { by: (row) => row.id, on: "parentId" });
export const local3 = db.c3.local().where((row) => inArray(row.id, [1, 2]));
export const write3 = () => db.c3.update(1, { title: "t" });
export const q4 = db.c4
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c5, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one4Query = db.c4.findOne(1).join("children", db.c5, { by: (row) => row.id, on: "parentId" });
export const local4 = db.c4.local().where((row) => inArray(row.id, [1, 2]));
export const write4 = () => db.c4.update(1, { title: "t" });
export const q5 = db.c5
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c6, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one5Query = db.c5.findOne(1).join("children", db.c6, { by: (row) => row.id, on: "parentId" });
export const local5 = db.c5.local().where((row) => inArray(row.id, [1, 2]));
export const write5 = () => db.c5.update(1, { title: "t" });
export const q6 = db.c6
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c7, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one6Query = db.c6.findOne(1).join("children", db.c7, { by: (row) => row.id, on: "parentId" });
export const local6 = db.c6.local().where((row) => inArray(row.id, [1, 2]));
export const write6 = () => db.c6.update(1, { title: "t" });
export const q7 = db.c7
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c8, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one7Query = db.c7.findOne(1).join("children", db.c8, { by: (row) => row.id, on: "parentId" });
export const local7 = db.c7.local().where((row) => inArray(row.id, [1, 2]));
export const write7 = () => db.c7.update(1, { title: "t" });
export const q8 = db.c8
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c9, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one8Query = db.c8.findOne(1).join("children", db.c9, { by: (row) => row.id, on: "parentId" });
export const local8 = db.c8.local().where((row) => inArray(row.id, [1, 2]));
export const write8 = () => db.c8.update(1, { title: "t" });
export const q9 = db.c9
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c10, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one9Query = db.c9.findOne(1).join("children", db.c10, { by: (row) => row.id, on: "parentId" });
export const local9 = db.c9.local().where((row) => inArray(row.id, [1, 2]));
export const write9 = () => db.c9.update(1, { title: "t" });
export const q10 = db.c10
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c11, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one10Query = db.c10.findOne(1).join("children", db.c11, { by: (row) => row.id, on: "parentId" });
export const local10 = db.c10.local().where((row) => inArray(row.id, [1, 2]));
export const write10 = () => db.c10.update(1, { title: "t" });
export const q11 = db.c11
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c12, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one11Query = db.c11.findOne(1).join("children", db.c12, { by: (row) => row.id, on: "parentId" });
export const local11 = db.c11.local().where((row) => inArray(row.id, [1, 2]));
export const write11 = () => db.c11.update(1, { title: "t" });
export const q12 = db.c12
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c13, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one12Query = db.c12.findOne(1).join("children", db.c13, { by: (row) => row.id, on: "parentId" });
export const local12 = db.c12.local().where((row) => inArray(row.id, [1, 2]));
export const write12 = () => db.c12.update(1, { title: "t" });
export const q13 = db.c13
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c14, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one13Query = db.c13.findOne(1).join("children", db.c14, { by: (row) => row.id, on: "parentId" });
export const local13 = db.c13.local().where((row) => inArray(row.id, [1, 2]));
export const write13 = () => db.c13.update(1, { title: "t" });
export const q14 = db.c14
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c15, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one14Query = db.c14.findOne(1).join("children", db.c15, { by: (row) => row.id, on: "parentId" });
export const local14 = db.c14.local().where((row) => inArray(row.id, [1, 2]));
export const write14 = () => db.c14.update(1, { title: "t" });
export const q15 = db.c15
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c16, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one15Query = db.c15.findOne(1).join("children", db.c16, { by: (row) => row.id, on: "parentId" });
export const local15 = db.c15.local().where((row) => inArray(row.id, [1, 2]));
export const write15 = () => db.c15.update(1, { title: "t" });
export const q16 = db.c16
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c17, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one16Query = db.c16.findOne(1).join("children", db.c17, { by: (row) => row.id, on: "parentId" });
export const local16 = db.c16.local().where((row) => inArray(row.id, [1, 2]));
export const write16 = () => db.c16.update(1, { title: "t" });
export const q17 = db.c17
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c18, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one17Query = db.c17.findOne(1).join("children", db.c18, { by: (row) => row.id, on: "parentId" });
export const local17 = db.c17.local().where((row) => inArray(row.id, [1, 2]));
export const write17 = () => db.c17.update(1, { title: "t" });
export const q18 = db.c18
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c19, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one18Query = db.c18.findOne(1).join("children", db.c19, { by: (row) => row.id, on: "parentId" });
export const local18 = db.c18.local().where((row) => inArray(row.id, [1, 2]));
export const write18 = () => db.c18.update(1, { title: "t" });
export const q19 = db.c19
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c20, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one19Query = db.c19.findOne(1).join("children", db.c20, { by: (row) => row.id, on: "parentId" });
export const local19 = db.c19.local().where((row) => inArray(row.id, [1, 2]));
export const write19 = () => db.c19.update(1, { title: "t" });
export const q20 = db.c20
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c21, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one20Query = db.c20.findOne(1).join("children", db.c21, { by: (row) => row.id, on: "parentId" });
export const local20 = db.c20.local().where((row) => inArray(row.id, [1, 2]));
export const write20 = () => db.c20.update(1, { title: "t" });
export const q21 = db.c21
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c22, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one21Query = db.c21.findOne(1).join("children", db.c22, { by: (row) => row.id, on: "parentId" });
export const local21 = db.c21.local().where((row) => inArray(row.id, [1, 2]));
export const write21 = () => db.c21.update(1, { title: "t" });
export const q22 = db.c22
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c23, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one22Query = db.c22.findOne(1).join("children", db.c23, { by: (row) => row.id, on: "parentId" });
export const local22 = db.c22.local().where((row) => inArray(row.id, [1, 2]));
export const write22 = () => db.c22.update(1, { title: "t" });
export const q23 = db.c23
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c24, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one23Query = db.c23.findOne(1).join("children", db.c24, { by: (row) => row.id, on: "parentId" });
export const local23 = db.c23.local().where((row) => inArray(row.id, [1, 2]));
export const write23 = () => db.c23.update(1, { title: "t" });
export const q24 = db.c24
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c25, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one24Query = db.c24.findOne(1).join("children", db.c25, { by: (row) => row.id, on: "parentId" });
export const local24 = db.c24.local().where((row) => inArray(row.id, [1, 2]));
export const write24 = () => db.c24.update(1, { title: "t" });
export const q25 = db.c25
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c26, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one25Query = db.c25.findOne(1).join("children", db.c26, { by: (row) => row.id, on: "parentId" });
export const local25 = db.c25.local().where((row) => inArray(row.id, [1, 2]));
export const write25 = () => db.c25.update(1, { title: "t" });
export const q26 = db.c26
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c27, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one26Query = db.c26.findOne(1).join("children", db.c27, { by: (row) => row.id, on: "parentId" });
export const local26 = db.c26.local().where((row) => inArray(row.id, [1, 2]));
export const write26 = () => db.c26.update(1, { title: "t" });
export const q27 = db.c27
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c28, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one27Query = db.c27.findOne(1).join("children", db.c28, { by: (row) => row.id, on: "parentId" });
export const local27 = db.c27.local().where((row) => inArray(row.id, [1, 2]));
export const write27 = () => db.c27.update(1, { title: "t" });
export const q28 = db.c28
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c29, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one28Query = db.c28.findOne(1).join("children", db.c29, { by: (row) => row.id, on: "parentId" });
export const local28 = db.c28.local().where((row) => inArray(row.id, [1, 2]));
export const write28 = () => db.c28.update(1, { title: "t" });
export const q29 = db.c29
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c30, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one29Query = db.c29.findOne(1).join("children", db.c30, { by: (row) => row.id, on: "parentId" });
export const local29 = db.c29.local().where((row) => inArray(row.id, [1, 2]));
export const write29 = () => db.c29.update(1, { title: "t" });
export const q30 = db.c30
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c31, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one30Query = db.c30.findOne(1).join("children", db.c31, { by: (row) => row.id, on: "parentId" });
export const local30 = db.c30.local().where((row) => inArray(row.id, [1, 2]));
export const write30 = () => db.c30.update(1, { title: "t" });
export const q31 = db.c31
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c32, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one31Query = db.c31.findOne(1).join("children", db.c32, { by: (row) => row.id, on: "parentId" });
export const local31 = db.c31.local().where((row) => inArray(row.id, [1, 2]));
export const write31 = () => db.c31.update(1, { title: "t" });
export const q32 = db.c32
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c33, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one32Query = db.c32.findOne(1).join("children", db.c33, { by: (row) => row.id, on: "parentId" });
export const local32 = db.c32.local().where((row) => inArray(row.id, [1, 2]));
export const write32 = () => db.c32.update(1, { title: "t" });
export const q33 = db.c33
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c34, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one33Query = db.c33.findOne(1).join("children", db.c34, { by: (row) => row.id, on: "parentId" });
export const local33 = db.c33.local().where((row) => inArray(row.id, [1, 2]));
export const write33 = () => db.c33.update(1, { title: "t" });
export const q34 = db.c34
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c35, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one34Query = db.c34.findOne(1).join("children", db.c35, { by: (row) => row.id, on: "parentId" });
export const local34 = db.c34.local().where((row) => inArray(row.id, [1, 2]));
export const write34 = () => db.c34.update(1, { title: "t" });
export const q35 = db.c35
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c36, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one35Query = db.c35.findOne(1).join("children", db.c36, { by: (row) => row.id, on: "parentId" });
export const local35 = db.c35.local().where((row) => inArray(row.id, [1, 2]));
export const write35 = () => db.c35.update(1, { title: "t" });
export const q36 = db.c36
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c37, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one36Query = db.c36.findOne(1).join("children", db.c37, { by: (row) => row.id, on: "parentId" });
export const local36 = db.c36.local().where((row) => inArray(row.id, [1, 2]));
export const write36 = () => db.c36.update(1, { title: "t" });
export const q37 = db.c37
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c38, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one37Query = db.c37.findOne(1).join("children", db.c38, { by: (row) => row.id, on: "parentId" });
export const local37 = db.c37.local().where((row) => inArray(row.id, [1, 2]));
export const write37 = () => db.c37.update(1, { title: "t" });
export const q38 = db.c38
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c39, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one38Query = db.c38.findOne(1).join("children", db.c39, { by: (row) => row.id, on: "parentId" });
export const local38 = db.c38.local().where((row) => inArray(row.id, [1, 2]));
export const write38 = () => db.c38.update(1, { title: "t" });
export const q39 = db.c39
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c40, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one39Query = db.c39.findOne(1).join("children", db.c40, { by: (row) => row.id, on: "parentId" });
export const local39 = db.c39.local().where((row) => inArray(row.id, [1, 2]));
export const write39 = () => db.c39.update(1, { title: "t" });
export const q40 = db.c40
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c41, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one40Query = db.c40.findOne(1).join("children", db.c41, { by: (row) => row.id, on: "parentId" });
export const local40 = db.c40.local().where((row) => inArray(row.id, [1, 2]));
export const write40 = () => db.c40.update(1, { title: "t" });
export const q41 = db.c41
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c42, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one41Query = db.c41.findOne(1).join("children", db.c42, { by: (row) => row.id, on: "parentId" });
export const local41 = db.c41.local().where((row) => inArray(row.id, [1, 2]));
export const write41 = () => db.c41.update(1, { title: "t" });
export const q42 = db.c42
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c43, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one42Query = db.c42.findOne(1).join("children", db.c43, { by: (row) => row.id, on: "parentId" });
export const local42 = db.c42.local().where((row) => inArray(row.id, [1, 2]));
export const write42 = () => db.c42.update(1, { title: "t" });
export const q43 = db.c43
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c44, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one43Query = db.c43.findOne(1).join("children", db.c44, { by: (row) => row.id, on: "parentId" });
export const local43 = db.c43.local().where((row) => inArray(row.id, [1, 2]));
export const write43 = () => db.c43.update(1, { title: "t" });
export const q44 = db.c44
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c45, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one44Query = db.c44.findOne(1).join("children", db.c45, { by: (row) => row.id, on: "parentId" });
export const local44 = db.c44.local().where((row) => inArray(row.id, [1, 2]));
export const write44 = () => db.c44.update(1, { title: "t" });
export const q45 = db.c45
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c46, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one45Query = db.c45.findOne(1).join("children", db.c46, { by: (row) => row.id, on: "parentId" });
export const local45 = db.c45.local().where((row) => inArray(row.id, [1, 2]));
export const write45 = () => db.c45.update(1, { title: "t" });
export const q46 = db.c46
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c47, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one46Query = db.c46.findOne(1).join("children", db.c47, { by: (row) => row.id, on: "parentId" });
export const local46 = db.c46.local().where((row) => inArray(row.id, [1, 2]));
export const write46 = () => db.c46.update(1, { title: "t" });
export const q47 = db.c47
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c48, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one47Query = db.c47.findOne(1).join("children", db.c48, { by: (row) => row.id, on: "parentId" });
export const local47 = db.c47.local().where((row) => inArray(row.id, [1, 2]));
export const write47 = () => db.c47.update(1, { title: "t" });
export const q48 = db.c48
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c49, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one48Query = db.c48.findOne(1).join("children", db.c49, { by: (row) => row.id, on: "parentId" });
export const local48 = db.c48.local().where((row) => inArray(row.id, [1, 2]));
export const write48 = () => db.c48.update(1, { title: "t" });
export const q49 = db.c49
  .where((row) => and(eq(row.teamId, 1), gt(row.likes, 2), op("search", row.title, "x")))
  .orderBy((row) => row.createdAt, "desc")
  .select((row) => ({ id: row.id, title: row.title, parentId: row.parentId }))
  .join("parent", db.c0, (row) => row.parentId)
  .infinite({ pageSize: 20 });
export const one49Query = db.c49.findOne(1).join("children", db.c0, { by: (row) => row.id, on: "parentId" });
export const local49 = db.c49.local().where((row) => inArray(row.id, [1, 2]));
export const write49 = () => db.c49.update(1, { title: "t" });

export const tx = () =>
  db.transaction((t) => {
    t.c0.update(1, { likes: 1 });
    t.c1.update(2, { title: "a" });
  });
