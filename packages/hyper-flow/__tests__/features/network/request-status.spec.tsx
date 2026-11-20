import { render } from "@testing-library/react";

import { getStatus, RequestStatusIcon, Status } from "@/utils/request.status.utils";

describe("Request status", () => {
  const item = { isRemoved: false, isCanceled: false, isFinished: false, isSuccess: false, isPaused: false };

  it("should tell the status of a request", () => {
    expect(getStatus(item)).toBe(Status.IN_PROGRESS);
    expect(getStatus({ ...item, isPaused: true })).toBe(Status.PAUSED);
    expect(getStatus({ ...item, isFinished: true, isSuccess: true })).toBe(Status.SUCCESS);
    expect(getStatus({ ...item, isFinished: true })).toBe(Status.FAILED);
    expect(getStatus({ ...item, isRemoved: true })).toBe(Status.REMOVED);
    // An aborted request is removed from its queue afterwards
    expect(getStatus({ ...item, isRemoved: true, isCanceled: true })).toBe(Status.CANCELED);
  });

  it.each([
    [Status.REMOVED, "#9e9e9e"],
    [Status.CANCELED, "#f97316"],
    [Status.FAILED, "#ef4444"],
    [Status.SUCCESS, "#22c55e"],
    [Status.IN_PROGRESS, "#3b82f6"],
  ])("should draw a %s request in its color", (status, color) => {
    const { container } = render(<RequestStatusIcon status={status} className="custom" />);

    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("custom");
    expect(container.querySelector(`[fill="${color}"]`)).toBeInTheDocument();
  });

  it("should draw no icon for a paused request", () => {
    const { container } = render(<RequestStatusIcon status={Status.PAUSED} />);

    expect(container).toBeEmptyDOMElement();
  });
});
