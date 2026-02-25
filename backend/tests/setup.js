import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { jest } from "@jest/globals";

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
  jest.restoreAllMocks();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});