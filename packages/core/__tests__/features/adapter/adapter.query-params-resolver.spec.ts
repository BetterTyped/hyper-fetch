import { Adapter } from "adapter";
import { Client } from "client";

type Filter = { field: string; value: string };

class FiltersBuilder {
  constructor(readonly filters: Filter[] = []) {}

  where = (field: string, value: string) => new FiltersBuilder([...this.filters, { field, value }]);

  toJSON = () => this.filters;
}

type FiltersQueryParams = Filter[] | ((builder: FiltersBuilder) => FiltersBuilder);

const createAdapter = (onFetch: (queryParams: unknown) => void) =>
  new Adapter<Record<string, never>, string, number, Record<string, never>, FiltersQueryParams, FiltersQueryParams>({
    name: "filters-adapter",
    defaultMethod: "GET",
    defaultExtra: {},
    systemErrorStatus: 500,
    systemErrorExtra: {},
  }).setFetcher(({ request, onSuccess }) => {
    onFetch(request.queryParams);
    onSuccess({ data: null, status: 200, extra: {} });
  });

describe("Adapter [ Query params resolver ]", () => {
  let fetched: unknown[] = [];
  let client = new Client({ url: "shared-base-url" }).setAdapter(createAdapter((queryParams) => fetched.push(queryParams)));

  beforeEach(() => {
    fetched = [];
    client = new Client({ url: "shared-base-url" }).setAdapter(
      createAdapter((queryParams) => fetched.push(queryParams)).setQueryParamsResolver((callback) =>
        (callback(new FiltersBuilder()) as FiltersBuilder).toJSON(),
      ),
    );
  });

  const getUsers = () => client.createRequest<{ response: null; queryParams: FiltersQueryParams }>()({ endpoint: "/users" });

  it("should store the data a callback resolves to when it is set", () => {
    const request = getUsers().setQueryParams((filters) => filters.where("role", "admin"));

    expect(request.queryParams).toStrictEqual([{ field: "role", value: "admin" }]);
  });

  it("should derive cache and query keys from the resolved data", () => {
    const fromCallback = getUsers().setQueryParams((filters) => filters.where("role", "admin"));
    const fromData = getUsers().setQueryParams([{ field: "role", value: "admin" }]);
    const other = getUsers().setQueryParams((filters) => filters.where("role", "guest"));

    expect(fromCallback.cacheKey).toBe(fromData.cacheKey);
    expect(fromCallback.queryKey).toBe(fromData.queryKey);
    expect(fromCallback.cacheKey).not.toBe(other.cacheKey);
  });

  it("should keep the resolved data in toJSON and clones", () => {
    const request = getUsers().setQueryParams((filters) => filters.where("role", "admin"));

    expect(request.toJSON().queryParams).toStrictEqual([{ field: "role", value: "admin" }]);
    expect(request.clone().queryParams).toStrictEqual([{ field: "role", value: "admin" }]);
  });

  it("should resolve a callback given to send", async () => {
    await getUsers().send({ queryParams: (filters) => filters.where("role", "admin").where("active", "yes") });

    expect(fetched).toStrictEqual([
      [
        { field: "role", value: "admin" },
        { field: "active", value: "yes" },
      ],
    ]);
  });

  it("should store query params as given when the adapter has no resolver", () => {
    const callback = (filters: FiltersBuilder) => filters.where("role", "admin");
    const plainClient = new Client({ url: "shared-base-url" }).setAdapter(createAdapter(() => null));
    const request = plainClient
      .createRequest<{ response: null; queryParams: FiltersQueryParams }>()({ endpoint: "/users" })
      .setQueryParams(callback);

    expect(request.queryParams).toBe(callback);
  });

  it("should leave data query params untouched", () => {
    const data = [{ field: "role", value: "admin" }];
    const request = getUsers().setQueryParams(data);

    expect(request.queryParams).toBe(data);
  });
});
