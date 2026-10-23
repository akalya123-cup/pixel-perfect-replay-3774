import { describe, expect, it } from "vitest";
import { classify, recommendPriority } from "./triage";

describe("triage", () => {
  it("classifies a fan complaint as Electrical", () => {
    expect(classify("Ceiling fan in room 204 is not working").category).toBe("Electrical");
  });
  it("classifies wifi issues as IT and Networking", () => {
    expect(classify("WiFi keeps disconnecting in library").category).toBe("IT and Networking");
  });
  it("returns Other with review when nothing matches", () => {
    const r = classify("something odd");
    expect(r.category).toBe("Other");
    expect(r.needsReview).toBe(true);
  });
  it("marks safety risks as Critical", () => {
    expect(recommendPriority("socket is sparking", "Electrical")).toBe("Critical");
  });
  it("marks minor gardening as Low", () => {
    expect(recommendPriority("grass needs trimming", "Gardening")).toBe("Low");
  });
});
