const { connectDatabase } = require("../src/config/database");
const mongoose = require("mongoose");

beforeAll(async () => {
  await connectDatabase();
}, 30000);

afterAll(async () => {
  await mongoose.connection.close();
});
