import { act, render } from "@testing-library/react";

import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { Meteors } from "@/components/ui/meteors";
import { Particles } from "@/components/ui/particles";

/** A 2D context that records what is drawn */
const createRecordingContext = () => {
  const calls: { name: string; args: unknown[] }[] = [];
  const record =
    (name: string) =>
    (...args: unknown[]) => {
      calls.push({ name, args });
    };
  const context = {
    fillStyle: "",
    clearRect: record("clearRect"),
    fillRect: record("fillRect"),
    beginPath: record("beginPath"),
    arc: record("arc"),
    fill: record("fill"),
    translate: record("translate"),
    setTransform: record("setTransform"),
    scale: record("scale"),
    // Parsing a color draws it on a 1px canvas and reads it back
    getImageData: () => ({ data: [12, 34, 56, 255] }),
  };
  return { context, calls, count: (name: string) => calls.filter((call) => call.name === name).length };
};

/** Animation frames run only when the test steps them */
const controlAnimationFrames = () => {
  let nextId = 1;
  const pending = new Map<number, FrameRequestCallback>();
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    const id = nextId;
    nextId += 1;
    pending.set(id, callback);
    return id;
  });
  const cancel = vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    pending.delete(id);
  });
  return {
    pending: () => pending.size,
    cancel,
    step: (time: number) => {
      const callbacks = [...pending.values()];
      pending.clear();
      act(() => callbacks.forEach((callback) => callback(time)));
    },
  };
};

const observers = { intersection: [] as { callback: IntersectionObserverCallback; disconnect: () => void }[] };

class FakeIntersectionObserver {
  disconnect = vi.fn();

  observe = vi.fn();

  constructor(public callback: IntersectionObserverCallback) {
    observers.intersection.push(this);
  }

  setVisible(isIntersecting: boolean) {
    act(() =>
      this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver),
    );
  }
}

describe("Canvas effects", () => {
  let recording: ReturnType<typeof createRecordingContext>;

  beforeEach(() => {
    recording = createRecordingContext();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      recording.context as unknown as CanvasRenderingContext2D,
    );
    observers.intersection = [];
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("given the flickering grid", () => {
    // 4px squares with a 6px gap fit 10 columns and 5 rows into 100x50
    const renderGrid = () => render(<FlickeringGrid width={100} height={50} color="#0c2238" />);

    it("should size the canvas to the given area and the screen density", () => {
      vi.spyOn(window, "devicePixelRatio", "get").mockReturnValue(2);
      const { container } = renderGrid();
      const canvas = container.querySelector("canvas")!;

      expect(canvas.width).toBe(200);
      expect(canvas.height).toBe(100);
      expect(canvas.style.width).toBe("100px");
    });

    it("should draw every square while it is visible", () => {
      const frames = controlAnimationFrames();
      renderGrid();

      (observers.intersection[0] as unknown as FakeIntersectionObserver).setVisible(true);
      const before = recording.count("fillRect");
      frames.step(16);

      // The background, then every square
      expect(recording.count("fillRect") - before).toBe(1 + 10 * 5);
      expect(recording.count("clearRect")).toBe(1);
      expect(recording.context.fillStyle).toMatch(/^rgba\(12, 34, 56, ?[\d.]+\)$/);
      expect(frames.pending()).toBe(1);
    });

    it("should not animate while it is out of view", () => {
      const frames = controlAnimationFrames();
      renderGrid();

      frames.step(16);

      expect(recording.count("clearRect")).toBe(0);
      expect(frames.pending()).toBe(0);
    });

    it("should stop animating and observing when it unmounts", () => {
      const frames = controlAnimationFrames();
      const view = renderGrid();
      const observer = observers.intersection[0] as unknown as FakeIntersectionObserver;
      observer.setVisible(true);

      view.unmount();

      expect(frames.pending()).toBe(0);
      expect(observer.disconnect).toHaveBeenCalled();
    });

    it("should flicker squares over time", () => {
      const frames = controlAnimationFrames();
      renderGrid();
      (observers.intersection[0] as unknown as FakeIntersectionObserver).setVisible(true);
      frames.step(0);

      // Every square gets a new opacity when the dice say so
      const random = vi.spyOn(Math, "random").mockReturnValue(0);
      frames.step(1000);
      random.mockRestore();

      expect(recording.context.fillStyle).toBe("rgba(12, 34, 56,0)");
    });

    it("should rebuild the grid when its container resizes", () => {
      const resizeCallbacks: ResizeObserverCallback[] = [];
      vi.stubGlobal(
        "ResizeObserver",
        class {
          observe = vi.fn();

          disconnect = vi.fn();

          constructor(callback: ResizeObserverCallback) {
            resizeCallbacks.push(callback);
          }
        },
      );
      const { container } = render(<FlickeringGrid height={50} />);
      const canvas = container.querySelector("canvas")!;
      vi.spyOn(container.firstElementChild as HTMLElement, "clientWidth", "get").mockReturnValue(300);

      act(() => resizeCallbacks[0]([], {} as ResizeObserver));

      expect(canvas.style.width).toBe("300px");
    });

    it("should render without a canvas context", () => {
      vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);

      expect(() => renderGrid()).not.toThrow();
    });
  });

  describe("given the particles", () => {
    const renderParticles = (props: Partial<React.ComponentProps<typeof Particles>> = {}) => {
      vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(200);
      vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(100);
      return render(<Particles quantity={30} color="#fff" {...props} />);
    };

    it("should draw as many particles as asked for", () => {
      controlAnimationFrames();
      renderParticles();

      // Drawn once when the canvas is set up and once by the first frame, nothing more
      expect(recording.count("arc")).toBe(30 + 30);
    });

    it("should move and redraw the particles on every frame", () => {
      const frames = controlAnimationFrames();
      renderParticles({ vx: 1 });
      const drawn = recording.count("arc");

      frames.step(16);

      expect(recording.count("arc")).toBe(drawn + 30);
      expect(frames.pending()).toBe(1);
    });

    it("should replace particles that leave the canvas", () => {
      const frames = controlAnimationFrames();
      renderParticles({ quantity: 5, vx: 500 });

      frames.step(16);
      frames.step(32);

      // Particles pushed off the canvas are replaced, the count stays the same
      expect(frames.pending()).toBe(1);
      expect(recording.count("arc")).toBeGreaterThanOrEqual(5 * 3);
    });

    it("should follow the mouse over the canvas", () => {
      const frames = controlAnimationFrames();
      renderParticles();
      vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue({
        left: 0,
        top: 0,
        width: 200,
        height: 100,
      } as DOMRect);

      act(() => {
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: 150, clientY: 60 }));
      });
      frames.step(16);

      const translations = recording.calls.filter((call) => call.name === "translate").slice(-30);
      expect(translations.some(({ args }) => args[0] !== 0 || args[1] !== 0)).toBeTrue();
    });

    it("should set the canvas up again after the window resizes", () => {
      vi.useFakeTimers();
      controlAnimationFrames();
      renderParticles();
      const scaled = recording.count("scale");

      act(() => {
        window.dispatchEvent(new Event("resize"));
        window.dispatchEvent(new Event("resize"));
        vi.advanceTimersByTime(200);
      });

      // Two quick resizes set it up once
      expect(recording.count("scale")).toBe(scaled + 1);
      vi.useRealTimers();
    });

    it("should fade particles in up to their opacity away from the edges", () => {
      const frames = controlAnimationFrames();
      // Every particle in the middle of a large canvas, still, with the highest target opacity
      const random = vi.spyOn(Math, "random").mockReturnValue(0.5);
      vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(400);
      vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(400);
      render(<Particles quantity={1} color="#fff" />);
      random.mockRestore();

      for (let frame = 1; frame <= 40; frame += 1) {
        frames.step(frame * 16);
      }

      // targetAlpha is 0.5 * 0.6 + 0.1 = 0.4, reached in steps of 0.02 and never passed
      expect(recording.context.fillStyle).toBe("rgba(255, 255, 255, 0.4)");
    });

    it("should stop animating when it unmounts", () => {
      const frames = controlAnimationFrames();
      const view = renderParticles();

      view.unmount();

      expect(frames.pending()).toBe(0);
    });
  });

  describe("given the meteors", () => {
    it("should render the asked number of meteors with timings in range", () => {
      const { container } = render(
        <Meteors number={12} minDelay={1} maxDelay={2} minDuration={3} maxDuration={4} angle={200} />,
      );

      const meteors = [...container.querySelectorAll<HTMLSpanElement>("span")];
      expect(meteors).toHaveLength(12);
      meteors.forEach((meteor) => {
        const delay = parseFloat(meteor.style.animationDelay);
        const duration = parseFloat(meteor.style.animationDuration);
        expect(delay).toBeGreaterThanOrEqual(1);
        expect(delay).toBeLessThanOrEqual(2);
        expect(duration).toBeGreaterThanOrEqual(3);
        expect(duration).toBeLessThanOrEqual(4);
        expect(meteor.style.getPropertyValue("--angle")).toBe("-200deg");
      });
    });
  });
});
