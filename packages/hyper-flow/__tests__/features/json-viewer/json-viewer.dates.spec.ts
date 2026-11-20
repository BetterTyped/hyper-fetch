import { fromDateInput, getDateValue } from "@/components/json-viewer/value/value";

describe("JSON viewer [ Dates ]", () => {
  it("should treat valid values under date-like keys as dates", () => {
    expect(getDateValue("createdAt", 0)).toBe("1970-01-01T00:00:00.000Z");
    expect(getDateValue("updated_at", "2026-01-02T03:04:05.000Z")).toBe("2026-01-02T03:04:05.000Z");
    expect(getDateValue("responseTimestamp", Date.UTC(2026, 0, 1))).toBe("2026-01-01T00:00:00.000Z");
  });

  it("should not treat other values under date-like keys as dates", () => {
    expect(getDateValue("updatedAt", "never")).toBeNull();
    expect(getDateValue("date", true)).toBeNull();
    expect(getDateValue("date", { nested: 1 })).toBeNull();
  });

  it("should not treat other keys as dates", () => {
    expect(getDateValue("name", "2026-01-02")).toBeNull();
    expect(getDateValue(0, 0)).toBeNull();
  });

  it("should keep the type of the edited value", () => {
    expect(fromDateInput("2026-01-02T03:04:05", 0)).toBe(Date.UTC(2026, 0, 2, 3, 4, 5));
    expect(fromDateInput("2026-01-02T03:04:05", "2025-01-01T00:00:00.000Z")).toBe("2026-01-02T03:04:05.000Z");
  });

  it("should keep the previous value when the input is cleared", () => {
    expect(fromDateInput("", 123)).toBe(123);
  });
});
