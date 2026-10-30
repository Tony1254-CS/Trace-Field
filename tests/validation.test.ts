import { describe, expect, it } from "vitest";
import { missionCreateSchema, observationCreateSchema } from "@/lib/validations/trace";

describe("TRACE validation boundaries", () => {
  it("accepts a mission without an optional target", () => {
    expect(missionCreateSchema.safeParse({ title: "River edge", prompt: "Is standing water visible?" }).success).toBe(true);
  });

  it("rejects partial and out-of-range target coordinates", () => {
    expect(missionCreateSchema.safeParse({ title: "River edge", prompt: "Question", target: { lat: 91, lng: 0 } }).success).toBe(false);
  });

  it("requires an active mission id and one supported response for an observation", () => {
    const valid = { missionId: "c0a8012e-5e3d-4a6f-9dbf-1785e4ccb125", answer: "inconclusive", capturedAt: "2026-10-30T00:00:00.000Z" };
    expect(observationCreateSchema.safeParse(valid).success).toBe(true);
    expect(observationCreateSchema.safeParse({ ...valid, answer: "verified" }).success).toBe(false);
  });
});
