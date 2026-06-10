const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/index");

const TEST_USER = {
  firstName: "Test",
  lastName: "User",
  email: `test_${Date.now()}@aurea.test`,
  password: "Password123!",
};


describe("POST /api/v1/auth/clientes/registro", () => {
  it("registra un cliente nuevo", async () => {
    const res = await request(app).post("/api/v1/auth/clientes/registro").send(TEST_USER);
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it("rechaza email duplicado", async () => {
    await request(app).post("/api/v1/auth/clientes/registro").send(TEST_USER);
    const res = await request(app).post("/api/v1/auth/clientes/registro").send(TEST_USER);
    expect(res.status).toBe(409);
  });

  it("rechaza si falta el nombre", async () => {
    const res = await request(app).post("/api/v1/auth/clientes/registro").send({ email: "x@x.com", password: "123456789" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/auth/clientes/login", () => {
  beforeAll(async () => {
    await request(app).post("/api/v1/auth/clientes/registro").send(TEST_USER);
  });

  it("hace login con credenciales correctas", async () => {
    const res = await request(app).post("/api/v1/auth/clientes/login").send({ email: TEST_USER.email, password: TEST_USER.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("rechaza contraseña incorrecta", async () => {
    const res = await request(app).post("/api/v1/auth/clientes/login").send({ email: TEST_USER.email, password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  it("rechaza si faltan campos", async () => {
    const res = await request(app).post("/api/v1/auth/clientes/login").send({ email: TEST_USER.email });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/auth/me", () => {
  let token;
  beforeAll(async () => {
    const res = await request(app).post("/api/v1/auth/clientes/login").send({ email: TEST_USER.email, password: TEST_USER.password });
    token = res.body.token;
  });

  it("devuelve el usuario autenticado", async () => {
    const res = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("rechaza sin token", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });
});
