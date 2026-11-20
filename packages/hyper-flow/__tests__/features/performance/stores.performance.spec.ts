import { createResponseEvent } from "../stats/stats.fixtures";
import { useNetworkStore } from "@/store/applications/network.store";
import { useQueueStore } from "@/store/applications/queue.store";

/**
 * Requests stream in many events per second. These guard the structural sharing that lets list rows skip
 * re-rendering, and keeps each event's cost independent of the size of the history.
 */
describe("Stores [ Structural sharing ]", () => {
  beforeEach(() => {
    useNetworkStore.setState(useNetworkStore.getInitialState(), true);
    useNetworkStore.getState().initialize("App");
    useQueueStore.setState(useQueueStore.getInitialState(), true);
    useQueueStore.getState().initialize("App");
  });

  const listRequests = (count: number) => {
    const events = Array.from({ length: count }, () => createResponseEvent());
    events.forEach((data) => useNetworkStore.getState().setNetworkRequest({ application: "App", data }));
    return events;
  };

  it("should keep untouched requests by reference when one request changes", () => {
    const [first, second] = listRequests(3);
    const before = useNetworkStore.getState().applications.App.requests;

    useNetworkStore.getState().updateNetworkRequest({
      application: "App",
      requestId: second.requestId,
      update: { isCanceled: true },
    });

    const after = useNetworkStore.getState().applications.App.requests;
    expect(after).not.toBe(before);
    expect(after.find((item) => item.requestId === first.requestId)).toBe(
      before.find((item) => item.requestId === first.requestId),
    );
    expect(after.find((item) => item.requestId === second.requestId)).not.toBe(
      before.find((item) => item.requestId === second.requestId),
    );
  });

  it("should keep existing requests by reference when a new one is listed", () => {
    listRequests(2);
    const before = useNetworkStore.getState().applications.App.requests;

    listRequests(1);

    const after = useNetworkStore.getState().applications.App.requests;
    expect(after.slice(1)).toStrictEqual(before);
    after.slice(1).forEach((item, index) => expect(item).toBe(before[index]));
  });

  it("should not notify subscribers when nothing changed", () => {
    const [event] = listRequests(1);
    const listener = vi.fn();
    const unsubscribe = useNetworkStore.subscribe(listener);

    useNetworkStore.getState().updateNetworkRequest({ application: "App", requestId: "unknown", update: {} });
    useNetworkStore.getState().setPausedRequests({ application: "App", requestIds: [event.requestId], paused: false });
    useNetworkStore.getState().setPausedRequests({ application: "App", requestIds: [], paused: true });

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("should not notify queue subscribers for loading keys that don't change", () => {
    useQueueStore.getState().addLoadingKey({ application: "App", queryKey: "GET_/users" });
    const listener = vi.fn();
    const unsubscribe = useQueueStore.subscribe(listener);

    useQueueStore.getState().addLoadingKey({ application: "App", queryKey: "GET_/users" });
    useQueueStore.getState().removeLoadingKey({ application: "App", queryKey: "GET_/posts" });

    expect(listener).not.toHaveBeenCalled();
    useQueueStore.getState().removeLoadingKey({ application: "App", queryKey: "GET_/users" });
    expect(listener).toHaveBeenCalledOnce();
    expect(useQueueStore.getState().applications.App.loadingKeys.size).toBe(0);
    unsubscribe();
  });

  it("should keep other applications by reference", () => {
    useNetworkStore.getState().initialize("Other");
    const other = useNetworkStore.getState().applications.Other;

    listRequests(1);

    expect(useNetworkStore.getState().applications.Other).toBe(other);
  });

  it("should cap the history without growing past it", () => {
    const events = listRequests(1005);

    const { requests } = useNetworkStore.getState().applications.App;
    expect(requests).toHaveLength(1000);
    expect(requests[0].requestId).toBe(events.at(-1)?.requestId);
  });
});
