import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("TRACE API boundary", () => {
  it("exposes a versioned health check without account data", async () => {
    const response = await request(app).get("/api/v1/health").expect(200);
    expect(response.body).toMatchObject({ status: "ok", service: "trace-api" });
    expect(response.body).not.toHaveProperty("user");
  });

  it("rejects mission reads without a signed-in user", async () => {
    await request(app).get("/api/v1/missions").expect(401);
  });

  it("rejects observation writes without a signed-in user", async () => {
    await request(app).post("/api/v1/observations").send({}).expect(401);
  });

  it("rejects backup restores without a signed-in user", async () => {
    await request(app).post("/api/v1/backup/restore").send({}).expect(401);
  });

  it("exposes NASA services connectivity status", async () => {
    const response = await request(app).get("/api/v1/nasa/status").expect(200);
    expect(response.body).toHaveProperty("services");
    expect(response.body.services).toHaveProperty("cmr");
    expect(response.body.services).toHaveProperty("asf");
  }, 10000);

  it("queries real ASF DAAC SAR scenes for valid coordinates", async () => {
    const response = await request(app)
      .get("/api/v1/nasa/sar-scenes?lat=24.8949&lng=91.8687")
      .expect(200);
    expect(response.body).toHaveProperty("scenes");
    expect(response.body).toHaveProperty("physicalPrinciples");
    expect(response.body).toHaveProperty("gibsImageUrl");
  }, 10000);
});
