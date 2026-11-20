import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";

import { JSONViewer } from "@/components/json-viewer/json-viewer";

describe("JSON viewer [ Component ]", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const renderViewer = (props: Parameters<typeof JSONViewer>[0]) => {
    const user = userEvent.setup(vi.isFakeTimers() ? { advanceTimers: (ms) => vi.advanceTimersByTime(ms) } : {});
    const view = render(
      <>
        <Toaster />
        <JSONViewer {...props} />
      </>,
    );
    return { ...view, user };
  };

  /** The copy button of a nested value, next to its label */
  const getLabelCopy = (label: string) => screen.getByText(`${label}:`).parentElement!.querySelector("[role=button]")!;

  it("should show a missing value as text", () => {
    renderViewer({ data: null });

    expect(screen.getByText("null")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy JSON" })).not.toBeInTheDocument();
  });

  describe("given a plain value instead of an object", () => {
    it("should edit a string", () => {
      const onChange = vi.fn();
      renderViewer({ data: "hello", onChange });

      fireEvent.change(screen.getByRole("textbox"), { target: { value: "hello world" } });

      expect(onChange).toHaveBeenCalledWith("hello world");
    });

    it("should edit a number, also 0", () => {
      const onChange = vi.fn();
      renderViewer({ data: 0, onChange });

      fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "42" } });

      expect(onChange).toHaveBeenCalledWith(42);
    });

    it("should edit false", () => {
      const onChange = vi.fn();
      renderViewer({ data: false, onChange });

      fireEvent.click(screen.getByRole("checkbox"));

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it("should show an empty string as an empty value, not as missing", () => {
      renderViewer({ data: "", onChange: vi.fn() });

      expect(screen.getByRole("textbox")).toHaveValue("");
    });
  });

  it("should copy the whole data and confirm it", async () => {
    const { user } = renderViewer({ data: { user: { name: "Maciej" } } });

    await user.click(screen.getByRole("button", { name: "Copy JSON" }));

    expect(await navigator.clipboard.readText()).toBe(JSON.stringify({ user: { name: "Maciej" } }, null, 2));
    expect(await screen.findByText("Copied to clipboard")).toBeInTheDocument();
  });

  it("should say so when the clipboard refuses the copy", async () => {
    const { user } = renderViewer({ data: { user: { name: "Maciej" } } });
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("Write permission denied"));

    await user.click(screen.getByRole("button", { name: "Copy JSON" }));

    expect(await screen.findByText("Could not copy to clipboard")).toBeInTheDocument();
    expect(screen.queryByText("Copied to clipboard")).not.toBeInTheDocument();
  });

  it("should copy a nested value from its label and show it was copied for a moment", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { user, container } = renderViewer({ data: { user: { name: "Maciej" }, tags: ["a"] } });

    await user.click(getLabelCopy("user"));

    expect(await navigator.clipboard.readText()).toBe(JSON.stringify({ name: "Maciej" }));
    expect(container.querySelector(".lucide-circle-check")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(container.querySelector(".lucide-circle-check")).not.toBeInTheDocument();
  });

  it("should copy from the keyboard", async () => {
    const { user } = renderViewer({ data: { tags: ["a", "b"] } });

    act(() => {
      (getLabelCopy("tags") as HTMLElement).focus();
    });
    await user.keyboard(" ");
    expect(await navigator.clipboard.readText()).toBe("");

    await user.keyboard("{Enter}");

    expect(await navigator.clipboard.readText()).toBe(JSON.stringify(["a", "b"]));
  });

  it("should keep a timestamp when its date is cleared", () => {
    const onChange = vi.fn();
    renderViewer({ data: { createdAt: Date.UTC(2026, 0, 1) }, onChange });

    fireEvent.change(screen.getByLabelText("createdAt"), { target: { value: "" } });

    expect(onChange).toHaveBeenCalledWith({ createdAt: Date.UTC(2026, 0, 1) });
  });

  it("should empty a date string when its date is cleared", () => {
    const onChange = vi.fn();
    renderViewer({ data: { updatedAt: "2026-01-01T00:00:00.000Z" }, onChange });

    fireEvent.change(screen.getByLabelText("updatedAt"), { target: { value: "" } });

    expect(onChange).toHaveBeenCalledWith({ updatedAt: "" });
  });

  it("should show values read-only without onChange", () => {
    renderViewer({ data: { createdAt: Date.UTC(2026, 0, 1), name: "Maciej", age: 3, admin: true } });

    expect(screen.getByLabelText("createdAt")).toBeDisabled();
    expect(screen.getByLabelText("name")).toBeDisabled();
    expect(screen.getByLabelText("age")).toBeDisabled();
    // A read-only boolean is only its text
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByText("true")).toBeInTheDocument();
  });

  it("should let multi-line text grow by hand", () => {
    renderViewer({ data: { bio: "first\nsecond", name: "Maciej" }, onChange: vi.fn() });

    expect(screen.getByLabelText("bio")).toHaveStyle({ resize: "vertical" });
    expect(screen.getByLabelText("name")).toHaveStyle({ resize: "none" });
  });
});
