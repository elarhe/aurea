const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/index");


describe("GET /api/v1/health", () => {
  it("devuelve status ok", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("GET /api/v1/products", () => {
  it("devuelve lista de productos", async () => {
    const res = await request(app).get("/api/v1/products");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.productos)).toBe(true);
  });

  it("pagina correctamente", async () => {
    const res = await request(app).get("/api/v1/products?page=1&limit=5");
    expect(res.status).toBe(200);
    expect(res.body.productos.length).toBeLessThanOrEqual(5);
  });
});
