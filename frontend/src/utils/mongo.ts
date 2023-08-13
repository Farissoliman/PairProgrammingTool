import { MongoClient } from "mongodb";

const DB_NAME = process.env.MONGODB_DB_NAME ?? "gendertool";

const client = new MongoClient(
  process.env.MONGO_CONNECTION_STRING ?? "mongodb://127.0.0.1:27017"
);
const conn = client.connect();
export const getDatabase = async () => (await conn).db(DB_NAME);
